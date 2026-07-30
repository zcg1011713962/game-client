import { UserInfo, UserState } from "../user/UserInfo";
import GameUIManager from "../ui/GameUIManager";
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
import GameRes from "../GameRes";

export interface PlayerDTO {
    userId: number;
    seatId: number;
    state: number;
    online: boolean;
    avatar: string;
    nickname: string;
    gold: number;
    grabBanker?: number;
}

export interface RoomSnapshot {
    roundId: number;
    maxRoundId?: number;
    roomId: number;
    userId: number;
    roomState: number;
    roomType?: number;
    baseScore: number;

    players: PlayerDTO[];
    bankerSeat: number;

    betMap: Record<number, number>;
    roomTotalWinMap?: Record<string, number>;
    cardMap: Record<number, CardInfo[]>;
    openedCardUsers?: number[];

    serverTime?: number;
    roundAnimStartTime?: number;
    roundAnimEndTime?: number;
    grabStartTime?: number;
    grabEndTime?: number;
    bankerAnimStartTime?: number;
    bankerAnimEndTime?: number;
    betStartTime?: number;
    betEndTime?: number;
    dealStartTime?: number;
    showCardTime?: number;
    settleTime?: number;
    nextRoundTime?: number;

    settlePush: SettlePush;
    roomFinalSettlePush?: RoomFinalSettlePush;
}
export interface GrabBankerStartPush {
    roomId: number;
    roundId: number;
    roomState: number;
    serverTime: number;
    grabStartTime: number;
    grabEndTime: number;
}

export interface GrabBankerResultPush {
    roomId: number;
    roundId: number;
    roomState: number;
    bankerUserId: number;
    bankerSeat: number;
    serverTime: number;
    bankerAnimStartTime: number; // 庄家动画
    bankerAnimEndTime: number;
    betStartTime: number;
    betEndTime: number;
    players: PlayerDTO[];
}

export interface GrabBankerPush {
    roomId: number;
    userId: number;
    seatId: number;
    grabBanker: number;
    roomState: number;
    serverTime: number;
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
    openedCardUsers?: number[];
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
    setServerTime?: number;
    setSettleTime?: number;
    nextRoundTime: number;
}

export interface NextRoundPush {
    roomId: number;
    roundId: number;
    maxRoundId?: number;
    roomState: number;
    players: PlayerDTO[];
    nextRoundTime: number;
    serverTime: number;
}

export interface RoomFinalSettlePlayerDTO {
    userId: number;
    seatId: number;
    nickname: string;
    avatar: string;
    totalWinAmount: number;
    bankerCount: number;
    afterGold: number;
}

export interface RoomFinalSettlePush {
    roomId: number;
    roundId: number;
    roundCount: number;
    serverTime: number;
    message?: string;
    roomType?: number;
    scoreMode?: boolean;
    players: RoomFinalSettlePlayerDTO[];
}

export interface PlayerOpenCardPush {
    roomId: number;
    roundId?: number;
    userId: number;
    seatId: number;
    openType: number;
    roomState: number;
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
    private isLoadingGameScene: boolean = false;

    private roomSnapshot: RoomSnapshot | null= null;
    private syncingRoomInfo: boolean = false;

    private roundId: number = -1;
    private maxRoundId: number = 0;

    private ownerUserId : number = -1;

    private roomId: number = -1;

    private myUserId: number = -1;

    private mySeatId: number = -1;

    private seatCount: number = 8;

    private roomState: RoomState = RoomState.WAIT;
    private roomType: number = 1;
    private roomScoreMap: Map<number, number> = new Map();

    private bankerSeat: number = -1;

    private baseScore: number = -1;

    private players: Map<number, PlayerDTO> = new Map();
    private betMap: Record<number, number> = {};
    private cardMap: Record<number, CardInfo[]> = {};

    private grabBankerServerOffset: number = 0;
    private grabBankerEndTime: number = 0;
    private betServerOffset: number = 0;
    private betEndTime: number = 0;

    private sentRoundIds: Set<number> = new Set();
    private timelineVersion: number = 0;
    private animatedBetKeys: Set<string> = new Set();
    private roomFinalSettled: boolean = false;
    private latestRoomFinalSettle: RoomFinalSettlePush | null = null;

    private constructor() {}
    
    // 游戏场景初始化完成后调用
    public onGameSceneReady() {
        this.gameReady = true;
        this.isLoadingGameScene = false;
        if (this.roomSnapshot) {
            this.renderRoom(this.roomSnapshot);
        }
    }

    private renderRoom(data: RoomSnapshot){
        console.log("renderRoom", data);
        (data as any).__clientReceiveTime = Date.now();
        this.invalidateTimelineTasks();

        const bankerSeat = data.bankerSeat;
        const players = data.players;

        this.roundId = data.roundId;
        this.maxRoundId = data.maxRoundId || this.maxRoundId || 0;
        this.roomId = data.roomId;
        this.myUserId = data.userId;
        this.roomType = data.roomType || this.roomType || 1;
        this.resetRoomScoreMap(data.roomTotalWinMap);
        this.bankerSeat = bankerSeat;
        this.betMap = data.betMap;
        this.cardMap = data.cardMap;
        this.baseScore = data.baseScore;
        this.roomFinalSettled = false;
        this.latestRoomFinalSettle = null;
        
        if(GameUIManager.instance){
            GameUIManager.instance.updateTopView(data.roomId, players.length, data.baseScore);
            GameUIManager.instance.updateRoundView(this.roundId, this.maxRoundId);
        }
        this.updatePlayer(data.userId, players);
       
        // 更新房间状态
        this.setRoomState(data.roomState);
        this.refreshAllSeatView();
        this.recoverRoomByState(data);
        if (data.roomFinalSettlePush) {
            this.roomFinalSettle(data.roomFinalSettlePush);
        }
    }

    private recoverRoomByState(data: RoomSnapshot) {
        switch (this.roomState) {
            case RoomState.READY:
                this.recoverRoundStart(data);
                break;
            case RoomState.GRAB_BANKER:
                this.recoverGrabBankerCountdown(data);
                break;
            case RoomState.BET:
                this.recoverBetCountdown(data);
                this.refreshAllSeatView();
                break;
            case RoomState.DEAL:
                if (data.cardMap && Object.keys(data.cardMap).length > 0) {
                    const dealCardPush = this.buildDealCardPush(data);
                    this.dealCard(dealCardPush);
                } else {
                    this.applyOpenedCardUsers(data.openedCardUsers);
                }
                break;
            case RoomState.SETTLE:
                if (data.settlePush) {
                    this.doSettle(data.settlePush, false);
                }
                break;
            default:
                break;
        }
    }

    private async recoverRoundStart(data: RoomSnapshot) {
        if (!data.roundAnimStartTime || !data.roundAnimEndTime || !data.serverTime) {
            return;
        }

        const nowServer = this.getSnapshotServerNow(data);
        if (nowServer >= data.roundAnimEndTime) {
            return;
        }

        if (this.sentRoundIds.has(data.roundId)) {
            return;
        }

        const version = this.timelineVersion;
        this.sentRoundIds.add(data.roundId);
        await GameUIManager.instance.showRoundStartAnim(
            this.roundId,
            data.serverTime,
            data.roundAnimEndTime
        );

        if (!this.isCurrentTimeline(version, data.roundId)) {
            return;
        }
    }

    private recoverGrabBankerCountdown(data?: RoomSnapshot) {
        const endTime = data && data.grabEndTime ? data.grabEndTime : this.grabBankerEndTime;
        const nowServer = data && data.serverTime ? this.getSnapshotServerNow(data) : this.getGrabBankerServerNow();
        if (data && data.serverTime) {
            this.grabBankerServerOffset = data.serverTime - ((data as any).__clientReceiveTime || Date.now());
            this.grabBankerEndTime = endTime;
        }

        if (endTime <= 0 || nowServer >= endTime) {
            CountDownManager.close();
            GameUIManager.instance.setGrabBankerPanelVisible(false);
            GameUIManager.instance.hidePhaseTip();
            return;
        }

        const myPlayer = this.players.get(this.myUserId);
        if (myPlayer && myPlayer.grabBanker != null) {
            CountDownManager.close();
            GameUIManager.instance.setGrabBankerPanelVisible(false);
            this.showGrabBankerWaitingTip(myPlayer.grabBanker, Math.ceil((endTime - nowServer) / 1000));
            return;
        }

        GameUIManager.instance.hidePhaseTip();
        GameUIManager.instance.setGrabBankerPanelVisible(true);
        CountDownManager.show(Math.ceil((endTime - nowServer) / 1000));
    }

    private recoverBetCountdown(data?: RoomSnapshot) {
        GameUIManager.instance.hidePhaseTip();
        const startTime = data && data.betStartTime ? data.betStartTime : 0;
        const endTime = data && data.betEndTime ? data.betEndTime : this.betEndTime;
        const nowServer = data && data.serverTime ? this.getSnapshotServerNow(data) : this.getBetServerNow();

        if (endTime <= 0 || nowServer >= endTime) {
            CountDownManager.close();
            GameUIManager.instance.setBetPanelVisible(false);
            GameUIManager.instance.hideBankerBetStatus();
            return;
        }

        if (startTime > 0 && nowServer < startTime) {
            const version = this.timelineVersion;
            const roundId = this.roundId;
            CountDownManager.close();
            GameUIManager.instance.setBetPanelVisible(false);
            GameUIManager.instance.hideBankerBetStatus();
            DelayTaskUtil.getInstance().schedule(() => {
                if (!this.isCurrentTimeline(version, roundId)) {
                    return;
                }
                this.recoverBetCountdown(data);
            }, (startTime - nowServer));
            return;
        }

        if (this.betMap && this.betMap[this.myUserId] != null) {
            CountDownManager.close();
            GameUIManager.instance.setBetPanelVisible(false);
            this.refreshBankerBetStatus();
            return;
        }

        GameUIManager.instance.setBetPanelVisible(this.canBet());
        this.refreshBankerBetStatus();
        CountDownManager.show(Math.ceil((endTime - nowServer) / 1000));
    }

    private getGrabBankerServerNow(): number {
        return Date.now() + this.grabBankerServerOffset;
    }

    private getBetServerNow(): number {
        return Date.now() + this.betServerOffset;
    }

    private shouldRecoverDealCards(data: RoomSnapshot): boolean {
        const tableNode = GameUIManager.instance ? GameUIManager.instance.getTableNode() : null;
        const paiJiuTable = tableNode && cc.isValid(tableNode)
            ? tableNode.getComponent("PaiJiuTable") as any
            : null;

        if (paiJiuTable && paiJiuTable.hasCardsOnTable && paiJiuTable.hasCardsOnTable()) {
            return false;
        }

        return true;
    }

    private getSnapshotServerNow(data: RoomSnapshot): number {
        const receiveTime = (data as any).__clientReceiveTime || Date.now();
        return Date.now() + ((data.serverTime || receiveTime) - receiveTime);
    }

    private invalidateTimelineTasks() {
        this.timelineVersion++;
    }

    private isCurrentTimeline(version: number, roundId?: number): boolean {
        if (version !== this.timelineVersion) {
            return false;
        }

        if (roundId != null && roundId !== this.roundId) {
            return false;
        }

        return true;
    }

    private getGameUI(): GameUIManager | null {
        const gameUI = GameUIManager.instance;
        if (!gameUI || !cc.isValid(gameUI.node)) {
            return null;
        }

        return gameUI;
    }

    // 进房回包
    public applyEnterRoom(data: RoomSnapshot) {
        console.log("进房回报包", data);
        cc.log("进房回包", data);

        // 1. 先缓存房间数据
        this.roomSnapshot = data;

        if (this.gameReady && (this.syncingRoomInfo || this.roomId === data.roomId)) {
            this.syncingRoomInfo = false;
            this.renderRoom(data);
            return;
        }

        this.syncingRoomInfo = false;

        // 2. 切换到游戏场景
        this.loadGameScene();
        
    }

    private async loadGameScene() {
        if (this.isLoadingGameScene) {
            return;
        }

        this.isLoadingGameScene = true;
        const t = Date.now();

        try {
            console.log("进入游戏: 开始预加载游戏资源");
            await GameRes.instance.preload();
            console.log("进入游戏: 游戏资源预加载完成", Date.now() - t, "ms");
            console.log("进入游戏: 开始预加载游戏场景");
            await SceneUtil.preloadScene("game_1");
            console.log("进入游戏: 游戏场景预加载完成", Date.now() - t, "ms");
            console.log("进入游戏等待资源耗时:", Date.now() - t, "ms");
            await SceneUtil.loadScene("game_1");
            console.log("进入游戏总耗时:", Date.now() - t, "ms");
        } catch (e) {
            cc.error("进入游戏场景失败:", e);
            this.isLoadingGameScene = false;
        }
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
        const gameUI = this.getGameUI();
        if (!gameUI) {
            return;
        }

        gameUI.clearTable();
        this.refreshAllSeatView();
        
    }


    public applyRoomInfo(data: RoomSnapshot | null) {
        this.syncingRoomInfo = false;
        if (!data) {
            this.handleNoRoomInfo();
            return;
        }

        if (this.gameReady) {
            this.roomSnapshot = data;
            this.renderRoom(data);
            return;
        }

        this.applyEnterRoom(data);
    }

    public syncRoomInfo() {
        this.syncingRoomInfo = true;
        WsClient.instance.send(Cmd.ROOM_INFO, {
            roomId: this.roomId > 0 ? this.roomId : null
        });
    }

    private handleNoRoomInfo() {
        this.roomSnapshot = null;
        this.roomId = -1;
        this.mySeatId = -1;
        this.bankerSeat = -1;
        this.players.clear();
        this.roomScoreMap.clear();
        this.invalidateTimelineTasks();

        const hallUI = HallUIManager.instance;
        if (hallUI && cc.isValid(hallUI.node)) {
            return;
        }

        const currentScene = cc.director.getScene();
        if (currentScene && currentScene.name && currentScene.name.indexOf("hall") >= 0) {
            return;
        }

        SceneUtil.loadScene("hall");
    }

    // 玩家进房通知
    public applyPlayerEnter(data: { roomId: number, player: PlayerDTO }) {
        if (!data || !data.player) {
            return;
        }
        this.players.set(data.player.userId, data.player);
        if(this.gameReady){
            GameUIManager.instance.updateTopView(data.roomId, this.players.size, this.baseScore);
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
        GameUIManager.instance.showReady(ReadyBtnState.CANCEL_READY);
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
        const gameUI = this.getGameUI();
        if (!gameUI) {
            return;
        }

        gameUI.clearTable();
        gameUI.showReady(ReadyBtnState.HIDE);
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


    // 游戏开始
    public async applyGameStart(data: {
        roomId: number,
        roundId: number,
        maxRoundId?: number,
        players: PlayerDTO[],
        serverTime: number,
        roundAnimStartTime: number,
        roundAnimEndTime: number,
    }) {
        console.log("游戏开始", "roundId:", data.roundId);
        this.invalidateTimelineTasks();
        const version = this.timelineVersion;
        this.roundId = data.roundId;
        this.maxRoundId = data.maxRoundId || this.maxRoundId || 0;
        this.animatedBetKeys.clear();

        this.players.clear();
        data.players.forEach(p => {
            this.players.set(p.userId, p);
        });

        const gameUI = this.getGameUI();
        if (!gameUI) {
            return;
        }

        gameUI.clearTable();
        gameUI.showReady(ReadyBtnState.HIDE);
        gameUI.updateRoundView(this.roundId, this.maxRoundId);

        const serverOffset = data.serverTime - Date.now();
        const getServerNow = () => Date.now() + serverOffset;
        const nowServer = getServerNow();

        // 第X局动画：过期不播
        if (nowServer < data.roundAnimEndTime) {
            const waitAnimSeconds = Math.max(
                0,
                (data.roundAnimStartTime - nowServer) / 1000
            );
            if (waitAnimSeconds > 0) {
                await PaiJiuUtil.wait(this as any, waitAnimSeconds);
            }
            if (this.isCurrentTimeline(version, data.roundId) && getServerNow() < data.roundAnimEndTime) {
                const currentGameUI = this.getGameUI();
                if (!currentGameUI) {
                    return;
                }

                this.sentRoundIds.add(data.roundId);
                await currentGameUI.showRoundStartAnim(
                    this.roundId,
                    data.serverTime,
                    data.roundAnimEndTime
                );
            }
        } else {
            console.log("局数动画已过期，跳过");
        }

    }

    // 开始抢庄
    public grabBankerStart(data: GrabBankerStartPush) {
        console.log("开始抢庄", data);
        this.invalidateTimelineTasks();
        const version = this.timelineVersion;
        const roundId = data.roundId;
        const serverOffset = data.serverTime - Date.now();
        const getServerNow = () => Date.now() + serverOffset;
        this.grabBankerServerOffset = serverOffset;
        this.grabBankerEndTime = data.grabEndTime;
     
        const waitGrabSeconds = Math.max(
            0,
            (data.grabStartTime - getServerNow()) / 1000
        );

        DelayTaskUtil.getInstance().schedule(() => {
            if (!this.isCurrentTimeline(version, roundId)) {
                return;
            }

            this.setRoomState(data.roomState);
            GameUIManager.instance.hidePhaseTip();
            this.recoverGrabBankerCountdown();
        }, waitGrabSeconds * 1000);
    }

    // 抢庄完毕-
    public grabBankerEnd(data: GrabBankerResultPush){
        console.log("抢庄完毕", data);
        this.invalidateTimelineTasks();
        const version = this.timelineVersion;
        const roundId = data.roundId;
        CountDownManager.close();
        GameUIManager.instance.setGrabBankerPanelVisible(false);
        GameUIManager.instance.hidePhaseTip();
        this.bankerSeat = data.bankerSeat;
        this.updatePlayers(data.players);
        this.grabBankerEndTime = 0;
        this.setRoomState(data.roomState);
        this.refreshAllSeatView();
        
        // 等到下注开始时间
        const serverOffset = data.serverTime - Date.now();
        const getServerNow = () => Date.now() + serverOffset;
        this.betServerOffset = serverOffset;
        this.betEndTime = data.betEndTime;
        const waitBetSeconds = Math.max(
            0,
            (data.betStartTime - getServerNow()) / 1000
        );

        if (waitBetSeconds > 0) {
            GameUIManager.instance.showPhaseTip("庄家已确定，准备下注", Math.ceil(waitBetSeconds));
        }

        DelayTaskUtil.getInstance().schedule(() => {
            if (!this.isCurrentTimeline(version, roundId)) {
                return;
            }

            GameUIManager.instance.hidePhaseTip();
            this.setRoomState(data.roomState);
            this.refreshAllSeatView();
            this.recoverBetCountdown();
        }, waitBetSeconds * 1000);
    }

    public playerGrabBanker(data: GrabBankerPush) {
        if (!data) {
            return;
        }

        const player = this.players.get(data.userId);
        if (player) {
            player.grabBanker = data.grabBanker;
        }

        if (data.userId === this.myUserId) {
            CountDownManager.close();
            GameUIManager.instance.setGrabBankerPanelVisible(false);
            this.showGrabBankerWaitingTip(data.grabBanker);
        }
    }

    public showGrabBankerWaitingTip(grabBanker: number, leftSeconds?: number) {
        const seconds = leftSeconds != null
            ? leftSeconds
            : Math.ceil((this.grabBankerEndTime - this.getGrabBankerServerNow()) / 1000);
        GameUIManager.instance.showPhaseTip(
            grabBanker === 1 ? "已抢庄，等待其他玩家" : "不抢，等待其他玩家",
            Math.max(0, seconds)
        );
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
        this.betMap[data.userId] = data.totalBet || data.chip;
        this.updatePlayers(players);
        this.refreshBankerBetStatus();
        this.playBetChipOnce(data);
        // 投注面板隐藏
        GameUIManager.instance.setBetPanelVisible(false);
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
        this.betMap[data.userId] = data.totalBet || data.chip;
        this.refreshBankerBetStatus();

        const playerMap = new Map(players.map(player => [player.seatId, player]));
        // 更新玩家金币/积分
        SeatComponentManager.getInstance().seatComponentList.forEach(comp =>{
            const seatId = comp["seatData"].id;
            const player = playerMap.get(seatId)
            if(player){
                comp.updateSetGold(this.getSeatDisplayAmount(player));
            }
        });


        if(seatId === this.mySeatId){
            GameUIManager.instance.setBetPanelVisible(false);
        }
        this.playBetChipOnce(data);
        // 更新座位信息
        this.refreshAllSeatView();
    }

    private playBetChipOnce(data: {
        roomId: number,
        userId: number,
        seatId: number,
        chip: number,
        totalBet?: number
    }) {
        if (!data || data.seatId == null || data.chip == null) {
            return;
        }

        const totalBet = data.totalBet || data.chip;
        const key = `${this.roundId}:${data.roomId}:${data.userId}:${totalBet}`;
        if (this.animatedBetKeys.has(key)) {
            return;
        }

        this.animatedBetKeys.add(key);
        GameUIManager.instance.onSelectChip(data.chip, data.seatId);
    }
    // 发牌
    public async dealCard(deal: DealCardPush) {
        this.invalidateTimelineTasks();
        CountDownManager.close();
        GameUIManager.instance.hidePhaseTip();
        GameUIManager.instance.hideBankerBetStatus();
        this.grabBankerEndTime = 0;
        this.betEndTime = 0;

        this.setRoomState(deal.roomState);
        this.bankerSeat = deal.bankerSeat;

        const tableNode = GameUIManager.instance.getTableNode();
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
        this.applyOpenedCardUsers(deal.openedCardUsers);
    }

    // 结算
    public playerOpenCard(data: PlayerOpenCardPush) {
        if (!data || data.seatId == null) {
            return;
        }

        if (data.roundId != null && data.roundId !== this.roundId) {
            cc.warn("忽略旧局亮牌推送", data.roundId, this.roundId);
            return;
        }

        if (data.roomState != null) {
            this.setRoomState(data.roomState);
        }

        const tableNode = GameUIManager.instance.getTableNode();
        if (!tableNode || !cc.isValid(tableNode)) {
            return;
        }

        const paiJiuTable = tableNode.getComponent("PaiJiuTable") as any;
        if (!paiJiuTable || !paiJiuTable.openSeatCardsByServer) {
            return;
        }

        paiJiuTable.openSeatCardsByServer(data.seatId);
    }

    private applyOpenedCardUsers(openedCardUsers?: number[]) {
        if (!openedCardUsers || openedCardUsers.length <= 0) {
            return;
        }

        const tableNode = GameUIManager.instance ? GameUIManager.instance.getTableNode() : null;
        const paiJiuTable = tableNode && cc.isValid(tableNode)
            ? tableNode.getComponent("PaiJiuTable") as any
            : null;

        if (!paiJiuTable || !paiJiuTable.showSeatCardsImmediately) {
            return;
        }

        openedCardUsers.forEach(userId => {
            const seatId = this.getSeatIdByUserId(Number(userId));
            if (seatId >= 0) {
                paiJiuTable.showSeatCardsImmediately(seatId);
            }
        });
    }

    public settle(settleInfo: SettlePush) {
        const version = this.timelineVersion;
        const roundId = this.roundId;

        const serverTime = settleInfo.serverTime || settleInfo.setServerTime;
        const settleTime = settleInfo.settleTime || settleInfo.setSettleTime;

        if (!serverTime || !settleTime) {
            cc.error("settle 缺少时间字段", settleInfo);
            this.doSettle(settleInfo, true);
            return;
        }

        const serverOffset =
            serverTime - Date.now();

        const nowServer =
            Date.now() + serverOffset;

        const delay = Math.max(
            0,
            (settleTime - nowServer) / 1000
        );

        DelayTaskUtil.getInstance().schedule(() => {
            if (!this.isCurrentTimeline(version, roundId)) {
                return;
            }
            this.doSettle(settleInfo, true);
        }, delay * 1000);
    }

    private doSettle(data: SettlePush, playEffects: boolean = true) {
        GameUIManager.instance.hideBankerBetStatus();
        this.forceTableSettleReveal();
        const bankerSeat = data.bankerSeat;
        const settlePlayers = data.settlePlayers;
        const players = data.players;

        this.updatePlayers(players);
        if (playEffects && this.isScoreRoom()) {
            this.applyScoreSettle(settlePlayers);
        }
        this.setRoomState(data.roomState);

        const playerMap = new Map(players.map(player => [player.seatId, player]));
        const settlePlayerMap = new Map(settlePlayers.map(p => [p.seatId, p]));

        SeatComponentManager.getInstance().seatComponentList.forEach(comp => {
            const seatId = comp["seatData"].id;
            const player = playerMap.get(seatId);
            const settlePlayer = settlePlayerMap.get(seatId);

            if (player) {
                comp.updateSetGold(this.getSeatDisplayAmount(player));

                if (player.seatId !== bankerSeat && settlePlayer) {
                    comp.setResultStatusView(settlePlayer.win);
                }
            }
        });

        if (playEffects) {
            GameUIManager.instance.playSettleEffects(settlePlayers, bankerSeat);
        } else {
            GameUIManager.instance.clearSettleEffects();
        }
    }

    private forceTableSettleReveal() {
        const tableNode = GameUIManager.instance ? GameUIManager.instance.getTableNode() : null;
        const paiJiuTable = tableNode && cc.isValid(tableNode)
            ? tableNode.getComponent("PaiJiuTable") as any
            : null;

        if (paiJiuTable && paiJiuTable.forceSettleReveal) {
            paiJiuTable.forceSettleReveal();
        } else {
            GameUIManager.instance.setLookCardPanelVisible(false, true);
        }
    }

    public doNextRound(){   
        SettleManager.close();
    }


    // 下一局
    public nextRound(data: NextRoundPush) {
        console.log("下一局:", data.roundId)
        this.invalidateTimelineTasks();
        GameUIManager.instance.hideBankerBetStatus();
        // 强制关闭结算界面
        SettleManager.close();

        this.roundId = data.roundId;
        this.maxRoundId = data.maxRoundId || this.maxRoundId || 0;
        this.betMap = {};
        this.animatedBetKeys.clear();
        this.setRoomState(data.roomState);
        this.updatePlayers(data.players);

        // 进入下一轮后保留牌面和输赢，等玩家点击准备时再完整清理
        GameUIManager.instance.keepSettleViewForNextReady();
        this.refreshAllSeatView();
        GameUIManager.instance.updateRoundView(this.roundId, this.maxRoundId);

        GameUIManager.instance.showReady(
            ReadyBtnState.READY
        );
    }

    public roomFinalSettle(data: RoomFinalSettlePush) {
        this.invalidateTimelineTasks();
        this.roomFinalSettled = true;
        data.scoreMode = data.scoreMode || data.roomType === 2 || this.isScoreRoom();
        this.latestRoomFinalSettle = data;
        CountDownManager.close();
        GameUIManager.instance.hidePhaseTip();
        GameUIManager.instance.hideBankerBetStatus();
        SettleManager.close();
        GameUIManager.instance.showReady(ReadyBtnState.HIDE);
        GameUIManager.instance.showRoomFinalSettle(data);
    }

    public isScoreRoom(): boolean {
        return this.roomType === 2;
    }

    private resetRoomScoreMap(roomTotalWinMap?: Record<string, number>) {
        this.roomScoreMap.clear();
        if (!this.isScoreRoom() || !roomTotalWinMap) {
            return;
        }

        Object.keys(roomTotalWinMap).forEach(userId => {
            this.roomScoreMap.set(Number(userId), Number(roomTotalWinMap[userId]) || 0);
        });
    }

    private applyScoreSettle(settlePlayers: SettlePlayerDTO[]) {
        if (!settlePlayers) {
            return;
        }

        settlePlayers.forEach(player => {
            if (!player || player.userId == null) {
                return;
            }

            const currentScore = this.roomScoreMap.get(player.userId) || 0;
            this.roomScoreMap.set(player.userId, currentScore + Number(player.winAmount || 0));
        });
    }

    private getSeatDisplayAmount(player: PlayerDTO): number {
        if (!this.isScoreRoom()) {
            return player.gold;
        }

        return this.roomScoreMap.get(player.userId) || 0;
    }

    public isRoomFinalSettled(): boolean {
        return this.roomFinalSettled;
    }

    public showLatestRoomFinalSettle(): boolean {
        if (!this.latestRoomFinalSettle) {
            return false;
        }

        GameUIManager.instance.showRoomFinalSettle(this.latestRoomFinalSettle);
        GameUIManager.instance.showReady(ReadyBtnState.HIDE);
        return true;
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
            if(GameUIManager.instance){
                GameUIManager.instance.updateTopView(data.roomId, this.players.size, this.baseScore);
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
        console.log("roomStatus:", state);
        if(state == undefined){
            return;
        }
        this.roomState = state as RoomState;
        this.refreshBetUI();
        this.refreshGrabBankerUI();
    }

    public getRoomState() {
        return this.roomState;
    }
    

    public canBet(): boolean {
        return this.roomState === RoomState.BET && this.mySeatId >= 0 && this.bankerSeat > -1 && this.bankerSeat !== this.mySeatId;
    }

    private refreshBetUI() {
        const canBet = this.canBet();
        if(canBet){
            console.log("投注面板展示");
        }else{
             console.log("投注面板隐藏", this.mySeatId, this.bankerSeat);
        }
        if (!GameUIManager.instance) {
            return;
        }

        GameUIManager.instance.setBetPanelVisible(canBet);
        this.refreshBankerBetStatus();
    }

    private refreshBankerBetStatus() {
        if (!GameUIManager.instance) {
            return;
        }

        if (this.roomState !== RoomState.BET) {
            GameUIManager.instance.hideBankerBetStatus();
            return;
        }

        GameUIManager.instance.showBankerBetStatus(
            this.getPlayers(),
            this.bankerSeat,
            this.mySeatId,
            this.betMap || {}
        );
    }

    private refreshGrabBankerUI(){
        if(this.roomState === RoomState.GRAB_BANKER){
             GameUIManager.instance.setGrabBankerPanelVisible(true);
        }else{
             GameUIManager.instance.setGrabBankerPanelVisible(false);
        }
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
            userInfo.gold = this.getSeatDisplayAmount(player);
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
        const now = Date.now();
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
            playerCards,
            serverTime: snapshot.serverTime || now,
            dealStartTime: snapshot.dealStartTime || now,
            showCardTime: snapshot.showCardTime || now + 20000,
            settleTime: snapshot.settleTime || now + 23000,
            nextRoundTime: (snapshot.settlePush && snapshot.settlePush.nextRoundTime) || now + 27000,
            openedCardUsers: snapshot.openedCardUsers || []
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
        this.maxRoundId = 0;
        this.ownerUserId = -1;
        this.roomId =-1;
        this.myUserId = -1;
        this.mySeatId = -1;
        this.roomState = RoomState.WAIT;
        this.bankerSeat = -1;
        this.gameReady = false;
        this.isLoadingGameScene = false;
        this.syncingRoomInfo = false;
        this.grabBankerEndTime = 0;
        this.betEndTime = 0;
        this.animatedBetKeys.clear();
        this.timelineVersion++;
        this.roomFinalSettled = false;
        this.latestRoomFinalSettle = null;
        if (
            GameUIManager.instance &&
            GameUIManager.instance.node &&
            cc.isValid(GameUIManager.instance.node)
        ) {
            GameUIManager.instance.updateRoundView(0, 0);
        }
    }


    

}
