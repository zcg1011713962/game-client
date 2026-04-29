
import PaiJiuCard, { IPaiJiuCardData } from "./card/PaiJiuCard";
import ClientRoomManager from "./room/ClientRoomManager";
import PaiJiuUtil from "./util/PaiJiuUtil";
const {ccclass, property} = cc._decorator;
interface IPlayerDealData {
    seatId: number;
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
    private playerPosRoot: cc.Node = null;

    private cardImgMap : { [key: string]: cc.SpriteFrame }= {}; // 预加载图片资源

    private totalCardCount: number = 32;  // 牌九通常 32 张
    private cardsPerPlayer: number = 2;  // 每人发几张
    private playerPosList: cc.Node[] = []; // 牌定位坐标
    private deckOffsetX: number = 0.5; // 牌堆每张牌X间距
    private deckOffsetY: number = 1;  // 牌堆每张牌Y间距
    private dealGapX: number = 75; // 同一玩家手牌x间距
    private dealGapY: number = 0; // 同一玩家手牌y间距
    private dealDuration: number = 0.18; // 发牌持续时间
    private dealInterval: number = 0.12; // 延时发一张牌
    

    private cardList: cc.Node[] = [];
    private playerCardMap: { [seat: number]: cc.Node[] } = {};
    private isPlaying: boolean = false;
    async onLoad () {
        this.cardList = [];
        this.playerCardMap = {};
        this.isPlaying = false;
        // 加载牌图片
        await this.loadCardImg()
        // 加载座位预制体
        await this.loadCardPrefab();
        this.deckContainer = this.node.getChildByName("DeckContainer");
        this.dealContainer = this.node.getChildByName("DealContainer");
        this.playerPosRoot = this.node.getChildByName("PlayerPosRoot");
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


    loadCardImg() {
        return new Promise((resolve, reject) => {
            cc.resources.loadDir("card", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                assets.forEach(sp => {
                    this.cardImgMap[sp.name] = sp;
                });
                resolve(this.cardImgMap);
                console.log("所有牌加载完成");
            });
        });
    }

    public async playStartAnim(serverResult?: IServerDealResult) {
        if (this.isPlaying) return;

        this.isPlaying = true;
        // 创建发牌堆
        await this.createDeck();

        // 洗牌
        this.shuffleAnim(() => {
            // 发牌
            this.dealCards(serverResult, () => {
                this.isPlaying = false;
                cc.log("发牌完成");
                this.clearDeck();
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
            // 修改卡片预制体属性
            //card.angle = 90; // 横牌。如果你资源本身就是横的，这句删掉
            card.scale = 1; // 恢复等比例缩放
            let dirX = -1; // 1=右，-1=左
            let dirY = 1; // 1=上，-1=下
             // 堆叠位置
            card.x = i * this.deckOffsetX * dirX;
            card.y = i * this.deckOffsetY * dirY;
            card.zIndex = i;

            //console.log("牌堆 angle:", card.angle);
            //console.log("牌堆 parent angle:", card.parent.angle);

            this.cardList.push(card);
        }
    }

    clearTable () {
        this.clearDeck();

        if (this.dealContainer) {
            this.dealContainer.removeAllChildren();
        }

        this.cardList = [];
        this.playerCardMap = {};
    }

    clearDeck(){
        if (this.deckContainer) {
            this.deckContainer.removeAllChildren();
        }
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
                    angle: randA,
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
                        angle: (Math.random() - 0.5) * 10,
                    })
                    .start();
            }

            for (let i = 0; i < rightGroup.length; i++) {
                const card = rightGroup[i];
                cc.tween(card)
                    .to(0.15, {
                        x: 90 + i * 2,
                        y: -20 - i * 2,
                        angle: (Math.random() - 0.5) * 10,
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
                            angle: 0,
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

    /**
     *  发所有牌 
     */
    public dealCards(serverResult?: IServerDealResult, cb?: Function) {
        const dealOrder = this.buildDealOrder(serverResult);
        console.log("发牌排序", dealOrder);
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

    // private buildDealOrder(serverResult?: IServerDealResult): IDealOrderItem[] {
    //     const result: IDealOrderItem[] = [];
    //     let playerCount = 0;
       
    //     if (serverResult && serverResult.players) {
    //         const bankerSeat = serverResult.bankerSeat || 0;
    //         playerCount = serverResult.players.length;

    //         for (let round = 0; round < this.cardsPerPlayer; round++) {
    //             for (let i = 0; i < playerCount; i++) {
    //                 const seatId = (bankerSeat + i) % playerCount;
    //                 const player = serverResult.players.find((p) => p.seatId === seatId);
    //                 const cardData = player && player.cards ? player.cards[round] : null;

    //                 result.push({
    //                     seat: seat,
    //                     cardData: cardData || null,
    //                 });
    //             }
    //         }
           
    //         return result;
    //     }
    //     return result;
    // }
    private buildDealOrder(serverResult?: IServerDealResult): IDealOrderItem[] {
        const result: IDealOrderItem[] = [];

        if (!serverResult || !serverResult.players || serverResult.players.length === 0) {
            return result;
        }

        const bankerSeat = serverResult.bankerSeat ?? serverResult.players[0].seatId;

        // 已坐下玩家
        const players = serverResult.players
            .filter(p => p.seatId >= 0 && p.cards && p.cards.length > 0);

        if (players.length === 0) {
            return result;
        }

        // 按 8 个桌位，从庄家开始顺时针找已坐下玩家
        const orderedPlayers = this.sortPlayersFromBanker(players, bankerSeat, 8);

        for (let round = 0; round < this.cardsPerPlayer; round++) {
            for (const player of orderedPlayers) {
                console.log(player.cards[round])
                result.push({
                    seat: player.seatId,
                    cardData: player.cards[round] || null,
                });
            }
        }

        return result;
    }

    private sortPlayersFromBanker(players: any[], bankerSeat: number, seatCount: number): any[] {
        const result: any[] = [];

        for (let i = 0; i < seatCount; i++) {
            const seatId = (bankerSeat + i) % seatCount;
            const player = players.find(p => p.seatId === seatId);

            if (player) {
                result.push(player);
            }
        }

        return result;
    }

    /**
     * 发一张牌 
     */
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
        // 获取每个卡片预制体
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


        const targetPosNode = this.playerPosRoot.getChildByName(`Player${seat}Pos`);
        const worldPos = targetPosNode.parent.convertToWorldSpaceAR(targetPosNode.position);
        const localPos = this.dealContainer.convertToNodeSpaceAR(worldPos);

        const targetX = localPos.x + cardIndexInHand * this.dealGapX;
        const targetY = localPos.y + cardIndexInHand * this.dealGapY;

        card.zIndex = 100 + dealIndex; // 发的牌在最上层
        card.scale = 0.9; // 发牌时让牌小一点
        //card.angle = 90;
        //console.log("发牌 angle:", card.angle);
        //console.log("发牌 parent angle:", card.parent.angle);

        const startWorldPos = this.deckContainer.convertToWorldSpaceAR(
            cc.v2(
                this.deckOffsetX * this.cardList.length,
                -this.deckOffsetY * this.cardList.length
            )
        );
        const startLocalPos = this.dealContainer.convertToNodeSpaceAR(startWorldPos);
        card.setPosition(startLocalPos);

        if (cardData && cardData.id !== undefined) {
            const key = `pai_${cardData.id}`;
            const spriteFrame = this.cardImgMap[key];

            if (!spriteFrame) {
                console.error("找不到牌:", key);
                return;
            }

            const frontNode = card.getChildByName("Front");
            const sprite = frontNode.getComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
        }
       

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

   
        const targetPosNode = this.playerPosRoot.getChildByName(`Player${seat}Pos`);
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


    public async showCard() {
        console.log("翻牌");
        await PaiJiuUtil.wait(this, 3);
        const players = ClientRoomManager.instance.getPlayers();
        ClientRoomManager.instance.getMySeatId();
        players.forEach(player =>{
            this.flipSeatCards(player.seatId, () => {
                this.sortSeatCards(player.seatId);
            });
        })
        await PaiJiuUtil.wait(this, 0.5);
    }


}
