const { ccclass } = cc._decorator;

@ccclass
export default class CursorManager {

    private static cursorNode: cc.Node = null;
    private static cursorOkNode: cc.Node = null;
    private static canvas: cc.Node = null;

    /**
     * 初始化
     */
    public static init(canvas: cc.Node, cursor: cc.Node, cursorOk: cc.Node) {
        this.canvas = canvas;
        this.cursorNode = cursor;
        this.cursorOkNode = cursorOk;
         // 隐藏手势
        this.cursorNode.active = false;
        this.cursorOkNode.active = false;
         // 隐藏系统鼠标
        cc.game.canvas.style.cursor = "none";
    }

    /**
     * 鼠标按下
     */
    public static onDown(event: cc.Event.EventMouse) {
        if (!this.canvas) return;

        const pos = event.getLocation();

        this.cursorNode.active = false;
        this.cursorOkNode.active = true;

        const uiPos = this.canvas.convertToNodeSpaceAR(pos);
        this.cursorOkNode.setPosition(uiPos);
    }

    /**
     * 鼠标抬起
     */
    public static onUp() {
        this.cursorOkNode.active = false;
        this.cursorNode.active = true;
    }


     /**
     * 鼠标移动
     */
    public static onMove(event: cc.Event.EventMouse) {
        const pos = event.getLocation();

        // ⭐ 第一次移动显示普通手型
        if (!this.cursorNode.active) {
            this.cursorNode.active = true;
        }

        const uiPos = this.canvas.convertToNodeSpaceAR(pos);

        // ⭐ 默认手型跟随鼠标
        this.cursorNode.setPosition(uiPos);
    }
}