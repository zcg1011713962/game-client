import CreateRoomReq from "../entity/CreateRoomReq";
import HallUIManager from "../HallUIManager";
import { RoomCardType } from "./RoomSelectPopup";

const { ccclass } = cc._decorator;

@ccclass
export default class CreateRoomPopup extends cc.Component {

    private panel: cc.Node = null;
    private mask: cc.Node = null;
    private btnClose: cc.Node = null;
    private btnCreate: cc.Node = null;
    private selectedRoundCount: number = 16;
    private roundOptionNodes: cc.Node[] = [];
    private roundNormalSpriteFrame: cc.SpriteFrame = null;
    private roundSelectedSpriteFrame: cc.SpriteFrame = null;

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
        this.initRoundOptions();

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

            if (label.node.name === "Label_Title") {
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
            }else if(label.node.name === "label1"){
                    // 字号
                label.fontSize = 35;
            

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
            }else if(label.node.name === "label2"){
                    // 字号
                label.fontSize = 22;
            

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
            }

            
        });
    }

    private initRoundOptions() {
        const roundGroup = cc.find("Panel/ScrollView/View/RoundGroup", this.node);
        if (!roundGroup) {
            cc.warn("CreateRoomPopup 找不到 RoundGroup");
            return;
        }

        const configs = [
            { name: "s1", value: 8 },
            { name: "s2", value: 16 },
            { name: "s3", value: 32 },
        ];

        this.roundOptionNodes = [];

        configs.forEach(config => {
            const node = roundGroup.getChildByName(config.name);
            if (!node) {
                return;
            }

            const sprite = node.getComponent(cc.Sprite);
            if (config.value === 8 && sprite) {
                this.roundNormalSpriteFrame = sprite.spriteFrame;
            } else if (config.value === 16 && sprite) {
                this.roundSelectedSpriteFrame = sprite.spriteFrame;
            }

            (node as any).__roundCount = config.value;
            node.off(cc.Node.EventType.TOUCH_END, this.onRoundOptionTouch, this);
            node.on(cc.Node.EventType.TOUCH_END, this.onRoundOptionTouch, this);
            this.roundOptionNodes.push(node);
        });

        this.updateRoundOptions();
    }

    private onRoundOptionTouch(event: cc.Event.EventTouch) {
        event.stopPropagation();

        const node = event.currentTarget as cc.Node;
        const roundCount = (node as any).__roundCount;
        if (!roundCount || this.selectedRoundCount === roundCount) {
            return;
        }

        this.selectedRoundCount = roundCount;
        this.updateRoundOptions();

        cc.Tween.stopAllByTarget(node);
        node.scale = 1;
        cc.tween(node)
            .to(0.08, { scale: 1.06 })
            .to(0.08, { scale: 1 })
            .start();
    }

    private updateRoundOptions() {
        this.roundOptionNodes.forEach(node => {
            const selected = (node as any).__roundCount === this.selectedRoundCount;
            node.opacity = selected ? 255 : 210;

            const sprite = node.getComponent(cc.Sprite);
            if (sprite) {
                if (selected && this.roundSelectedSpriteFrame) {
                    sprite.spriteFrame = this.roundSelectedSpriteFrame;
                } else if (!selected && this.roundNormalSpriteFrame) {
                    sprite.spriteFrame = this.roundNormalSpriteFrame;
                }
            }

            const titleNode = node.getChildByName("label1");
            const titleLabel = titleNode ? titleNode.getComponent(cc.Label) : null;
            if (titleLabel) {
                titleLabel.node.color = selected
                    ? new cc.Color(255, 248, 207)
                    : new cc.Color(90, 51, 22);
            }

            const costNode = node.getChildByName("label2");
            const costLabel = costNode ? costNode.getComponent(cc.Label) : null;
            if (costLabel) {
                costLabel.node.color = selected
                    ? new cc.Color(255, 234, 170)
                    : new cc.Color(90, 51, 22);
            }
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
        const req = new CreateRoomReq();
        req.gameId = 1;
        req.roundCount = this.selectedRoundCount;
        req.playerCount = 4;
        req.bankerMode = 1;
        req.zhiZun = true;
        req.doubleTian = true;
        req.doubleDi = true;
        req.doubleRen = true;
        req.doubleE = true;
        HallUIManager.instance.onClickCard(RoomCardType.CREATE, req);
        this.hide();
    }

    onDestroy() {
        if (this.mask) {
            this.mask.off(cc.Node.EventType.TOUCH_START, this.onMaskTouch, this);
            this.mask.off(cc.Node.EventType.TOUCH_MOVE, this.onMaskTouch, this);
            this.mask.off(cc.Node.EventType.TOUCH_END, this.onMaskTouchEnd, this);
            this.mask.off(cc.Node.EventType.TOUCH_CANCEL, this.onMaskTouch, this);
        }
        this.roundOptionNodes.forEach(node => {
            node.off(cc.Node.EventType.TOUCH_END, this.onRoundOptionTouch, this);
        });
    }
    
}
