const { ccclass, property } = cc._decorator;
import SeatComponent from "./SeatComponent";
import { SeatData, SeatState } from "./SeatData";
import RoomManager from "../room/RoomManager";
import CurrUserManager from "../user/CurrUserManager";
import SeatComponentManager from "./SeatComponentManager";
import { UserInfo } from "../user/UserInfo";
import UIManager from "../ui/UIManager";
import ClientRoomManager from "../room/ClientRoomManager";
import {Cmd} from "../enum/Cmd";
import WsClient from "../net/WsClient";

@ccclass
export default class SeatManager extends cc.Component {

    private seatPrefab: cc.Node = null;
    private seatContainerNode: cc.Node = null;
    private avatarMap : { [key: string]: cc.SpriteFrame } = {}; // 预加载头像图片资源


    onLoad() {
        this.seatContainerNode = cc.find("Canvas/MainLayout/Table/SeatContainer");
        // 监听座位点击
        cc.systemEvent.on("SEAT_CLICK", this.onSeatClick, this);
    }

    public async init(){
        // 加载座位预制体
        await this.loadSeatPrefabs();
        // 加载头像
        await this.loadAvatarImg();
        // 初始化数据
        this.initData();
    }


    loadSeatPrefabs() {
        return new Promise((resolve, reject) => {
            cc.resources.load("prefabs/Seat", cc.Prefab, (err, prefab) => {
                if (err) {
                    cc.error("Seat prefab加载失败", err);
                    reject(err);
                    return;
                }
                this.seatPrefab = prefab;
                resolve(prefab);
                console.log("座位预制体加载完成");
            });
        });
    }


    loadAvatarImg() {
        return new Promise((resolve, reject) => {
            cc.resources.loadDir("avatar", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                assets.forEach(sp => {
                    this.avatarMap[sp.name] = sp;
                });
                resolve(this.avatarMap);
                console.log("所有头像加载完成");
            });
        });
    }

 
    private initData() {
        const seats = UIManager.instance.getSeat();
        for (let i = 0; i < seats.length; i++) {
            SeatComponentManager.getInstance().seatComponentDataList.push({
                id: seats[i].id,
                x: seats[i].x,
                y: seats[i].y,
                state: SeatState.EMPTY,
                userInfo: null
            });
        }
    }


    /**
     * 初始化座位布局
     */
    initSeatLayout() {
        if (!this.seatPrefab || !this.seatContainerNode) {
            cc.error("SeatManager未初始化完成");
            return;
        }
        this.seatContainerNode.removeAllChildren();


        SeatComponentManager.getInstance().seatComponentDataList.forEach((data, i) => {
            const node = cc.instantiate(this.seatPrefab);
            node.parent = this.seatContainerNode;
            node.setPosition(data.x, data.y);

            const seatComponent = node.getComponent(SeatComponent);
            seatComponent.init(data, this.avatarMap);
            SeatComponentManager.getInstance().seatComponentList.push(seatComponent);

        });
        console.log('SeatLayout OK')
    }


     /**
     * 点击座位
     */
    // private onSeatClick(seatId: number) {
    //     const data = SeatComponentManager.getInstance().seatComponentDataList.find(s => s.id === seatId);
    //     if (!data){
    //         console.log("没有座位预制体", seatId);
    //         return;
    //     } 

    //     if (data.state !== SeatState.EMPTY){
    //         console.log("座位非空闲", seatId);
    //         return;
    //     } 

    //     // 获取房间的用户
    //     const userId = CurrUserManager.getInstance().currentUserId;
    //     const self = RoomManager.getRoom()?.users.get(userId);
    //     if (!self){
    //         console.log("用户不在房间", userId);
    //         return;
    //     }

    //     // 已准备，游戏中
    //     if (self.isReady() || self.isPlaying()) {
    //         console.log("用户状态不允许入座", userId, self.state);
    //         return;
    //     }

    //     let success = RoomManager.sitDown(self.userId, seatId);
    //     if (success) {
    //         SeatManager.refreshSeat(seatId, self);
    //     } else {
    //         console.log("入座失败");
    //     }
    // }

    private onSeatClick(seatId: number) {

        const roomId = ClientRoomManager.instance.getRoomId();
        const mySeatId = ClientRoomManager.instance.getMySeatId();

        // 1. 已经坐下了
        if (mySeatId >= 0) {
            console.log("你已经坐在座位上了mySeatId",  mySeatId);
            return;
        }

        // 2. 判断座位是否有人
        const seatUser = ClientRoomManager.instance.getSeatUser(seatId);
        if (seatUser) {
            console.log("这个座位已经有人:", seatId);
            return;
        }

        // 3. 发送坐下请求
        console.log("请求坐下 seatId:", seatId);
        WsClient.instance.send(Cmd.SIT_DOWN, {roomId: roomId, seatId: seatId});
    }

    /**
     * 刷新单个座位
     */
    public static refreshSeat(seatId: number, userInfo: UserInfo) {
        const seat = SeatComponentManager.getInstance().seatComponentList.find(s => s["seatData"].id === seatId);
        const data = SeatComponentManager.getInstance().seatComponentDataList.find(s => s.id === seatId);

        if (seat && data) {
            // 更新座位用户信息
            data.userInfo = userInfo;
            seat.setData(data);
        }
    }




}