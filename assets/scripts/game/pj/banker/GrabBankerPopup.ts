import { Cmd } from "../enum/Cmd";
import WsClient from "../net/WsClient";
import ClientRoomManager from "../room/ClientRoomManager";

const { ccclass } = cc._decorator;

@ccclass
export default class GrabBankerPopup extends cc.Component {

    private panel: cc.Node = null;
    private btnGrab: cc.Node = null;
    private btnNoGrab: cc.Node = null;

    private submitted: boolean = false;


    onLoad() {
        this.panel = this.node.getChildByName("Panel");
        this.btnGrab = this.panel.getChildByName("Btn_Grab");
        this.btnNoGrab = this.panel.getChildByName("Btn_NoGrab");

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



    public show() {
        this.submitted = false;
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
        WsClient.instance.send(Cmd.GRAB_BANKER, {roomId: ClientRoomManager.instance.getRoomId(), grabBanker: grabBanker});
        this.hide();
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