import UserData from "../../login/entity/UserData";

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

        this.setLabel(nameLabelNode, user.nickname, cc.Color.WHITE, cc.Color.BLACK, 2);
        this.setLabel(idLabelNode, `ID: ${user.userId}`, cc.Color.WHITE, cc.Color.BLACK, 2);
        this.setLabel(coinValNode, String(user.gold), new cc.Color(255, 215, 0), new cc.Color(80, 40, 0), 1);
        this.setLabel(roomCardValNode, String(user.roomCard), new cc.Color(255, 215, 0), new cc.Color(80, 40, 0), 1);
    }

    /**
     * 通用设置 Label 文本和描边
     */
    private setLabel(
        labelNode: cc.Node,
        text: string,
        color: cc.Color,
        outlineColor: cc.Color,
        outlineWidth: number
    ) {
        if (!labelNode) return;

        const label = labelNode.getComponent(cc.Label);
        if (!label) return;

        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
            outline = labelNode.addComponent(cc.LabelOutline);
        }

        outline.color = outlineColor;
        outline.width = outlineWidth;

        label.string = text;
        label.node.color = color;
    }
}