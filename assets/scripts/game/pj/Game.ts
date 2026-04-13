const { ccclass, property } = cc._decorator;


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

        // 隐藏手势
        this.cursorNode.active = false;
        this.cursorOkNode.active = false;
        // 隐藏系统鼠标
        cc.game.canvas.style.cursor = "none";
        this.canvas.on(cc.Node.EventType.MOUSE_MOVE, (event) => {
            let pos = event.getLocation();
            if (!this.cursorNode.active) {
                this.cursorNode.active = true; // ⭐ 第一次移动再显示
            }
            this.cursorNode.setPosition(this.node.convertToNodeSpaceAR(pos));
        });
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