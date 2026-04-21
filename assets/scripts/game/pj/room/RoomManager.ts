
import { UserState, UserInfo } from "../user/UserInfo";
import { Room } from "./Room";
import { Seat } from "../seat/Seat";
import SeatManager from "../seat/SeatManager";
import UIManager from "../ui/UIManager";
import SeatComponentManager from "../seat/SeatComponentManager";
import SeatComponent from "../seat/SeatComponent";
import { SeatData, SeatState } from "../seat/SeatData";
import CurrUserManager from "../user/CurrUserManager";

export default class RoomManager {
    private static room: Room | null = null;

    /** 当前玩家 */
    private static selfUser: UserInfo | null = null;

    private static _instance: RoomManager | null = null;

    public static roomOwerUserId: number | null = null;

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
        RoomManager.room = Room.getInstance(roomId, 8);
        this.selfUser = self;

        // 加入房间用户列表
        RoomManager.room.users.set(self.userId, self);
        if(RoomManager.room.users.size == 1){
            RoomManager.roomOwerUserId = self.userId;
        }
        console.log("enterRoom:", roomId, "roomOwerUserId", RoomManager.roomOwerUserId);
    }

    /** 退出房间 */
    public static leaveRoom() {
        if (!RoomManager.room || !RoomManager.selfUser) return;

        // 如果在座位上，先站起
        if (RoomManager.selfUser.seatId >= 0) {
            RoomManager.leaveSeat(RoomManager.selfUser.userId);
        }

        RoomManager.room.users.delete(RoomManager.selfUser.userId);

        console.log("退出房间:", RoomManager.room.roomId);

        RoomManager.room = null;
        RoomManager.selfUser = null;
    }

    /** 入座 */
    public static sitDown(userId: number, seatId?: number): boolean {
        if (!RoomManager.room) return false;

        let user = RoomManager.room.users.get(userId);
        if (!user) return false;

        let seat: Seat | null = null;

        if (seatId !== undefined) {
            seat = RoomManager.room.getSeat(seatId);
            if (!seat || !seat.isEmpty()) return false;
        } else {
            seat = RoomManager.room.getEmptySeat();
            if (!seat) return false;
        }

        seat.sit(user);
        const data = SeatComponentManager.getInstance().seatComponentDataList.find(s => s.id === seatId);
        if(data){
             // 座位预制体坐下状态
             data.state = SeatState.OCCUPIED;
             // 准备或开始按钮展示
             UIManager.instance.setStartBtnStatus(true);
        }
        return true;
    }

    /** 离座 */
    public static leaveSeat(userId: number) {
        if (!RoomManager.room) return;

        let user = RoomManager.room.users.get(userId);
        if (!user || user.seatId < 0) return;

        let seat = RoomManager.room.getSeat(user.seatId);
        seat?.standUp();
    }

     /**
      * 
      *  准备
      */
     public static ready(userId: number) {
        if (!RoomManager.room) return;

        let user = RoomManager.room.users.get(userId);
        if (!user || user.seatId < 0){
            console.log("找不到用户或未入座")
            return;
        }
        
        let seat = RoomManager.room.getSeat(user.seatId);
        if(seat){
            const flag = seat.ready();
            if(flag){
                RoomManager.refreshAllSeatView();
            }
            return flag;
        }
        return false;
    }

    /**
     * 是否所有都准备
     */
    public static isAllReady(userId: number) {
        if (!RoomManager.room) return;
        // 是房主
        if(RoomManager.roomOwerUserId == CurrUserManager.getInstance().currentUserId){
            console.log("检查所有玩家状态")
            if(RoomManager.room.users){
               const size = RoomManager.room.users.size;
               let readyUsers: UserInfo[] = RoomManager.getReadyUsers();

               const popUpNode = cc.find("Canvas/UI/PopUp");
               console.log("popUpNode", popUpNode)
               const popupManager =  popUpNode.getComponent("PopupManager");
                console.log("popupManager", popupManager)
               if(size == readyUsers.length){
                  console.log("所有玩家已经准备好")
                  //popupManager.show("所有玩家已经准备好");
               }else{
                  console.log("有玩家未准备好")
                  popupManager.show("有玩家未准备好");
               }
            }
        }

    }

    public static getReadyUsers(): UserInfo[] {
        if(RoomManager.room){
            return Array.from(RoomManager.room.users.values())
            .filter(u => u.state === UserState.Ready);
        }
        return new Array();
    }


    /**
     * 
     * 游戏中
     */
     public static playing(userId: number) {
        if (!RoomManager.room) return;

        let user = RoomManager.room.users.get(userId);
        if (!user || user.seatId < 0) return;

        let seat = RoomManager.room.getSeat(user.seatId);
        if(seat){
            return seat.playing();
        }
        return false;
    }

    /**
     * 刷新已入座用户状态
     */
    public static refreshAllSeatView(){
        if(RoomManager.room){
            RoomManager.room.users.forEach((userInfo, i) =>{
                if(userInfo){
                    const seatId = userInfo.seatId;
                    if(seatId >= 0){
                        SeatManager.refreshSeat(seatId, userInfo);
                        //console.log("刷新座位", seatId, userInfo.userId, userInfo.state);
                        if(userInfo.state == UserState.Sit){
                            UIManager.instance.setStartBtnStatus(true);
                        }else if(userInfo.state == UserState.Ready){
                            UIManager.instance.setStartBtnStatus(false);
                        }
                     
                    }
                }
            })
        }
    }

    /** 获取某个座位玩家 */
    public static getSeatUser(seatId: number): UserInfo | null {
        if (!RoomManager.room) return null;
        return RoomManager.room.getSeat(seatId)?.user || null;
    }

    /** 玩家加入（别人进房） */
    public static addUser(user: UserInfo) {
        if (!RoomManager.room) return;
        RoomManager.room.users.set(user.userId, user);
    }

    /** 玩家离开（别人退房） */
    public static removeUser(userId: number) {
        if (!RoomManager.room) return;

        RoomManager.leaveSeat(userId);
        RoomManager.room.users.delete(userId);
    }

    /** 获取当前房间 */
    public static getRoom(): Room | null {
        return RoomManager.room;
    }
}