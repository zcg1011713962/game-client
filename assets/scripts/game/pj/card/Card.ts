const { ccclass, property } = cc._decorator;

@ccclass
export default class Card extends cc.Component {

    private sprite: cc.Sprite = null;

    private atlas: cc.SpriteAtlas = null;


    backFrame: cc.SpriteFrame = null;

    private cardId: number = 0;

    /** 显示牌背 */
    showBack() {
        this.sprite.spriteFrame = this.backFrame;
    }

    /** 显示牌面 */
    showFront(cardId: number) {
        this.cardId = cardId;

        const name = `pai_${cardId < 10 ? "0" + cardId : cardId}`;
        const frame = this.atlas.getSpriteFrame(name);

        if (!frame) {
            cc.error("找不到牌资源:", name);
            return;
        }

        this.sprite.spriteFrame = frame;
    }

    /** 翻牌动画 */
    flipTo(cardId: number) {
        cc.tween(this.node)
            .to(0.1, { scaleX: 0 })
            .call(() => {
                this.showFront(cardId);
            })
            .to(0.1, { scaleX: 1 })
            .start();
    }
}