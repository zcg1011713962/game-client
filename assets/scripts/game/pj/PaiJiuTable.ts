
import PaiJiuCard, { IPaiJiuCardData } from "./card/PaiJiuCard";
const {ccclass, property} = cc._decorator;
interface IPlayerDealData {
    seat: number;
    cards: IPaiJiuCardData[];
}

interface IServerDealResult {
    bankerSeat?: number;
    players: IPlayerDealData[];
}

interface IDealOrderItem {
    seat: number;
    cardData: IPaiJiuCardData | null;
}
@ccclass
export default class PaiJiuTable extends cc.Component {
    private deckContainer: cc.Node = null;
    private dealContainer: cc.Node = null;
    private cardPrefab: cc.Node = null;

    private totalCardCount: number = 32;  // 牌九通常 32 张
    private cardsPerPlayer: number = 2;  // 每人发几张
    private playerCount: number = 4;
    private playerPosList: cc.Node[] = [];
    private deckOffsetX: number = 0.5;
    private deckOffsetY: number = 1;
    private dealGapX: number = 36; // 同一玩家手牌间距
    private dealGapY: number = 0;
    private dealDuration: number = 0.18;
    private dealInterval: number = 0.12;
    

    private cardList: cc.Node[] = [];
    private playerCardMap: { [seat: number]: cc.Node[] } = {};
    private isPlaying: boolean = false;
    onLoad () {
        this.cardList = [];
        this.playerCardMap = {};
        this.isPlaying = false;
        this.playerPosList = [];
        // 加载座位预制体
        this.loadCardPrefab();
        this.deckContainer = this.node.getChildByName("DeckContainer");
        this.dealContainer = this.node.getChildByName("DealContainer");
        let root = this.node.getChildByName("PlayerPosRoot");

        for (let i = 0; i < 4; i++) {
            let node = root.getChildByName(`Player${i}Pos`);
            this.playerPosList.push(node);
        }
    }


    loadCardPrefab() {
        return new Promise((resolve, reject) => {
            cc.resources.load("prefabs/Card", cc.Prefab, (err, prefab) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(prefab);
                }
            });
        });
    }

    public async playStartAnim(serverResult?: IServerDealResult) {
        if (this.isPlaying) return;

        this.isPlaying = true;
        // 创建发牌堆
        await this.createDeck();

        this.shuffleAnim(() => {
            this.dealCards(serverResult, () => {
                this.isPlaying = false;
                cc.log("发牌完成");
            });
        });
    }

    // 创建牌堆
    async createDeck () {
        this.cardPrefab = await this.loadCardPrefab();
        this.clearTable();
        console.log("clearTable");

        for (let i = 0; i < this.totalCardCount; i++) {
            
            let card = cc.instantiate(this.cardPrefab);
            this.deckContainer.addChild(card);

            let script = card.getComponent("PaiJiuCard");
            if (script) {
                script.init({ id: i });
            }

            card.angle = 90; // 横牌。如果你资源本身就是横的，这句删掉
            card.scale = 1;

            let dirX = -1; // 1=右，-1=左
            let dirY = 1; // 1=上，-1=下
             // 堆叠位置
            card.x = i * this.deckOffsetX * dirX;
            card.y = i * this.deckOffsetY * dirY;
            
            card.zIndex = i;

            this.cardList.push(card);
        }
    }

    clearTable () {
        if (this.deckContainer) {
            this.deckContainer.removeAllChildren();
        }

        if (this.dealContainer) {
            this.dealContainer.removeAllChildren();
        }

        this.cardList = [];
        this.playerCardMap = {};
    }

    public shuffleAnim(cb?: Function) {
        if (!this.cardList.length) {
            cb && cb();
            return;
        }

        const mid = Math.floor(this.cardList.length / 2);
        const leftGroup = this.cardList.slice(0, mid);
        const rightGroup = this.cardList.slice(mid);

        for (let i = 0; i < this.cardList.length; i++) {
            const card = this.cardList[i];
            const randX = (Math.random() - 0.5) * 80;
            const randY = (Math.random() - 0.5) * 40;
            const randA = (Math.random() - 0.5) * 20;

            cc.tween(card)
                .delay(i * 0.01)
                .to(0.12, {
                    x: card.x + randX,
                    y: card.y + randY,
                    angle: 90 + randA,
                })
                .start();
        }

        this.scheduleOnce(() => {
            for (let i = 0; i < leftGroup.length; i++) {
                const card = leftGroup[i];
                cc.tween(card)
                    .to(0.15, {
                        x: -90 + i * 2,
                        y: 20 - i * 2,
                        angle: 90 + (Math.random() - 0.5) * 10,
                    })
                    .start();
            }

            for (let i = 0; i < rightGroup.length; i++) {
                const card = rightGroup[i];
                cc.tween(card)
                    .to(0.15, {
                        x: 90 + i * 2,
                        y: -20 - i * 2,
                        angle: 90 + (Math.random() - 0.5) * 10,
                    })
                    .start();
            }
        }, 0.15);

        this.scheduleOnce(() => {
            const merged: cc.Node[] = [];
            let l = 0;
            let r = 0;

            while (l < leftGroup.length || r < rightGroup.length) {
                if (l < leftGroup.length) merged.push(leftGroup[l++]);
                if (r < rightGroup.length) merged.push(rightGroup[r++]);
            }

            this.cardList = merged;

            for (let i = 0; i < this.cardList.length; i++) {
                const card = this.cardList[i];
                card.zIndex = i;

                cc.tween(card)
                    .delay(i * 0.01)
                    .to(
                        0.18,
                        {
                            x: i * this.deckOffsetX,
                            y: -i * this.deckOffsetY,
                            angle: 90,
                        },
                        { easing: "sineOut" }
                    )
                    .start();
            }
        }, 0.38);

        this.scheduleOnce(() => {
            for (let i = 0; i < this.cardList.length; i++) {
                const card = this.cardList[i];
                cc.tween(card)
                    .to(0.06, { scale: 0.98 })
                    .to(0.08, { scale: 1.0 })
                    .start();
            }
        }, 0.65);

        this.scheduleOnce(() => {
            cb && cb();
        }, 0.82);
    }

    public dealCards(serverResult?: IServerDealResult, cb?: Function) {
        const dealOrder = this.buildDealOrder(serverResult);
        console.log("dealOrder", dealOrder);
        const total = dealOrder.length;

        if (total <= 0) {
            cb && cb();
            return;
        }

        for (let i = 0; i < total; i++) {
            this.scheduleOnce(() => {
                this.dealOneCard(dealOrder[i], i, total, cb);
            }, i * this.dealInterval);
        }
    }

    private buildDealOrder(serverResult?: IServerDealResult): IDealOrderItem[] {
        const result: IDealOrderItem[] = [];

        if (serverResult && serverResult.players) {
            const bankerSeat = serverResult.bankerSeat || 0;

            for (let round = 0; round < this.cardsPerPlayer; round++) {
                for (let i = 0; i < this.playerCount; i++) {
                    const seat = (bankerSeat + i) % this.playerCount;
                    const player = serverResult.players.find((p) => p.seat === seat);
                    const cardData = player && player.cards ? player.cards[round] : null;

                    result.push({
                        seat: seat,
                        cardData: cardData || null,
                    });
                }
            }
           
            return result;
        }

        for (let round = 0; round < this.cardsPerPlayer; round++) {
            for (let seat = 0; seat < this.playerCount; seat++) {
                result.push({
                    seat,
                    cardData: {
                        demo: true,
                        seat,
                        index: round,
                    },
                });
            }
        }
        console.log("buildDealOrder", result)
        return result;
    }

    private dealOneCard(
        dealInfo: IDealOrderItem,
        dealIndex: number,
        total: number,
        finalCb?: Function
    ) {
        if (!this.cardList.length) return;

        const card = this.cardList.pop();
        if (!card) return;

        card.removeFromParent(false);
        this.dealContainer.addChild(card);

        const seat = dealInfo.seat;
        const cardData = dealInfo.cardData;

        const cardComp = card.getComponent(PaiJiuCard);
        if (cardComp) {
            cardComp.init(cardData || undefined);
        }

        if (!this.playerCardMap[seat]) {
            this.playerCardMap[seat] = [];
        }

        const seatCards = this.playerCardMap[seat];
        const cardIndexInHand = seatCards.length;
        seatCards.push(card);

        const targetPosNode = this.playerPosList[seat];
        const worldPos = targetPosNode.parent.convertToWorldSpaceAR(targetPosNode.position);
        const localPos = this.dealContainer.convertToNodeSpaceAR(worldPos);

        const targetX = localPos.x + cardIndexInHand * this.dealGapX;
        const targetY = localPos.y + cardIndexInHand * this.dealGapY;

        card.zIndex = 100 + dealIndex;
        card.scale = 0.9;
        card.angle = 90;

        const startWorldPos = this.deckContainer.convertToWorldSpaceAR(
            cc.v2(
                this.deckOffsetX * this.cardList.length,
                -this.deckOffsetY * this.cardList.length
            )
        );
        const startLocalPos = this.dealContainer.convertToNodeSpaceAR(startWorldPos);
        card.setPosition(startLocalPos);

        cc.tween(card)
            .to(
                this.dealDuration,
                {
                    x: targetX,
                    y: targetY,
                    scale: 1.0,
                },
                { easing: "sineOut" }
            )
            .call(() => {
                if (dealIndex === total - 1) {
                    finalCb && finalCb();
                }
            })
            .start();
    }

    // 翻牌
    public flipSeatCards(seat: number, cb?: Function) {
        const cards = this.playerCardMap[seat] || [];
        if (!cards.length) {
            cb && cb();
            return;
        }

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardComp = card.getComponent(PaiJiuCard);

            this.scheduleOnce(() => {
                if (cardComp) {
                    cardComp.flipToFront(() => {
                        if (i === cards.length - 1) {
                            cb && cb();
                        }
                    });
                }
            }, i * 0.1);
        }
    }

    public sortSeatCards(seat: number) {
        const cards = this.playerCardMap[seat] || [];
        if (!cards.length) return;

        const targetPosNode = this.playerPosList[seat];
        const worldPos = targetPosNode.parent.convertToWorldSpaceAR(targetPosNode.position);
        const localPos = this.dealContainer.convertToNodeSpaceAR(worldPos);

        const totalWidth = (cards.length - 1) * this.dealGapX;
        const startX = localPos.x - totalWidth / 2;

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            card.zIndex = 200 + i;

            cc.tween(card)
                .to(0.12, {
                    x: startX + i * this.dealGapX,
                    y: localPos.y,
                })
                .start();
        }
    }

    public getSeatCards(seat: number): cc.Node[] {
        return this.playerCardMap[seat] || [];
    }


}
