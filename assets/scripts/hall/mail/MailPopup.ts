import ToastManager from "../../common/ToastManager";
import UserData from "../../login/entity/UserData";
import HallRes from "../HallRes";
import MailApi, { MailAttachmentVO, MailReceiveResultVO, MailVO } from "./MailApi";
import MailDetailPopup from "./MailDetailPopup";
import MailItem from "./MailItem";

const { ccclass } = cc._decorator;

@ccclass
export default class MailPopup extends cc.Component {
    private btnClose: cc.Node = null;
    private btnReceiveAll: cc.Node = null;
    private btnDeleteRead: cc.Node = null;
    private content: cc.Node = null;
    private scrollView: cc.ScrollView = null;
    private emptyLabel: cc.Label = null;
    private footerTipNode: cc.Node = null;
    private footerTipLabel: cc.Label = null;
    private unreadCountLabel: cc.Label = null;
    private badgeCountLabel: cc.Label = null;
    private redBadge: cc.Node = null;
    private detailNode: cc.Node = null;
    private pageNo: number = 1;
    private pageSize: number = 20;
    private loading: boolean = false;
    private destroyed: boolean = false;
    private records: MailVO[] = [];

    protected onLoad(): void {
        this.addBlockInput(this.node);
        this.bindNodes();
        this.bindEvents();
        this.applyImages();
        this.applyLabelStyle();
    }

    public async loadFirstPage(): Promise<void> {
        if (!this.isAlive() || this.loading) {
            return;
        }

        this.pageNo = 1;
        await this.loadList();
    }

    private bindNodes(): void {
        this.node.setContentSize(this.node.width || 1080, this.node.height || 1920);
        this.btnClose = this.btnClose || this.findChildDeep(this.node, "BtnClose");
        this.btnReceiveAll = this.btnReceiveAll || this.findChildDeep(this.node, "BtnReceiveAll");
        this.btnDeleteRead = this.btnDeleteRead || this.findChildDeep(this.node, "BtnDeleteRead");
        this.scrollView = this.scrollView || this.findScrollView("ScrollView");
        this.content = this.content || this.findChildDeep(this.node, "Content") || (this.scrollView ? this.scrollView.content : null);
        this.emptyLabel = this.emptyLabel || this.ensureLabel("EmptyLabel");
        this.footerTipNode = this.footerTipNode || this.findChildDeep(this.node, "FooterTip");
        this.footerTipLabel = this.footerTipLabel || this.ensureFooterTipLabel();
        this.unreadCountLabel = this.unreadCountLabel || this.findLabel("UnreadCountLabel");
        this.badgeCountLabel = this.badgeCountLabel || this.findLabel("CountLabel");
        this.redBadge = this.redBadge || this.findChildDeep(this.node, "RedBadge");
        this.addBlockInput(this.findChildDeep(this.node, "Mask") || this.findChildDeep(this.node, "Bg"));

        if (this.scrollView && this.content) {
            this.scrollView.content = this.content;
            this.scrollView.horizontal = false;
            this.scrollView.vertical = true;
        }
        this.setupContentLayout();
    }

    private bindEvents(): void {
        this.bindButton(this.btnClose, this.hide);
        this.bindButton(this.btnReceiveAll, this.onReceiveAllClick);
        this.bindButton(this.btnDeleteRead, this.onDeleteReadClick);
    }

    private bindButton(node: cc.Node, handler: Function): void {
        if (!node) return;
        node.off(cc.Node.EventType.TOUCH_END, handler, this);
        node.on(cc.Node.EventType.TOUCH_END, handler, this);
    }

    private applyLabelStyle(): void {
        this.setLabelStyle("TitleLabel", 64, 72, cc.color(255, 244, 222));
        this.setLabelStyle("TextLabel", 30, 36, cc.color(220, 220, 228));
        this.setLabelStyle("UnreadCountLabel", 42, 48, cc.color(255, 95, 95));
        this.setLabelColor("CountLabel", cc.color(255, 255, 255));
        this.setLabelStyle("BtnReceiveAll/Label", 32, 38, cc.color(255, 246, 230));
        this.setLabelStyle("BtnDeleteRead/Label", 30, 36, cc.color(220, 220, 228));
        this.setLabelStyle("EmptyLabel", 34, 40, cc.color(190, 194, 204));
        this.setLabelBaseStyle(this.footerTipLabel, 26, 32, cc.color(150, 150, 160));
        this.setLabel(this.emptyLabel, "暂无邮件", cc.color(190, 194, 204));
        this.setLabel(this.footerTipLabel, "邮件最多保存30天，请及时领取附件", cc.color(150, 150, 160));
        if (this.emptyLabel) {
            this.emptyLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            this.emptyLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
        }
    }

    private setLabelStyle(pathOrName: string, fontSize: number, lineHeight: number, color: cc.Color): void {
        const node = pathOrName.indexOf("/") >= 0
            ? cc.find(pathOrName, this.node)
            : this.findChildDeep(this.node, pathOrName);
        if (!node) return;

        const label = node.getComponent(cc.Label);
        if (!label) return;

        label.fontSize = fontSize;
        label.lineHeight = lineHeight;
        label.node.color = color;
    }

    private setLabelColor(pathOrName: string, color: cc.Color): void {
        const node = pathOrName.indexOf("/") >= 0
            ? cc.find(pathOrName, this.node)
            : this.findChildDeep(this.node, pathOrName);
        if (!node) return;

        const label = node.getComponent(cc.Label);
        if (!label) return;

        label.node.color = color;
    }

    private addBlockInput(node: cc.Node): void {
        if (!node || node.getComponent(cc.BlockInputEvents)) {
            return;
        }

        node.addComponent(cc.BlockInputEvents);
    }

    private applyImages(): void {
        this.setSprite("Bg", "mail_popup_bg");
        this.setSprite("TitleBg", "mail_title_bg");
        this.setSprite("BtnClose", "mail_btn_close");
        this.setSprite("UnreadGroup/Bg", "mail_unread_bg");
        this.setSprite("IconMail", "mail_icon_unread");
        this.setSprite("RedBadge", "mail_red_dot");
        this.setSprite("BtnReceiveAll", "mail_btn_receive_all");
        this.setSprite("BtnDeleteRead", "mail_btn_delete_read");
        this.setSprite("FooterTip", "mail_footer_tip_bg");
    }

    private async loadList(): Promise<void> {
        this.loading = true;
        try {
            const res = await MailApi.list(this.pageNo, this.pageSize);
            if (!this.isAlive()) return;
            if (!res || res.code !== 0 || !res.data) {
                ToastManager.show(res && res.msg ? res.msg : "获取邮件失败");
                return;
            }

            this.records = res.data.records || [];
            this.refreshList();
            await this.refreshUnreadCount();
        } catch (e) {
            cc.error("获取邮件失败:", e);
            ToastManager.show("获取邮件失败");
        } finally {
            this.loading = false;
        }
    }

    private refreshList(): void {
        if (!this.content || !cc.isValid(this.content)) {
            return;
        }

        this.content.removeAllChildren();
        if (this.emptyLabel) {
            this.emptyLabel.string = "暂无邮件";
            this.emptyLabel.node.active = this.records.length === 0;
        }
        if (this.footerTipNode) {
            this.footerTipNode.active = true;
        }
        if (this.footerTipLabel) {
            this.footerTipLabel.string = "邮件最多保存30天，请及时领取附件";
        }

        this.records.forEach(record => {
            const node = cc.instantiate(HallRes.instance.mailItemPrefab);
            node.setContentSize(node.width || 980, node.height || 190);
            this.content.addChild(node);

            let item = node.getComponent(MailItem);
            if (!item) {
                item = node.addComponent(MailItem);
            }

            item.updateView(record);
            item.setClickHandler((data) => {
                this.onItemClick(data);
            });
        });

        const layout = this.content.getComponent(cc.Layout);
        if (layout) {
            this.resizeContentHeight();
            layout.updateLayout();
        }

        if (this.scrollView && cc.isValid(this.scrollView.node)) {
            this.scrollView.scrollToTop(0);
        }
    }

    private async refreshUnreadCount(): Promise<void> {
        try {
            const res = await MailApi.unreadCount();
            if (!this.isAlive() || !res || res.code !== 0) return;

            const count = Number(res.data || 0);
            this.setLabel(this.unreadCountLabel, `${count}`, cc.color(255, 95, 95));
            this.setLabel(this.badgeCountLabel, `${count}`, cc.color(255, 255, 255));
            if (this.redBadge) {
                this.redBadge.active = count > 0;
            }
        } catch (e) {
            cc.warn("刷新邮件未读数量失败:", e);
        }
    }

    private async onItemClick(data: MailVO): Promise<void> {
        if (!data || !data.mailId) return;

        try {
            const res = await MailApi.read(data.mailId);
            if (!this.isAlive()) return;

            if (!res || res.code !== 0) {
                ToastManager.show(res && res.msg ? res.msg : "读取邮件失败");
                return;
            }

            const readMail = res.data || data;
            this.markMailReadInList(readMail);
            this.refreshList();
            this.openDetail(readMail);
            await this.refreshUnreadCount();
            cc.systemEvent.emit("MAIL_ASSET_CHANGE");
        } catch (e) {
            cc.error("读取邮件失败:", e);
            ToastManager.show("读取邮件失败");
        }
    }

    private async openDetail(data: MailVO): Promise<void> {
        if (!data || !this.isAlive()) return;

        try {
            await HallRes.instance.loadMailImg();
            const prefab = await HallRes.instance.loadMailDetailPopupPrefab();
            if (!this.isAlive()) return;

            if (this.detailNode && cc.isValid(this.detailNode)) {
                this.detailNode.destroy();
            }

            this.detailNode = cc.instantiate(prefab);
            const parent = this.node.parent || cc.find("Canvas") || this.node;
            parent.addChild(this.detailNode);
            this.detailNode.setPosition(0, 0);
            this.detailNode.zIndex = this.node.zIndex + 10;

            let popup = this.detailNode.getComponent(MailDetailPopup);
            if (!popup) {
                popup = this.detailNode.addComponent(MailDetailPopup);
            }

            popup.init(data, () => {
                this.loadFirstPage();
            });
        } catch (e) {
            cc.error("打开邮件详情失败:", e);
            ToastManager.show("打开邮件详情失败");
        }
    }

    private markMailReadInList(data: MailVO): void {
        if (!data || !data.mailId) return;

        for (let i = 0; i < this.records.length; i++) {
            if (Number(this.records[i].mailId) !== Number(data.mailId)) {
                continue;
            }

            this.records[i] = {
                ...this.records[i],
                ...data,
                readStatus: 1,
            };
            return;
        }
    }

    private async onReceiveAllClick(): Promise<void> {
        try {
            const res = await MailApi.receiveAll();
            if (!this.isAlive()) return;

            if (!res || res.code !== 0) {
                ToastManager.show(res && res.msg ? res.msg : "领取失败");
                return;
            }

            if (!res.data || !res.data.attachments || res.data.attachments.length === 0) {
                ToastManager.show("没有可领取的奖励");
                await this.loadFirstPage();
                return;
            }

            this.applyReceiveUser(res.data);
            ToastManager.show(this.formatReceiveTip(res.data));
            await this.loadFirstPage();
        } catch (e) {
            cc.error("一键领取邮件失败:", e);
            ToastManager.show("领取失败");
        }
    }

    private async onDeleteReadClick(): Promise<void> {
        const deletable = this.records.filter(item =>
            Number(item.readStatus || 0) === 1 &&
            (Number(item.receiveStatus) !== 0 || !item.hasAttachment)
        );

        if (deletable.length === 0) {
            ToastManager.show("没有可删除邮件");
            return;
        }

        try {
            for (let i = 0; i < deletable.length; i++) {
                const res = await MailApi.deleteMail(deletable[i].mailId);
                if (!this.isAlive()) return;
                if (!res || res.code !== 0) {
                    ToastManager.show(res && res.msg ? res.msg : "删除失败");
                    return;
                }
            }

            ToastManager.show("删除成功");
            await this.loadFirstPage();
        } catch (e) {
            cc.error("删除已读邮件失败:", e);
            ToastManager.show("删除失败");
        }
    }

    private applyReceiveUser(data: MailReceiveResultVO): void {
        if (!data || !data.user) {
            return;
        }

        const current = UserData.get();
        if (!current) {
            return;
        }

        current.gold = data.user.gold != null ? data.user.gold : current.gold;
        current.roomCard = data.user.roomCard != null ? data.user.roomCard : current.roomCard;
        UserData.save(current);

        cc.systemEvent.emit("MAIL_ASSET_CHANGE");
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

    private hide(): void {
        if (this.node && cc.isValid(this.node)) {
            this.node.active = false;
        }
    }

    private setSprite(pathOrName: string, imgName: string): void {
        const node = pathOrName.indexOf("/") >= 0
            ? cc.find(pathOrName, this.node)
            : this.findChildDeep(this.node, pathOrName);
        if (!node) return;

        const sprite = node.getComponent(cc.Sprite) || node.addComponent(cc.Sprite);
        const width = node.width;
        const height = node.height;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = HallRes.instance.mailImgMap[imgName] || null;
        if (width > 0 && height > 0) {
            node.setContentSize(width, height);
        }
    }

    private setLabel(label: cc.Label, text: string, color?: cc.Color): void {
        if (!label) return;
        label.string = text;
        if (color) {
            label.node.color = color;
        }
    }

    private setLabelBaseStyle(label: cc.Label, fontSize: number, lineHeight: number, color: cc.Color): void {
        if (!label) return;

        label.fontSize = fontSize;
        label.lineHeight = lineHeight;
        label.node.color = color;
    }

    private setupContentLayout(): void {
        if (!this.content) return;

        const layout = this.content.getComponent(cc.Layout) || this.content.addComponent(cc.Layout);
        layout.type = cc.Layout.Type.VERTICAL;
        layout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
        layout.verticalDirection = cc.Layout.VerticalDirection.TOP_TO_BOTTOM;
        layout.paddingTop = 0;
        layout.paddingBottom = 20;
        layout.spacingY = 18;
    }

    private resizeContentHeight(): void {
        if (!this.content) return;

        const itemHeight = 190;
        const spacingY = 18;
        const paddingBottom = 20;
        const viewHeight = this.scrollView && this.scrollView.node ? this.scrollView.node.height : 1120;
        const listHeight = this.records.length <= 0
            ? viewHeight
            : this.records.length * itemHeight + Math.max(0, this.records.length - 1) * spacingY + paddingBottom;

        this.content.setContentSize(this.content.width || 990, Math.max(viewHeight, listHeight));
    }

    private findLabel(name: string): cc.Label {
        const node = this.findChildDeep(this.node, name);
        return node ? node.getComponent(cc.Label) : null;
    }

    private ensureLabel(name: string): cc.Label {
        const node = this.findChildDeep(this.node, name);
        if (!node) return null;

        const label = node.getComponent(cc.Label) || node.addComponent(cc.Label);
        if (node.width <= 0 || node.height <= 0) {
            node.setContentSize(500, 60);
        }
        return label;
    }

    private ensureFooterTipLabel(): cc.Label {
        const root = this.footerTipNode || this.findChildDeep(this.node, "FooterTip");
        if (!root) return null;

        this.ensureFooterTipIcon(root);

        let labelNode = root.getChildByName("Label");
        if (!labelNode) {
            labelNode = new cc.Node("Label");
            root.addChild(labelNode);
        }

        labelNode.setPosition(30, 0);
        labelNode.setContentSize(root.width > 0 ? root.width - 100 : 600, root.height > 0 ? root.height : 50);

        const label = labelNode.getComponent(cc.Label) || labelNode.addComponent(cc.Label);
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        return label;
    }

    private ensureFooterTipIcon(root: cc.Node): void {
        let iconNode = root.getChildByName("IconTip");
        if (!iconNode) {
            iconNode = new cc.Node("IconTip");
            root.addChild(iconNode);
        }

        iconNode.setPosition(-(root.width > 0 ? root.width / 2 - 44 : 300), 0);
        iconNode.setContentSize(32, 32);

        const label = iconNode.getComponent(cc.Label) || iconNode.addComponent(cc.Label);
        label.string = "!";
        label.fontSize = 28;
        label.lineHeight = 32;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        label.node.color = cc.color(255, 74, 74);
    }

    private findScrollView(name: string): cc.ScrollView {
        const node = this.findChildDeep(this.node, name);
        return node ? node.getComponent(cc.ScrollView) : null;
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
        if (this.detailNode && cc.isValid(this.detailNode)) {
            this.detailNode.destroy();
        }
    }
}
