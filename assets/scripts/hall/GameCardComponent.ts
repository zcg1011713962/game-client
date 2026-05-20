const {ccclass, property} = cc._decorator;
import {GameCardData} from "./entity/GameCardData";
import HallRes from "./HallRes";
import HallUIManager from "./HallUIManager";

@ccclass
export default class GameCardComponent extends cc.Component {
    private bg1Map : { [key: string]: cc.SpriteFrame } = {}; // 预加载图片资源
    private gameIconMap : { [key: string]: cc.SpriteFrame } = {}; // 预加载图片资源
    private gameCardData: GameCardData = null;

    onLoad () {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onClick, this);
    }

    public init(gameCardData: GameCardData, bg1Map : { [key: string]: cc.SpriteFrame }, gameIconMap : { [key: string]: cc.SpriteFrame }){
        this.bg1Map = bg1Map;
        this.gameIconMap = gameIconMap;
        this.setData(gameCardData);
    }

    /**
    * 更新数据
    */
    public setData(gameCardData: GameCardData) {
        this.gameCardData = gameCardData;
        this.updateView();
    }

    public updateView(){
        if(this.gameCardData){
            const bg1Node = this.node.getChildByName("bg1");
            const bg1Sprite = this.getBg1Sprite(this.gameCardData.id);
            const gameIconSprite = this.getGameIconSprite(this.gameCardData.id);
            if(bg1Node && bg1Sprite){
                const bg1NodeSprite = bg1Node.getComponent(cc.Sprite)
                bg1NodeSprite.spriteFrame = bg1Sprite;
            }
            const gameIconNode = this.node.getChildByName("gameIcon");
            if(gameIconNode && gameIconSprite){
                const gameIconNodeSprite = gameIconNode.getComponent(cc.Sprite);
                gameIconNodeSprite.spriteFrame = gameIconSprite;
            }
    
            const numLabeNode = this.node.getChildByName("numLabel");
            HallUIManager.instance.setGameOnlineCountView(numLabeNode, 120);
        }
    }


    private getBg1Sprite(id : number){
        const key = `bg1_${id}`;
        const spriteFrame = this.bg1Map[key];
        if (!spriteFrame) {
            console.error("找不到游戏卡片背景:", key, this.bg1Map);
            return;
        }
        return spriteFrame; 
    }

    private getGameIconSprite(id : number){
        const key = `game_${id}`;
        const spriteFrame = this.gameIconMap[key];
        if (!spriteFrame) {
            console.error("找不到游戏卡片ICON:", key, this.gameIconMap);
            return;
        }
        return spriteFrame; 
    }


    private onClick() {
        // 游戏卡片点击
        cc.audioEngine.playEffect(HallRes.instance.hallClickAudio, false);
        cc.log("onClick", this.gameCardData);
        if (!this.gameCardData) return;
        cc.systemEvent.emit("GameCard_CLICK", this.gameCardData.id);
    }


}
