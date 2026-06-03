import UIManager from "../pj/ui/UIManager";

const { ccclass, property } = cc._decorator;

export enum ReadyBtnState {
    READY = 1,
    CANCEL_READY = 2,
    HIDE = 3
}

@ccclass
export default class ReadyButton extends cc.Component {
    private readyNode!: cc.Node;
    private cancelReadyNode!: cc.Node;

    private state!: ReadyBtnState;

    onLoad() {
        this.readyNode = this.node.getChildByName("ReadyNode");
        this.cancelReadyNode = this.node.getChildByName("CancelReadyNode");
        this.setState(ReadyBtnState.HIDE);

        this.readyNode.on(
            cc.Node.EventType.TOUCH_END,
            this.readyBtnClick,
            this
        );

        this.cancelReadyNode.on(
            cc.Node.EventType.TOUCH_END,
            this.cancelBtnClick,
            this
        );

    }

    public setState(state: ReadyBtnState) {
        this.state = state;
         console.log("准备按钮状态", this.state);

        this.node.active = state !== ReadyBtnState.HIDE;

        if (this.readyNode) {
            this.readyNode.active = state === ReadyBtnState.READY;
        }

        if (this.cancelReadyNode) {
            this.cancelReadyNode.active = state === ReadyBtnState.CANCEL_READY;
        }
    }

    public getState(): ReadyBtnState {
        return this.state;
    }

    public readyBtnClick(){
        UIManager.instance.readyBtnClick();
    }

    public cancelBtnClick(){
        UIManager.instance.cancelBtnClick();
    }

    
}