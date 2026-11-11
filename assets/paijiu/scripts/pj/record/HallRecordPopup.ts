import RecordApi from "./RecordApi";
import { RecordItemDTO } from "./RecordTypes";
import HallRecordItem from "./HallRecordItem";
import HallUIManager from "../../../../hall/scripts/HallUIManager";
import HallRes from "../../../../hall/scripts/HallRes";
import ToastManager from "../../../../scripts/common/ToastManager";
import GameRes from "../GameRes";
import HallRecordDetailPopup from "./HallRecordDetailPopup";

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
    private detailNode: cc.Node = null;

    private pageNo: number = 1;
    private pageSize: number = 20;
    private loading: boolean = false;
    private hasMore: boolean = true;
    private selectedTabIndex: number = 0;
    private requestVersion: number = 0;
    private destroyed: boolean = false;

    protected onLoad(): void {
        this.bindView();
    }

    public async loadFirstPage(_roomId: number | null) {
        if (!this.isAlive()) {
            return;
        }

        this.pageNo = 1;
        this.hasMore = true;
        await this.loadRecord(true);
    }

    private bindView(): void {
        this.content = cc.find("ListView/View/Content", this.node);
        this.scrollView = cc.find("ListView", this.node)?.getComponent(cc.ScrollView);
        this.emptyLabel = cc.find("EmptyLabel", this.node)?.getComponent(cc.Label);
        this.tabNodes = [cc.find("Tabs/TabAll", this.node), cc.find("Tabs/TabPaiJiu", this.node)];
        this.tabLabels = this.tabNodes.map(node => node?.getChildByName("Label")?.getComponent(cc.Label));
        if (!this.content || !this.scrollView || !this.emptyLabel || this.tabNodes.some(node => !node)) return;
        const back = cc.find("BtnBack", this.node);
        back?.on(cc.Node.EventType.TOUCH_END, this.hide, this);
        this.tabNodes.forEach((node, index) => node?.on(cc.Node.EventType.TOUCH_END, () => this.onTabClick(index), this));
        this.scrollView?.node.on("scroll-ended", this.onScrollEnded, this);
        this.updateTabView();
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

    private hide() {
        const manager = HallUIManager.instance;
        if (manager && cc.isValid(manager.node)) {
            manager.hideRecord();
            return;
        }

        if (this.node && cc.isValid(this.node)) {
            this.node.active = false;
        }
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
                null,
                HallRecordPopup.TAB_GAME_IDS[this.selectedTabIndex]
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
        if (this.emptyLabel && cc.isValid(this.emptyLabel.node)) {
            this.emptyLabel.node.active = !list || list.length === 0;
        }

        if (!list || list.length === 0) {
            return;
        }

        this.createItems(list);
        if (this.scrollView && cc.isValid(this.scrollView.node)) {
            this.scrollView.scrollToTop(0);
        }
    }

    private append(list: RecordItemDTO[]) {
        if (!this.isAlive() || !this.content || !cc.isValid(this.content) || !list || list.length === 0) {
            return;
        }

        this.createItems(list);
    }

    private createItems(list: RecordItemDTO[]) {
        if (!this.isAlive() || !this.content || !cc.isValid(this.content)) {
            return;
        }

        list.forEach(data => {
            if (!this.isAlive() || !this.content || !cc.isValid(this.content)) {
                return;
            }

            const itemNode = cc.instantiate(HallRes.instance.hallRecordItemPrefab);
            this.content.addChild(itemNode);

            const item = itemNode.getComponent("HallRecordItem") as HallRecordItem;
            if (item) {
                item.updateView(data);
                item.setClickHandler((record) => {
                    this.openDetail(record);
                });
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

    private async openDetail(summary: RecordItemDTO): Promise<void> {
        if (!summary || !summary.roomId) {
            ToastManager.show("房间记录异常");
            return;
        }

        try {
            cc.log("打开牌九房间详情: 开始加载牌图", summary.roomId);
            await GameRes.instance.loadCardImg();
            if (!cc.isValid(this.node)) {
                return;
            }

            cc.log("打开牌九房间详情: 开始请求房间记录", summary.roomId);
            const res = await RecordApi.queryRecord(1, 100, Number(summary.roomId), summary.gameId || 1);
            if (!cc.isValid(this.node)) {
                return;
            }

            if (!res || res.code !== 0 || !res.data) {
                throw new Error(`房间详情接口返回异常: ${res ? JSON.stringify(res) : "null"}`);
            }

            const records: RecordItemDTO[] = (res.data.records || []).slice();
            records.sort((a, b) => Number(a.roundId || 0) - Number(b.roundId || 0));

            cc.log("打开牌九房间详情: 开始创建预制体", summary.roomId, records.length);
            await this.showDetailByPrefab(summary, records);
        } catch (e) {
            cc.error("打开牌九房间详情失败:", e);
            ToastManager.show("获取房间详情失败");
        }
    }

    private async showDetailByPrefab(summary: RecordItemDTO, records: RecordItemDTO[]): Promise<void> {
        cc.log("打开牌九房间详情: 加载详情弹窗预制体");
        const popupPrefab = await HallRes.instance.loadHallRecordDetailPopupPrefab();
        if (!cc.isValid(this.node)) {
            return;
        }

        cc.log("打开牌九房间详情: 加载详情条目预制体");
        const itemPrefab = await HallRes.instance.loadHallRecordDetailItemPrefab();
        if (!cc.isValid(this.node)) {
            return;
        }

        if (!popupPrefab || !itemPrefab) {
            throw new Error("HallRecordDetailPopup 或 HallRecordDetailItem 预制体加载失败");
        }

        this.closeDetail();

        cc.log("打开牌九房间详情: 实例化详情弹窗预制体");
        const detail = cc.instantiate(popupPrefab);
        detail.parent = this.node;
        detail.setPosition(0, 0);
        detail.zIndex = 50;
        this.detailNode = detail;

        cc.log("打开牌九房间详情: 获取详情弹窗脚本");
        let detailPopup = detail.getComponent(HallRecordDetailPopup);
        if (!detailPopup) {
            cc.log("打开牌九房间详情: 详情弹窗未挂脚本，运行时自动添加");
            detailPopup = detail.addComponent(HallRecordDetailPopup);
        }

        cc.log("打开牌九房间详情: 初始化详情弹窗");
        detailPopup.init(summary, records, () => {
            this.closeDetail();
        }, itemPrefab);
        cc.log("打开牌九房间详情: 完成");
    }

    private closeDetail(): void {
        if (!this.destroyed && this.detailNode && cc.isValid(this.detailNode)) {
            this.detailNode.destroy();
        }

        this.detailNode = null;
    }

    protected onDestroy(): void {
        this.destroyed = true;
        this.requestVersion++;
        this.loading = false;
        this.closeDetail();

        if (this.scrollView && this.scrollView.node && cc.isValid(this.scrollView.node)) {
            this.scrollView.node.off("scroll-ended", this.onScrollEnded, this);
        }

        this.scrollView = null;
        this.content = null;
        this.emptyLabel = null;
    }
}
