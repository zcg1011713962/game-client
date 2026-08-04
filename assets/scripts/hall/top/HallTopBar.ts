import UserData from "../../login/entity/UserData";
import UIColorUtil from "../../util/UIColorUtil";
import UIUtil from "../../util/UIUtil";
import HallUIManager from "../HallUIManager";
import HallRes from "../HallRes";
import MailApi from "../mail/MailApi";

const { ccclass } = cc._decorator;

@ccclass
export default class HallTopBar extends cc.Component {

    private playerInfoNode: cc.Node = null;
    private coinBoxNode: cc.Node = null;
    private roomCardBoxNode: cc.Node = null;
    private emailNode: cc.Node = null;
    private destroyed: boolean = false;
    private unreadRefreshSeq: number = 0;

    protected onLoad(): void {
        this.playerInfoNode = this.node.getChildByName("PlayerInfo");
        this.coinBoxNode = this.node.getChildByName("CoinBox");
        this.roomCardBoxNode = this.node.getChildByName("RoomCardBox");
        this.emailNode = this.node.getChildByName("Email");
        const addCoinNode = this.coinBoxNode.getChildByName("Add");
        const addCardNode = this.roomCardBoxNode.getChildByName("Add");

        addCoinNode.on(cc.Node.EventType.TOUCH_END, this.shopShow, this);
        addCardNode.on(cc.Node.EventType.TOUCH_END, this.shopShow, this);
        if (this.emailNode) {
            this.emailNode.on(cc.Node.EventType.TOUCH_END, this.mailShow, this);
        }
        cc.systemEvent.on("MAIL_ASSET_CHANGE", this.refresh, this);
        this.refresh();
    }

    /**
     * 刷新顶部栏显示
     */
    public refresh() {
        const user = UserData.get();
        console.log("刷新顶部栏显示", user);
        if (!user) return;

        const nameLabelNode = this.playerInfoNode?.getChildByName("NameLabel");
        const idLabelNode = this.playerInfoNode?.getChildByName("IdLabel");
        const coinValNode = this.coinBoxNode?.getChildByName("CoinVal");
        const roomCardValNode = this.roomCardBoxNode?.getChildByName("RoomCardVal");

        UIUtil.setLabel(nameLabelNode, String(user.nickname),  UIColorUtil.NICKNAME, UIColorUtil.NICKNAME_OUTLINE, 2);
        UIUtil.setLabel(idLabelNode, `ID: ${user.userId}`, UIColorUtil.USER_ID, UIColorUtil.USER_ID_OUTLINE, 2);
        UIUtil.setLabel(coinValNode, String(user.gold), UIColorUtil.GOLD, UIColorUtil.TITLE, 1);
        UIUtil.setLabel(roomCardValNode, String(user.roomCard), UIColorUtil.GOLD, UIColorUtil.TITLE, 1);

        this.refreshMailRedPoint();
    }

    private shopShow(){
        HallUIManager.instance.showShop();
    }

    private mailShow(): void {
        HallUIManager.instance.showMail(cc.find("Canvas"));
    }

    private async refreshMailRedPoint(): Promise<void> {
        if (!this.emailNode) {
            return;
        }

        const seq = ++this.unreadRefreshSeq;
        try {
            await HallRes.instance.loadTopImg();
            if (!this.isAlive(seq)) {
                return;
            }

            const res = await MailApi.unreadCount();
            if (!this.isAlive(seq)) {
                return;
            }

            const count = res && res.code === 0 ? Number(res.data || 0) : 0;
            this.updateMailIcon(count > 0);
        } catch (e) {
            cc.warn("刷新大厅邮件红点失败:", e);
            this.updateMailIcon(false);
        }
    }

    private updateMailIcon(hasUnread: boolean): void {
        if (!this.emailNode || !cc.isValid(this.emailNode)) {
            return;
        }

        const sprite = this.emailNode.getComponent(cc.Sprite);
        if (!sprite) {
            return;
        }

        const frameName = hasUnread ? "email_red_point" : "email";
        const spriteFrame = HallRes.instance.topImgMap[frameName];
        if (!spriteFrame) {
            return;
        }

        sprite.spriteFrame = spriteFrame;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    }

    private isAlive(seq: number): boolean {
        return !this.destroyed && seq === this.unreadRefreshSeq && cc.isValid(this.node);
    }

    protected onDestroy(): void {
        this.destroyed = true;
        this.unreadRefreshSeq++;
        cc.systemEvent.off("MAIL_ASSET_CHANGE", this.refresh, this);

        if (this.emailNode) {
            this.emailNode.off(cc.Node.EventType.TOUCH_END, this.mailShow, this);
        }
    }

}
