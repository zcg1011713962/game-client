import UserData from "../../login/entity/UserData";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HallTopBar extends cc.Component {
    private playerInfoNode : cc.Node = null;
    private coinBoxNode: cc.Node = null;
    private diamondBoxNode: cc.Node = null;

    protected onLoad(): void {
        this.playerInfoNode = this.node.getChildByName("PlayerInfo");
        this.coinBoxNode = this.node.getChildByName("CoinBox");
        this.diamondBoxNode = this.node.getChildByName("DiamondBox");
        this.init();
    }

    public init(){
        if(!this.playerInfoNode){
            return;
        }
        const nameLabelNode = this.playerInfoNode.getChildByName("NameLabel");
        const idLabelNode = this.playerInfoNode.getChildByName("IdLabel");
        const coinValNode = this.coinBoxNode.getChildByName("CoinVal");
        
        const user = UserData.get();
        if(user){
            console.log(nameLabelNode, idLabelNode, coinValNode)
            this.setNickNameView(nameLabelNode, user.nickname);
            this.setIdValView(idLabelNode, String(user.userId));
            this.setGoldView(coinValNode, String(user.gold));

            console.log("update top bar", user, user.nickname);
        }
       
    }

    public setNickNameView(labelNode: cc.Node, name : string) {
        const label = labelNode.getComponent(cc.Label);
        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
                outline = labelNode.addComponent(cc.LabelOutline);
                // 黑色描边
                outline.color = cc.Color.BLACK;
                // 宽度
                outline.width = 3;
        }
        label.string = name;
        label.node.color =  new cc.Color(255, 220, 40);
    }


    public setIdView(labelNode: cc.Node, name : string) {
        const label = labelNode.getComponent(cc.Label);
        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
                outline = labelNode.addComponent(cc.LabelOutline);
                // 黑色描边
                outline.color = new cc.Color(20, 40, 120);
                // 宽度
                outline.width = 2;
        }
        label.string = name;
        label.node.color = cc.Color.WHITE; 
    }

    public setIdValView(labelNode: cc.Node, name : string) {
        const label = labelNode.getComponent(cc.Label);
        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
                outline = labelNode.addComponent(cc.LabelOutline);
                // 黑色描边
                outline.color = new cc.Color(20, 40, 120);
                // 宽度
                outline.width = 1;
        }
        label.string = name;
        label.node.color = cc.Color.WHITE; 
    }


     public setGoldView(labelNode: cc.Node, name : string) {
        const label = labelNode.getComponent(cc.Label);
        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
                outline = labelNode.addComponent(cc.LabelOutline);
                outline.color = new cc.Color(80, 40, 0)
                // 宽度
                outline.width = 3;
        }
        label.string = name;
        label.node.color = new cc.Color(255, 215, 0); // 金色
    }



    


}
