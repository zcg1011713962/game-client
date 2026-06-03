import HallUIManager from "../HallUIManager";
import { RoomCardType } from "./RoomSelectPopup";

const { ccclass } = cc._decorator;

@ccclass
export default class CreateRoomPopup extends cc.Component {

    private panel: cc.Node = null;
    private mask: cc.Node = null;
    private btnClose: cc.Node = null;
    private btnCreate: cc.Node = null;

    onLoad() {
        this.mask = this.node.getChildByName("Mask");
        this.panel = this.node.getChildByName("Panel");

        if (!this.panel) {
            cc.error("CreateRoomPopup 找不到 Panel");
            return;
        }

        if (this.mask) {
            this.mask.on(cc.Node.EventType.TOUCH_START, this.onMaskTouch, this);
            this.mask.on(cc.Node.EventType.TOUCH_MOVE, this.onMaskTouch, this);
            this.mask.on(cc.Node.EventType.TOUCH_END, this.onMaskTouchEnd, this);
            this.mask.on(cc.Node.EventType.TOUCH_CANCEL, this.onMaskTouch, this);
        }

        this.btnClose = this.panel.getChildByName("Btn_Close");
        this.btnCreate = this.panel.getChildByName("Btn_Create");

        if (this.btnClose) {
            this.btnClose.on(cc.Node.EventType.TOUCH_END, this.hide, this);
        }

        if (this.btnCreate) {
            this.btnCreate.on(cc.Node.EventType.TOUCH_END, this.onCreateRoom, this);
        }
        this.initTitleStyle();

        this.node.active = false;
    }

    private onMaskTouch(event: cc.Event.EventTouch) {
        event.stopPropagation();
    }

    private onMaskTouchEnd(event: cc.Event.EventTouch) {
        event.stopPropagation();
    }


    private initTitleStyle() {

        const content = cc.find(
            "Panel/ScrollView/View",
            this.node
        );

        if (!content) return;

        const labels = content.getComponentsInChildren(cc.Label);

        labels.forEach(label => {

            if (label.node.name !== "Label_Title") {
                return;
            }

            // 字号
            label.fontSize = 40;
        

            // 深棕色
            label.node.color = new cc.Color(
                90,
                51,
                22
            );

            // 描边
            let outline =
                label.getComponent(cc.LabelOutline);

            if (!outline) {
                outline =
                    label.addComponent(cc.LabelOutline);
            }

            outline.color =
                new cc.Color(
                    245,
                    214,
                    161
                );

            outline.width = 1;
        });
    }

    /**
     * 显示弹窗
     */
    public show() {

        this.node.active = true;

        this.panel.opacity = 0;
        this.panel.scale = 0.85;

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
     * 关闭弹窗
     */
    public hide() {
        console.log("hide")

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
     * 创建房间
     */
    private onCreateRoom() {
        HallUIManager.instance.onClickCard(RoomCardType.CREATE);
        this.hide();
    }

    onDestroy() {
        if (this.mask) {
            this.mask.off(cc.Node.EventType.TOUCH_START, this.onMaskTouch, this);
            this.mask.off(cc.Node.EventType.TOUCH_MOVE, this.onMaskTouch, this);
            this.mask.off(cc.Node.EventType.TOUCH_END, this.onMaskTouchEnd, this);
            this.mask.off(cc.Node.EventType.TOUCH_CANCEL, this.onMaskTouch, this);
        }
    }
    
}