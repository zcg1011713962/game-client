import { UserInfo, UserState } from "../user/UserInfo";
import UIManager from "../ui/UIManager";
import SeatManager from "../seat/SeatManager";
import {RoomState} from "../room/RoomState"；

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
    roomId: number;
    userId: number;
    seatId: number;
    roomState: number;
    players: PlayerDTO[];
}

export default class ClientRoomManager {

    private static _instance: ClientRoomManager = null;

    public static get instance(): ClientRoomManager {
        if (!this._instance) {
            this._instance = new ClientRoomManager();
        }
        return this._instance;
    }

    private roomId: number = 0;

    private myUserId: number = 0;

    private mySeatId: number = -1;

    private players: Map<number, PlayerDTO> = new Map();

    private roomState: RoomState = RoomState.WAIT;

    private constructor() {}

    public applyEnterRoom(data: RoomSnapshot) {
        this.roomId = data.roomId;
        this.myUserId = data.userId;
        this.mySeatId = data.seatId;

        this.players.clear();

        if (data.players) {
            data.players.forEach(p => {
                this.players.set(p.userId, p);
            });
        }

        this.refreshAllSeatView();

        cc.log("进房成功 roomId:", this.roomId);
    }

    public applySitDown(data: {roomId: number,userId: number,seatId: number,state: number}) {

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

        // 如果是自己
        if (data.userId === this.myUserId) {
            this.mySeatId = data.seatId;
        }

        this.refreshAllSeatView();
    }

    public applyRoomInfo(data: RoomSnapshot) {
        this.applyEnterRoom(data);
    }

    public applyPlayerEnter(data: { roomId: number, player: PlayerDTO }) {
        if (!data || !data.player) {
            return;
        }

        this.players.set(data.player.userId, data.player);

        this.refreshAllSeatView();
    }

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

        this.refreshAllSeatView();
    }

    public applyGameStart(data: {
        roomId: number,
        roomState: number,
        players: PlayerDTO[]
    }) {
        console.log("游戏开始，进入下注阶段 roomState", this.roomState);
        this.players.clear();

        if (data.players) {
            data.players.forEach(p => {
                this.players.set(p.userId, p);
            });
        }
        this.setRoomState(data.roomState);
        this.refreshAllSeatView();

        UIManager.instance.setStartBtnStatus(false);
    }

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
}