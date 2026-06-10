const { ccclass } = cc._decorator;

@ccclass
export default class GrabBankerPopup extends cc.Component {

    private btnGrab: cc.Node = null;
    private btnNoGrab: cc.Node = null;

    private roomId: number = 0;
    private submitted: boolean = false;

    private submitCb: (roomId: number, grabBanker: number) => void = null;

    onLoad() {

        this.btnGrab = this.node.getChildByName("Btn_Grab");
        this.btnNoGrab = this.node.getChildByName("Btn_NoGrab");

        if (!this.btnGrab || !this.btnNoGrab) {
            cc.error("GrabBankerPopup 按钮节点不存在");
            return;
        }

        this.btnGrab.on(
            cc.Node.EventType.TOUCH_END,
            this.onClickGrab,
            this
        );

        this.btnNoGrab.on(
            cc.Node.EventType.TOUCH_END,
            this.onClickNoGrab,
            this
        );

        this.node.active = false;
    }

    onDestroy() {

        if (this.btnGrab) {
            this.btnGrab.off(
                cc.Node.EventType.TOUCH_END,
                this.onClickGrab,
                this
            );
        }

        if (this.btnNoGrab) {
            this.btnNoGrab.off(
                cc.Node.EventType.TOUCH_END,
                this.onClickNoGrab,
                this
            );
        }
    }

    public setSubmitCallback(
        cb: (roomId: number, grabBanker: number) => void
    ) {
        this.submitCb = cb;
    }

    public show(roomId: number) {

        this.roomId = roomId;
        this.submitted = false;

        this.setButtonEnable(true);

        this.node.active = true;

        this.playShowAnim();
    }

    public hide() {

        if (!this.node.active) {
            return;
        }

        this.playHideAnim();
    }

    private onClickGrab() {
        this.submit(1);
    }

    private onClickNoGrab() {
        this.submit(0);
    }

    private submit(grabBanker: number) {

        if (this.submitted) {
            return;
        }

        this.submitted = true;

        this.setButtonEnable(false);

        if (this.submitCb) {
            this.submitCb(this.roomId, grabBanker);
        }

        this.hide();
    }

    private setButtonEnable(enable: boolean) {

        this.setNodeEnable(this.btnGrab, enable);
        this.setNodeEnable(this.btnNoGrab, enable);
    }

    private setNodeEnable(node: cc.Node, enable: boolean) {

        if (!node) {
            return;
        }

        const btn = node.getComponent(cc.Button);

        if (btn) {
            btn.interactable = enable;
        }
    }

    private playShowAnim() {

        this.node.stopAllActions();

        this.node.opacity = 0;
        this.node.scale = 0.8;

        cc.tween(this.node)
            .parallel(
                cc.tween().to(0.15, {
                    opacity: 255
                }),
                cc.tween().to(0.15, {
                    scale: 1
                })
            )
            .start();
    }

    private playHideAnim() {

        this.node.stopAllActions();

        cc.tween(this.node)
            .parallel(
                cc.tween().to(0.12, {
                    opacity: 0
                }),
                cc.tween().to(0.12, {
                    scale: 0.8
                })
            )
            .call(() => {
                this.node.active = false;
            })
            .start();
    }
}