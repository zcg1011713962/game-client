import { UserInfo, UserState } from "../user/UserInfo";
import UIManager from "../ui/UIManager";
import SeatManager from "../seat/SeatManager";
import {RoomState} from "../room/RoomState";
import {CardInfo} from "../card/CardConfig";
import SeatComponentManager from "../seat/SeatComponentManager";
import WsClient from "../net/WsClient";
import {Cmd} from "../enum/Cmd";
import PaiJiuUtil from "../util/PaiJiuUtil";


export interface PlayerDTO {
    userId: number;
    seatId: number;
    state: number;
    online: boolean;
    avatar: string;
    gold: number;
    nickname: string;
}

export interface RoomSnapshot {
    roundId: number;
    roomId: number;
    userId: number;
    roomState: number;
    players: PlayerDTO[];
    bankerSeat: number;
    seats: Map<number, number>;
    betMap: Map<number, number>;
    cardMap: Map<number, CardInfo[]>;
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
}

export interface SettlePush {
    roomId: number;
    roomState: number;
    bankerSeat: number;
    players: SettlePlayerDTO[];
}

export interface NextRoundPush {
    roomId: number;
    roundId: number;
}

export default class ClientRoomManager {

    private static _instance: ClientRoomManager = null;

    public static get instance(): ClientRoomManager {
        if (!this._instance) {
            this._instance = new ClientRoomManager();
        }
        return this._instance;
    }

    private roundId: number = -1;

    private ownerUserId : number = -1;

    private roomId: number = -1;

    private myUserId: number = -1;

    private mySeatId: number = -1;


    private roomState: RoomState = RoomState.WAIT;

    private bankerSeat: number = -1;

    private players: Map<number, PlayerDTO> = new Map();
    private seats: Map<number, number> = new Map();
    private betMap: Map<number, number> = new Map();
    private cardMap: Map<number, CardInfo[]> = new Map();


    private constructor() {}

    // 进房回包
    public applyEnterRoom(data: RoomSnapshot) {
        this.roundId = data.roundId;
        this.roomId = data.roomId;
        this.myUserId = data.userId;
        this.bankerSeat = data.bankerSeat;
        this.seats = data.seats;
        this.betMap = data.betMap;
        this.cardMap = data.cardMap;
        
        this.updatePlayers(data.userId, data.players);
       
        // 更新房间状态
        this.setRoomState(data.roomState);
        this.refreshAllSeatView();

        console.log("进房成功 roomId:", this.roomId, "roomStatus", data.roomState, "myUserId",  this.myUserId, "mySeatId", this.mySeatId);
    }

    // 坐下回包
    public applySitDown(data: {roomId: number, userId: number, seatId: number, state: number}) {

        let player = this.players.get(data.userId);

        if (!player) {
            player = {
                userId: data.userId,
                seatId: data.seatId,
                state: data.state,
                online: true
            };
            this.players.set(data.userId, player);
        } else {
            player.seatId = data.seatId;
            player.state = data.state;
        }
        if(this.myUserId === data.userId){
             this.mySeatId = data.seatId;
        }
       
        this.refreshAllSeatView();
    }

    // 获取返奖信息回包
    public applyRoomInfo(data: RoomSnapshot) {
        this.applyEnterRoom(data);
    }

    // 玩家进房通知
    public applyPlayerEnter(data: { roomId: number, player: PlayerDTO }) {
        if (!data || !data.player) {
            return;
        }

        this.players.set(data.player.userId, data.player);

        this.refreshAllSeatView();
    }

    // 准备回包
    public selfReadyOk(data: {
        roomId: number,
        userId: number,
        seatId: number,
        state: number
    }){
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

        if (player) {
            player.state = data.state;
            player.seatId = data.seatId;
        } else {
            this.players.set(data.userId, {
                userId: data.userId,
                seatId: data.seatId,
                state: data.state,
                online: true
            });
        }
           // 更新房间状态
        this.setRoomState(data.roomState);
        this.refreshAllSeatView();
    }

    // 全准备好-游戏开始
    public applyGameStart(data: {
        roomId: number,
        roomState: number,
        bankerSeat: number;
        players: PlayerDTO[]
    }) {
        this.players.clear();

        if (data.players) {
            data.players.forEach(p => {
                this.players.set(p.userId, p);
            });
        }
        this.bankerSeat = data.bankerSeat;
        this.setRoomState(data.roomState);
        console.log("游戏开始，进入下注阶段 roomState", this.roomState, "庄家位:", this.bankerSeat);
        this.refreshAllSeatView();
    }
    // 下注
    public applyPlayerBet(data: {
        roomId: number,
        userId: number,
        seatId: number,
        betArea: number,
        chip: number,
        totalBet: number
    }) {
        cc.log("玩家下注:", data);
        // 筹码动画
        //UIManager.instance.onSelectChip(data.chip);
    }
    // 发牌
    public async dealCard(deal : DealCardPush){
        const data = deal as DealCardPush;
        // 切换发牌状态
        ClientRoomManager.instance.setRoomState(data.roomState);
        const paiJiuTable = UIManager.instance.getTableNode().getComponent("PaiJiuTable");
        console.log("后端发牌", data);
        const serverResult = {
               bankerSeat: data.bankerSeat,
               players: data.playerCards
        };
        this.bankerSeat = data.bankerSeat;
        console.log("后端发牌", serverResult);
        paiJiuTable.playStartAnim(serverResult);     
     
        // 翻牌
        await paiJiuTable.showCard();
        // 发送结算请求
        WsClient.instance.send(Cmd.SETTLE, { roomId: deal.roomId});
    }

    // 结算
    public settle(settleInfo : SettlePush){
        console.log("结算", settleInfo);
        const data = settleInfo as SettlePush;
        ClientRoomManager.instance.setRoomState(data.roomState);

        const bankerSeat = settleInfo.bankerSeat;
        data.players.forEach(p => {
            const seatId = p.seatId;
            const seatComponen = SeatComponentManager.getInstance().seatComponentList.find(s => s["seatData"].id === seatId);
            if(seatComponen){
                if(seatId !== bankerSeat){
                    seatComponen.setResultStatusView(p.win);
                }
            }
            console.log("结算:", p.userId, p.winAmount, p.afterGold);
         });

         // 结算动画结束
         WsClient.instance.send(Cmd.NEXT_ROUND, {roomId: settleInfo.roomId});
         
    }
    // 下一轮
    public nextRound(data: NextRoundPush){
        this.roundId = data.roundId;
    }

    public getBankerSeat(): number{
        return this.bankerSeat;
    }


    public setRoomState(state: number) {
        this.roomState = state as RoomState;
        this.refreshBetUI();
    }

    public canBet(): boolean {
        return this.roomState === RoomState.BET && this.mySeatId >= 0;
    }

    private refreshBetUI() {
        const canBet = this.canBet();
        console.log("是否可以下注", canBet, "roomState", this.roomState, "mySeatId", this.mySeatId);
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

    private refreshAllSeatView() {
        this.players.forEach(player => {
            if (player.seatId == null || player.seatId < 0) {
                return;
            }
            const userInfo = new UserInfo();
            userInfo.userId = player.userId;
            userInfo.seatId = player.seatId;
            userInfo.state = player.state;
            userInfo.avatar = player.avatar;
            userInfo.gold = player.gold;
            userInfo.nickname = player.nickname;
            SeatManager.refreshSeat(player.seatId, userInfo);
        });
    }

    public selfBetOk(data: {
        roomId: number,
        roomState: number,
        players: PlayerDTO[]
    }){
        UIManager.instance.setBetPanelVisible(false);
    }

    public updatePlayers(userId : number, players: PlayerDTO[]){
        this.players.clear();
         // 更新玩家信息
        if (players) {
            players.forEach(p => {
                this.players.set(p.userId, p);
            });
        }
        let player = this.players.get(userId);
        if(player){
            this.mySeatId = player.seatId;
        }
    }

    

}