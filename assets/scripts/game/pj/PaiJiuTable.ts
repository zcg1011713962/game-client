const {ccclass, property} = cc._decorator;

@ccclass
export default class PaiJiuTable extends cc.Component {
    private deckContainer: cc.Node = null;
    private dealContainer: cc.Node = null;

    private totalCardCount: number = 32;  // 牌九通常 32 张
    private cardsPerPlayer: number = 2;  // 每人发几张，可改 4
    private playerCount: number = 4;

    private deckOffsetX: number = 3;
    private deckOffsetY: number = 2;

    private dealGapX: number = 36; // 同一玩家手牌间距
    private dealGapY: number = 0;


    onLoad () {
        this.deckContainer = this.node.getChildByName("deckContainer");
        this.dealContainer = this.node.getChildByName("dealContainer");

    }

    playStartAnim () {
        this.createDeck();

        // this.shuffleAnim(() => {
        //     this.dealCards(serverResult, () => {
        //         cc.log("发牌完成");
        //     });
        // });
    }

     // 创建牌堆
    // -------------------------
    createDeck () {
        this.clearTable();

        for (let i = 0; i < this.totalCardCount; i++) {
            let card = cc.instantiate(this.cardPrefab);
            this.deckContainer.addChild(card);

            let script = card.getComponent("PaiJiuCard");
            if (script) {
                script.init({ id: i });
            }

            card.angle = 90; // 横牌。如果你资源本身就是横的，这句删掉
            card.scale = 1;

            // 堆叠位置
            card.x = i * this.deckOffsetX;
            card.y = -i * this.deckOffsetY;
            card.zIndex = i;

            this.cardList.push(card);
        }
    }

    clearTable () {
        this.deckContainer.removeAllChildren();
        this.dealContainer.removeAllChildren();
        //this.cardList = [];
        //this.playerCardMap = {};
    }


}
