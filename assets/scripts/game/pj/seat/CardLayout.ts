const {ccclass, property} = cc._decorator;

@ccclass
export default class CardLayout extends cc.Component {
   
    private cardPrefab: cc.Prefab = null;
    private _resolveReady: Function = null;
    private _isReady: boolean = false;
    private deckContainer: cc.Node = null;
    private cardContainer: cc.Node = null;

    onLoad() {
        // 牌堆
        this.deckContainer = cc.find("Canvas/TableRoot/DeckContainer");
        // 牌区
        this.cardContainer = cc.find("Canvas/TableRoot/CardContainer");
        // 牌预制体
        cc.resources.load("prefabs/Card", cc.Prefab, (err, prefab) => {
            if (err) {
                cc.error("Card prefab加载失败", err);
                return;
            }

            this.cardPrefab = prefab;
            this._isReady = true;

            // ⭐ 通知 Promise
            if (this._resolveReady) {
                this._resolveReady(true);
                this._resolveReady = null;
            }
        });
    }

    
    /**
     * ⭐ Promise初始化
     */
    public ready(): Promise<boolean> {
        return new Promise((resolve) => {

            // 已经准备好，直接返回
            if (this._isReady) {
                resolve(true);
                return;
            }

            // 没好就等加载完成
            this._resolveReady = resolve;
        });
    }

    // 🎴 发牌主流程
    dealPaiJiu(cardsData) {
        this.cardContainer.removeAllChildren();
       
        let delay = 0;
        let cards = [];
        
        // 发四张牌
        for (let i = 0; i < 4; i++) {
            let card = cc.instantiate(this.cardPrefab);
            card.parent = this.cardContainer;

            console.log('牌堆初始位置' + this.deckContainer.position)
            // 初始位置（牌堆）
            card.setPosition(this.deckContainer.position);
            card.scale = 0.6;

            cards.push(card);

            // 发牌动画
            this.dealOne(card, i, delay);

            delay += 0.1;
        }
        

        // 全部发完后排列 + 翻牌
        this.scheduleOnce(() => {
            this.layoutPaiJiu(cards);
            this.flipAll(cards, cardsData);
        }, delay + 0.3);
    }

    // 🚀 单张发牌
    dealOne(card, index, delay) {

        let targetPos = this.cardContainer.position;

        card.runAction(
            cc.sequence(
                cc.delayTime(delay),
                cc.spawn(
                    cc.moveTo(0.25, targetPos).easing(cc.easeCubicActionOut()),
                    cc.scaleTo(0.25, 1)
                ),
                cc.callFunc(() => {
                    card.parent = this.cardContainer;
                    card.setPosition(0, 0);
                })
            )
        );
    }

    // 🎯 排列4张牌（牌九）
    layoutPaiJiu(cards) {

        let gapX = 80;
        let gapY = 100;

        // 后牌（上）
        cards[0].setPosition(-gapX, gapY);
        cards[1].setPosition(gapX, gapY);

        // 前牌（下）
        cards[2].setPosition(-gapX + 10, -gapY);
        cards[3].setPosition(gapX + 10, -gapY);

        // 层级（前牌盖住）
        cards[2].zIndex = 10;
        cards[3].zIndex = 10;

        // 微旋转（更真实）
        cards[0].angle = -2;
        cards[1].angle = 2;
        cards[2].angle = -3;
        cards[3].angle = 3;
    }

    // 🔄 翻牌（全部）
    flipAll(cards, data) {

        for (let i = 0; i < cards.length; i++) {

            let card = cards[i];
            let frame = this.getCardFrame(data[i]);

            this.flip(card, frame, i * 0.1);
        }
    }

    // 🔁 单张翻牌
    flip(card, frame, delay) {

        let sprite = card.getComponent(cc.Sprite);

        card.runAction(
            cc.sequence(
                cc.delayTime(delay),
                cc.scaleTo(0.15, 0, 1),
                cc.callFunc(() => {
                    sprite.spriteFrame = frame;
                }),
                cc.scaleTo(0.15, 1, 1)
            )
        );
    }

    // 🎴 获取牌图
    getCardFrame(id) {
        let path = "cards/c" + id;
        cc.resources.load(path, cc.SpriteFrame, (err, frame) => {
            if (err) {
                cc.error("加载失败", path);
                return;
            }

            return frame;
        });
    }
}
