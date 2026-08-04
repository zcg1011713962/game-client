import ToastManager from "../../common/ToastManager";
import UserData from "../../login/entity/UserData";
import HallRes from "../HallRes";
import MailApi, { MailAttachmentVO, MailReceiveResultVO, MailTime, MailVO } from "./MailApi";

const { ccclass } = cc._decorator;

@ccclass
export default class MailDetailPopup extends cc.Component {
    private mail: MailVO = null;
    private onChanged: () => void = null;
    private loading: boolean = false;
    private destroyed: boolean = false;

    protected onLoad(): void {
        this.addBlockInput(this.node);
        this.bindEvents();
        this.applyImages();
        this.applyLabelStyle();
    }

    public init(mail: MailVO, onChanged?: () => void): void {
        this.mail = mail;
        this.onChanged = onChanged || null;
        this.refreshView();
    }

    private bindEvents(): void {
        this.bindButton("BtnBack", this.close);
        this.bindButton("BtnClose", this.close);
        this.bindButton("BtnDelete", this.onDeleteClick);
        this.bindButton("BtnReceive", this.onReceiveClick);
    }

    private bindButton(name: string, handler: Function): void {
        const node = this.findChildDeep(this.node, name);
        if (!node) return;

        node.off(cc.Node.EventType.TOUCH_END, handler, this);
        node.on(cc.Node.EventType.TOUCH_END, handler, this);
    }

    private applyImages(): void {
        this.setSprite("Bg", "mail_detail_bg");
        this.setSprite("TitleBg", "mail_detail_title_bg");
        this.setSprite("BtnBack", "mail_detail_btn_back");
        this.setSprite("BtnClose", "mail_btn_close");
        this.setSprite("BtnDelete", "mail_btn_delete_read");
        this.setSprite("BtnReceive", "mail_btn_receive_all");
    }

    private applyLabelStyle(): void {
        this.setLabelStyle("SubjectLabel", 46, 56, cc.color(255, 238, 220));
        this.setLabelStyle("SenderTitle", 32, 40, cc.color(210, 210, 218));
        this.setLabelStyle("SenderValue", 32, 40, cc.color(220, 220, 228));
        this.setLabelStyle("SendTimeTitle", 32, 40, cc.color(210, 210, 218));
        this.setLabelStyle("SendTimeValue", 32, 40, cc.color(220, 220, 228));
        this.setLabelStyle("ExpireTimeTitle", 32, 40, cc.color(210, 210, 218));
        this.setLabelStyle("ExpireTimeValue", 32, 40, cc.color(220, 220, 228));
        this.setLabelStyle("RemainTimeLabel", 32, 40, cc.color(65, 255, 72));
        this.ensureLabelSize("SubjectLabel", 760, 70);
        this.ensureLabelSize("SenderValue", 500, 45);
        this.ensureLabelSize("SendTimeValue", 500, 45);
        this.ensureLabelSize("ExpireTimeValue", 360, 45);
        this.ensureLabelSize("RemainTimeLabel", 260, 45);
    }

    private refreshView(): void {
        if (!this.mail) return;

        this.setLabelText("SubjectLabel", this.mail.title || "系统邮件");
        this.setLabelText("SenderValue", this.mail.sender || "系统");
        this.setLabelText("SendTimeValue", this.formatTime(this.mail.createTime || this.mail.startTime));
        this.setLabelText("ExpireTimeValue", this.formatTime(this.mail.expireTime));
        this.setLabelText("RemainTimeLabel", this.formatRemainTime(this.mail.expireTime));
        this.setContentText(this.mail.content || "");
        this.refreshRewardView();
        this.refreshButtonView();
    }

    private setContentText(text: string): void {
        const node = this.findChildDeep(this.node, "ContentLabel");
        if (!node) return;

        const label = node.getComponent(cc.Label) || node.addComponent(cc.Label);
        label.string = text || "";
        label.fontSize = 32;
        label.lineHeight = 50;
        label.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        label.verticalAlign = cc.Label.VerticalAlign.TOP;
        label.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
        label.node.color = cc.color(220, 220, 228);

        if (node.width < 400 || node.height < 200) {
            node.setContentSize(780, 300);
        }
    }

    private refreshRewardView(): void {
        const panel = this.findChildDeep(this.node, "RewardPanel");
        const layout = this.findChildDeep(this.node, "RewardLayout");
        const attachments = this.mail.attachments || [];

        if (panel) {
            panel.active = attachments.length > 0;
        }
        if (!layout) return;

        for (let i = 0; i < 3; i++) {
            const item = this.findChildDeep(layout, `RewardItem_${i}`);
            if (item) {
                item.active = i < attachments.length;
            }
        }

        const startX = -270;
        for (let i = 0; i < attachments.length && i < 3; i++) {
            const item = this.findChildDeep(layout, `RewardItem_${i}`);
            if (!item) continue;

            item.active = true;
            item.x = startX + i * 270;
            item.y = 0;
            item.setContentSize(210, 260);
            this.updateRewardItem(item, attachments[i]);
        }
    }

    private updateRewardItem(root: cc.Node, data: MailAttachmentVO): void {
        const itemBg = this.ensureChild(root, "ItemBg", cc.v2(0, 45), cc.size(210, 210));
        const icon = this.ensureChild(root, "Icon", cc.v2(0, 55), cc.size(130, 130));
        const nameLabelNode = this.ensureChild(root, "NameLabel", cc.v2(0, -80), cc.size(190, 44));
        const countLabelNode = this.ensureChild(root, "CountLabel", cc.v2(0, -125), cc.size(190, 38));

        const itemBgSprite = itemBg.getComponent(cc.Sprite) || itemBg.addComponent(cc.Sprite);
        this.setSpriteFrame(itemBgSprite, HallRes.instance.mailImgMap["mail_item_bg_read"]);
        itemBgSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

        const iconSprite = icon.getComponent(cc.Sprite) || icon.addComponent(cc.Sprite);
        this.setAttachmentIcon(iconSprite, data);

        const nameLabel = nameLabelNode.getComponent(cc.Label) || nameLabelNode.addComponent(cc.Label);
        nameLabel.string = this.getAttachmentName(data);
        nameLabel.fontSize = 34;
        nameLabel.lineHeight = 42;
        nameLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        nameLabel.node.color = cc.color(255, 219, 96);

        const countLabel = countLabelNode.getComponent(cc.Label) || countLabelNode.addComponent(cc.Label);
        countLabel.string = `x${Number(data.itemCount || 0)}`;
        if (countLabel.fontSize <= 0) {
            countLabel.fontSize = 30;
        }
        if (countLabel.lineHeight <= 0) {
            countLabel.lineHeight = 38;
        }
        countLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        countLabel.node.color = cc.color(220, 220, 228);
    }

    private refreshButtonView(): void {
        const receiveButton = this.findChildDeep(this.node, "BtnReceive");
        const deleteButton = this.findChildDeep(this.node, "BtnDelete");
        const hasAttachment = !!this.mail.hasAttachment && !!this.mail.attachments && this.mail.attachments.length > 0;
        const received = Number(this.mail.receiveStatus) === 1;
        const expired = this.isExpired(this.mail.expireTime);

        if (receiveButton) {
            receiveButton.active = hasAttachment && !received && !expired;
        }
        if (deleteButton) {
            deleteButton.active = !hasAttachment || received || expired;
        }
    }

    private async onReceiveClick(): Promise<void> {
        if (this.loading || !this.mail) return;

        this.loading = true;
        try {
            const res = await MailApi.receive(this.mail.mailId);
            if (!this.isAlive()) return;

            if (!res || res.code !== 0) {
                ToastManager.show(res && res.msg ? res.msg : "领取失败");
                return;
            }

            if (!res.data || !res.data.attachments || res.data.attachments.length === 0) {
                ToastManager.show("没有可领取的奖励");
                this.refreshView();
                this.notifyChanged();
                return;
            }

            this.applyReceiveUser(res.data);
            this.mail.receiveStatus = 1;
            ToastManager.show(this.formatReceiveTip(res.data));
            this.refreshView();
            this.notifyChanged();
        } catch (e) {
            cc.error("领取邮件附件失败:", e);
            ToastManager.show("领取失败");
        } finally {
            this.loading = false;
        }
    }

    private async onDeleteClick(): Promise<void> {
        if (this.loading || !this.mail) return;

        this.loading = true;
        try {
            const res = await MailApi.deleteMail(this.mail.mailId);
            if (!this.isAlive()) return;

            if (!res || res.code !== 0) {
                ToastManager.show(res && res.msg ? res.msg : "删除失败");
                return;
            }

            ToastManager.show("删除成功");
            this.notifyChanged();
            this.close();
        } catch (e) {
            cc.error("删除邮件失败:", e);
            ToastManager.show("删除失败");
        } finally {
            this.loading = false;
        }
    }

    private applyReceiveUser(data: MailReceiveResultVO): void {
        if (!data || !data.user) return;

        const current = UserData.get();
        if (!current) return;

        current.gold = data.user.gold != null ? data.user.gold : current.gold;
        current.roomCard = data.user.roomCard != null ? data.user.roomCard : current.roomCard;
        UserData.save(current);
        cc.systemEvent.emit("MAIL_ASSET_CHANGE");
    }

    private notifyChanged(): void {
        if (this.onChanged) {
            this.onChanged();
        }
    }

    private close(): void {
        if (this.node && cc.isValid(this.node)) {
            this.node.destroy();
        }
    }

    private getAttachmentName(data: MailAttachmentVO): string {
        switch (Number(data.itemType)) {
            case 1:
                return "金币";
            case 2:
                return "房卡";
            case 3:
                return "钻石";
            default:
                return "奖励";
        }
    }

    private setAttachmentIcon(sprite: cc.Sprite, data: MailAttachmentVO): void {
        const type = Number(data.itemType);
        if (type === 1) {
            this.loadResourceSprite(sprite, "common/icon/coin");
            return;
        }
        if (type === 3) {
            this.loadResourceSprite(sprite, "common/icon/diamond");
            return;
        }

        this.setSpriteFrame(sprite, HallRes.instance.mailImgMap["mail_icon_gift_active"]);
    }

    private loadResourceSprite(sprite: cc.Sprite, path: string): void {
        cc.resources.load(path, cc.SpriteFrame, (err, sp: cc.SpriteFrame) => {
            if (err || !this.isAlive() || !sprite || !cc.isValid(sprite.node)) {
                return;
            }

            this.setSpriteFrame(sprite, sp);
        });
    }

    private formatReceiveTip(data: MailReceiveResultVO): string {
        if (!data || !data.attachments || data.attachments.length === 0) {
            return "没有可领取的奖励";
        }

        const parts: string[] = [];
        const gold = this.sumAttachment(data.attachments, 1);
        const roomCard = this.sumAttachment(data.attachments, 2);
        const diamond = this.sumAttachment(data.attachments, 3);

        if (gold > 0) parts.push(`金币+${gold}`);
        if (roomCard > 0) parts.push(`房卡+${roomCard}`);
        if (diamond > 0) parts.push(`钻石+${diamond}`);
        return parts.length > 0 ? `领取${parts.join(" ")}` : "没有可领取的奖励";
    }

    private sumAttachment(list: MailAttachmentVO[], itemType: number): number {
        return list
            .filter(item => Number(item.itemType) === itemType)
            .reduce((sum, item) => sum + Number(item.itemCount || 0), 0);
    }

    private setSprite(pathOrName: string, imgName: string): void {
        const node = this.findChildDeep(this.node, pathOrName);
        if (!node) return;

        const sprite = node.getComponent(cc.Sprite) || node.addComponent(cc.Sprite);
        this.setSpriteFrame(sprite, HallRes.instance.mailImgMap[imgName]);
    }

    private setSpriteFrame(sprite: cc.Sprite, sp: cc.SpriteFrame): void {
        if (!sprite || !sp) return;

        const width = sprite.node.width;
        const height = sprite.node.height;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = sp;
        if (width > 0 && height > 0) {
            sprite.node.setContentSize(width, height);
        }
    }

    private ensureChild(parent: cc.Node, name: string, pos: cc.Vec2, size: cc.Size): cc.Node {
        let node = parent.getChildByName(name);
        if (!node) {
            node = new cc.Node(name);
            parent.addChild(node);
        }

        node.setPosition(pos);
        node.setContentSize(size);
        return node;
    }

    private setLabelText(name: string, text: string, color?: cc.Color): void {
        const node = this.findChildDeep(this.node, name);
        if (!node) return;

        const label = node.getComponent(cc.Label) || node.addComponent(cc.Label);
        label.string = text || "";
        if (color) {
            label.node.color = color;
        }
    }

    private setLabelStyle(name: string, fontSize: number, lineHeight: number, color: cc.Color): void {
        const node = this.findChildDeep(this.node, name);
        if (!node) return;

        const label = node.getComponent(cc.Label) || node.addComponent(cc.Label);
        label.fontSize = fontSize;
        label.lineHeight = lineHeight;
        label.node.color = color;
    }

    private ensureLabelSize(name: string, width: number, height: number): void {
        const node = this.findChildDeep(this.node, name);
        if (!node) return;

        if (node.width < width || node.height < height) {
            node.setContentSize(width, height);
        }
    }

    private formatTime(time: MailTime): string {
        const timestamp = this.toTimestamp(time);
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())} ${this.pad(date.getHours())}:${this.pad(date.getMinutes())}`;
    }

    private formatRemainTime(time: MailTime): string {
        const timestamp = this.toTimestamp(time);
        if (!timestamp) return "";

        const left = timestamp - Date.now();
        if (left <= 0) return "已过期";

        const day = Math.max(1, Math.ceil(left / 86400000));
        return `(剩余 ${day} 天)`;
    }

    private isExpired(time: MailTime): boolean {
        const timestamp = this.toTimestamp(time);
        return timestamp > 0 && timestamp <= Date.now();
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

    private addBlockInput(node: cc.Node): void {
        if (!node || node.getComponent(cc.BlockInputEvents)) return;
        node.addComponent(cc.BlockInputEvents);
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

    private isAlive(): boolean {
        return !this.destroyed && !!this.node && cc.isValid(this.node);
    }

    protected onDestroy(): void {
        this.destroyed = true;
        this.unscheduleAllCallbacks();
    }
}
