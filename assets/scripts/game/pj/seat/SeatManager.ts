const { ccclass, property } = cc._decorator;
import SeatComponent from "./SeatComponent";
import { SeatData, SeatState } from "./SeatData";
import SeatComponentManager from "./SeatComponentManager";
import { UserInfo } from "../user/UserInfo";
import UIManager from "../ui/UIManager";
import ClientRoomManager from "../room/ClientRoomManager";
import {Cmd} from "../enum/Cmd";
import WsClient from "../net/WsClient";
import GameRes from "../GameRes";

@ccclass
export default class SeatManager extends cc.Component {
    private seatContainerNode: cc.Node = null;
   
    onLoad() {
        this.seatContainerNode = cc.find("Canvas/MainLayout/Table/SeatContainer");
        // 监听座位点击
        cc.systemEvent.on("SEAT_CLICK", this.onSeatClick, this);
    }

    public async init(){
        let t = Date.now();
        // 初始化数据
        this.initData();
        console.log("座位数据初始完毕:", Date.now() - t, "ms");
    }

 
    private initData() {
        const seats = UIManager.instance.getSeat();
        SeatComponentManager.getInstance().seatComponentDataList = [];
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
        if (!GameRes.instance.seatPrefab || !this.seatContainerNode) {
            cc.error("SeatManager未初始化完成");
            return;
        }
        this.seatContainerNode.removeAllChildren();

        SeatComponentManager.getInstance().seatComponentList = [];

        SeatComponentManager.getInstance().seatComponentDataList.forEach((data, i) => {
            const node = cc.instantiate(GameRes.instance.seatPrefab);
            node.parent = this.seatContainerNode;
            node.setPosition(data.x, data.y);

            const seatComponent = node.getComponent(SeatComponent);
            seatComponent.init(data);
            SeatComponentManager.getInstance().seatComponentList.push(seatComponent);

        });
        console.log('SeatLayout OK')
    }



    private onSeatClick(seatId: number) {
        cc.audioEngine.playEffect(GameRes.instance.clickAudio, false);
        const roomId = ClientRoomManager.instance.getRoomId();
        const mySeatId = ClientRoomManager.instance.getMySeatId();

        // 判断座位是否有人
        const seatUser = ClientRoomManager.instance.getSeatUser(seatId);
        if (seatUser) {
            console.log("这个座位已经有人:", seatId);
            return;
        }

        // 发送坐下请求
        console.log("请求坐下 seatId:", seatId);
        WsClient.instance.send(Cmd.SIT_DOWN, {roomId: roomId, seatId: seatId});
    }

    /**
     * 刷新单个座位
     */
    public static refreshSeat(seatId: number, userInfo: UserInfo | null) {
        const seatComponentList = SeatComponentManager.getInstance().seatComponentList;
        const seatComponentDataList = SeatComponentManager.getInstance().seatComponentDataList;
        if(seatComponentList && seatComponentDataList){
            const seat = seatComponentList.find(s => s["seatData"].id === seatId);
            const data = seatComponentDataList.find(s => s.id === seatId);

            if (seat && data) {
                // 更新座位用户信息
                data.userInfo = userInfo;
                seat.setData(data);
            }
        }
    }




}