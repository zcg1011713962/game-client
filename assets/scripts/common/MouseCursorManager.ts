import UIZOrder from "./ui/UIZOrder";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MouseCursorManager extends cc.Component {


    private cursorNormal: cc.Node = null;
    private cursorDown: cc.Node = null;
    private canvasNode: cc.Node = null;

    onLoad() {
        
    }

    /**
     * 每个场景加载后调用一次
     */
    public bindCanvas(canvas: cc.Node) {
        this.cursorNormal = this.node.getChildByName("cursorNormal");
        this.cursorDown = this.node.getChildByName("cursorDown");
        this.cursorNormal.active = false;
        this.cursorDown.active = false;

        if (this.canvasNode) {
            if (cc.sys.isMobile) {
                 this.canvasNode.off(cc.Node.EventType.TOUCH_MOVE, this.onMouseMove, this);
            } else {
                 this.canvasNode.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
            }
            this.canvasNode.off(cc.Node.EventType.TOUCH_START, this.onMouseDown, this);
            this.canvasNode.off(cc.Node.EventType.TOUCH_END, this.onMouseUp, this);
            this.canvasNode.off(cc.Node.EventType.TOUCH_CANCEL, this.onMouseUp, this);
        }
        this.canvasNode = canvas;
        if (cc.sys.isMobile) {
            this.canvasNode.on(cc.Node.EventType.TOUCH_MOVE, this.onMouseMove, this);
        }else{
            this.canvasNode.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        }
        this.canvasNode.on(cc.Node.EventType.TOUCH_START, this.onMouseDown, this);
        this.canvasNode.on(cc.Node.EventType.TOUCH_END, this.onMouseUp, this);
        this.canvasNode.on(cc.Node.EventType.TOUCH_CANCEL, this.onMouseUp, this);
        if (cc.sys.isBrowser && cc.game.canvas) {
            cc.game.canvas.style.cursor = "none";
        }
        this.node.zIndex = UIZOrder.TOP;
    }
    
    public show() {
        this.cursorNormal.active = true;
        this.cursorDown.active = false;
        this.hideSystemCursor();
    }

    public hide() {
        this.cursorNormal.active = false;
        this.cursorDown.active = false;
        this.showSystemCursor();
    }

    private onMouseMove(event: cc.Event.EventMouse) {

        if (!this.canvasNode) return;

        const pos = this.getMousePos(event);
        this.cursorNormal.active = true;
        this.cursorDown.active = false;
        this.cursorNormal.setPosition(pos);
    }

    private onMouseDown(event: cc.Event.EventMouse) {
        if (!this.canvasNode) return;

        const pos = this.getMousePos(event);

        this.cursorNormal.active = false;
        this.cursorDown.active = true;
        this.cursorDown.setPosition(pos);
    }

    private onMouseUp(event: cc.Event.EventMouse) {
        if (!this.canvasNode) return;

        const pos = this.getMousePos(event);

        this.cursorDown.active = false;
        this.cursorNormal.active = true;
        this.cursorNormal.setPosition(pos);
    }

    private getMousePos(event: cc.Event.EventMouse): cc.Vec2 {
        const worldPos = event.getLocation();
        return this.canvasNode.convertToNodeSpaceAR(worldPos);
    }

    private hideSystemCursor() {
        if (cc.sys.isBrowser && cc.game.canvas) {
            cc.game.canvas.style.cursor = "none";
        }
    }

    private showSystemCursor() {
        if (cc.sys.isBrowser && cc.game.canvas) {
            cc.game.canvas.style.cursor = "auto";
        }
    }
  
}