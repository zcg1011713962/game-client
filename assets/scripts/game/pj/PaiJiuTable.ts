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

    serverTime: number;
    dealStartTime: number;
    showCardTime: number;
    settleTime: number;
    nextRoundTime: number;
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

    private deckContainer!: cc.Node;
    private dealContainer!: cc.Node;
    private cardPrefab!: cc.Prefab;
    private playerPosRoot!: cc.Node;

    private totalCardCount: number = 32;
    private cardsPerPlayer: number = 2;

    private deckOffsetX: number = 0.5;
    private deckOffsetY: number = 1;

    private dealGapX: number = 75;
    private dealGapY: number = 0;

    private dealDuration: number = 0.28;
    private dealInterval: number = 0.18;

    private cardList: cc.Node[] = [];
    private playerCardMap: { [seat: number]: cc.Node[] } = {};

    private isPlaying: boolean = false;
    private isBackground: boolean = false;
    private tableState: PaiJiuTableState = PaiJiuTableState.IDLE;

    private currentServerResult!: IServerDealResult;
    private currentDealOrder: IDealOrderItem[] = [];

    private dealFinishCb: Function = null;
    private dealFinishCalled: boolean = false;

    /** 服务器时间偏移 */
    private serverOffset: number = 0;

    /** 翻牌时间 */
    private currentShowCardTime: number = 0;


    private currentSettleTime: number = 0;
    private currentNextRoundTime: number = 0;

    async onLoad() {
        this.cardList = [];
        this.playerCardMap = {};
        this.isPlaying = false;
        this.tableState = PaiJiuTableState.IDLE;

        this.deckContainer = this.node.getChildByName("DeckContainer");
        this.dealContainer = this.node.getChildByName("DealContainer");
        this.playerPosRoot = this.node.getChildByName("PlayerPosRoot");

        cc.game.on(cc.game.EVENT_HIDE, this.onGameHide, this);
        cc.game.on(cc.game.EVENT_SHOW, this.onGameShow, this);
    }

    onDestroy() {
        cc.game.off(cc.game.EVENT_HIDE, this.onGameHide, this);
        cc.game.off(cc.game.EVENT_SHOW, this.onGameShow, this);
    }

    private getServerNow(): number {
        return Date.now() + this.serverOffset;
    }

    private onGameHide() {
        //cc.log("切后台");
        this.isBackground = true;
    }

    private onGameShow() {
        this.isBackground = false;

        //console.log( "回前台","RoomState:", ClientRoomManager.instance.getRoomState(), "tableState:", this.tableState);

        const roomState = ClientRoomManager.instance.getRoomState();

        if (
            roomState === RoomState.WAIT ||
            roomState === RoomState.READY ||
            roomState === RoomState.BET
        ) {
            UIManager.instance.clearCardContainer();
            UIManager.instance.clearBetContainer();
            return;
        }

        if (roomState !== RoomState.DEAL) {
            return;
        }

        const nowServer = this.getServerNow();

        if (this.currentShowCardTime > 0 && nowServer >= this.currentShowCardTime) {
            this.stopAllAnimAndSchedule();
            this.currentDealOrder = this.buildDealOrder(this.currentServerResult);
            this.fastCompleteDeal(false);
            this.fastShowAllCards();
            return;
        }

        if (this.tableState === PaiJiuTableState.SHUFFLING) {
            this.stopAllAnimAndSchedule();
            this.startDealAfterShuffleByServerTime();
            return;
        }

        if (this.tableState === PaiJiuTableState.DEALING) {
            this.fastCompleteDeal(true);
            return;
        }

        if (this.tableState === PaiJiuTableState.SHOW_CARD) {
            this.fastShowAllCards();
        }
    }

    private stopAllAnimAndSchedule() {
        cc.Tween.stopAll();
        this.unscheduleAllCallbacks();
    }

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

    /**
     * 发牌入口：使用服务器时间控制
     */
    public async playStartAnim(serverResult: IServerDealResult) {
        if (this.isPlaying) {
            return;
        }
        

        this.isPlaying = true;
        this.currentServerResult = serverResult;
        this.currentDealOrder = this.buildDealOrder(serverResult);
        this.dealFinishCalled = false;

        if (serverResult.serverTime) {
            this.serverOffset = serverResult.serverTime - Date.now();
        }

        const nowServer = this.getServerNow();

        const dealStartTime = serverResult.dealStartTime || nowServer;
        const showCardTime = serverResult.showCardTime || nowServer + 5000;

        // 结算时间
        const settleTime = serverResult.settleTime || nowServer + 9000;
        this.currentNextRoundTime = serverResult.nextRoundTime;
        this.currentShowCardTime = showCardTime;
        this.currentSettleTime = settleTime;

        await this.createDeck();

        /**
         * 已经到翻牌时间，直接显示最终状态
         */
        if (nowServer >= showCardTime) {
            this.fastCompleteDeal(false);
            this.fastShowAllCards();
            return;
        }

        /**
         * 已经过了发牌开始时间，直接补完发牌，然后等翻牌时间
         */
        if (nowServer > dealStartTime) {
            this.fastCompleteDeal(false);
            this.waitShowCardByServerTime();
            return;
        }

        /**
         * 还没到发牌时间，等待发牌开始
         */
        const waitDealSeconds = Math.max(
            0,
            (dealStartTime - nowServer) / 1000
        );

        this.scheduleOnce(() => {
            this.startShuffleByServerTime();
        }, waitDealSeconds);
    }

    private startShuffleByServerTime() {
        if (!this.currentServerResult) {
            return;
        }

        if (this.getServerNow() >= this.currentShowCardTime) {
            this.fastCompleteDeal(false);
            this.fastShowAllCards();
            return;
        }

        this.tableState = PaiJiuTableState.SHUFFLING;

        this.shuffleAnim(() => {
            if (this.tableState !== PaiJiuTableState.SHUFFLING) {
                return;
            }

            this.startDealAfterShuffleByServerTime();
        });
    }

    private startDealAfterShuffleByServerTime() {
        if (this.getServerNow() >= this.currentShowCardTime) {
            this.fastCompleteDeal(false);
            this.fastShowAllCards();
            return;
        }

        this.dealCards(this.currentServerResult, () => {
            this.isPlaying = false;
            this.tableState = PaiJiuTableState.IDLE;

            //cc.log("发牌完成");
            this.clearDeck();

            this.waitShowCardByServerTime();
        });
    }

    private waitShowCardByServerTime() {
        const waitShowSeconds = Math.max(
            0,
            (this.currentShowCardTime - this.getServerNow()) / 1000
        );

        this.scheduleOnce(() => {
            this.showCard();
        }, waitShowSeconds);
    }

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
                script.init({ id: i } as any);
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

    public clearCardContainer() {
        this.clearDeck();

        if (this.dealContainer) {
            this.dealContainer.removeAllChildren();
        }

        this.cardList = [];
        this.playerCardMap = {};
    }

    private clearDeck() {
        if (this.deckContainer) {
            this.deckContainer.removeAllChildren();
        }
    }

    private async playShuffleAudio() {
        if (this.tableState !== PaiJiuTableState.SHUFFLING) {
            return;
        }

        const shuffingAudio = await GameRes.instance.getShufflingAudio();
        cc.audioEngine.playEffect(shuffingAudio, false);
    }

    private shuffleAnim(cb?: Function) {
        if (!this.cardList.length) {
            cb && cb();
            return;
        }

        const mid = Math.floor(this.cardList.length / 2);
        const leftGroup = this.cardList.slice(0, mid);
        const rightGroup = this.cardList.slice(mid);

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
                    .to(0.18, {
                        x: i * this.deckOffsetX,
                        y: -i * this.deckOffsetY,
                        angle: 0,
                    }, { easing: "sineOut" })
                    .start();
            });
        }, 0.38);

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

        for (let i = 0; i < total; i++) {
            this.scheduleOnce(() => {
                if (this.tableState !== PaiJiuTableState.DEALING) return;
                if (this.isBackground) return;

                if (this.getServerNow() >= this.currentShowCardTime) {
                    this.fastCompleteDeal(true);
                    return;
                }

                this.dealOneCard(dealOrder[i], i);
            }, i * this.dealInterval);
        }

        this.scheduleOnce(() => {
            if (this.tableState !== PaiJiuTableState.DEALING) return;
            this.fastCompleteDeal(true);
        }, total * this.dealInterval + this.dealDuration + 0.05);
    }

    private callDealFinish() {
        if (this.dealFinishCalled) return;

        this.dealFinishCalled = true;

        const cb = this.dealFinishCb;
        this.dealFinishCb = null;

        cb && cb();
    }

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
            .to(this.dealDuration, {
                x: targetPos.x,
                y: targetPos.y,
                scale: 1.0,
            }, { easing: "sineOut" })
            .call(async () => {
                const dealCardAudio = await GameRes.instance.getDealCardAudio();
                cc.audioEngine.playEffect(dealCardAudio, false);
            })
            .start();
    }

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

    private initCardData(card: cc.Node, cardData?: IPaiJiuCardData | null) {
        const cardComp = card.getComponent(PaiJiuCard);
        if (cardComp) {
            cardComp.init(cardData || undefined);
        }

        if (cardData && cardData.id !== undefined) {
            const key = `pai_${cardData.id}`;
            const spriteFrame = GameRes.instance.cardImgMap[key];

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

    public sortSeatCards(seat: number) {
        const cards = this.playerCardMap[seat] || [];
        if (!cards.length) return;

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const targetPos = this.getCardTargetPos(seat, i);

            card.zIndex = 200 + i;

            cc.Tween.stopAllByTarget(card);

            card.scaleX = Math.abs(card.scaleX || 1);
            card.scaleY = Math.abs(card.scaleY || 1);

            cc.tween(card)
                .to(0.12, {
                    x: targetPos.x,
                    y: targetPos.y,
                    scaleX: 1,
                    scaleY: 1,
                    angle: 0,
                })
                .start();
        }
    }

    public getSeatCards(seat: number): cc.Node[] {
        return this.playerCardMap[seat] || [];
    }

    public async showCard() {
        if (this.currentSettleTime > 0 && this.getServerNow() >= this.currentSettleTime) {
            this.fastCompleteDeal(false);
            this.fastShowAllCards();
            return;
        }

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

        // 等待翻牌
        const waitSeconds = this.currentSettleTime > 0 ? Math.max(0, (this.currentSettleTime - this.getServerNow()) / 1000): 0.5;
        await PaiJiuUtil.wait(this, Math.min(waitSeconds, 0.8));

        if (this.tableState === PaiJiuTableState.SHOW_CARD) {
            this.fastShowAllCards();
        }
    }

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
        this.isPlaying = false;
    }

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