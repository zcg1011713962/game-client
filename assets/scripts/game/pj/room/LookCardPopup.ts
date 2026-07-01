import UIManager from "../ui/UIManager";

const { ccclass } = cc._decorator;

@ccclass
export default class LookCardPopup extends cc.Component {

    private panel: cc.Node = null;

    private btnRubCard: cc.Node = null;
    private btnOpenCard: cc.Node = null;


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
    public show() {
        this.node.active = true;

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

    /**
     * 点击搓牌
     */
    private onClickRubCard() {
        this.hide();
        UIManager.instance.rubCard();
    }

    /**
     * 点击亮牌
     */
    private onClickOpenCard() {
        this.hide();
        UIManager.instance.showCard();
    }





}