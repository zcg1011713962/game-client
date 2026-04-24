const { ccclass, property } = cc._decorator;
import CursorManager from "./common/CursorManager";
import RoomManager from "./room/RoomManager";
import { UserInfo } from "./user/UserInfo";
import CurrUserManager from "./user/CurrUserManager";
import UIManager from "./ui/UIManager";

@ccclass
export default class Game extends cc.Component {

    private cursorNode: cc.Node = null;
    private cursorOkNode: cc.Node = null;
    private canvasNode: cc.Node = null;
    private seatContainerNode: cc.Node = null;


    onLoad () {
        console.log("Game onLoad");

        this.canvasNode = cc.find("Canvas");
        this.cursorNode = cc.find("Canvas/CursorLayer/Hand");
        this.cursorOkNode = cc.find("Canvas/CursorLayer/Hand_ok");
        this.seatContainerNode = cc.find("Canvas/MainLayout/Table/SeatContainer");
        if (!this.cursorNode) {
            cc.error("找不到 Hand 节点！");
            return;
        }
        CursorManager.init(this.canvasNode, this.cursorNode, this.cursorOkNode);
        // 鼠标移动手势
        this.canvasNode.on(cc.Node.EventType.MOUSE_MOVE, CursorManager.onMove, CursorManager);

     }


    start() {
        this.initTable();
    }

    async initTable() {

        const seatManager =  this.seatContainerNode.getComponent("SeatManager");
        // 隐藏准备按钮
        UIManager.instance.setStartBtnStatus(false);
        await seatManager.init();
        // 初始化桌子
        seatManager.initSeatLayout();
        // 模拟进房
        this.enterRoom()
    }


    public enterRoom(){
        // 自己进房
        const selftUserId = 888888
        const roomId = 12345678;

        let self = new UserInfo({ userId: selftUserId, nickname: "玩家-me", gold: 10000 , avatar: "0"});
        CurrUserManager.getInstance().currentUserId = selftUserId;
        RoomManager.enterRoom(roomId, self);

        for (let i = 1; i < 8; i++) {
             const userId = selftUserId + i;
             let user = new UserInfo({ userId: userId, nickname: "玩家" + i , gold: i * 10000, avatar: String(i)});
             RoomManager.enterRoom(12345678, user);
             RoomManager.sitDown(userId, i);
             RoomManager.ready(userId);
        }
       
    }



}