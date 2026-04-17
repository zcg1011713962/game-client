const { ccclass, property } = cc._decorator;
import SeatComponent from "./SeatComponent";
import { SeatData, SeatState } from "./SeatData";
import RoomManager from "../room/RoomManager";
import { UserInfo } from "../user/UserInfo";
import CurrUserManager from "../user/CurrUserManager";
@ccclass
export default class SeatManager extends cc.Component {

    private seatPrefab: cc.Node = null;
    private seatContainerNode: cc.Node = null;
    private startBtnNode: cc.Node = null;

    private _resolveReady: Function = null;
    private _isReady: boolean = false;

    // 座位预制体数组
    private seatComponentList: SeatComponent[] = [];
    // 座位属性
    private seatComponentDataList: SeatData[] = [];

    onLoad() {
         // 加载座位预制体
        cc.resources.load("prefabs/Seat", cc.Prefab, (err, prefab) => {
            if (err) {
                cc.error("Seat prefab加载失败", err);
                return;
            }
            this.seatPrefab = prefab;
            this._isReady = true;
            // 通知 Promise
            if (this._resolveReady) {
                this._resolveReady(true);
                this._resolveReady = null;
            }
        });
        this.seatContainerNode = cc.find("Canvas/MainLayout/Table/SeatContainer");
        this.startBtnNode = cc.find("Canvas/MainLayout/Table/Table/StartBtn");
        this.initData();
        // 监听座位点击
        cc.systemEvent.on("SEAT_CLICK", this.onSeatClick, this);
        // 准备按钮点击
        // 鼠标移动手势
        this.startBtnNode.on(cc.Node.EventType.MOUSE_UP, this.onStartBtnClick, this);
    }

 
    private initData() {
        let seats = [];
        // 设置座位坐标
        seats.push({ x : 0, y : -600, id:  0 });
        seats.push({ x : 400, y : -380, id:  1 });
        seats.push({ x : 480, y : 20, id:  2 });
        seats.push({ x : 400, y : 420, id:  3});
        seats.push({ x : 0, y : 700, id:  4});
        seats.push({ x : -400, y : 420, id:  5 });
        seats.push({ x : -480, y : 20, id:  6});
        seats.push({ x : -400, y : -380, id:  7});

        for (let i = 0; i < seats.length; i++) {
            this.seatComponentDataList.push({
                id: seats[i].id,
                x: seats[i].x,
                y: seats[i].y,
                state: SeatState.EMPTY
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


        this.seatComponentDataList.forEach((data, i) => {
            const node = cc.instantiate(this.seatPrefab);
            node.parent = this.seatContainerNode;
            node.setPosition(data.x, data.y);

            const seatComponent = node.getComponent(SeatComponent);
            seatComponent.setData(data);
            this.seatComponentList.push(seatComponent);

        });
        console.log('SeatLayout OK')
    }


     /**
     * 点击座位
     */
    private onSeatClick(seatId: number) {
        const data = this.seatComponentDataList.find(s => s.id === seatId);
        if (!data){
            console.log("没有座位预制体", seatId);
            return;
        } 

        if (data.state !== SeatState.EMPTY){
            console.log("座位非空闲", seatId);
            return;
        } 

        // 获取房间的用户
        const userId = CurrUserManager.getInstance().currentUserId;
        const self = RoomManager.getRoom()?.users.get(userId);
        if (!self){
            console.log("用户不在房间", userId);
            return;
        }

        // 已经坐了就不处理
        if (self.seatId >= 0) {
            console.log("已经入座", userId);
            return;
        }

        let success = RoomManager.sitDown(self.userId, seatId);
        if (success) {
            // 座位预制体坐下状态
            data.state = SeatState.OCCUPIED;
            // 准备按钮
            this.setStartBtnStatus(true);
            this.refreshSeat(seatId);
        } else {
            console.log("入座失败");
        }
    }

    /**
     * 刷新单个座位
     */
    private refreshSeat(seatId: number) {
        const seat = this.seatComponentList.find(s => s["seatData"].id === seatId);
        const data = this.seatComponentDataList.find(s => s.id === seatId);

        if (seat && data) {
            seat.setData(data);
        }
    }

   
    public ready(): Promise<boolean> {
        return new Promise((resolve) => {

            // 已经准备好，直接返回
            if (this._isReady) {
                resolve(true);
                return;
            }

            // 没好就等加载完成
            this._resolveReady = resolve;
        });
    }

    public setStartBtnStatus(active: boolean) {
        this.startBtnNode.active = active;
    }

    private onStartBtnClick(){
        console.log("点击准备")
        this.setStartBtnStatus(false);

         const userId = CurrUserManager.getInstance().currentUserId;
         const self = RoomManager.getRoom()?.users.get(userId);
         const seatComponent = this.seatComponentList.find(s => s["seatData"].id === self.seatId);
         seatComponent.setStautsReady(true);
    }


}