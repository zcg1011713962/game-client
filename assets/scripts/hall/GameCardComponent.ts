const { ccclass, property } = cc._decorator;

import { GameCardData } from "./entity/GameCardData";
import HallRes from "./HallRes";
import HallUIManager from "./HallUIManager";

@ccclass
export default class GameCardComponent extends cc.Component {

    private gameCardData: GameCardData = null;
    private loadToken: number = 0;

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onClick, this);
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onClick, this);
    }

    public init(gameCardData: GameCardData) {
        this.setData(gameCardData);
    }

    public setData(gameCardData: GameCardData) {
        this.gameCardData = gameCardData;
        this.updateView();
    }

    public updateView() {
        if (!this.gameCardData) return;

        const token = ++this.loadToken;

        this.updateTextView();
        this.loadCardImageAsync(this.gameCardData.id, token);
    }

    private async loadCardImageAsync(id: number, token: number) {
        try {
            const bgKey = `bg1_${id}`;
            const iconKey = `game_${id}`;

            const [bg1Sprite, gameIconSprite] = await Promise.all([
                HallRes.instance.loadBg1Img(bgKey),
                HallRes.instance.loadGameIconImg(iconKey),
            ]);

            if (!cc.isValid(this.node)) return;
            if (token !== this.loadToken) return;

            const bg1Node = this.node.getChildByName("bg1");
            if (bg1Node && bg1Sprite) {
                bg1Node.getComponent(cc.Sprite).spriteFrame = bg1Sprite;
            }

            const gameIconNode = this.node.getChildByName("gameIcon");
            if (gameIconNode && gameIconSprite) {
                gameIconNode.getComponent(cc.Sprite).spriteFrame = gameIconSprite;
            }

        } catch (e) {
            cc.error("游戏卡片图片加载失败:", id, e);
        }
    }

    private updateTextView() {
        const numLabeNode = this.node.getChildByName("numLabel");
        HallUIManager.instance.setGameOnlineCountView(numLabeNode, 120);
    }

    private onClick() {
        if (HallRes.instance.hallClickAudio) {
            cc.audioEngine.playEffect(HallRes.instance.hallClickAudio, false);
        }

        if (!this.gameCardData) return;

        cc.log("onClick", this.gameCardData);
        cc.systemEvent.emit("GameCard_CLICK", this.gameCardData.id);
    }
}