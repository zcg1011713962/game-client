import HallRes from "../../../hall/HallRes";
import { RecordItemDTO } from "./GameRecordItem";

const { ccclass } = cc._decorator;

@ccclass
export default class HallRecordItem extends cc.Component {
    private bgSprite: cc.Sprite = null;
    private iconSprite: cc.Sprite = null;
    private gameNameLabel: cc.Label = null;
    private roomLabel: cc.Label = null;
    private timeLabel: cc.Label = null;
    private resultLabel: cc.Label = null;
    private amountLabel: cc.Label = null;
    private arrowLabel: cc.Label = null;
    private recordData: RecordItemDTO = null;
    private clickHandler: (data: RecordItemDTO) => void = null;

    protected onLoad(): void {
        this.buildView();
        this.bindTouch();
    }

    public updateView(data: RecordItemDTO) {
        if (!this.gameNameLabel) {
            this.buildView();
        }

        this.recordData = data;
        const amount = Number(data.winAmount || 0);

        this.gameNameLabel.string = "牌九";
        this.roomLabel.string = `房间号：${data.roomId || ""}`;
        this.timeLabel.string = `时间：${this.formatTime(data.startTime || data.settleTime)}`;
        this.resultLabel.string = "总 输 赢";
        this.amountLabel.string = this.formatAmount(amount);

        this.updateAmountStyle(amount);
    }

    public setClickHandler(handler: (data: RecordItemDTO) => void): void {
        this.clickHandler = handler;
    }

    private buildView(): void {
        this.node.removeAllChildren();
        this.node.setContentSize(1020, 190);

        const bg = this.createSpriteNode("Bg", HallRes.instance.recordImgMap["record_item_bg"], 1020, 190);
        bg.parent = this.node;
        this.bgSprite = bg.getComponent(cc.Sprite);

        const icon = this.createSpriteNode("GameIcon", HallRes.instance.recordImgMap["record_paijiu_icon"], 150, 150);
        icon.parent = this.node;
        icon.setPosition(-390, 0);
        this.iconSprite = icon.getComponent(cc.Sprite);

        this.gameNameLabel = this.createLabel("牌九", 46, cc.color(255, 246, 232), true);
        this.gameNameLabel.node.parent = this.node;
        this.gameNameLabel.node.setAnchorPoint(0, 0.5);
        this.gameNameLabel.node.setPosition(-290, 48);

        this.roomLabel = this.createLabel("房间号：", 29, cc.color(205, 205, 215), false);
        this.roomLabel.node.parent = this.node;
        this.roomLabel.node.setAnchorPoint(0, 0.5);
        this.roomLabel.node.setPosition(-290, -8);

        this.timeLabel = this.createLabel("", 29, cc.color(180, 184, 196), false);
        this.timeLabel.node.parent = this.node;
        this.timeLabel.node.setAnchorPoint(0, 0.5);
        this.timeLabel.node.setPosition(-290, -55);

        this.resultLabel = this.createLabel("总 输 赢", 28, cc.color(180, 184, 196), false);
        this.resultLabel.node.parent = this.node;
        this.resultLabel.node.setPosition(225, 35);

        this.amountLabel = this.createLabel("0", 62, cc.color(105, 230, 90), true);
        this.amountLabel.node.parent = this.node;
        this.amountLabel.node.setContentSize(260, 70);
        this.amountLabel.node.setPosition(225, -28);

        this.arrowLabel = this.createLabel(">", 58, cc.color(255, 212, 190), true);
        this.arrowLabel.node.parent = this.node;
        this.arrowLabel.node.setPosition(450, -2);
    }

    private bindTouch(): void {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    private onTouchStart(): void {
        if (this.bgSprite && HallRes.instance.recordImgMap["record_item_bg_pressed"]) {
            this.bgSprite.spriteFrame = HallRes.instance.recordImgMap["record_item_bg_pressed"];
        }
    }

    private onTouchEnd(): void {
        this.resetBg();

        if (this.clickHandler && this.recordData) {
            this.clickHandler(this.recordData);
        }
    }

    private onTouchCancel(): void {
        this.resetBg();
    }

    private resetBg(): void {
        if (this.bgSprite && HallRes.instance.recordImgMap["record_item_bg"]) {
            this.bgSprite.spriteFrame = HallRes.instance.recordImgMap["record_item_bg"];
        }
    }

    private updateAmountStyle(amount: number): void {
        if (amount > 0) {
            this.amountLabel.node.color = cc.color(95, 230, 88);
            return;
        }

        if (amount < 0) {
            this.amountLabel.node.color = cc.color(255, 58, 60);
            return;
        }

        this.amountLabel.node.color = cc.color(85, 155, 255);
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

    private formatTime(time: number): string {
        if (!time) {
            return "";
        }

        const date = new Date(time);
        const year = date.getFullYear();
        const month = this.pad(date.getMonth() + 1);
        const day = this.pad(date.getDate());
        const hour = this.pad(date.getHours());
        const minute = this.pad(date.getMinutes());
        const second = this.pad(date.getSeconds());

        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
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
            labelOutline.color = cc.color(20, 0, 0);
            labelOutline.width = 3;
        }

        return label;
    }

    private pad(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
    }

    protected onDestroy(): void {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }
}
