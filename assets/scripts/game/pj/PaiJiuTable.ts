import PaiJiuCard, { IPaiJiuCardData } from "./card/PaiJiuCard";
import GameRes from "./GameRes";
import ClientRoomManager from "./room/ClientRoomManager";
import { RoomState } from "./room/RoomState";
import UIManager from "./ui/UIManager";
import PaiJiuUtil from "./util/PaiJiuUtil";

const { ccclass } = cc._decorator;

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

enum PaiJiuTableState {
    IDLE = "IDLE",
    SHUFFLING = "SHUFFLING",
    DEALING = "DEALING",
    SHOW_CARD = "SHOW_CARD",
}

@ccclass
export default class PaiJiuTable extends cc.Component {
    private deckContainer: cc.Node = null;
    private dealContainer: cc.Node = null;
    private cardPrefab: cc.Prefab = null;
    private playerPosRoot: cc.Node = null;
    private audioId: number | null= null;

    /** 牌图片缓存，key 例如 pai_1 */
    private cardImgMap: { [key: string]: cc.SpriteFrame } = {};

    private totalCardCount: number = 32;
    private cardsPerPlayer: number = 2;

    /** 牌堆堆叠偏移 */
    private deckOffsetX: number = 0.5;
    private deckOffsetY: number = 1;

    /** 玩家手牌间距 */
    private dealGapX: number = 75;
    private dealGapY: number = 0;

    /** 发牌动画时间和间隔 */
    private dealDuration: number = 0.28;
    private dealInterval: number = 0.18;

    /** 牌堆中的牌 */
    private cardList: cc.Node[] = [];

    /** seatId -> 玩家手牌节点 */
    private playerCardMap: { [seat: number]: cc.Node[] } = {};

    private isPlaying: boolean = false;
    private isBackground: boolean = false;
    private tableState: PaiJiuTableState = PaiJiuTableState.IDLE;

    /** 当前服务器发牌数据，用于后台恢复或补发牌 */
    private currentServerResult: IServerDealResult = null;

    /** 当前发牌顺序 */
    private currentDealOrder: IDealOrderItem[] = [];

    /** 发牌完成回调 */
    private dealFinishCb: Function = null;

    /** 防止发牌完成回调重复执行 */
    private dealFinishCalled: boolean = false;

    async onLoad() {
        this.cardList = [];
        this.playerCardMap = {};
        this.isPlaying = false;
        this.tableState = PaiJiuTableState.IDLE;

        this.deckContainer = this.node.getChildByName("DeckContainer");
        this.dealContainer = this.node.getChildByName("DealContainer");
        this.playerPosRoot = this.node.getChildByName("PlayerPosRoot");

        /** 监听网页切后台/回前台 */
        cc.game.on(cc.game.EVENT_HIDE, this.onGameHide, this);
        cc.game.on(cc.game.EVENT_SHOW, this.onGameShow, this);

        await this.loadCardImg();
        await this.loadCardPrefab();
    }

    onDestroy() {
        cc.game.off(cc.game.EVENT_HIDE, this.onGameHide, this);
        cc.game.off(cc.game.EVENT_SHOW, this.onGameShow, this);
    }

    /** 切后台 */
    private onGameHide() {
        cc.log("切后台");
        this.isBackground = true;
    }

    /** 回前台 */
    private onGameShow() {
        this.isBackground = false;
         cc.log("回前台，RoomState", ClientRoomManager.instance.getRoomState(), "tableState" ,this.tableState);

          if(ClientRoomManager.instance.getRoomState() === RoomState.WAIT || ClientRoomManager.instance.getRoomState() === RoomState.READY || ClientRoomManager.instance.getRoomState() === RoomState.BET){
            UIManager.instance.clearCardContainer();
            UIManager.instance.clearBetContainer();
          }else if(ClientRoomManager.instance.getRoomState() === RoomState.DEAL){
                /**
             * 回前台时，浏览器后台可能导致 tween / scheduleOnce 延迟。
             * 所以这里不继续等动画，而是直接补到当前流程的最终状态。
             */
            if (this.tableState === PaiJiuTableState.SHUFFLING) {
                this.stopAllAnimAndSchedule();
                this.startDealAfterShuffle();
                return;
            }

            if (this.tableState === PaiJiuTableState.DEALING) {
                this.fastCompleteDeal(true);
                return;
            }

            if (this.tableState === PaiJiuTableState.SHOW_CARD) {
                this.fastShowAllCards();
                return;
            }
         }

         
       
    }

    /** 停止所有动画和当前组件上的定时器 */
    private stopAllAnimAndSchedule() {
        cc.Tween.stopAll();
        this.unscheduleAllCallbacks();
    }

        /** 加载牌预制体 */
    private async loadCardPrefab(): Promise<cc.Prefab> {

        if (this.cardPrefab) {
            return this.cardPrefab;
        }

        const bundle = await GameRes.instance.loadGameBundle();

        return new Promise((resolve, reject) => {

            bundle.load("prefabs/Card", cc.Prefab, (err, prefab: cc.Prefab) => {

                if (err) {
                    cc.error("Card预制体加载失败", err);
                    reject(err);
                    return;
                }

                this.cardPrefab = prefab;

                cc.log("牌预制体加载完成");

                resolve(prefab);

            });

        });
    }

    /** 加载所有牌图片 */
    private async loadCardImg(): Promise<{ [key: string]: cc.SpriteFrame }> {

        if (Object.keys(this.cardImgMap).length > 0) {
            return this.cardImgMap;
        }

        const bundle = await GameRes.instance.loadGameBundle();

        return new Promise((resolve, reject) => {

            bundle.loadDir("card", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {

                if (err) {
                    cc.error("牌图片加载失败", err);
                    reject(err);
                    return;
                }

                assets.forEach(sp => {
                    this.cardImgMap[sp.name] = sp;
                });

                cc.log("所有牌加载完成");

                resolve(this.cardImgMap);

            });

        });
    }

    /**
     * 开始发牌动画入口
     */
    public async playStartAnim(serverResult?: IServerDealResult) {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.currentServerResult = serverResult;
        this.dealFinishCalled = false;

        await this.createDeck();

        this.tableState = PaiJiuTableState.SHUFFLING;

        this.shuffleAnim(() => {
            if (this.tableState !== PaiJiuTableState.SHUFFLING) return;
            this.startDealAfterShuffle();
        });
    }

    /** 洗牌完成后开始发牌 */
    private startDealAfterShuffle() {
        this.dealCards(this.currentServerResult, () => {
            this.isPlaying = false;
            this.tableState = PaiJiuTableState.IDLE;
            cc.log("发牌完成");
            this.clearDeck();

            // 翻牌
            this.showCard();
        });
    }

    /** 创建牌堆 */
    private async createDeck() {
        if (!this.cardPrefab) {
            await this.loadCardPrefab();
        }

        this.clearCardContainer();

        for (let i = 0; i < this.totalCardCount; i++) {
            const card = cc.instantiate(this.cardPrefab);
            this.deckContainer.addChild(card);

            const script = card.getComponent(PaiJiuCard);
            if (script) {
                script.init({ id: i });
            }

            const dirX = -1;
            const dirY = 1;

            card.scale = 1;
            card.x = i * this.deckOffsetX * dirX;
            card.y = i * this.deckOffsetY * dirY;
            card.zIndex = i;

            this.cardList.push(card);
        }
    }

    /** 清理牌堆和牌区 */
    public clearCardContainer() {
        this.clearDeck();

        if (this.dealContainer) {
            this.dealContainer.removeAllChildren();
        }

        this.cardList = [];
        this.playerCardMap = {};
    }

    /** 清理牌堆 */
    private clearDeck() {
        if (this.deckContainer) {
            this.deckContainer.removeAllChildren();
        }
    }

    /** 播放洗牌音效 */
    private playShuffleAudio() {
        if (this.tableState !== PaiJiuTableState.SHUFFLING) return;

        cc.audioEngine.playEffect(GameRes.instance.shuffingAudio, false);
    }

    /** 洗牌动画 */
    private shuffleAnim(cb?: Function) {
        if (!this.cardList.length) {
            cb && cb();
            return;
        }

        const mid = Math.floor(this.cardList.length / 2);
        const leftGroup = this.cardList.slice(0, mid);
        const rightGroup = this.cardList.slice(mid);

        // 开始乱牌音效
        this.playShuffleAudio();

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

        // 分成两堆
        this.scheduleOnce(() => {
            if (this.tableState !== PaiJiuTableState.SHUFFLING) return;

            this.playShuffleAudio();

            leftGroup.forEach((card, i) => {
                cc.tween(card)
                    .to(0.15, {
                        x: -90 + i * 2,
                        y: 20 - i * 2,
                        angle: (Math.random() - 0.5) * 10,
                    })
                    .start();
            });

            rightGroup.forEach((card, i) => {
                cc.tween(card)
                    .to(0.15, {
                        x: 90 + i * 2,
                        y: -20 - i * 2,
                        angle: (Math.random() - 0.5) * 10,
                    })
                    .start();
            });
        }, 0.15);

        // 合牌
        this.scheduleOnce(() => {
            if (this.tableState !== PaiJiuTableState.SHUFFLING) return;

            this.playShuffleAudio();

            const merged: cc.Node[] = [];
            let l = 0;
            let r = 0;

            while (l < leftGroup.length || r < rightGroup.length) {
                if (l < leftGroup.length) merged.push(leftGroup[l++]);
                if (r < rightGroup.length) merged.push(rightGroup[r++]);
            }

            this.cardList = merged;

            this.cardList.forEach((card, i) => {
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
            });
        }, 0.38);

        // 压牌 / 整理牌堆
        this.scheduleOnce(() => {
            if (this.tableState !== PaiJiuTableState.SHUFFLING) return;

            this.playShuffleAudio();

            this.cardList.forEach(card => {
                cc.tween(card)
                    .to(0.06, { scale: 0.98 })
                    .to(0.08, { scale: 1.0 })
                    .start();
            });
        }, 0.65);

        this.scheduleOnce(() => {
            if (this.tableState !== PaiJiuTableState.SHUFFLING) return;
            cb && cb();
        }, 0.82);
    }

    /** 发所有牌 */
    private dealCards(serverResult?: IServerDealResult, cb?: Function) {
        const dealOrder = this.buildDealOrder(serverResult);
        const total = dealOrder.length;

        this.currentServerResult = serverResult;
        this.currentDealOrder = dealOrder;
        this.dealFinishCb = cb;
        this.dealFinishCalled = false;
        this.tableState = PaiJiuTableState.DEALING;

        if (total <= 0) {
            this.callDealFinish();
            return;
        }

        /**
         * 正常情况下逐张发牌。
         * 注意：这里只负责播放动画，不再依赖最后一张牌 tween.call 推进流程。
         */
        for (let i = 0; i < total; i++) {
            this.scheduleOnce(() => {
                if (this.tableState !== PaiJiuTableState.DEALING) return;
                if (this.isBackground) return;

                this.dealOneCard(dealOrder[i], i);
            }, i * this.dealInterval);
        }

        /**
         * 发牌流程完成时间。
         * 到时间后直接补齐所有牌，避免后台导致部分 schedule/tween 没执行。
         */
        this.scheduleOnce(() => {
            if (this.tableState !== PaiJiuTableState.DEALING) return;
            this.fastCompleteDeal(true);
        }, total * this.dealInterval + this.dealDuration + 0.05);
    }

    /** 发牌完成回调，只允许执行一次 */
    private callDealFinish() {
        if (this.dealFinishCalled) return;

        this.dealFinishCalled = true;

        const cb = this.dealFinishCb;
        this.dealFinishCb = null;

        cb && cb();
    }

    /** 根据服务器数据构建发牌顺序 */
    private buildDealOrder(serverResult?: IServerDealResult): IDealOrderItem[] {
        const result: IDealOrderItem[] = [];

        if (!serverResult || !serverResult.players || serverResult.players.length === 0) {
            return result;
        }

        const bankerSeat = serverResult.bankerSeat ?? serverResult.players[0].seatId;

        const players = serverResult.players.filter(p => {
            return p.seatId >= 0 && p.cards && p.cards.length > 0;
        });

        if (players.length === 0) {
            return result;
        }

        const orderedPlayers = this.sortPlayersFromBanker(players, bankerSeat, 8);

        for (let round = 0; round < this.cardsPerPlayer; round++) {
            for (const player of orderedPlayers) {
                result.push({
                    seat: player.seatId,
                    cardData: player.cards[round] || null,
                });
            }
        }

        return result;
    }

    /** 从庄家座位开始排序 */
    private sortPlayersFromBanker(
        players: IPlayerDealData[],
        bankerSeat: number,
        seatCount: number
    ): IPlayerDealData[] {
        const result: IPlayerDealData[] = [];

        for (let i = 0; i < seatCount; i++) {
            const seatId = (bankerSeat + i) % seatCount;
            const player = players.find(p => p.seatId === seatId);

            if (player) {
                result.push(player);
            }
        }

        return result;
    }

    /** 发一张牌 */
    private dealOneCard(dealInfo: IDealOrderItem, dealIndex: number) {
        if (!this.cardList.length) return;

        const card = this.cardList.pop();
        if (!card) return;

        card.removeFromParent(false);
        this.dealContainer.addChild(card);

        const seat = dealInfo.seat;
        const cardData = dealInfo.cardData;

        this.initCardData(card, cardData);

        if (!this.playerCardMap[seat]) {
            this.playerCardMap[seat] = [];
        }

        const seatCards = this.playerCardMap[seat];
        const cardIndexInHand = seatCards.length;
        seatCards.push(card);

        const targetPos = this.getCardTargetPos(seat, cardIndexInHand);

        card.zIndex = 100 + dealIndex;
        card.scale = 0.9;

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
                    x: targetPos.x,
                    y: targetPos.y,
                    scale: 1.0,
                },
                { easing: "sineOut" }
            ).call(() =>{
                cc.audioEngine.playEffect(GameRes.instance.dealCardAudio, false);
            })
            .start();
    }

    /**
     * 快速补完发牌。
     * 用于：
     * 1. 后台回来时补状态
     * 2. showCard 被提前调用时，先把牌补齐
     */
    private fastCompleteDeal(needCallback: boolean = false) {
        if (!this.currentDealOrder || !this.currentDealOrder.length) {
            if (needCallback) this.callDealFinish();
            return;
        }

        this.stopAllAnimAndSchedule();
        this.clearDeck();

        if (this.dealContainer) {
            this.dealContainer.removeAllChildren();
        }

        this.cardList = [];
        this.playerCardMap = {};

        for (let i = 0; i < this.currentDealOrder.length; i++) {
            const dealInfo = this.currentDealOrder[i];
            const seat = dealInfo.seat;
            const cardData = dealInfo.cardData;

            const card = cc.instantiate(this.cardPrefab);
            this.dealContainer.addChild(card);

            this.initCardData(card, cardData);

            if (!this.playerCardMap[seat]) {
                this.playerCardMap[seat] = [];
            }

            const seatCards = this.playerCardMap[seat];
            const cardIndexInHand = seatCards.length;
            seatCards.push(card);

            const targetPos = this.getCardTargetPos(seat, cardIndexInHand);

            card.x = targetPos.x;
            card.y = targetPos.y;
            card.scale = 1;
            card.angle = 0;
            card.zIndex = 100 + i;
        }

        this.tableState = PaiJiuTableState.IDLE;
        this.isPlaying = false;

        if (needCallback) {
            this.callDealFinish();
        }
    }

    /** 初始化牌数据和正面图片 */
    private initCardData(card: cc.Node, cardData?: IPaiJiuCardData | null) {
        const cardComp = card.getComponent(PaiJiuCard);
        if (cardComp) {
            cardComp.init(cardData || undefined);
        }

        if (cardData && cardData.id !== undefined) {
            const key = `pai_${cardData.id}`;
            const spriteFrame = this.cardImgMap[key];

            if (!spriteFrame) {
                console.error("找不到牌:", key);
                return;
            }

            const frontNode = card.getChildByName("Front");
            if (frontNode) {
                const sprite = frontNode.getComponent(cc.Sprite);
                if (sprite) {
                    sprite.spriteFrame = spriteFrame;
                }
            }
        }
    }

    /** 获取某个座位第几张牌的目标位置 */
    private getCardTargetPos(seat: number, cardIndexInHand: number): cc.Vec2 {
        const targetPosNode = this.playerPosRoot.getChildByName(`Player${seat}Pos`);

        if (!targetPosNode) {
            console.error(`找不到座位节点 Player${seat}Pos`);
            return cc.v2(0, 0);
        }

        const worldPos = targetPosNode.parent.convertToWorldSpaceAR(targetPosNode.position);
        const localPos = this.dealContainer.convertToNodeSpaceAR(worldPos);

        return cc.v2(
            localPos.x + cardIndexInHand * this.dealGapX,
            localPos.y + cardIndexInHand * this.dealGapY
        );
    }

    /**
     * 判断当前牌是否已经发完整。
     * 防止发牌中直接翻牌。
     */
    private hasAllDealedCards(): boolean {
        if (!this.currentDealOrder || this.currentDealOrder.length <= 0) {
            return false;
        }

        let count = 0;

        for (const seat in this.playerCardMap) {
            count += this.playerCardMap[seat].length;
        }

        return count >= this.currentDealOrder.length;
    }

    /** 翻某个座位的牌 */
    public flipSeatCards(seat: number, cb?: Function) {
        const cards = this.playerCardMap[seat] || [];

        if (!cards.length) {
            cb && cb();
            return;
        }

        let finishCount = 0;

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];

            this.scheduleOnce(() => {
                if (this.tableState !== PaiJiuTableState.SHOW_CARD) return;
                if (this.isBackground) return;

                const cardComp = card.getComponent(PaiJiuCard);

                if (cardComp) {
                    cardComp.flipToFront(() => {
                        finishCount++;

                        if (finishCount >= cards.length) {
                            cb && cb();
                        }
                    });
                } else {
                    finishCount++;

                    if (finishCount >= cards.length) {
                        cb && cb();
                    }
                }
            }, i * 0.1);
        }
    }

    /** 整理某个座位的牌 */
    public sortSeatCards(seat: number) {
        const cards = this.playerCardMap[seat] || [];
        if (!cards.length) return;

        const targetPosNode = this.playerPosRoot.getChildByName(`Player${seat}Pos`);

        if (!targetPosNode) {
            console.error(`找不到座位节点 Player${seat}Pos`);
            return;
        }

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

    /**
     * 展示牌。
     * 关键修复：
     * 如果发牌还没完成，不能直接改成 SHOW_CARD。
     * 必须先 fastCompleteDeal() 补齐牌，再翻牌。
     */
    public async showCard() {
        cc.log("准备翻牌 isBackground:", this.isBackground, "tableState:", this.tableState);

        
        if (
            this.tableState === PaiJiuTableState.SHUFFLING ||
            this.tableState === PaiJiuTableState.DEALING
        ) {
            this.fastCompleteDeal(false);
        }

        if (!this.hasAllDealedCards()) {
            console.warn("牌还没发完整，禁止翻牌");
            return;
        }

        this.tableState = PaiJiuTableState.SHOW_CARD;

       

        if (this.isBackground || this.tableState !== PaiJiuTableState.SHOW_CARD) {
            return;
        }

        const players = ClientRoomManager.instance.getPlayers();

        players.forEach(player => {
            this.flipSeatCards(player.seatId, () => {
                this.sortSeatCards(player.seatId);
            });
        });

        await PaiJiuUtil.wait(this, 0.5);

        if (this.tableState === PaiJiuTableState.SHOW_CARD) {
            this.fastShowAllCards();
        }
    }

    /**
     * 快速展示所有牌。
     * 用于后台回来，或者翻牌等待超时后直接补到最终状态。
     */
    private fastShowAllCards() {
        this.stopAllAnimAndSchedule();

        const players = ClientRoomManager.instance.getPlayers();

        players.forEach(player => {
            const cards = this.playerCardMap[player.seatId] || [];

            cards.forEach(card => {
                this.forceCardFront(card);
            });

            this.sortSeatCards(player.seatId);
        });

        this.tableState = PaiJiuTableState.IDLE;
    }

    /** 强制显示牌正面，不走翻牌动画 */
    private forceCardFront(card: cc.Node) {
        const cardComp: any = card.getComponent(PaiJiuCard);

        if (cardComp && cardComp.showFront) {
            cardComp.showFront();
            return;
        }

        const front = card.getChildByName("Front");
        const back = card.getChildByName("Back");

        if (front) {
            front.active = true;
            front.scaleX = 1;
        }

        if (back) {
            back.active = false;
        }

        card.scaleX = Math.abs(card.scaleX);
        card.angle = 0;
    }
}