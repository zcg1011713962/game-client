import UIColorUtil from "../util/UIColorUtil";
import UIUtil from "../util/UIUtil";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ToastView extends cc.Component {

    private static readonly MIN_TEXT_WIDTH = 180;
    private static readonly MAX_TEXT_WIDTH = 840;
    private static readonly HORIZONTAL_PADDING = 60;
    private static readonly VERTICAL_PADDING = 40;

    private msgLabelNode!: cc.Node;
    private duration: number = 1.5;

    protected onLoad(): void {
        this.msgLabelNode = this.node.getChildByName("msgLabel");
    }

    public show(msg: string, success: boolean = false) {
        if (this.msgLabelNode) {
            this.setMessage(msg, success);
            this.duration = Math.min(4, Math.max(1.5, msg.length * 0.08));

            this.node.opacity = 0;
            this.node.scale = 0.8;

            cc.tween(this.node)
            .to(0.15, { opacity: 255, scale: 1 })
            .delay(this.duration)
            .to(0.2, { opacity: 0, scale: 0.9 })
            .call(() => {
                this.node.destroy();
            })
            .start();
        }
       

       
    }

    public showPersistent(msg: string, success: boolean = false) {
        if (!this.msgLabelNode) {
            return;
        }

        this.setMessage(msg, success);

        this.node.stopAllActions();
        cc.Tween.stopAllByTarget(this.node);
        this.node.opacity = 255;
        this.node.scale = 1;
        this.node.off(cc.Node.EventType.TOUCH_END, this.close, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.close, this);
    }

    private setMessage(msg: string, success: boolean) {
        UIUtil.setLabel(
            this.msgLabelNode,
            msg,
            success ? UIColorUtil.TOAST_SUCCESS : UIColorUtil.TOAST_ERROR,
            UIColorUtil.TOAST_OUTLINE,
            2
        );

        const label = this.msgLabelNode.getComponent(cc.Label);
        const textWidth = this.estimateTextWidth(msg, label.fontSize);
        const labelWidth = Math.min(
            ToastView.MAX_TEXT_WIDTH,
            Math.max(ToastView.MIN_TEXT_WIDTH, textWidth)
        );

        label.enableWrapText = true;
        label.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        this.msgLabelNode.setContentSize(labelWidth, label.lineHeight);
        const forceUpdate = (label as any)._forceUpdateRenderData;
        if (forceUpdate) {
            forceUpdate.call(label);
        }

        const background = this.node.getChildByName("bg");
        if (background) {
            const width = Math.min(
                ToastView.MAX_TEXT_WIDTH + ToastView.HORIZONTAL_PADDING,
                labelWidth + ToastView.HORIZONTAL_PADDING
            );
            const height = Math.max(90, this.msgLabelNode.height + ToastView.VERTICAL_PADDING);
            background.setContentSize(width, height);
        }
    }

    private estimateTextWidth(text: string, fontSize: number): number {
        return Array.from(text).reduce((width, character) => {
            return width + (/^[\x00-\x7F]$/.test(character) ? fontSize * 0.55 : fontSize);
        }, 0);
    }

    private close() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.close, this);
        this.node.destroy();
    }

    protected onDestroy(): void {
        this.node.off(cc.Node.EventType.TOUCH_END, this.close, this);
    }
}
