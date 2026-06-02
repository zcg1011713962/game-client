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

    private state: ReadyBtnState = ReadyBtnState.HIDE;

    onLoad() {
        this.readyNode = this.node.getChildByName("ReadyNode");
        this.cancelReadyNode = this.node.getChildByName("CancelReadyNode");
        this.setState(ReadyBtnState.HIDE);
    }

    public setState(state: ReadyBtnState) {
        this.state = state;

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
}