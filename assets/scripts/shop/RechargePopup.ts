import RechargePanelStyle from "./RechargePanelStyle";

const { ccclass, property } = cc._decorator;

/** Standalone UI. Host handles orders, withdrawals, history and QR generation. */
@ccclass
export default class RechargePopup extends cc.Component {
    @property({ tooltip: "由服务端提供的 TRC20 充值地址" }) depositAddress: string = "";
    @property(cc.SpriteFrame) qrSpriteFrame: cc.SpriteFrame = null;
    @property({ tooltip: "展示用兑换比例，实际到账以服务端为准" }) coinsPerUsdt: number = 100;

    private amount: number = 10;
    private amountNodes: cc.Node[] = [];
    private customInput: cc.EditBox = null;
    private statusVersion = 0;

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.stopTouch, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.stopTouch, this);
        this.bind("Panel/CloseButton", () => this.node.destroy());
        this.bind("Panel/Tabs/RechargeTab", () => this.selectTab(false));
        this.bind("Panel/Tabs/WithdrawTab", () => this.selectTab(true));
        this.bind("Panel/RechargeContent/AddressArea/CopyButton", () => this.copyAddress());
        this.bind("Panel/HistoryButton", () => {
            if (this.node.hasEventListener("recharge-history")) {
                this.node.emit("recharge-history");
            } else {
                this.showStatus("充值记录暂未开放");
            }
        });
        const grid = cc.find("Panel/RechargeContent/AmountGrid", this.node);
        this.amountNodes = grid.children;
        [10, 20, 50, 100, 500].forEach((value, i) => {
            this.amountNodes[i].on(cc.Node.EventType.TOUCH_END, () => this.selectAmount(value, i), this);
            const label = this.amountNodes[i].getChildByName("CoinValue").getComponent(cc.Label);
            label.string = "≈ " + (value * this.coinsPerUsdt).toLocaleString() + " 金币";
        });
        this.setupCustomInput(this.amountNodes[5]);
        this.refreshPaymentView();
        const rate = cc.find("Panel/RateBar/RateValue", this.node).getComponent(cc.Label);
        rate.string = String(this.coinsPerUsdt) + " 金币";
        this.selectAmount(10, 0, false);
        this.fitPanel();
        cc.view.on("canvas-resize", this.fitPanel, this);
    }

    onDestroy() { cc.view.off("canvas-resize", this.fitPanel, this); }

    public setPaymentDetails(address: string, qr: cc.SpriteFrame) {
        this.depositAddress = address || "";
        this.qrSpriteFrame = qr || null;
        this.refreshPaymentView();
    }

    public getSelectedAmount(): number { return this.amount; }

    private bind(path: string, callback: () => void) {
        cc.find(path, this.node).on(cc.Node.EventType.TOUCH_END, callback, this);
    }

    private stopTouch(event: cc.Event.EventTouch) { event.stopPropagation(); }

    private fitPanel() {
        const panel = this.node.getChildByName("Panel");
        const size = cc.view.getVisibleSize();
        panel.scale = Math.min(size.width / panel.width, size.height / panel.height, 1);
        const mask = this.node.getChildByName("Mask");
        mask.setContentSize(size);
        mask.getComponent(RechargePanelStyle).redraw();
    }

    private setupCustomInput(node: cc.Node) {
        const inputNode = new cc.Node("AmountInput");
        inputNode.setContentSize(node.width - 12, node.height - 12);
        node.addChild(inputNode);
        this.customInput = inputNode.addComponent(cc.EditBox);
        this.customInput.inputMode = cc.EditBox.InputMode.DECIMAL;
        this.customInput.maxLength = 9;
        this.customInput.fontSize = 35;
        this.customInput.fontColor = cc.Color.WHITE;
        this.customInput.placeholder = "自定义金额";
        this.customInput.placeholderFontSize = 29;
        this.customInput.placeholderFontColor = new cc.Color(193, 208, 233);
        node.getChildByName("Title").active = false;
        inputNode.on("editing-did-ended", () => {
            const text = this.customInput.string.trim();
            const value = Number(text);
            if (!/^\d+(\.\d{1,2})?$/.test(text) || value <= 0 || value > 1000000) {
                this.customInput.string = "";
                this.showStatus("请输入有效金额，最多保留两位小数");
                return;
            }
            this.selectAmount(value, 5);
        }, this);
    }

    private selectAmount(value: number, index: number, notify: boolean = true) {
        this.amount = value;
        this.amountNodes.forEach((node, i) => this.setSelected(node, i === index));
        if (index !== 5 && this.customInput) this.customInput.string = "";
        if (notify) this.node.emit("recharge-amount-changed", value);
    }

    private setSelected(node: cc.Node, selected: boolean) {
        const style = node.getComponent(RechargePanelStyle);
        style.fill = selected ? new cc.Color(5, 50, 116) : new cc.Color(10, 22, 45);
        style.stroke = selected ? new cc.Color(0, 213, 255) : new cc.Color(40, 68, 112);
        style.glow = selected;
        style.redraw();
    }

    private selectTab(withdraw: boolean) {
        cc.find("Panel/RechargeContent", this.node).active = !withdraw;
        cc.find("Panel/WithdrawContent", this.node).active = withdraw;
        this.setSelected(cc.find("Panel/Tabs/RechargeTab", this.node), !withdraw);
        this.setSelected(cc.find("Panel/Tabs/WithdrawTab", this.node), withdraw);
        if (withdraw) this.node.emit("recharge-withdraw");
    }

    private refreshPaymentView() {
        const area = cc.find("Panel/RechargeContent/AddressArea", this.node);
        if (!area) return;
        area.getChildByName("AddressValue").getComponent(cc.Label).string =
            this.depositAddress || "等待充值地址";
        const qr = area.getChildByName("QRCode").getComponent(cc.Sprite);
        qr.spriteFrame = this.qrSpriteFrame;
        qr.node.active = !!this.depositAddress && !!this.qrSpriteFrame;
        area.getChildByName("QRPlaceholder").active = !qr.node.active;
    }

    private async copyAddress() {
        if (!this.depositAddress) { this.showStatus("充值地址尚未准备好"); return; }
        try {
            if (cc.sys.isBrowser && typeof navigator !== "undefined" && navigator.clipboard) {
                await navigator.clipboard.writeText(this.depositAddress);
                if (cc.isValid(this.node)) this.showStatus("地址已复制");
            } else {
                this.node.emit("recharge-copy-address", this.depositAddress);
                this.showStatus("请复制上方完整地址");
            }
        } catch (_) {
            if (cc.isValid(this.node)) this.showStatus("复制失败，请手动复制地址");
        }
    }

    private showStatus(text: string) {
        const node = cc.find("Panel/Status", this.node);
        node.getComponent(cc.Label).string = text;
        node.active = true;
        const version = ++this.statusVersion;
        this.scheduleOnce(() => { if (version === this.statusVersion) node.active = false; }, 3);
    }
}
