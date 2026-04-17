const { ccclass, property } = cc._decorator;
import CursorManager from "./common/CursorManager";
import RoomManager from "./room/RoomManager";
import { UserInfo } from "./user/UserInfo";
import CurrUserManager from "./user/CurrUserManager";

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
        seatManager.setStartBtnStatus(false);
        await seatManager.ready();
        // 初始化桌子
        seatManager.initSeatLayout();
        // 模拟进房
        this.enterRoom()
    }


    public enterRoom(){
        // 自己进房
        const userId = 888888

        let self = new UserInfo({ userId: userId, nickname: "玩家-me" });
        CurrUserManager.getInstance().currentUserId = userId;
        RoomManager.enterRoom(12345678, self);
    }



}