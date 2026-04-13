const { ccclass, property } = cc._decorator;

@ccclass
export default class JoinBtn extends cc.Component {

    private cursorNode: cc.Node = null;
    private cursorOkNode: cc.Node = null;
    private canvas: cc.Node = null;

    onLoad () {

        this.canvas = cc.find("Canvas");
        this.cursorNode = cc.find("Canvas/CursorLayer/Hand");
        this.cursorOkNode = cc.find("Canvas/CursorLayer/Hand_ok");

        if (!this.cursorNode || !this.cursorOkNode) {
            cc.error("Cursor 节点没找到！");
            return;
        }

        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onDown, this);
        this.node.on(cc.Node.EventType.MOUSE_UP, this.onUp, this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onUp, this);
    }

    onDown (event: cc.Event.EventMouse) {

        let pos = event.getLocation();

        // ⭐ 切换手型
        this.cursorNode.active = false;
        this.cursorOkNode.active = true;

        // ⭐ 用 Canvas 转换（关键）
        let uiPos = this.canvas.convertToNodeSpaceAR(pos);

        this.cursorOkNode.setPosition(uiPos);
    }

    onUp () {
        this.cursorOkNode.active = false;
        this.cursorNode.active = true;
    }
}