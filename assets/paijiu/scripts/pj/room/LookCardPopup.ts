import GameUIManager from "../ui/GameUIManager";

const { ccclass } = cc._decorator;

@ccclass
export default class LookCardPopup extends cc.Component {

    private panel: cc.Node = null;

    private btnRubCard: cc.Node = null;
    private btnOpenCard: cc.Node = null;
    private countdownLabelNode: cc.Node = null;
    private countdownEndLocalTime: number = 0;


    onLoad() {

        this.panel = this.node.getChildByName("Panel");

        this.btnRubCard = this.panel.getChildByName("BtnRubCard");
        this.btnOpenCard = this.panel.getChildByName("BtnOpenCard");

        this.btnRubCard.on(
            cc.Node.EventType.TOUCH_END,
            this.onClickRubCard,
            this
        );

        this.btnOpenCard.on(
            cc.Node.EventType.TOUCH_END,
            this.onClickOpenCard,
            this
        );

        this.node.active = false;
    }

    onDestroy() {
        this.unschedule(this.updateCountdown);

        this.btnRubCard.off(
            cc.Node.EventType.TOUCH_END,
            this.onClickRubCard,
            this
        );

        this.btnOpenCard.off(
            cc.Node.EventType.TOUCH_END,
            this.onClickOpenCard,
            this
        );
    }

    /**
     * 显示
     */
    public show(leftSeconds?: number) {
        this.node.active = true;
        this.setCountdown(leftSeconds || 0);

        this.panel.opacity = 0;
        this.panel.scale = 0.8;

        cc.Tween.stopAllByTarget(this.panel);

        cc.tween(this.panel)
            .parallel(
                cc.tween().to(0.18, {
                    opacity: 255
                }),
                cc.tween().to(0.18, {
                    scale: 1
                }, {
                    easing: "backOut"
                })
            )
            .start();
    }

    /**
     * 隐藏
     */
    public hide() {

        cc.Tween.stopAllByTarget(this.panel);
        this.unschedule(this.updateCountdown);

        cc.tween(this.panel)
            .parallel(
                cc.tween().to(0.12, {
                    opacity: 0
                }),
                cc.tween().to(0.12, {
                    scale: 0.85
                })
            )
            .call(() => {
                this.node.active = false;
            })
            .start();
    }

    public hideImmediately() {
        cc.Tween.stopAllByTarget(this.panel);
        this.unschedule(this.updateCountdown);
        this.countdownEndLocalTime = 0;
        this.panel.opacity = 0;
        this.panel.scale = 0.85;
        this.node.active = false;
    }

    public setCountdown(leftSeconds: number) {
        const label = this.getCountdownLabel();
        this.unschedule(this.updateCountdown);

        if (!leftSeconds || leftSeconds <= 0) {
            this.countdownEndLocalTime = 0;
            label.string = "";
            return;
        }

        this.countdownEndLocalTime = Date.now() + leftSeconds * 1000;
        this.updateCountdown();
        this.schedule(this.updateCountdown, 0.2);
    }

    private updateCountdown() {
        const label = this.getCountdownLabel();
        if (this.countdownEndLocalTime <= 0) {
            label.string = "";
            return;
        }

        const leftSeconds = Math.max(0, Math.ceil((this.countdownEndLocalTime - Date.now()) / 1000));
        label.string = `请亮牌或搓牌 ${leftSeconds}秒`;

        if (leftSeconds <= 0) {
            this.unschedule(this.updateCountdown);
        }
    }

    private getCountdownLabel(): cc.Label {
        if (!this.countdownLabelNode || !cc.isValid(this.countdownLabelNode)) {
            this.countdownLabelNode = new cc.Node("CountdownLabel");
            this.countdownLabelNode.setPosition(0, 76);
            this.countdownLabelNode.setContentSize(320, 34);
            this.panel.addChild(this.countdownLabelNode);

            const label = this.countdownLabelNode.addComponent(cc.Label);
            label.fontSize = 24;
            label.lineHeight = 28;
            label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            label.verticalAlign = cc.Label.VerticalAlign.CENTER;
            this.countdownLabelNode.color = new cc.Color(255, 230, 128);
        }

        return this.countdownLabelNode.getComponent(cc.Label);
    }

    /**
     * 点击搓牌
     */
    private onClickRubCard() {
        this.hide();
        GameUIManager.instance.rubCard();
    }

    /**
     * 点击亮牌
     */
    private onClickOpenCard() {
        this.hide();
        GameUIManager.instance.showCard();
    }





}
