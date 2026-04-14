const { ccclass, property } = cc._decorator;
import CursorManager from "../common/CursorManager";
@ccclass
export default class JoinBtn extends cc.Component {


    onLoad () {
        this.node.on(cc.Node.EventType.MOUSE_DOWN, CursorManager.onDown, CursorManager);
        this.node.on(cc.Node.EventType.MOUSE_UP, CursorManager.onUp, CursorManager);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, CursorManager.onUp, CursorManager);
    }


}