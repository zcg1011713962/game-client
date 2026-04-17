
import { UserInfo } from "../user/UserInfo";
import { Room } from "./Room";
import { Seat } from "../seat/Seat";
import SeatManager from "../seat/SeatManager";
import SeatComponentManager from "../seat/SeatComponentManager";
import SeatComponent from "../seat/SeatComponent";

export default class RoomManager {
    private static room: Room | null = null;

    /** 当前玩家 */
    private static selfUser: UserInfo | null = null;

    private static _instance: RoomManager | null = null;

    // 禁止外部 new
    private constructor() {}

    public static getInstance(): RoomManager {
        if (!this._instance) {
            this._instance = new RoomManager();
        }
        return this._instance;
    }

    /** 进房 */
    public static enterRoom(roomId: number, self: UserInfo) {
        this.room = new Room(roomId);
        this.selfUser = self;

        // 加入房间用户列表
        this.room.users.set(self.userId, self);

        console.log("enterRoom:", roomId);
    }

    /** 退出房间 */
    public static leaveRoom() {
        if (!this.room || !this.selfUser) return;

        // 如果在座位上，先站起
        if (this.selfUser.seatId >= 0) {
            this.leaveSeat(this.selfUser.userId);
        }

        this.room.users.delete(this.selfUser.userId);

        console.log("退出房间:", this.room.roomId);

        this.room = null;
        this.selfUser = null;
    }

    /** 入座 */
    public static sitDown(userId: number, seatId?: number): boolean {
        if (!this.room) return false;

        let user = this.room.users.get(userId);
        if (!user) return false;

        let seat: Seat | null = null;

        if (seatId !== undefined) {
            seat = this.room.getSeat(seatId);
            if (!seat || !seat.isEmpty()) return false;
        } else {
            seat = this.room.getEmptySeat();
            if (!seat) return false;
        }

        seat.sit(user);
        return true;
    }

    /** 离座 */
    public static leaveSeat(userId: number) {
        if (!this.room) return;

        let user = this.room.users.get(userId);
        if (!user || user.seatId < 0) return;

        let seat = this.room.getSeat(user.seatId);
        seat?.standUp();
    }

     /**
      * 
      *  准备
      */
     public static ready(userId: number) {
        if (!this.room) return;

        let user = this.room.users.get(userId);
        if (!user || user.seatId < 0) return;

        let seat = this.room.getSeat(user.seatId);
        if(seat){
            return seat.ready();
        }
        return false;
    }

    /**
     * 
     * 游戏中
     */
     public static playing(userId: number) {
        if (!this.room) return;

        let user = this.room.users.get(userId);
        if (!user || user.seatId < 0) return;

        let seat = this.room.getSeat(user.seatId);
        if(seat){
            return seat.playing();
        }
        return false;
    }


    public static refreshAllSeatView(){
        if(this.room){
            this.room.users.forEach((userInfo, i) =>{
                const seatId = userInfo.seatId;
                if(seatId > 0){
                    //SeatComponent seatComponent = SeatComponentManager.getInstance().seatComponentList.find(it => it.getData().id == seatId)
                    //if(){

                    //}
                }
            })

            return true;
        }
        return false;
    }

    /** 获取某个座位玩家 */
    public static getSeatUser(seatId: number): UserInfo | null {
        if (!this.room) return null;
        return this.room.getSeat(seatId)?.user || null;
    }

    /** 玩家加入（别人进房） */
    public static addUser(user: UserInfo) {
        if (!this.room) return;
        this.room.users.set(user.userId, user);
    }

    /** 玩家离开（别人退房） */
    public static removeUser(userId: number) {
        if (!this.room) return;

        this.leaveSeat(userId);
        this.room.users.delete(userId);
    }

    /** 获取当前房间 */
    public static getRoom(): Room | null {
        return this.room;
    }
}