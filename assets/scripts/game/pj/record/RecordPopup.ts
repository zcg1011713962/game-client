import GameRes from "../GameRes";
import ToastManager from "../../../common/ToastManager";
import RecordApi from "./RecordApi";
import RecordItem, { RecordItemDTO } from "./RecordItem";
import UIManager from "../ui/UIManager";
import HallUIManager from "../../../hall/HallUIManager";
import HallRes from "../../../hall/HallRes";

const { ccclass } = cc._decorator;

@ccclass
export default class RecordPopup extends cc.Component {
    private mask: cc.Node = null;
    private content: cc.Node = null;
    private emptyNode: cc.Node = null;
    private btnClose:cc.Node = null;

    private pageNo: number = 1;
    private pageSize: number = 7;

    private loading: boolean = false;
    private hasMore: boolean = true;

    protected onLoad(): void {
        this.mask = this.node.getChildByName("Mask");
        this.content = cc.find("ListView/View/Content", this.node);
        this.emptyNode = cc.find("EmptyNode", this.node);
        this.btnClose = this.node.getChildByName("BtnClose");
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

    protected onEnable(): void {
        this.loadFirstPage();
    }

    private onMaskTouch(event: cc.Event.EventTouch) {
        event.stopPropagation();
    }

    private onMaskTouchEnd(event: cc.Event.EventTouch) {
        event.stopPropagation();
    }

    private hide(){
        HallUIManager.instance.hideRecord();
    }

    private async loadFirstPage() {
        this.pageNo = 1;
        this.hasMore = true;

        await this.loadRecord(true);
    }

    public async loadMore() {
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
                this.pageSize
            );
            console.log("RecordApi", res)
            const records: RecordItemDTO[] =
                res.data.records || [];

            this.hasMore = records.length >= this.pageSize;

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

    public refresh(list: RecordItemDTO[]) {
        if (!this.content) {
            return;
        }

        this.content.removeAllChildren();

        this.setEmptyVisible(!list || list.length === 0);

        if (!list || list.length === 0) {
            return;
        }

        this.createItems(list);
    }

    public append(list: RecordItemDTO[]) {
        if (!this.content || !list || list.length === 0) {
            return;
        }

        this.setEmptyVisible(false);
        this.createItems(list);
    }

    private createItems(list: RecordItemDTO[]) {
        list.forEach(data => {
            const itemNode = cc.instantiate(
                HallRes.instance.recordItemPrefab
            );

            this.content.addChild(itemNode);

            const item = itemNode.getComponent("RecordItem") as RecordItem;

            if (item) {
                item.updateView(data);
            }
        });
    }

    private setEmptyVisible(visible: boolean) {
        if (this.emptyNode) {
            this.emptyNode.active = visible;
        }
    }



    private initTitleStyle() {

        const content = cc.find(
            "TitleBg",
            this.node
        );

        if (!content) return;

        const labels = content.getComponentsInChildren(cc.Label);

        labels.forEach(label => {

         if(label.node.name === "label"){
                label.fontSize = 35;

                label.node.color = cc.color(246, 215, 122);

                // 描边
                let outline =
                    label.getComponent(cc.LabelOutline);

                if (!outline) {
                    outline =
                        label.addComponent(cc.LabelOutline);
                }

                outline.color = cc.color(107, 58, 0);
                outline.width = 2;
            }
        });
    }
}