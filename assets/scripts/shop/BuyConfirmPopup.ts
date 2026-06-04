const { ccclass } = cc._decorator;

@ccclass
export default class BuyConfirmPopup extends cc.Component {

    private panel: cc.Node = null;
    private btnCancel: cc.Node = null;
    private btnConfirm: cc.Node = null;
    private btnClose: cc.Node = null;
    private labelDesc: cc.Label = null;
    private mask: cc.Node = null;
    private productId: number = 0;

    onLoad() {
        this.panel = this.node.getChildByName("Panel");
        this.mask = this.node.getChildByName("Mask");
        this.btnCancel = cc.find("Panel/Btn_Cancel", this.node);
        this.btnConfirm = cc.find("Panel/Btn_Confirm", this.node);
        this.btnClose = cc.find("Panel/Btn_Close", this.node);
        this.labelDesc = cc.find("Panel/Label_Desc", this.node).getComponent(cc.Label);
        this.setTitleStyle(this.labelDesc);

        if (this.btnCancel) {
            this.btnCancel.on(cc.Node.EventType.TOUCH_END, this.hide, this);
        }

        if (this.btnConfirm) {
            this.btnConfirm.on(cc.Node.EventType.TOUCH_END, this.onConfirmBuy, this);
        }
        if(this.btnClose){
             this.btnClose.on(cc.Node.EventType.TOUCH_END, this.hide, this);
        }
        if (this.mask) {
            this.mask.on(cc.Node.EventType.TOUCH_START, this.onMaskTouch, this);
            this.mask.on(cc.Node.EventType.TOUCH_MOVE, this.onMaskTouch, this);
            this.mask.on(cc.Node.EventType.TOUCH_END, this.onMaskTouchEnd, this);
            this.mask.on(cc.Node.EventType.TOUCH_CANCEL, this.onMaskTouch, this);
        }

        this.node.active = false;
    }

    
    private onMaskTouch(event: cc.Event.EventTouch) {
        event.stopPropagation();
    }

    private onMaskTouchEnd(event: cc.Event.EventTouch) {
        event.stopPropagation();
    }

    public show(productId: number, name: string, price: number) {
        this.productId = productId;
        this.node.active = true;

        this.labelDesc.string = `是否花费 ￥${price} 购买 ${name}？`;

        this.panel.scale = 0.85;
        this.panel.opacity = 0;

        cc.tween(this.panel)
            .parallel(
                cc.tween().to(0.18, { scale: 1 }, { easing: "backOut" }),
                cc.tween().to(0.18, { opacity: 255 })
            )
            .start();
    }

    public hide() {
        cc.tween(this.panel)
            .to(0.12, { scale: 0.85, opacity: 0 })
            .call(() => {
                this.node.active = false;
            })
            .start();
    }

    private onConfirmBuy() {
        cc.log("确认购买商品:", this.productId);

        // TODO: 这里发起支付/购买请求
        // ShopManager.instance.buyProduct(this.productId);

        this.hide();
    }


    /**
     * 棋牌风格文本
     */
    public setTitleStyle(label: cc.Label) {

        if (!label) return;

        label.node.color = new cc.Color(
            92,
            56,
            35,
            255
        );

        let outline = label.getComponent(cc.LabelOutline);

        if (!outline) {
            outline = label.addComponent(cc.LabelOutline);
        }

        outline.color = new cc.Color(
            255,
            244,
            220,
            255
        );

        outline.width = 2;

        let shadow = label.getComponent(cc.LabelShadow);

        if (!shadow) {
            shadow = label.addComponent(cc.LabelShadow);
        }

        shadow.color = new cc.Color(
            0,
            0,
            0,
            80
        );

        shadow.offset = cc.v2(0, -2);
        shadow.blur = 1;
    }

    protected onDestroy(): void {
         if (this.mask) {
            this.mask.off(cc.Node.EventType.TOUCH_START, this.onMaskTouch, this);
            this.mask.off(cc.Node.EventType.TOUCH_MOVE, this.onMaskTouch, this);
            this.mask.off(cc.Node.EventType.TOUCH_END, this.onMaskTouchEnd, this);
            this.mask.off(cc.Node.EventType.TOUCH_CANCEL, this.onMaskTouch, this);
        }
    }
}