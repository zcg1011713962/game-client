import HallRes from "../HallRes";
import { MailTime, MailVO } from "./MailApi";

const { ccclass } = cc._decorator;

@ccclass
export default class MailItem extends cc.Component {
    private bg: cc.Sprite = null;
    private unreadDot: cc.Node = null;
    private mailIcon: cc.Sprite = null;
    private titleLabel: cc.Label = null;
    private senderLabel: cc.Label = null;
    private timeLabel: cc.Label = null;
    private expireLabel: cc.Label = null;
    private attachmentIcon: cc.Sprite = null;
    private attachmentStateLabel: cc.Label = null;
    private stateLabel: cc.Label = null;
    private arrow: cc.Sprite = null;
    private btnClick: cc.Node = null;
    private data: MailVO = null;
    private clickHandler: (data: MailVO) => void = null;

    protected onLoad(): void {
        this.ensureSize();
        this.bindNodes();
        this.applyLabelStyle();
        this.bindTouch();
    }

    public updateView(data: MailVO): void {
        this.ensureSize();
        this.bindNodes();
        this.applyLabelStyle();
        this.data = data;

        const unread = Number(data.readStatus || 0) === 0;
        const hasAttachment = !!data.hasAttachment;
        const receiveStatus = Number(data.receiveStatus);
        const expired = this.isExpired(data);
        const canReceive = hasAttachment && receiveStatus === 0 && !expired;

        this.setSprite(this.bg, unread || canReceive ? "mail_item_bg_unread" : "mail_item_bg_read");
        this.setSprite(this.mailIcon, unread ? "mail_icon_unread" : "mail_icon_read");
        this.setSprite(this.attachmentIcon, canReceive ? "mail_icon_gift_active" : "mail_icon_gift_gray");
        this.setSprite(this.arrow, "mail_arrow");

        if (this.unreadDot) {
            this.unreadDot.active = unread;
            const dotSprite = this.unreadDot.getComponent(cc.Sprite) || this.unreadDot.addComponent(cc.Sprite);
            this.setSprite(dotSprite, "mail_red_dot");
        }

        this.setLabel(this.titleLabel, data.title || "系统邮件", unread ? cc.color(255, 240, 216) : cc.color(200, 200, 200));
        this.setLabel(this.senderLabel, `发件人：${data.sender || "系统"}`, cc.color(190, 190, 200));
        this.setLabel(this.timeLabel, this.formatTime(data.createTime || data.startTime), cc.color(190, 190, 200));
        this.setLabel(this.expireLabel, this.formatExpire(data.expireTime), expired ? cc.color(255, 48, 48) : cc.color(216, 216, 216));

        if (expired) {
            this.setLabel(this.stateLabel, "已过期", cc.color(255, 48, 48));
            this.setLabel(this.attachmentStateLabel, "已过期", cc.color(255, 48, 48));
        } else if (!hasAttachment) {
            this.setLabel(this.stateLabel, "无附件", cc.color(88, 232, 93));
            this.setLabel(this.attachmentStateLabel, "无附件", cc.color(88, 232, 93));
        } else if (receiveStatus === 1) {
            this.setLabel(this.stateLabel, "已领取", cc.color(170, 170, 170));
            this.setLabel(this.attachmentStateLabel, "已领取", cc.color(170, 170, 170));
        } else {
            this.setLabel(this.stateLabel, "可领取", cc.color(255, 210, 42));
            this.setLabel(this.attachmentStateLabel, "可领取", cc.color(255, 210, 42));
        }
    }

    public setClickHandler(handler: (data: MailVO) => void): void {
        this.clickHandler = handler;
    }

    private bindNodes(): void {
        this.bg = this.bg || this.findSprite("Bg");
        this.unreadDot = this.unreadDot || this.findChildDeep(this.node, "UnreadDot");
        this.mailIcon = this.mailIcon || this.findSprite("MailIcon");
        this.titleLabel = this.titleLabel || this.findLabel("TitleLabel");
        this.senderLabel = this.senderLabel || this.findLabel("SenderLabel");
        this.timeLabel = this.timeLabel || this.findLabel("TimeLabel");
        this.expireLabel = this.expireLabel || this.findLabel("ExpireLabel");
        this.attachmentIcon = this.attachmentIcon || this.findSprite("AttachmentIcon");
        this.attachmentStateLabel = this.attachmentStateLabel || this.findLabel("AttachmentStateLabel");
        this.stateLabel = this.stateLabel || this.findLabel("StateLabel");
        this.arrow = this.arrow || this.findSprite("Arrow");
        this.btnClick = this.btnClick || this.findChildDeep(this.node, "BtnClick") || this.node;
    }

    private bindTouch(): void {
        const target = this.btnClick || this.node;
        if (target.width <= 0 || target.height <= 0) {
            target.setContentSize(this.node.width || 980, this.node.height || 190);
        }
        target.off(cc.Node.EventType.TOUCH_END, this.onClick, this);
        target.on(cc.Node.EventType.TOUCH_END, this.onClick, this);
    }

    private ensureSize(): void {
        if (this.node.width <= 0 || this.node.height <= 0) {
            this.node.setContentSize(980, 190);
        }
    }

    private applyLabelStyle(): void {
        this.setLabelBaseStyle(this.titleLabel, 34, 40, cc.color(255, 240, 216));
        this.setLabelBaseStyle(this.senderLabel, 26, 32, cc.color(190, 190, 200));
        this.setLabelBaseStyle(this.timeLabel, 25, 31, cc.color(190, 190, 200));
        this.setLabelBaseStyle(this.expireLabel, 24, 30, cc.color(216, 216, 216));
        this.setLabelBaseStyle(this.stateLabel, 28, 34, cc.color(255, 210, 42));
        this.setLabelBaseStyle(this.attachmentStateLabel, 24, 30, cc.color(255, 210, 42));
    }

    private setLabelBaseStyle(label: cc.Label, fontSize: number, lineHeight: number, color: cc.Color): void {
        if (!label) return;

        label.fontSize = fontSize;
        label.lineHeight = lineHeight;
        label.node.color = color;
    }

    private onClick(): void {
        if (this.clickHandler && this.data) {
            this.clickHandler(this.data);
        }
    }

    private findSprite(name: string): cc.Sprite {
        const node = this.findChildDeep(this.node, name);
        if (!node) return null;
        return node.getComponent(cc.Sprite) || node.addComponent(cc.Sprite);
    }

    private findLabel(name: string): cc.Label {
        const node = this.findChildDeep(this.node, name);
        return node ? node.getComponent(cc.Label) : null;
    }

    private findChildDeep(root: cc.Node, name: string): cc.Node {
        if (!root) return null;
        if (root.name === name) return root;
        for (let i = 0; i < root.children.length; i++) {
            const found = this.findChildDeep(root.children[i], name);
            if (found) return found;
        }
        return null;
    }

    private setSprite(sprite: cc.Sprite, name: string): void {
        if (!sprite) return;
        const width = sprite.node.width;
        const height = sprite.node.height;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = HallRes.instance.mailImgMap[name] || null;
        if (width > 0 && height > 0) {
            sprite.node.setContentSize(width, height);
        }
    }

    private setLabel(label: cc.Label, text: string, color?: cc.Color): void {
        if (!label) return;
        label.string = text;
        if (color) {
            label.node.color = color;
        }
    }

    private isExpired(data: MailVO): boolean {
        const expireTime = this.toTimestamp(data.expireTime);
        return expireTime > 0 && expireTime <= Date.now();
    }

    private formatTime(time: MailTime): string {
        const timestamp = this.toTimestamp(time);
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())} ${this.pad(date.getHours())}:${this.pad(date.getMinutes())}`;
    }

    private formatExpire(time: MailTime): string {
        const timestamp = this.toTimestamp(time);
        if (!timestamp) return "";
        const left = timestamp - Date.now();
        if (left <= 0) return "已过期";
        const day = Math.max(1, Math.ceil(left / 86400000));
        return `剩余 ${day} 天`;
    }

    private toTimestamp(time: MailTime): number {
        if (!time) return 0;
        if (typeof time === "number") return time;

        let parsed = Date.parse(time);
        if (isNaN(parsed)) {
            parsed = Date.parse(time.replace(/-/g, "/"));
        }
        return isNaN(parsed) ? 0 : parsed;
    }

    private pad(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
    }
}
