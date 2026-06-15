import UserData from "../../login/entity/UserData";
import UIColorUtil from "../../util/UIColorUtil";
import UIUtil from "../../util/UIUtil";
import HallUIManager from "../HallUIManager";

const { ccclass } = cc._decorator;

@ccclass
export default class HallTopBar extends cc.Component {

    private playerInfoNode: cc.Node = null;
    private coinBoxNode: cc.Node = null;
    private roomCardBoxNode: cc.Node = null;

    protected onLoad(): void {
        this.playerInfoNode = this.node.getChildByName("PlayerInfo");
        this.coinBoxNode = this.node.getChildByName("CoinBox");
        this.roomCardBoxNode = this.node.getChildByName("RoomCardBox");
        const addCoinNode = this.coinBoxNode.getChildByName("Add");
        const addCardNode = this.roomCardBoxNode.getChildByName("Add");

        addCoinNode.on(cc.Node.EventType.TOUCH_END, this.shopShow, this);
        addCardNode.on(cc.Node.EventType.TOUCH_END, this.shopShow, this);
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


    }

    private shopShow(){
        HallUIManager.instance.showShop();
    }

}