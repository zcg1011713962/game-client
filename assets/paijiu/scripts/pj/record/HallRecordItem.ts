import HallRes from "../../../../hall/scripts/HallRes";
import { RecordItemDTO } from "./RecordTypes";

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
        this.bindView();
        this.bindTouch();
    }

    public updateView(data: RecordItemDTO) {
        if (!this.gameNameLabel) return;

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

    private bindView(): void {
        this.bgSprite = this.node.getChildByName("Bg")?.getComponent(cc.Sprite);
        this.iconSprite = this.node.getChildByName("GameIcon")?.getComponent(cc.Sprite);
        this.gameNameLabel = this.node.getChildByName("GameNameLabel")?.getComponent(cc.Label);
        this.roomLabel = this.node.getChildByName("RoomLabel")?.getComponent(cc.Label);
        this.timeLabel = this.node.getChildByName("TimeLabel")?.getComponent(cc.Label);
        this.resultLabel = this.node.getChildByName("ResultLabel")?.getComponent(cc.Label);
        this.amountLabel = this.node.getChildByName("AmountLabel")?.getComponent(cc.Label);
        this.arrowLabel = this.node.getChildByName("ArrowLabel")?.getComponent(cc.Label);
        
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

    private pad(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
    }

    protected onDestroy(): void {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }
}
