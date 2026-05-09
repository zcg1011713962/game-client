
const {ccclass, property} = cc._decorator;

@ccclass
export default class HallUIManager extends cc.Component {

    private gameCardPos : { x : number, y : number, id:  number, name: string }[] = [];
    private static _instance: HallUIManager = null;
    public static get instance(): HallUIManager {
        return this._instance;
    }

    onLoad() {
        // 保存单例引用
        HallUIManager._instance = this;
        this.init();
    }

    public init(){
        this.intGameCardPos();
    }



     public intGameCardPos(){
        this.gameCardPos = [];
        // 设置座位坐标
        this.gameCardPos.push({ x : -278, y : 50, id:  1 , name: "牌九"});
    }



    public getGameCardPos() : { x : number, y : number, id:  number, name: string }[] {
        return this.gameCardPos;
    }


    public setCardIconNameView(labelNode: cc.Node, name : string) {
        const label = labelNode.getComponent(cc.Label);
        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
                outline = labelNode.addComponent(cc.LabelOutline);
                // 黑色描边
                outline.color = cc.Color.BLACK;
                // 宽度
                outline.width = 5;
        }
        label.string = name;
        label.node.color = new cc.Color(255, 215, 0); // 金色
    }

    public setGameOnlineCountView(labelNode: cc.Node, count : number) {
        const label = labelNode.getComponent(cc.Label);
        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
                outline = labelNode.addComponent(cc.LabelOutline);
                // 黑色描边
                outline.color = cc.Color.BLACK;
                // 宽度
                outline.width = 5;
        }
        label.string = String(count);
        label.node.color = new cc.Color(255, 215, 0); // 金色
    }

}
