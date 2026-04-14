const { ccclass, property } = cc._decorator;
import CursorManager from "./common/CursorManager";

@ccclass
export default class Game extends cc.Component {

    private cursorNode: cc.Node = null;
    private cursorOkNode: cc.Node = null;
    private canvas: cc.Node = null;


    onLoad () {
        console.log("Game onLoad");

        this.canvas = cc.find("Canvas");
        this.cursorNode = cc.find("Canvas/CursorLayer/Hand");
        this.cursorOkNode = cc.find("Canvas/CursorLayer/Hand_ok");
        if (!this.cursorNode) {
            cc.error("找不到 Hand 节点！");
            return;
        }
        CursorManager.init(this.canvas, this.cursorNode, this.cursorOkNode);
        // 鼠标移动手势
        this.canvas.on(cc.Node.EventType.MOUSE_MOVE, CursorManager.onMove, CursorManager);
     }


    start() {
        this.initTable();
    }

    async initTable() {
        const seatContainer = cc.find("Canvas/MainLayout/Table/SeatContainer");
        const seatLayout = seatContainer.getComponent("SeatLayout");

        await seatLayout.ready();

        seatLayout.initSeatLayout();

        let data = [1, 1, 1, 1];
    }
}