import RecordApi from "./RecordApi";
import { RecordItemDTO } from "./GameRecordItem";
import HallRecordItem from "./HallRecordItem";
import HallUIManager from "../../../hall/HallUIManager";
import HallRes from "../../../hall/HallRes";
import ToastManager from "../../../common/ToastManager";

const { ccclass } = cc._decorator;

@ccclass
export default class HallRecordPopup extends cc.Component {
    private static readonly TITLE_NAMES = ["开始时间", "房间", "金币", "时长", "庄次数"];
    private static readonly COLUMN_X = [-300, -105, 25, 155, 300];

    private mask: cc.Node = null;
    private content: cc.Node = null;
    private btnClose: cc.Node = null;
    private scrollView: cc.ScrollView = null;

    private pageNo: number = 1;
    private pageSize: number = 20;

    private loading: boolean = false;
    private hasMore: boolean = true;

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

        this.initTitleView();
    }

    public async loadFirstPage(_roomId: number | null) {
        this.pageNo = 1;
        this.hasMore = true;

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

        try {
            const res = await RecordApi.queryRecord(
                this.pageNo,
                this.pageSize,
                null
            );
            const records: RecordItemDTO[] = res.data.records || [];

            this.hasMore = res.data.total > this.pageNo * this.pageSize;

            if (refresh) {
                this.refresh(records);
            } else {
                this.append(records);
            }
        } catch (e) {
            cc.error(e);
            ToastManager.show("获取战绩失败");

            if (!refresh) {
                this.pageNo--;
            }
        } finally {
            this.loading = false;
        }
    }

    private refresh(list: RecordItemDTO[]) {
        if (!this.content) {
            return;
        }

        this.content.removeAllChildren();

        if (!list || list.length === 0) {
            return;
        }

        this.createItems(list);
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

    private initTitleView() {
        const content = cc.find("TitleBg", this.node);
        if (!content) {
            return;
        }

        const labels = content.getComponentsInChildren(cc.Label)
            .filter(label => label.node.name === "label")
            .sort((a, b) => a.node.x - b.node.x);

        labels.forEach((label, index) => {
            const visible = index < HallRecordPopup.TITLE_NAMES.length;
            label.node.active = visible;

            if (!visible) {
                return;
            }

            label.string = HallRecordPopup.TITLE_NAMES[index];
            label.node.x = HallRecordPopup.COLUMN_X[index];
            label.fontSize = 40;
            label.lineHeight = 42;
            label.node.color = cc.color(246, 215, 122);

            let outline = label.getComponent(cc.LabelOutline);
            if (!outline) {
                outline = label.addComponent(cc.LabelOutline);
            }

            outline.color = cc.color(107, 58, 0);
            outline.width = 2;
        });
    }
}
