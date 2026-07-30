import RecordApi from "./RecordApi";
import GameRecordItem, { RecordItemDTO } from "./GameRecordItem";
import HallUIManager from "../../../hall/HallUIManager";
import HallRes from "../../../hall/HallRes";
import ToastManager from "../../../common/ToastManager";
import GameRes from "../GameRes";

const { ccclass } = cc._decorator;

@ccclass
export default class GameRecordPopup extends cc.Component {
    private mask: cc.Node = null;
    private content: cc.Node = null;
    private btnClose: cc.Node = null;
    private scrollView: cc.ScrollView = null;

    private pageNo: number = 1;
    private pageSize: number = 20;
    private roomId: number | null = null;
    private bankerDetailNode: cc.Node = null;

    private loading: boolean = false;
    private hasMore: boolean = true;
    private destroyed: boolean = false;
    private requestVersion: number = 0;

    protected onLoad(): void {
        this.mask = this.node.getChildByName("Mask");
        this.content = cc.find("ListView/View/Content", this.node);
        this.btnClose = this.node.getChildByName("BtnClose");
        this.scrollView = this.node.getChildByName("ListView").getComponent(cc.ScrollView);
        this.scrollView.node.on("scroll-ended", this.onScrollEnded, this);
        this.scrollView.content = this.content;

        if (this.btnClose) {
            this.btnClose.on(cc.Node.EventType.TOUCH_END, this.hide, this);
        }

        if (this.mask) {
            this.mask.on(cc.Node.EventType.TOUCH_START, this.onMaskTouch, this);
            this.mask.on(cc.Node.EventType.TOUCH_MOVE, this.onMaskTouch, this);
            this.mask.on(cc.Node.EventType.TOUCH_END, this.onMaskTouchEnd, this);
            this.mask.on(cc.Node.EventType.TOUCH_CANCEL, this.onMaskTouch, this);
        }

        this.initTitleStyle();
    }

    public async loadFirstPage(roomId: number | null) {
        if (!this.isAlive()) {
            return;
        }

        this.pageNo = 1;
        this.hasMore = true;
        this.roomId = roomId;

        await this.loadRecord(true);
    }

    private onMaskTouch(event: cc.Event.EventTouch) {
        event.stopPropagation();
    }

    private onMaskTouchEnd(event: cc.Event.EventTouch) {
        event.stopPropagation();
    }

    private hide() {
        HallUIManager.instance.hideRecord();
    }

    private onScrollEnded() {
        if (!this.scrollView) {
            console.error("scrollView null");
            return;
        }

        const offset = this.scrollView.getScrollOffset();
        const maxOffset = this.scrollView.getMaxScrollOffset();

        if (offset.y >= maxOffset.y - 50) {
            this.loadMore();
        }
    }

    public async loadMore() {
        if (!this.isAlive() || this.loading || !this.hasMore) {
            return;
        }

        this.pageNo++;
        await this.loadRecord(false);
    }

    private async loadRecord(refresh: boolean) {
        if (!this.isAlive() || this.loading) {
            return;
        }

        this.loading = true;
        const version = this.requestVersion;

        try {
            const res = await RecordApi.queryRecord(
                this.pageNo,
                this.pageSize,
                this.roomId
            );
            if (!this.isAlive() || version !== this.requestVersion) {
                return;
            }

            const records: RecordItemDTO[] = res.data.records || [];
            this.hasMore = res.data.total > this.pageNo * this.pageSize;

            if (refresh) {
                this.refresh(records);
            } else {
                this.append(records);
            }
        } catch (e) {
            if (!this.isAlive() || version !== this.requestVersion) {
                return;
            }

            cc.error(e);
            ToastManager.show("获取战绩失败");

            if (!refresh) {
                this.pageNo--;
            }
        } finally {
            if (this.isAlive() && version === this.requestVersion) {
                this.loading = false;
            }
        }
    }

    private refresh(list: RecordItemDTO[]) {
        if (!this.isAlive() || !this.content || !cc.isValid(this.content)) {
            return;
        }

        this.content.removeAllChildren();

        if (!list || list.length === 0) {
            return;
        }

        this.createItems(list);
    }

    private append(list: RecordItemDTO[]) {
        if (!this.isAlive() || !this.content || !cc.isValid(this.content) || !list || list.length === 0) {
            return;
        }

        this.createItems(list);
    }

    private createItems(list: RecordItemDTO[]) {
        list.forEach(data => {
            if (!this.isAlive() || !this.content || !cc.isValid(this.content)) {
                return;
            }

            const itemNode = cc.instantiate(HallRes.instance.gameRecordItemPrefab);
            this.content.addChild(itemNode);

            const item = itemNode.getComponent("GameRecordItem") as GameRecordItem;
            if (item) {
                item.setClickHandler(this.showBankerDetail.bind(this));
                item.updateView(data);
            }
        });

        const layout = this.content.getComponent(cc.Layout);
        if (layout) {
            layout.updateLayout();
        }
    }

    private isAlive(): boolean {
        return !this.destroyed && !!this.node && cc.isValid(this.node);
    }

    private initTitleStyle() {
        const content = cc.find("TitleBg", this.node);

        if (!content) {
            return;
        }

        const labels = content.getComponentsInChildren(cc.Label);

        labels.forEach(label => {
            if (label.node.name === "label") {
                label.fontSize = 35;
                label.node.color = cc.color(246, 215, 122);

                let outline = label.getComponent(cc.LabelOutline);
                if (!outline) {
                    outline = label.addComponent(cc.LabelOutline);
                }

                outline.color = cc.color(107, 58, 0);
                outline.width = 2;
            }
        });
    }

    private showBankerDetail(data: RecordItemDTO) {
        if (!data || !data.bankerCards || data.bankerCards.length < 2) {
            ToastManager.show("暂无庄家牌信息");
            return;
        }

        this.hideBankerDetail();

        const root = new cc.Node("BankerRecordDetail");
        root.zIndex = 10000;
        this.node.addChild(root);
        this.bankerDetailNode = root;

        const mask = new cc.Node("Mask");
        mask.setContentSize(2000, 2000);
        mask.color = cc.Color.BLACK;
        mask.opacity = 150;
        root.addChild(mask);
        mask.on(cc.Node.EventType.TOUCH_END, this.hideBankerDetail, this);

        const panel = new cc.Node("Panel");
        panel.setContentSize(520, 360);
        panel.color = cc.color(70, 36, 16);
        root.addChild(panel);
        const panelGraphics = panel.addComponent(cc.Graphics);
        panelGraphics.fillColor = cc.color(80, 42, 18, 245);
        panelGraphics.strokeColor = cc.color(236, 176, 80);
        panelGraphics.lineWidth = 4;
        panelGraphics.roundRect(-260, -180, 520, 360, 14);
        panelGraphics.fill();
        panelGraphics.stroke();
        panel.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => event.stopPropagation(), this);

        this.createDetailLabel(panel, "庄家牌", 0, 130, 38, cc.color(255, 224, 150));
        this.createDetailLabel(panel, this.formatCardTypeName(data.bankerCardTypeName || ""), 0, -120, 36, cc.color(255, 210, 95));

        this.createDetailCard(panel, data.bankerCards[0].id, -70, 15);
        this.createDetailCard(panel, data.bankerCards[1].id, 70, 15);

        const close = new cc.Node("Close");
        close.setPosition(235, 145);
        panel.addChild(close);
        const closeLabel = close.addComponent(cc.Label);
        closeLabel.string = "X";
        closeLabel.fontSize = 32;
        closeLabel.lineHeight = 32;
        close.color = cc.color(255, 230, 160);
        close.on(cc.Node.EventType.TOUCH_END, this.hideBankerDetail, this);
    }

    private hideBankerDetail() {
        if (this.bankerDetailNode && cc.isValid(this.bankerDetailNode)) {
            this.bankerDetailNode.destroy();
        }
        this.bankerDetailNode = null;
    }

    private createDetailCard(parent: cc.Node, cardId: number, x: number, y: number) {
        const cardNode = new cc.Node(`BankerCard${cardId}`);
        cardNode.setPosition(x, y);
        parent.addChild(cardNode);

        const sprite = cardNode.addComponent(cc.Sprite);
        sprite.spriteFrame = GameRes.instance.cardImgMap[`pai_${cardId}`];
        cardNode.setContentSize(86, 126);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    }

    private createDetailLabel(parent: cc.Node, text: string, x: number, y: number, size: number, color: cc.Color) {
        const labelNode = new cc.Node("Label");
        labelNode.setPosition(x, y);
        parent.addChild(labelNode);

        const label = labelNode.addComponent(cc.Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 4;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        labelNode.color = color;
    }

    private formatCardTypeName(typeName: string): string {
        if (!typeName) {
            return "";
        }

        return typeName.indexOf("对子") === 0 ? "对子" : typeName;
    }

    protected onDestroy(): void {
        this.destroyed = true;
        this.requestVersion++;
        this.loading = false;
        this.hideBankerDetail();

        if (this.scrollView && cc.isValid(this.scrollView.node)) {
            this.scrollView.node.off("scroll-ended", this.onScrollEnded, this);
        }

        if (this.btnClose && cc.isValid(this.btnClose)) {
            this.btnClose.off(cc.Node.EventType.TOUCH_END, this.hide, this);
        }

        if (this.mask && cc.isValid(this.mask)) {
            this.mask.off(cc.Node.EventType.TOUCH_START, this.onMaskTouch, this);
            this.mask.off(cc.Node.EventType.TOUCH_MOVE, this.onMaskTouch, this);
            this.mask.off(cc.Node.EventType.TOUCH_END, this.onMaskTouchEnd, this);
            this.mask.off(cc.Node.EventType.TOUCH_CANCEL, this.onMaskTouch, this);
        }
    }
}
