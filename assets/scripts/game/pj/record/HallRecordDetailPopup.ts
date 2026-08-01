import HallRes from "../../../hall/HallRes";
import HallRecordDetailItem from "./HallRecordDetailItem";
import { RecordItemDTO } from "./RecordTypes";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HallRecordDetailPopup extends cc.Component {
    @property(cc.Node)
    backButton: cc.Node = null;

    @property(cc.Sprite)
    gameIcon: cc.Sprite = null;

    @property(cc.Label)
    gameNameLabel: cc.Label = null;

    @property(cc.Label)
    roomLabel: cc.Label = null;

    @property(cc.Label)
    totalLabel: cc.Label = null;

    @property(cc.Label)
    roundCountLabel: cc.Label = null;

    @property(cc.ScrollView)
    scrollView: cc.ScrollView = null;

    @property(cc.Node)
    content: cc.Node = null;

    @property(cc.Prefab)
    itemPrefab: cc.Prefab = null;

    @property(cc.Label)
    emptyLabel: cc.Label = null;

    private closeHandler: () => void = null;

    protected onLoad(): void {
        this.bindNodesByName();
        this.bindEvents();
    }

    public init(summary: RecordItemDTO, records: RecordItemDTO[], closeHandler: () => void, itemPrefab?: cc.Prefab): void {
        cc.log("HallRecordDetailPopup: init start");
        this.closeHandler = closeHandler;
        this.itemPrefab = this.itemPrefab || itemPrefab || HallRes.instance.hallRecordDetailItemPrefab;

        cc.log("HallRecordDetailPopup: bind nodes");
        this.bindNodesByName();
        this.assertRequiredNodes();

        cc.log("HallRecordDetailPopup: bind events");
        this.bindEvents();

        cc.log("HallRecordDetailPopup: update summary");
        this.updateSummary(summary, records || []);

        cc.log("HallRecordDetailPopup: update list", records ? records.length : 0);
        this.updateList(records || []);
        cc.log("HallRecordDetailPopup: init complete");
    }

    private bindEvents(): void {
        if (!this.backButton) {
            return;
        }

        this.backButton.off(cc.Node.EventType.TOUCH_END, this.onBackClick, this);
        this.backButton.on(cc.Node.EventType.TOUCH_END, this.onBackClick, this);
    }

    private updateSummary(summary: RecordItemDTO, records: RecordItemDTO[]): void {
        const amount = Number(summary.winAmount || 0);

        if (this.gameIcon && HallRes.instance.recordImgMap["record_paijiu_icon"]) {
            this.gameIcon.spriteFrame = HallRes.instance.recordImgMap["record_paijiu_icon"];
        }

        this.setLabel(this.gameNameLabel, "牌九");
        this.setLabel(this.roomLabel, `房间号：${summary.roomId || ""}`);
        this.setLabel(this.totalLabel, `总输赢：${this.formatAmount(amount)}`, this.getAmountColor(amount));
        this.setLabel(this.roundCountLabel, `共 ${this.getRoundCount(summary, records)} 局`);
    }

    private updateList(records: RecordItemDTO[]): void {
        const targetContent = this.content || (this.scrollView ? this.scrollView.content : null);
        if (!targetContent) {
            cc.error("HallRecordDetailPopup 缺少 Content 节点");
            return;
        }

        targetContent.removeAllChildren();

        if (this.emptyLabel) {
            this.emptyLabel.node.active = records.length === 0;
        }

        if (!this.itemPrefab) {
            cc.error("HallRecordDetailPopup 缺少 HallRecordDetailItem 预制体");
            return;
        }

        records.forEach((record, index) => {
            try {
                const node = cc.instantiate(this.itemPrefab);
                targetContent.addChild(node);

                let item = node.getComponent(HallRecordDetailItem);
                if (!item) {
                    item = node.addComponent(HallRecordDetailItem);
                }

                if (item) {
                    item.updateView(record, index + 1);
                }
            } catch (e) {
                cc.error("HallRecordDetailPopup 创建详情条目失败:", index + 1, record, e);
            }
        });

        const layout = targetContent.getComponent(cc.Layout);
        if (layout) {
            try {
                layout.updateLayout();
            } catch (e) {
                cc.error("HallRecordDetailPopup 更新列表布局失败:", e);
            }
        }

        if (this.scrollView && cc.isValid(this.scrollView.node)) {
            this.scrollView.scrollToTop(0);
        }
    }

    private onBackClick(): void {
        if (this.closeHandler) {
            this.closeHandler();
            return;
        }

        this.node.destroy();
    }

    private bindNodesByName(): void {
        this.backButton = this.backButton || this.findChildDeep(this.node, "BtnBack") || this.findChildDeep(this.node, "BackButton");
        this.gameIcon = this.gameIcon || this.findSprite("GameIcon");
        this.gameNameLabel = this.gameNameLabel || this.findLabel("GameNameLabel");
        this.roomLabel = this.roomLabel || this.findLabel("RoomLabel");
        this.totalLabel = this.totalLabel || this.findLabel("TotalLabel");
        this.roundCountLabel = this.roundCountLabel || this.findLabel("RoundCountLabel");
        this.scrollView = this.scrollView || this.findScrollView("ScrollView") || this.findScrollView("ListView");
        this.content = this.content || this.findChildDeep(this.node, "Content") || (this.scrollView ? this.scrollView.content : null);
        this.emptyLabel = this.emptyLabel || this.findLabel("EmptyLabel");

        if (this.scrollView && this.content) {
            this.scrollView.content = this.content;
            this.scrollView.horizontal = false;
            this.scrollView.vertical = true;
        }
    }

    private assertRequiredNodes(): void {
        const missing: string[] = [];
        if (!this.backButton) missing.push("BtnBack");
        if (!this.gameNameLabel) missing.push("GameNameLabel");
        if (!this.roomLabel) missing.push("RoomLabel");
        if (!this.totalLabel) missing.push("TotalLabel");
        if (!this.roundCountLabel) missing.push("RoundCountLabel");
        if (!this.scrollView) missing.push("ScrollView");
        if (!this.content) missing.push("Content");
        if (!this.itemPrefab) missing.push("HallRecordDetailItem prefab");

        if (missing.length > 0) {
            throw new Error(`HallRecordDetailPopup 节点绑定缺失: ${missing.join(", ")}`);
        }
    }

    private setLabel(label: cc.Label, text: string, color?: cc.Color): void {
        if (!label) {
            return;
        }

        label.string = text;
        if (color) {
            label.node.color = color;
        }
    }

    private findLabel(name: string): cc.Label {
        const node = this.findChildDeep(this.node, name);
        return node ? node.getComponent(cc.Label) : null;
    }

    private findSprite(name: string): cc.Sprite {
        const node = this.findChildDeep(this.node, name);
        return node ? node.getComponent(cc.Sprite) : null;
    }

    private findScrollView(name: string): cc.ScrollView {
        const node = this.findChildDeep(this.node, name);
        return node ? node.getComponent(cc.ScrollView) : null;
    }

    private findChildDeep(root: cc.Node, name: string): cc.Node {
        if (!root) {
            return null;
        }

        if (root.name === name) {
            return root;
        }

        for (let i = 0; i < root.children.length; i++) {
            const found = this.findChildDeep(root.children[i], name);
            if (found) {
                return found;
            }
        }

        return null;
    }

    private getRoundCount(summary: RecordItemDTO, records: RecordItemDTO[]): number {
        if (summary.roundCount) {
            return Number(summary.roundCount);
        }

        if (!records || records.length === 0) {
            return 0;
        }

        return records.reduce((max, item) => Math.max(max, Number(item.roundId || 0)), 0);
    }

    private formatAmount(amount: number): string {
        if (amount > 0) {
            return `+${amount.toLocaleString()}`;
        }

        if (amount < 0) {
            return amount.toLocaleString();
        }

        return "0";
    }

    private getAmountColor(amount: number): cc.Color {
        if (amount > 0) {
            return cc.color(80, 235, 80);
        }

        if (amount < 0) {
            return cc.color(255, 58, 62);
        }

        return cc.color(255, 190, 35);
    }

    protected onDestroy(): void {
        this.unscheduleAllCallbacks();

        if (this.backButton) {
            this.backButton.off(cc.Node.EventType.TOUCH_END, this.onBackClick, this);
        }
    }
}
