import RecordApi from "./RecordApi";
import { RecordItemDTO } from "./GameRecordItem";
import HallRecordItem from "./HallRecordItem";
import HallUIManager from "../../../hall/HallUIManager";
import HallRes from "../../../hall/HallRes";
import ToastManager from "../../../common/ToastManager";

const { ccclass } = cc._decorator;

@ccclass
export default class HallRecordPopup extends cc.Component {
    private static readonly TABS = ["全部游戏", "牌九"];
    private static readonly TAB_GAME_IDS: Array<number | null> = [null, 1];

    private content: cc.Node = null;
    private scrollView: cc.ScrollView = null;
    private emptyLabel: cc.Label = null;
    private tabNodes: cc.Node[] = [];
    private tabLabels: cc.Label[] = [];

    private pageNo: number = 1;
    private pageSize: number = 20;
    private loading: boolean = false;
    private hasMore: boolean = true;
    private selectedTabIndex: number = 0;
    private requestVersion: number = 0;

    protected onLoad(): void {
        this.buildView();
    }

    public async loadFirstPage(_roomId: number | null) {
        this.pageNo = 1;
        this.hasMore = true;
        await this.loadRecord(true);
    }

    private buildView(): void {
        this.node.removeAllChildren();
        this.node.setPosition(0, 0);
        this.node.setContentSize(1080, 1920);

        this.createBg();
        this.createHeader();
        this.createTabs();
        this.createList();
        this.createFooterTip();
    }

    private createBg(): void {
        const bg = this.createSpriteNode("RecordBg", HallRes.instance.recordImgMap["record_bg"], 1080, 1920);
        bg.parent = this.node;
    }

    private createHeader(): void {
        const line = new cc.Node("TitleLine");
        line.parent = this.node;
        line.setPosition(0, 795);

        const graphics = line.addComponent(cc.Graphics);
        graphics.lineWidth = 3;
        graphics.strokeColor = cc.color(255, 32, 32, 180);
        graphics.moveTo(-520, 0);
        graphics.lineTo(-300, 0);
        graphics.moveTo(300, 0);
        graphics.lineTo(520, 0);
        graphics.stroke();

        const titleBg = this.createSpriteNode("TitleBg", HallRes.instance.recordImgMap["record_title_bg"], 540, 157);
        titleBg.parent = this.node;
        titleBg.setPosition(0, 815);


        const back = this.createSpriteNode("BtnBack", HallRes.instance.recordImgMap["record_back"], 118, 88);
        back.parent = this.node;
        back.setPosition(-420, 840);
        back.on(cc.Node.EventType.TOUCH_END, this.hide, this);
    }

    private createTabs(): void {
        const startX = -420;
        const y = 700;
        const gap = 154;
        this.tabNodes = [];
        this.tabLabels = [];

        HallRecordPopup.TABS.forEach((name, index) => {
            const selected = index === this.selectedTabIndex;
            const tab = this.createSpriteNode(
                `Tab${index}`,
                HallRes.instance.recordImgMap[selected ? "record_tab_selected" : "record_tab_normal"],
                150,
                78
            );
            tab.parent = this.node;
            tab.setPosition(startX + index * gap, y);
            tab.on(cc.Node.EventType.TOUCH_END, () => {
                this.onTabClick(index);
            }, this);

            const label = this.createLabel(name, 28, selected ? cc.color(255, 246, 230) : cc.color(160, 164, 178), true);
            label.node.parent = tab;
            label.node.setPosition(0, 0);

            this.tabNodes[index] = tab;
            this.tabLabels[index] = label;
        });

        // const timeBtn = this.createSpriteNode(
        //     "TimeFilter",
        //     HallRes.instance.recordImgMap["record_time_filter_bg"],
        //     190,
        //     58
        // );
        // timeBtn.parent = this.node;
        // timeBtn.setPosition(415, y);

        // const label = this.createLabel("全部时间  v", 25, cc.color(245, 245, 245), true);
        // label.node.parent = timeBtn;
        // label.node.setPosition(8, 0);
    }

    private onTabClick(index: number): void {
        if (this.selectedTabIndex === index) {
            return;
        }

        this.selectedTabIndex = index;
        this.updateTabView();
        this.pageNo = 1;
        this.hasMore = true;
        this.requestVersion++;
        this.loading = false;
        this.loadRecord(true);
    }

    private updateTabView(): void {
        this.tabNodes.forEach((node, index) => {
            if (!node || !cc.isValid(node)) {
                return;
            }

            const selected = index === this.selectedTabIndex;
            const sprite = node.getComponent(cc.Sprite);
            if (sprite) {
                sprite.spriteFrame = HallRes.instance.recordImgMap[selected ? "record_tab_selected" : "record_tab_normal"];
            }

            const label = this.tabLabels[index];
            if (label) {
                label.node.color = selected ? cc.color(255, 246, 230) : cc.color(160, 164, 178);
            }
        });
    }

    private createList(): void {
        const listNode = new cc.Node("ListView");
        listNode.parent = this.node;
        listNode.setPosition(0, -35);
        listNode.setContentSize(1040, 1320);

        const view = new cc.Node("View");
        view.parent = listNode;
        view.setContentSize(1040, 1320);
        view.addComponent(cc.Mask);

        this.content = new cc.Node("Content");
        this.content.parent = view;
        this.content.anchorY = 1;
        this.content.setPosition(0, 660);
        this.content.setContentSize(1040, 1320);

        const layout = this.content.addComponent(cc.Layout);
        layout.type = cc.Layout.Type.VERTICAL;
        layout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
        layout.spacingY = 18;
        layout.paddingTop = 8;
        layout.paddingBottom = 20;

        this.scrollView = listNode.addComponent(cc.ScrollView);
        this.scrollView.vertical = true;
        this.scrollView.horizontal = false;
        this.scrollView.content = this.content;
        this.scrollView.node.on("scroll-ended", this.onScrollEnded, this);

        this.emptyLabel = this.createLabel("暂无战绩记录", 34, cc.color(160, 164, 178), true);
        this.emptyLabel.node.parent = this.node;
        this.emptyLabel.node.setPosition(0, 150);
        this.emptyLabel.node.active = false;
    }

    private createFooterTip(): void {
        const label = this.createLabel("仅保留最近100场对局记录", 24, cc.color(130, 132, 142), false);
        label.node.parent = this.node;
        label.node.setPosition(0, -865);
    }

    private hide() {
        HallUIManager.instance.hideRecord();
    }

    private onScrollEnded() {
        if (!this.scrollView) {
            return;
        }

        const offset = this.scrollView.getScrollOffset();
        const maxOffset = this.scrollView.getMaxScrollOffset();

        if (offset.y >= maxOffset.y - 50) {
            this.loadMore();
        }
    }

    private async loadMore() {
        if (this.loading || !this.hasMore) {
            return;
        }

        this.pageNo++;
        await this.loadRecord(false);
    }

    private async loadRecord(refresh: boolean) {
        if (this.loading) {
            return;
        }

        this.loading = true;
        const version = this.requestVersion;

        try {
            const res = await RecordApi.queryRecord(
                this.pageNo,
                this.pageSize,
                null,
                HallRecordPopup.TAB_GAME_IDS[this.selectedTabIndex]
            );
            const records: RecordItemDTO[] = res.data.records || [];

            if (version !== this.requestVersion) {
                return;
            }

            this.hasMore = res.data.total > this.pageNo * this.pageSize;

            if (refresh) {
                this.refresh(records);
            } else {
                this.append(records);
            }
        } catch (e) {
            if (version !== this.requestVersion) {
                return;
            }

            cc.error(e);
            ToastManager.show("获取战绩失败");

            if (!refresh) {
                this.pageNo--;
            }
        } finally {
            if (version === this.requestVersion) {
                this.loading = false;
            }
        }
    }

    private refresh(list: RecordItemDTO[]) {
        if (!this.content) {
            return;
        }

        this.content.removeAllChildren();
        this.emptyLabel.node.active = !list || list.length === 0;

        if (!list || list.length === 0) {
            return;
        }

        this.createItems(list);
        this.scrollView.scrollToTop(0);
    }

    private append(list: RecordItemDTO[]) {
        if (!this.content || !list || list.length === 0) {
            return;
        }

        this.createItems(list);
    }

    private createItems(list: RecordItemDTO[]) {
        list.forEach(data => {
            const itemNode = cc.instantiate(HallRes.instance.hallRecordItemPrefab);
            this.content.addChild(itemNode);

            const item = itemNode.getComponent("HallRecordItem") as HallRecordItem;
            if (item) {
                item.updateView(data);
            }
        });

        const layout = this.content.getComponent(cc.Layout);
        if (layout) {
            layout.updateLayout();
        }
    }

    private createSpriteNode(name: string, spriteFrame: cc.SpriteFrame, width: number, height: number): cc.Node {
        const node = new cc.Node(name);
        node.setContentSize(width, height);

        const sprite = node.addComponent(cc.Sprite);
        sprite.spriteFrame = spriteFrame;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

        return node;
    }

    private createLabel(text: string, fontSize: number, color: cc.Color, outline: boolean): cc.Label {
        const node = new cc.Node("Label");
        const label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        node.color = color;

        if (outline) {
            const labelOutline = node.addComponent(cc.LabelOutline);
            labelOutline.color = cc.color(30, 0, 0);
            labelOutline.width = 3;
        }

        return label;
    }

    protected onDestroy(): void {
        if (this.scrollView) {
            this.scrollView.node.off("scroll-ended", this.onScrollEnded, this);
        }
    }
}
