import HallRes from "./HallRes";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HallUIManager extends cc.Component {
    public hallBmgAudioId: number | null = null;
    private gameCardPos : { x : number, y : number, id:  number, name: string }[] = [];
    public cardPopLayerNode: cc.Node | null = null;
    public gameCardNode: cc.Node | null = null;
    private static _instance: HallUIManager = null;
    public static get instance(): HallUIManager {
        return this._instance;
    }

    async onLoad() {
        // 保存单例引用
        HallUIManager._instance = this;
        this.init();
    }

    public async init(){
        this.intGameCardPos();
        await HallRes.instance.preload();
        if(this.hallBmgAudioId === null){
            this.hallBmgAudioId = cc.audioEngine.playEffect(HallRes.instance.hallBgmAudio, true);
            cc.audioEngine.setVolume(this.hallBmgAudioId, 0.3);
        } 
        this.cardPopLayerNode = cc.find("Canvas/PopLayer");
        this.gameCardNode = cc.find("Canvas/GameCard");
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

     onDestroy() {
        if(this.hallBmgAudioId !== null){
            cc.audioEngine.stopEffect(this.hallBmgAudioId);
            this.hallBmgAudioId = null;
        }
    }

}
