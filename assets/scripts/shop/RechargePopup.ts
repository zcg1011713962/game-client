import RechargePanelStyle from "./RechargePanelStyle";
import PaymentApi, { PaymentConfig, PaymentOrder } from "./PaymentApi";
import UserData from "../login/entity/UserData";

const { ccclass, property } = cc._decorator;

/** OKX TRC20 deposit UI. All settlement decisions are made by hall. */
@ccclass
export default class RechargePopup extends cc.Component {
    @property({ tooltip: "由服务端提供的 TRC20 充值地址" }) depositAddress: string = "";
    @property(cc.SpriteFrame) qrSpriteFrame: cc.SpriteFrame = null;
    @property({ tooltip: "展示用兑换比例，实际到账以服务端为准" }) coinsPerUsdt: number = 100;

    private amount: number = 10;
    private amountNodes: cc.Node[] = [];
    private customInput: cc.EditBox = null;
    private statusVersion = 0;
    private paymentConfig: PaymentConfig = null;
    private currentOrder: PaymentOrder = null;
    private creating = false;
    private polling = false;
    private qrRows: string[] = null;
    private createButton: cc.Node = null;
    private orderSummary: cc.Label = null;
    private historyNode: cc.Node = null;
    private historyPage = 1;
    private historyLoading = false;
    private lastPaidOrder = "";

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.stopTouch, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.stopTouch, this);
        this.bind("Panel/CloseButton", () => this.node.destroy());
        this.bind("Panel/Tabs/RechargeTab", () => this.selectTab(false));
        this.bind("Panel/Tabs/WithdrawTab", () => this.selectTab(true));
        this.bind("Panel/RechargeContent/AddressArea/CopyButton", () => this.copyAddress());
        this.bind("Panel/HistoryButton", () => this.showHistory(1));
        const grid = cc.find("Panel/RechargeContent/AmountGrid", this.node);
        this.amountNodes = grid.children;
        [10, 20, 50, 100, 500].forEach((value, i) => {
            this.amountNodes[i].on(cc.Node.EventType.TOUCH_END, () => this.selectAmount(value, i), this);
            const label = this.amountNodes[i].getChildByName("CoinValue").getComponent(cc.Label);
            label.string = "≈ " + (value * this.coinsPerUsdt).toLocaleString() + " 金币";
        });
        this.setupCustomInput(this.amountNodes[5]);
        this.clearPaymentDetails();
        const rate = cc.find("Panel/RateBar/RateValue", this.node).getComponent(cc.Label);
        rate.string = String(this.coinsPerUsdt) + " 金币";
        this.selectAmount(10, 0, false);
        this.setupPaymentControls();
        this.fitPanel();
        cc.view.on("canvas-resize", this.fitPanel, this);
        this.loadPaymentConfig();
        this.schedule(this.pollOrder, 5);
    }

    onDestroy() {
        cc.view.off("canvas-resize", this.fitPanel, this);
        this.unschedule(this.pollOrder);
    }

    public setPaymentDetails(address: string, qr: cc.SpriteFrame) {
        this.qrRows = null;
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
        if (notify && (this.creating || this.isOrderOpen())) {
            this.showStatus("已有待支付订单，请按订单金额付款，或等待订单到期");
            return;
        }
        this.amount = value;
        this.amountNodes.forEach((node, i) => this.setSelected(node, i === index));
        if (index !== 5 && this.customInput) this.customInput.string = "";
        if (notify) {
            this.currentOrder = null;
            this.clearPaymentDetails();
            this.orderSummary.string = "生成订单后，请按显示的精确金额转账";
            this.node.emit("recharge-amount-changed", value);
        }
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
        qr.enabled = !this.qrRows;
        qr.node.active = !!this.depositAddress && (!!this.qrSpriteFrame || !!this.qrRows);
        if (this.qrRows) this.drawQr(qr.node, this.qrRows);
        area.getChildByName("QRPlaceholder").active = !qr.node.active;
    }

    private alive(): boolean { return cc.isValid(this.node, true); }

    private isOrderOpen(): boolean {
        return !!this.currentOrder && (this.currentOrder.status === "CREDITING" ||
            (this.currentOrder.status === "PENDING" && this.currentOrder.expiresAt > Date.now()));
    }

    private setupPaymentControls() {
        const content = cc.find("Panel/RechargeContent", this.node);
        const title = cc.find("AmountHeading/Title", content);
        title.width = 510;
        title.x = -110;
        this.createButton = this.makeButton(content, "CreateOrderButton", "生成订单", 322, 274, 280, 60, () => this.createOrder());
        this.orderSummary = this.makeLabel(content, "OrderSummary", "正在获取充值配置…", 0, -36, 940, 28, 22, new cc.Color(255, 222, 95));
        const title2 = cc.find("AddressHeading/Title", content).getComponent(cc.Label);
        title2.string = "扫码或复制地址转账，网络请选择 TRC20";
        const warning = cc.find("AddressArea/NetworkNotice/NetworkBody", content).getComponent(cc.Label);
        warning.string = "到账金额须与订单应转金额完全一致\n识别尾差不计入金币，手续费另付\n未匹配或多次转账，请联系客服核查";
    }

    private async loadPaymentConfig() {
        try {
            const config = await PaymentApi.config();
            if (!this.alive()) return;
            this.paymentConfig = config;
            this.coinsPerUsdt = config.coinsPerUsdt;
            cc.find("Panel/RateBar/RateValue", this.node).getComponent(cc.Label).string = config.coinsPerUsdt + " 金币";
            [10, 20, 50, 100, 500].forEach((value, i) => {
                this.amountNodes[i].getChildByName("CoinValue").getComponent(cc.Label).string =
                    "≈ " + (value * config.coinsPerUsdt).toLocaleString() + " 金币";
            });
            this.orderSummary.string = config.enabled ? "生成订单后，请按显示的精确金额转账" : "充值服务暂未开放";
            if (!config.enabled) return;
            const orders = await PaymentApi.history(1);
            if (!this.alive()) return;
            const pending = orders.find(o => o.status === "PENDING" || o.status === "CREDITING");
            if (pending) this.applyOrder(pending);
        } catch (e) {
            if (this.alive()) this.orderSummary.string = this.errorText(e);
        }
    }

    private async createOrder() {
        if (this.creating) return;
        if (!this.paymentConfig) { this.loadPaymentConfig(); return; }
        if (!this.paymentConfig.enabled) { this.showStatus("充值服务暂未开放"); return; }
        if (this.isOrderOpen()) { this.showStatus("请按当前订单应转金额付款，不要重复转账"); return; }
        if (this.amount < Number(this.paymentConfig.minAmount) || this.amount > Number(this.paymentConfig.maxAmount)) {
            this.showStatus("充值金额范围：" + this.paymentConfig.minAmount + "–" + this.paymentConfig.maxAmount + " USDT");
            return;
        }
        this.creating = true;
        this.createButton.getChildByName("Title").getComponent(cc.Label).string = "正在生成…";
        try {
            const amount = this.amount.toFixed(2);
            const order = await PaymentApi.create(amount, PaymentApi.requestId(amount));
            if (!this.alive()) return;
            this.applyOrder(order);
        } catch (e) { if (this.alive()) this.showStatus(this.errorText(e)); }
        finally {
            this.creating = false;
            if (this.alive()) this.createButton.getChildByName("Title").getComponent(cc.Label).string = "生成订单";
        }
    }

    private applyOrder(order: PaymentOrder) {
        if (!order || !order.orderId) {
            this.showStatus("Invalid payment order response");
            return;
        }

        cc.log("[Payment] apply order", order.orderId, order.status, order.address);
        this.currentOrder = order;
        const amount = Number(order.amount);
        const index = [10, 20, 50, 100, 500].indexOf(amount);
        this.selectAmount(amount, index < 0 ? 5 : index, false);
        if (index < 0) this.customInput.string = order.amount;
        this.depositAddress = order.address || "";
        this.qrSpriteFrame = null;
        this.qrRows = order.qrRows || null;
        this.refreshPaymentView();

        if (order.status === "PENDING" && order.expiresAt > Date.now()) {
            const minutes = Math.max(1, Math.ceil((order.expiresAt - Date.now()) / 60000));
            this.orderSummary.string = "应转 " + order.payAmount + " USDT  ·  约 " + minutes + " 分钟内支付";
        } else {
            this.clearPaymentDetails();
            if (order.status === "CREDITING") this.orderSummary.string = "充值已确认，正在发放 " + order.coins + " 金币";
            else if (order.status === "PAID") {
                this.orderSummary.string = "充值成功，已发放 " + order.coins + " 金币";
                PaymentApi.clearRequest(order.amount);
                if (this.lastPaidOrder !== order.orderId && typeof order.gold === "number") {
                    this.lastPaidOrder = order.orderId;
                    UserData.updateGold(order.gold);
                    cc.systemEvent.emit("PAYMENT_ASSET_CHANGE");
                }
            } else {
                PaymentApi.clearRequest(order.amount);
                this.orderSummary.string = "订单已到期，请勿继续付款；已转账的订单仍会核对";
            }
        }
    }

    private async pollOrder() {
        if (this.polling || !this.currentOrder || this.currentOrder.status === "PAID") return;
        const id = this.currentOrder.orderId;
        if (this.currentOrder.status === "PENDING" && Date.now() >= this.currentOrder.expiresAt) {
            this.clearPaymentDetails();
            this.orderSummary.string = "订单已到期，正在核对支付状态";
        }
        this.polling = true;
        try {
            const order = await PaymentApi.status(id);
            if (this.alive() && this.currentOrder && this.currentOrder.orderId === id) this.applyOrder(order);
        } catch (e) { if (this.alive()) this.showStatus("查询暂时失败，将自动重试"); }
        finally { this.polling = false; }
    }

    private clearPaymentDetails() {
        this.depositAddress = "";
        this.qrRows = null;
        this.qrSpriteFrame = null;
        this.refreshPaymentView();
    }

    private drawQr(node: cc.Node, rows: string[]) {
        if (!rows.length || rows.length > 177 || rows.some(r => r.length !== rows.length || !/^[01]+$/.test(r))) {
            node.active = false;
            return;
        }
        const g = node.getComponent(cc.Graphics) || node.addComponent(cc.Graphics);
        g.clear();
        const unit = Math.floor(Math.min(node.width, node.height) / rows.length);
        const size = rows.length * unit;
        g.fillColor = cc.Color.WHITE;
        g.rect(-node.width / 2, -node.height / 2, node.width, node.height);
        g.fill();
        g.fillColor = cc.Color.BLACK;
        rows.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) if (row[x] === "1") {
                g.rect(x * unit - size / 2, size / 2 - (y + 1) * unit, unit, unit);
            }
        });
        g.fill();
    }

    private async showHistory(page: number) {
        if (this.historyLoading) return;
        if (!this.paymentConfig || !this.paymentConfig.enabled) { this.showStatus("充值服务暂未开放"); return; }
        this.historyLoading = true;
        try {
            const orders = await PaymentApi.history(page);
            if (!this.alive()) return;
            this.historyPage = page;
            if (this.historyNode && cc.isValid(this.historyNode)) this.historyNode.destroy();
            this.historyNode = new cc.Node("PaymentHistory");
            this.historyNode.setContentSize(970, 1530);
            this.historyNode.zIndex = 100;
            cc.find("Panel", this.node).addChild(this.historyNode);

            const background = new cc.Node("HistoryBackground");
            background.setContentSize(this.historyNode.getContentSize());
            background.zIndex = -1;
            this.historyNode.addChild(background);
            const backgroundStyle = background.addComponent(RechargePanelStyle);
            backgroundStyle.fill = new cc.Color(8, 19, 39, 255);
            backgroundStyle.stroke = new cc.Color(31, 140, 220, 255);
            backgroundStyle.lineWidth = 3;
            backgroundStyle.redraw();

            this.historyNode.addComponent(cc.BlockInputEvents);
            this.makeLabel(this.historyNode, "Title", "充值记录", 0, 685, 780, 70, 42, cc.Color.WHITE);
            this.makeButton(this.historyNode, "Close", "×", 410, 690, 85, 75, () => this.historyNode.destroy());
            const statusText = { PENDING: "待支付", CREDITING: "发币中", PAID: "已到账", EXPIRED: "已到期" };
            orders.forEach((order, index) => {
                const y = 580 - index * 58;
                const title = new Date(order.createdAt).toLocaleString() + "  " + order.payAmount + " USDT  " + statusText[order.status];
                const row = this.makeButton(this.historyNode, "Order" + index, title, 0, y, 890, 54, async () => {
                    try {
                        const current = await PaymentApi.status(order.orderId);
                        if (!this.alive()) return;
                        this.applyOrder(current);
                        if (this.historyNode && cc.isValid(this.historyNode)) this.historyNode.destroy();
                    } catch (e) { if (this.alive()) this.showStatus(this.errorText(e)); }
                });
                row.getChildByName("Title").getComponent(cc.Label).fontSize = 22;
            });
            if (!orders.length) this.makeLabel(this.historyNode, "Empty", "暂无充值记录", 0, 60, 800, 80, 32, cc.Color.WHITE);
            this.makeLabel(this.historyNode, "Page", "第 " + page + " 页", 0, -665, 250, 60, 27, cc.Color.WHITE);
            if (page > 1) this.makeButton(this.historyNode, "Previous", "上一页", -285, -665, 220, 60, () => this.showHistory(this.historyPage - 1));
            if (orders.length === 20) this.makeButton(this.historyNode, "Next", "下一页", 285, -665, 220, 60, () => this.showHistory(this.historyPage + 1));
        } catch (e) { if (this.alive()) this.showStatus(this.errorText(e)); }
        finally { this.historyLoading = false; }
    }

    private makeLabel(parent: cc.Node, name: string, text: string, x: number, y: number, w: number, h: number, size: number, color: cc.Color): cc.Label {
        const node = new cc.Node(name);
        node.setContentSize(w, h); node.setPosition(x, y); node.color = color; parent.addChild(node);
        const label = node.addComponent(cc.Label);
        label.string = text; label.fontSize = size; label.lineHeight = size + 6;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        label.overflow = cc.Label.Overflow.SHRINK;
        return label;
    }
    private makeButton(parent: cc.Node, name: string, text: string, x: number, y: number, w: number, h: number, callback: () => void): cc.Node {
        const node = new cc.Node(name);
        node.setContentSize(w, h); node.setPosition(x, y); parent.addChild(node);
        const style = node.addComponent(RechargePanelStyle);
        style.fill = new cc.Color(11, 43, 87); style.stroke = new cc.Color(31, 140, 220); style.redraw();
        this.makeLabel(node, "Title", text, 0, 0, w - 12, h - 6, 29, cc.Color.WHITE);
        node.on(cc.Node.EventType.TOUCH_END, callback, this);
        return node;
    }
    private errorText(error: any): string { return error && error.message ? error.message : "请求失败，请稍后重试"; }

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
