import { UserInfo, UserState } from "../user/UserInfo";
import UIManager from "../ui/UIManager";
import SeatManager from "../seat/SeatManager";
import {RoomState} from "../room/RoomState";
import {CardInfo} from "../card/CardConfig";
import SeatComponentManager from "../seat/SeatComponentManager";
import WsClient from "../net/WsClient";
import {Cmd} from "../enum/Cmd";
import {DelayTaskUtil} from "../util/DelayTaskUtil";
import SettleManager from "../../../common/SettleManager";
import UserData from "../../../login/entity/UserData";
import CountDownManager from "../../../common/CountDownManager";
import { SceneUtil } from "../../../util/SceneUtil";
import { ReadyBtnState } from "../../btn/ReadyButton";
import HallUIManager from "../../../hall/HallUIManager";
import PaiJiuUtil from "../util/PaiJiuUtil";

export interface PlayerDTO {
    userId: number;
    seatId: number;
    state: number;
    online: boolean;
    avatar: string;
    nickname: string;
    gold: number;
}

export interface RoomSnapshot {
    roundId: number;
    roomId: number;
    userId: number;
    roomState: number;
    baseScore: number;

    players: PlayerDTO[];
    bankerSeat: number;

    betMap: Record<number, number>;
    cardMap: Record<number, CardInfo[]>;

    serverTime?: number;
    dealStartTime?: number;
    showCardTime?: number;
    settleTime?: number;

    settlePush: SettlePush;
}

export interface PlayerCardDTO {
    userId: number;
    seatId: number;
    cards: CardInfo[]; // 每人两张牌
}

export interface DealCardPush {
    roomId: number;
    roomState: number;
    bankerSeat: number;
    playerCards: PlayerCardDTO[];

    serverTime: number;
    dealStartTime: number;
    showCardTime: number;

    settleTime: number; 
    nextRoundTime: number;
}

export interface SettlePlayerDTO {
    userId: number;
    seatId: number;
    win: number;        // 0输 1平 2赢 3庄家
    betAmount: number;
    winAmount: number;
    beforeGold: number;
    afterGold: number;
    cards: CardInfo[];
    cardTypeName: string;
    settleDesc: string;
}

export interface SettlePush {
    roomId: number;
    roomState: number;
    bankerSeat: number;
    settlePlayers: SettlePlayerDTO[];
    players: PlayerDTO[];

    serverTime: number;
    settleTime: number;
    nextRoundTime: number;
}

export interface NextRoundPush {
    roomId: number;
    roundId: number;
    roomState: number;
    players: PlayerDTO[];
    nextRoundTime: number;
    serverTime: number;
}

export default class ClientRoomManager {

    private static _instance: ClientRoomManager = null;

    public static get instance(): ClientRoomManager {
        if (!this._instance) {
            this._instance = new ClientRoomManager();
        }
        return this._instance;
    }
    private gameReady: boolean = false;

    private roomSnapshot: RoomSnapshot | null= null;

    private roundId: number = -1;

    private ownerUserId : number = -1;

    private roomId: number = -1;

    private myUserId: number = -1;

    private mySeatId: number = -1;

    private seatCount: number = 8;

    private roomState: RoomState = RoomState.WAIT;

    private bankerSeat: number = -1;

    private baseScore: number = -1;

    private players: Map<number, PlayerDTO> = new Map();
    private betMap: Record<number, number> = {};
    private cardMap: Record<number, CardInfo[]> = {};

    private sentRoundIds: Set<number> = new Set();

    private constructor() {}
    
    // 游戏场景初始化完成后调用
    public onGameSceneReady() {
        this.gameReady = true;
        if (this.roomSnapshot) {
            this.renderRoom(this.roomSnapshot);
        }
    }

    private renderRoom(data: RoomSnapshot){
        console.log("renderRoom", data);

        const bankerSeat = data.bankerSeat;
        const players = data.players;

        this.roundId = data.roundId;
        this.roomId = data.roomId;
        this.myUserId = data.userId;
        this.bankerSeat = bankerSeat;
        this.betMap = data.betMap;
        this.cardMap = data.cardMap;
        this.baseScore = data.baseScore;
        
        if(UIManager.instance){
            UIManager.instance.updateTopView(data.roomId, players.length, data.baseScore);
        }
        this.updatePlayer(data.userId, players);
       
        // 更新房间状态
        this.setRoomState(data.roomState);
        this.refreshAllSeatView();
        
        if(data.cardMap && Object.keys(data.cardMap).length > 0){
            console.log("断线重连恢复牌局");
            const dealCardPush = ClientRoomManager.instance.buildDealCardPush(data);
            // ClientRoomManager.instance.dealCard(dealCardPush);
            if(data.settlePush){
                this.settle(data.settlePush);
            }
        }
    }

    // 进房回包
    public applyEnterRoom(data: RoomSnapshot) {
        console.log("进房回报包", data);
        cc.log("进房回包", data);

        // 1. 先缓存房间数据
        this.roomSnapshot = data;

        // 2. 切换到游戏场景
        SceneUtil.loadScene("game_1");
        
    }

    // 坐下回包
    public applySitDown(data: {roomId: number, userId: number, seatId: number, state: number}) {

        let player = this.players.get(data.userId);
        const seatId = data.seatId;

        if (!player) {
            player = {
                userId: data.userId,
                seatId: seatId,
                state: data.state,
                online: true
            };
            this.players.set(data.userId, player);
        } else {
            player.seatId = seatId;
            player.state = data.state;
        }
        if(this.myUserId === data.userId){
             this.updateMySeatId(seatId);
        }
        UIManager.instance.clearTable();
        this.refreshAllSeatView();
        
    }


    public applyRoomInfo(data: RoomSnapshot) {
        this.applyEnterRoom(data);
    }

    // 玩家进房通知
    public applyPlayerEnter(data: { roomId: number, player: PlayerDTO }) {
        if (!data || !data.player) {
            return;
        }
        this.players.set(data.player.userId, data.player);
        if(this.gameReady){
            UIManager.instance.updateTopView(data.roomId, this.players.size, this.baseScore);
            this.refreshAllSeatView();
        }
       
    }

    // 准备回包
    public selfReadyOk(data: {
        roomId: number,
        userId: number,
        seatId: number,
        state: number
    }){
        this.updatePlayerStatusByUser(data.state, data.userId);
        this.refreshAllSeatView();
    }

    public selfCancelReadyOk(data: {
        roomId: number,
        userId: number,
        seatId: number,
        state: number
    }){
        this.updatePlayerStatusByUser(data.state, data.userId);
        this.refreshAllSeatView();
        UIManager.instance.showReady(ReadyBtnState.CANCEL_READY);
    }

    // 离开座位
    public leaveSeat(data: {
        roomId: number,
        userId: number,
        seatId: number,
        reason: number
    }){
        let player = this.players.get(data.userId);
        const seatId = data.seatId;
        if(player){
            player.seatId = seatId;
            player.state = UserState.Idle;
        }
        if(this.myUserId === data.userId){
             this.updateMySeatId(seatId);
        }
        UIManager.instance.clearTable();
        UIManager.instance.showReady(ReadyBtnState.HIDE);
        this.refreshAllSeatView(); 
    }

    // 准备通知
    public applyPlayerReady(data: {
        roomId: number,
        userId: number,
        seatId: number,
        state: number
    }) {
        const player = this.players.get(data.userId);
        const seatId = data.seatId;

        if (player) {
            player.state = data.state;
            player.seatId = seatId;
        } else {
            this.players.set(data.userId, {
                userId: data.userId,
                seatId: seatId,
                state: data.state,
                online: true
            });
        }
           // 更新房间状态
        this.setRoomState(RoomState.READY);
        this.refreshAllSeatView();
    }
    // 取消准备
    public applyCancelPlayerReady(data: {
        roomId: number,
        userId: number,
        seatId: number,
        state: number,
        roomStatus: number
    }){
        const player = this.players.get(data.userId);
        const seatId = data.seatId;
        if (player) {
            player.state = data.state;
            player.seatId = seatId;
        } else {
            this.players.set(data.userId, {
                userId: data.userId,
                seatId: seatId,
                state: data.state,
                online: true
            });
        }
        // 更新房间状态
        this.setRoomState(data.roomStatus);
        this.refreshAllSeatView();
    }

    // 全准备好-游戏开始
    public async applyGameStart(data: {
        roomId: number,
        roundId: number,
        roomState: number,
        bankerSeat: number,
        players: PlayerDTO[],
        betSeconds: number,

        serverTime: number,
        roundAnimStartTime: number,
        roundAnimExpireTime: number,
        betStartTime: number,
        betEndTime: number
    }) {
        console.log("游戏开始", "roundId:", data.roundId, "roomState:", data.roomState);

        this.roundId = data.roundId;

        this.players.clear();
        UIManager.instance.clearTable();

        data.players.forEach(p => {
            this.players.set(p.userId, p);
        });

        this.bankerSeat = data.bankerSeat;

        UIManager.instance.showReady(ReadyBtnState.HIDE);

        const serverOffset = data.serverTime - Date.now();

        const getServerNow = () => Date.now() + serverOffset;

        const nowServer = getServerNow();

        // 第X局动画：过期不播
        if (nowServer < data.roundAnimExpireTime) {
            const waitAnimSeconds = Math.max(
                0,
                (data.roundAnimStartTime - nowServer) / 1000
            );
            if (waitAnimSeconds > 0) {
                await PaiJiuUtil.wait(this as any, waitAnimSeconds);
            }
            if (getServerNow() < data.roundAnimExpireTime) {
                await UIManager.instance.showRoundStartAnim(
                    this.roundId,
                    data.serverTime,
                    data.roundAnimExpireTime
                );
            }
        } else {
            console.log("局数动画已过期，跳过");
        }

        // 等到下注开始时间
        const waitBetSeconds = Math.max(
            0,
            (data.betStartTime - getServerNow()) / 1000
        );

        DelayTaskUtil.getInstance().schedule(() => {

            this.setRoomState(data.roomState);

            this.refreshAllSeatView();

            const leftSeconds = Math.max(
                0,
                Math.ceil((data.betEndTime - getServerNow()) / 1000)
            );

            cc.log("下注倒计时 剩余:", leftSeconds);

            CountDownManager.show(leftSeconds);

        }, waitBetSeconds);
    }
    // 下注回包
    public selfBetOk(data: {
        roomId: number,
        userId: number,
        seatId: number,
        betArea: number,
        chip: number,
        totalBet: number,
        players: PlayerDTO[]
    }){
        const players= data.players;
        const seatId = data.seatId;
        // 投注面板隐藏
        UIManager.instance.setBetPanelVisible(false);
        // 移除倒计时
        CountDownManager.close();
    }
    // 下注通知
    public applyPlayerBet(data: {
        roomId: number,
        userId: number,
        seatId: number,
        betArea: number,
        chip: number,
        totalBet: number,
        players: PlayerDTO[]
    }) {
        //cc.log("玩家下注通知:", data);
        const players = data.players;
        const seatId = data.seatId;

        this.updatePlayers(players);

        const playerMap = new Map(players.map(player => [player.seatId, player]));
        // 更新玩家金币
        SeatComponentManager.getInstance().seatComponentList.forEach(comp =>{
            const seatId = comp["seatData"].id;
            const player = playerMap.get(seatId)
            if(player){
                // 更新玩家金币
                comp.updateSetGold(player.gold);
            }
        });


        if(seatId === this.mySeatId){
            UIManager.instance.setBetPanelVisible(false);
        }
        // 筹码动画
        UIManager.instance.onSelectChip(data.chip, seatId);
        // 更新座位信息
        this.refreshAllSeatView();
    }
    // 发牌
    public async dealCard(deal: DealCardPush) {
        CountDownManager.close();

        this.setRoomState(deal.roomState);
        this.bankerSeat = deal.bankerSeat;

        const tableNode = UIManager.instance.getTableNode();
        if (!tableNode || !cc.isValid(tableNode)) {
            cc.error("dealCard 找不到 TableNode");
            return;
        }

        const paiJiuTable = tableNode.getComponent("PaiJiuTable") as any;
        if (!paiJiuTable) {
            cc.error("dealCard 找不到 PaiJiuTable");
            return;
        }

        const serverResult = {
            bankerSeat: deal.bankerSeat,
            players: deal.playerCards,
            serverTime: deal.serverTime,
            dealStartTime: deal.dealStartTime,
            showCardTime: deal.showCardTime,
            settleTime: deal.settleTime,
            nextRoundTime: deal.nextRoundTime
        };

        this.bankerSeat = deal.bankerSeat;

        await paiJiuTable.playStartAnim(serverResult);
    }

    // 结算
    public settle(settleInfo: SettlePush) {

        const serverOffset =
            settleInfo.serverTime - Date.now();

        const nowServer =
            Date.now() + serverOffset;

        const delay = Math.max(
            0,
            (settleInfo.settleTime - nowServer) / 1000
        );

        DelayTaskUtil.getInstance().schedule(() => {
            this.doSettle(settleInfo);
        }, delay);
    }

    private doSettle(data: SettlePush) {
        const bankerSeat = data.bankerSeat;
        const settlePlayers = data.settlePlayers;
        const players = data.players;

        this.updatePlayers(players);
        this.setRoomState(data.roomState);

        const playerMap = new Map(players.map(player => [player.seatId, player]));
        const settlePlayerMap = new Map(settlePlayers.map(p => [p.seatId, p]));

        SeatComponentManager.getInstance().seatComponentList.forEach(comp => {
            const seatId = comp["seatData"].id;
            const player = playerMap.get(seatId);
            const settlePlayer = settlePlayerMap.get(seatId);

            if (player) {
                comp.updateSetGold(player.gold);

                if (player.seatId !== bankerSeat && settlePlayer) {
                    comp.setResultStatusView(settlePlayer.win);
                }
            }
        });

        const map = new Map(settlePlayers.map(p => [p.userId, p]));
        const user = UserData.get();

        if (user) {
            const settlePlayer = map.get(user.userId);

            if (settlePlayer) {
                SettleManager.show(
                    settlePlayer.win,
                    settlePlayer.winAmount,
                    settlePlayer.afterGold,
                    settlePlayer.cardTypeName,
                    settlePlayer.settleDesc
                );
            }
        }
    }

    public doNextRound(){   
        SettleManager.close();
    }


    // 下一局
    public nextRound(data: NextRoundPush) {
        console.log("下一局:", data.roundId)
        // 强制关闭结算界面
        SettleManager.close();

        this.roundId = data.roundId;
        this.setRoomState(data.roomState);
        this.updatePlayers(data.players);

         // 清桌
        UIManager.instance.clearTable();
        this.refreshAllSeatView();

        UIManager.instance.showReady(
            ReadyBtnState.READY
        );
    }


    // 离开房间回包
    public leaveRoom(data : any){
        cc.director.loadScene("hall");
    }

    // 离开房间通知
    public playerLeaveRoom(data: { roomId: number, player: PlayerDTO}) {
        if (!data || !data.player) {
            return;
        }
        this.players.delete(data.player.userId);
        if(data.player.userId !== this.myUserId && this.myUserId > -1){
             this.refreshAllSeatView();
            if(UIManager.instance){
                UIManager.instance.updateTopView(data.roomId, this.players.size, this.baseScore);
            }
        }
    }

    public userAssetUpdate(data : any){
        console.log("资产变更通知", data);
        switch (data.field) {
            case "roomCard":
                UserData.updateRoomCard(data.value);
                break;

            case "gold":
                UserData.updateGold(data.value);
                break;
            default:
                break;    
        }
        HallUIManager.instance.refreshHallTopBar();
    }



    public updatePlayerStatus(status : UserState){
        this.players.forEach(p =>{
            p.state = status;
        })
    }

    public updatePlayerStatusByUser(status : UserState, userId : number){
        this.players.forEach(p =>{
            if(p.userId === userId){
                p.state = status;
            }
        })
    }


    public getBankerSeat(): number{
        return this.bankerSeat;
    }


    public setRoomState(state: number) {
        if(state == undefined){
            return;
        }
        this.roomState = state as RoomState;
        this.refreshBetUI();
    }

    public getRoomState() {
        return this.roomState;
    }
    

    public canBet(): boolean {
        return this.roomState === RoomState.BET && this.mySeatId >= 0 && this.bankerSeat > -1 && this.bankerSeat !== this.mySeatId;
    }

    private refreshBetUI() {
        const canBet = this.canBet();
        //cc.log("是否可以下注:", canBet, "roomState:", this.roomState, "mySeatId:", this.mySeatId, "bankerSeat:", this.bankerSeat);
        UIManager.instance.setBetPanelVisible(canBet);
    }

    public getRoomId(): number {
        return this.roomId;
    }

    public getMyUserId(): number {
        return this.myUserId;
    }

    public getMySeatId(): number {
        return this.mySeatId;
    }

    public getSeatIdByUserId(userId: number): number {
        const player = this.players.get(userId);
        return player ? player.seatId : -1;
    }

    public getSeatUser(seatId: number): PlayerDTO | null {
        const list = Array.from(this.players.values());
        return list.find(p => p.seatId === seatId) || null;
    }

    public getPlayers(): PlayerDTO[] {
        return Array.from(this.players.values()).filter(p => p.seatId > -1);
    }

    public getPlayerStatusByUserId(userId: number): number {
        const player = this.players.get(userId);
        if(player){
            return player.state;
        }
        return UserState.Idle;
    }

    private refreshAllSeatView() {
        // 更新非空闲玩家座位
        const seats: number[] = [];
        this.players.forEach(player => {
            if (player.seatId == null || player.seatId < 0) {
                return;
            }
            const userInfo = new UserInfo();
            userInfo.userId = player.userId;
            userInfo.seatId = player.seatId;
            userInfo.state = player.state;
            userInfo.avatar = player.avatar;
            userInfo.nickname = player.nickname;
            userInfo.gold = player.gold;
            seats.push(player.seatId);
            SeatManager.refreshSeat(player.seatId, userInfo);
        });
        // 更新空闲座位
        SeatComponentManager.getInstance().seatComponentList.forEach(s =>{
            if(s && s["seatData"] && !seats.includes(s["seatData"].id)){
                if(s["seatData"].id !== undefined && s["seatData"].id !== null){
                    SeatManager.refreshSeat(s["seatData"].id, null);
                }
            }
        })
    }


    public updatePlayer(userId : number, players: PlayerDTO[]){
        this.players.clear();
         // 更新玩家信息
        if (players) {
            players.forEach(p => {
                this.players.set(p.userId, p);
            });
        }
        let player = this.players.get(userId);
        if(player && userId === this.myUserId){
            this.updateMySeatId(player.seatId);
        }
    }


    public updatePlayers(players: PlayerDTO[]){
        this.players.clear();
         // 更新玩家信息
        if (players) {
            players.forEach(p => {
                this.players.set(p.userId, p);
            });
        }
    }


    public buildDealCardPush(snapshot: RoomSnapshot): DealCardPush {
        const { roomId, roomState, players, cardMap } = snapshot;
        const playerCards: PlayerCardDTO[] = players.map(player => {
            const userId = player.userId;
            const cards = cardMap[userId] || [];

            return {
                userId: userId,
                seatId: player.seatId,
                cards: cards
            };
        });

        return {
            roomId,
            roomState,
            bankerSeat: snapshot.bankerSeat,
            playerCards
        };
    }

    public updateMySeatId(seatId : number){
        this.mySeatId = seatId;
        cc.log("最新的座位号", this.mySeatId);
    }

    public cleanRoom(){
 
        this.players.clear();
        this.betMap = {};
        this.cardMap = {};
        this.roundId = -1;
        this.ownerUserId = -1;
        this.roomId =-1;
        this.myUserId = -1;
        this.mySeatId = -1;
        this.roomState = RoomState.WAIT;
        this.bankerSeat = -1;
        this.gameReady = false;
    }


    

}