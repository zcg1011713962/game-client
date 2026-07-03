import PaiJiuCard, { IPaiJiuCardData } from "./card/PaiJiuCard";
import GameRes from "./GameRes";
import ClientRoomManager from "./room/ClientRoomManager";
import { RoomState } from "./room/RoomState";
import { Cmd } from "./enum/Cmd";
import GameUIManager from "./ui/GameUIManager";
import PaiJiuUtil from "./util/PaiJiuUtil";
import WsClient from "./net/WsClient";

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

interface IRubPeelContext {
    faceMask: cc.Node;
    faceNode: cc.Node;
    backMask: cc.Node;
    backNode: cc.Node;
    shadowNode: cc.Node;
    glowNode: cc.Node;
    hintNode: cc.Node;
    particleRoot: cc.Node;
    width: number;
    height: number;
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
    private reportedOpenSeats: { [seat: number]: boolean } = {};
    private openedSeats: { [seat: number]: boolean } = {};

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


    
    // 开牌
    public onClickOpenCard() {
        const mySeatId = ClientRoomManager.instance.getMySeatId();
        this.flipSeatCards(mySeatId, () => {
            this.sortSeatCards(mySeatId);
            this.sendOpenCard(1);
        });
    }
    // 搓牌
    public onClickRubCard() {
        const mySeatId = ClientRoomManager.instance.getMySeatId();
        this.playReferenceRubOpenEffect(mySeatId, () => {
            cc.log("搓牌开牌完成");
            this.sendOpenCard(2);
        });
    }

    private sendOpenCard(openType: number) {
        const mySeatId = ClientRoomManager.instance.getMySeatId();
        if (mySeatId < 0 || this.reportedOpenSeats[mySeatId]) {
            return;
        }

        this.reportedOpenSeats[mySeatId] = true;
        this.openedSeats[mySeatId] = true;
        WsClient.instance.send(Cmd.OPEN_CARD, {
            roomId: ClientRoomManager.instance.getRoomId(),
            openType: openType
        });
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
            GameUIManager.instance.clearCardContainer();
            GameUIManager.instance.clearBetContainer();
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
        this.reportedOpenSeats = {};
        this.openedSeats = {};
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
            this.tableState = PaiJiuTableState.SHOW_CARD;
            GameUIManager.instance.setLookCardPanelVisible(true);
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

            GameUIManager.instance.setLookCardPanelVisible(true);

            // 发牌完成进入亮牌状态
            this.tableState = PaiJiuTableState.SHOW_CARD;
            const waitShowSeconds = Math.max(
                0,
                (this.currentShowCardTime - this.getServerNow()) / 1000
            );
            this.scheduleOnce(() => {
                GameUIManager.instance.setLookCardPanelVisible(false);
            }, waitShowSeconds);

            return;
        });
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
        this.reportedOpenSeats = {};
        this.openedSeats = {};
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

    public openSeatCardsByServer(seat: number) {
        if (this.openedSeats[seat]) {
            return;
        }

        if (
            this.tableState === PaiJiuTableState.SHUFFLING ||
            this.tableState === PaiJiuTableState.DEALING
        ) {
            this.fastCompleteDeal(false);
        }

        if (!this.hasAllDealedCards()) {
            return;
        }

        this.openedSeats[seat] = true;
        this.tableState = PaiJiuTableState.SHOW_CARD;
        this.flipSeatCards(seat, () => {
            this.sortSeatCards(seat);
        });
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



    
    private playReferenceRubOpenEffect(seat: number, cb?: Function) {
        const cards = this.playerCardMap[seat] || [];

        if (cards.length < 2) {
            cb && cb();
            return;
        }

        this.moveReferenceRubCardsToCenter(cards, () => {
            this.playReferenceRubCards(cards, () => {
                this.returnReferenceRubCardsToSeat(seat, cards, cb);
            });
        });
    }

    private moveReferenceRubCardsToCenter(cards: cc.Node[], cb?: Function) {
        const centerY = -155;
        const gap = 130;
        let finish = 0;

        cards.forEach((card, index) => {
            cc.Tween.stopAllByTarget(card);
            this.clearReferenceRubNodes(card, false);

            const comp = card.getComponent(PaiJiuCard);
            if (comp) {
                comp.showBack();
            }

            card.zIndex = 1000 + index;
            card.opacity = 255;

            cc.tween(card)
                .to(0.28, {
                    x: index === 0 ? -gap / 2 : gap / 2,
                    y: centerY,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    angle: index === 0 ? -2 : 2
                }, { easing: "backOut" })
                .call(() => {
                    finish++;

                    if (finish >= cards.length) {
                        cb && cb();
                    }
                })
                .start();
        });
    }

    private playReferenceRubCards(cards: cc.Node[], cb?: Function) {
        const firstCard = cards[0];
        const secondCard = cards[1];
        const firstComp = firstCard.getComponent(PaiJiuCard);

        const startSecondCard = () => {
            this.playReferenceCardGlow(firstCard);
            this.spawnReferenceRubParticles(firstCard, 1, 8);
            this.enableReferencePeel(secondCard, cb);
        };

        if (firstComp) {
            firstComp.flipToFront(startSecondCard);
        } else {
            startSecondCard();
        }
    }

    private enableReferencePeel(card: cc.Node, cb?: Function) {
        const peel = this.createReferencePeel(card);
        if (!peel) {
            const comp = card.getComponent(PaiJiuCard);
            if (comp) {
                comp.flipToFront(cb);
            } else {
                cb && cb();
            }
            return;
        }

        let startX = 0;
        let baseProgress = 0;
        let progress = 0;
        let lastParticleProgress = 0;
        let finished = false;
        const needDistance = 330;

        const finishPeel = () => {
            if (finished) return;

            finished = true;
            this.unbindReferencePeelEvents(card, onStart, onMove, onEnd);
            this.updateReferencePeel(card, 1, peel);
            this.clearReferenceRubNodes(card, true);
            this.playReferenceCardGlow(card);
            this.spawnReferenceRubParticles(card, 1, 16);

            cb && cb();
        };

        const onStart = (event: cc.Event.EventTouch) => {
            if (finished) return;

            startX = event.getLocationX();
            baseProgress = progress;
        };

        const onMove = (event: cc.Event.EventTouch) => {
            if (finished) return;

            const dx = Math.max(0, event.getLocationX() - startX);
            const rawProgress = Math.min(baseProgress + dx / needDistance, 1);
            progress = this.getRubDisplayProgress(rawProgress);

            this.updateReferencePeel(card, progress, peel);

            if (progress - lastParticleProgress >= 0.035) {
                lastParticleProgress = progress;
                this.spawnReferenceRubParticles(card, progress, 3);
            }

            if (progress >= 1) {
                finishPeel();
            }
        };

        const onEnd = () => {
            if (finished) return;

            if (progress >= 0.92) {
                this.autoCompleteReferencePeel(card, peel, progress, finishPeel);
            } else {
                baseProgress = progress;
            }
        };

        card.on(cc.Node.EventType.TOUCH_START, onStart, this);
        card.on(cc.Node.EventType.TOUCH_MOVE, onMove, this);
        card.on(cc.Node.EventType.TOUCH_END, onEnd, this);
        card.on(cc.Node.EventType.TOUCH_CANCEL, onEnd, this);

        this.updateReferencePeel(card, 0, peel);
        this.playPeelWaitingShine(card, peel);
    }

    private getRubDisplayProgress(rawProgress: number): number {
        const p = Math.max(0, Math.min(rawProgress, 1));

        if (p < 0.85) {
            return Math.pow(p, 1.35);
        }

        const tail = (p - 0.85) / 0.15;
        return 0.8 + tail * 0.2;
    }

    private createReferencePeel(card: cc.Node): IRubPeelContext | null {
        this.clearReferenceRubNodes(card, false);

        const front = card.getChildByName("Front");
        const back = card.getChildByName("Back");

        if (!front || !back) {
            return null;
        }

        const frontSprite = front.getComponent(cc.Sprite);
        const backSprite = back.getComponent(cc.Sprite);

        if (!frontSprite || !backSprite) {
            return null;
        }

        const width = card.width || front.width || 80;
        const height = card.height || front.height || 170;

        card.setContentSize(width, height);

        front.active = false;
        back.active = false;

        const faceMask = new cc.Node("ReferenceRubFaceMask");
        faceMask.anchorX = 0;
        faceMask.anchorY = 0.5;
        faceMask.setContentSize(1, height);
        faceMask.setPosition(-width / 2, 0);
        faceMask.zIndex = 1200;
        card.addChild(faceMask);

        const mask = faceMask.addComponent(cc.Mask);
        mask.type = cc.Mask.Type.RECT;

        const faceNode = new cc.Node("ReferenceRubFace");
        faceNode.setContentSize(width, height);
        faceNode.setPosition(width / 2, 0);
        const faceSprite = faceNode.addComponent(cc.Sprite);
        faceSprite.spriteFrame = frontSprite.spriteFrame;
        faceMask.addChild(faceNode);

        const backMask = new cc.Node("ReferenceRubBackMask");
        backMask.anchorX = 1;
        backMask.anchorY = 0.5;
        backMask.setContentSize(width, height);
        backMask.setPosition(width / 2, 0);
        backMask.zIndex = 1215;
        card.addChild(backMask);

        const backMaskComp = backMask.addComponent(cc.Mask);
        backMaskComp.type = cc.Mask.Type.RECT;

        const backNode = new cc.Node("ReferenceRubBack");
        backNode.setContentSize(width, height);
        backNode.setPosition(-width / 2, 0);
        const backClone = backNode.addComponent(cc.Sprite);
        backClone.spriteFrame = backSprite.spriteFrame;
        backMask.addChild(backNode);

        const shadowNode = this.createReferenceShadow(width, height);
        shadowNode.zIndex = 1210;
        shadowNode.active = false;
        card.addChild(shadowNode);

        const glowNode = this.createReferenceGlow(width, height);
        glowNode.zIndex = 1190;
        card.addChild(glowNode);

        const hintNode = this.createReferenceSlideHint(width, height);
        hintNode.zIndex = 1230;
        card.addChild(hintNode);
        this.playReferenceSlideHint(hintNode, width);

        const particleRoot = new cc.Node("ReferenceRubParticles");
        particleRoot.zIndex = 1240;
        card.addChild(particleRoot);

        return {
            faceMask,
            faceNode,
            backMask,
            backNode,
            shadowNode,
            glowNode,
            hintNode,
            particleRoot,
            width,
            height
        };
    }

    private createReferenceShadow(width: number, height: number): cc.Node {
        const node = new cc.Node("ReferenceRubShadow");
        node.opacity = 0;

        return node;
    }

    private createReferenceSlideHint(width: number, height: number): cc.Node {
        const root = new cc.Node("ReferenceRubHint");
        root.opacity = 230;
        root.setPosition(0, -height * 0.72);

        const textNode = new cc.Node("HintText");
        textNode.setPosition(0, 0);
        const label = textNode.addComponent(cc.Label);
        label.string = "向右滑动开牌";
        label.fontSize = 18;
        label.lineHeight = 20;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        textNode.color = new cc.Color(255, 225, 128);
        root.addChild(textNode);

        const arrowNode = new cc.Node("HintArrow");
        arrowNode.setPosition(-width * 0.34, -22);
        const graphics = arrowNode.addComponent(cc.Graphics);
        graphics.strokeColor = new cc.Color(255, 215, 96, 230);
        graphics.fillColor = new cc.Color(255, 215, 96, 230);
        graphics.lineWidth = 4;
        graphics.moveTo(0, 0);
        graphics.lineTo(width * 0.52, 0);
        graphics.stroke();
        graphics.moveTo(width * 0.52, 0);
        graphics.lineTo(width * 0.4, 8);
        graphics.lineTo(width * 0.4, -8);
        graphics.close();
        graphics.fill();
        root.addChild(arrowNode);

        return root;
    }

    private createReferenceGlow(width: number, height: number): cc.Node {
        const node = new cc.Node("ReferenceRubGlow");
        node.opacity = 0;

        const graphics = node.addComponent(cc.Graphics);
        graphics.strokeColor = new cc.Color(255, 203, 93, 210);
        graphics.lineWidth = 3;
        graphics.roundRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10, 8);
        graphics.stroke();

        return node;
    }

    private playReferenceSlideHint(hintNode: cc.Node, width: number) {
        const arrowNode = hintNode.getChildByName("HintArrow");

        if (!arrowNode) {
            return;
        }

        cc.tween(arrowNode)
            .repeatForever(
                cc.tween()
                    .set({ x: -width * 0.34, opacity: 70 })
                    .to(0.18, { opacity: 255 })
                    .to(0.62, { x: width * 0.1, opacity: 0 })
                    .delay(0.18)
            )
            .start();

        cc.tween(hintNode)
            .repeatForever(
                cc.tween()
                    .to(0.45, { opacity: 255 })
                    .to(0.45, { opacity: 185 })
            )
            .start();
    }

    private hideReferenceSlideHint(peel: IRubPeelContext) {
        if (!peel.hintNode || !cc.isValid(peel.hintNode) || !peel.hintNode.active) {
            return;
        }

        cc.Tween.stopAllByTarget(peel.hintNode);
        const arrowNode = peel.hintNode.getChildByName("HintArrow");
        if (arrowNode) {
            cc.Tween.stopAllByTarget(arrowNode);
        }

        cc.tween(peel.hintNode)
            .to(0.12, { opacity: 0 })
            .call(() => {
                if (cc.isValid(peel.hintNode)) {
                    peel.hintNode.active = false;
                }
            })
            .start();
    }

    private updateReferencePeel(card: cc.Node, progress: number, peel?: IRubPeelContext) {
        const ctx = peel || this.getReferencePeel(card);
        if (!ctx) return;

        const p = Math.max(0, Math.min(progress, 1));
        const revealWidth = ctx.width * p;
        const edgeX = -ctx.width / 2 + revealWidth;

        ctx.faceMask.active = revealWidth > 0.5;
        ctx.faceMask.setContentSize(Math.max(1, revealWidth), ctx.height);
        ctx.faceNode.setPosition(ctx.width / 2, 0);

        const backWidth = Math.max(1, ctx.width - revealWidth);
        ctx.backMask.setContentSize(backWidth, ctx.height);
        ctx.backMask.setPosition(ctx.width / 2, 0);
        ctx.backNode.setPosition(-ctx.width / 2, 0);

        ctx.shadowNode.opacity = 0;
        ctx.shadowNode.x = edgeX - ctx.width * 0.45;
        ctx.shadowNode.scaleX = Math.max(0.08, 0.55 - p * 0.42);

        ctx.glowNode.opacity = Math.floor(80 + Math.sin(p * Math.PI) * 120);

        if (p > 0.12) {
            this.hideReferenceSlideHint(ctx);
        }

        if (p >= 1) {
            ctx.backMask.active = false;
            ctx.shadowNode.active = false;
        }
    }

    private autoCompleteReferencePeel(
        card: cc.Node,
        peel: IRubPeelContext,
        fromProgress: number,
        cb?: Function
    ) {
        const state = { value: fromProgress };

        cc.tween(state)
            .to(0.32, { value: 1 }, {
                progress: (start: number, end: number, current: number, ratio: number) => {
                    const p = start + (end - start) * ratio;
                    this.updateReferencePeel(card, p, peel);
                    return current;
                }
            })
            .call(() => {
                cb && cb();
            })
            .start();
    }

    private springReferencePeelBack(card: cc.Node, peel: IRubPeelContext, fromProgress: number) {
        const state = { value: fromProgress };
        const toProgress = Math.max(0.08, fromProgress * 0.55);

        cc.tween(state)
            .to(0.12, { value: toProgress }, {
                progress: (start: number, end: number, current: number, ratio: number) => {
                    const p = start + (end - start) * ratio;
                    this.updateReferencePeel(card, p, peel);
                    return current;
                }
            })
            .start();
    }

    private playPeelWaitingShine(card: cc.Node, peel: IRubPeelContext) {
        const line = new cc.Node("ReferenceRubShine");
        line.zIndex = 1245;
        line.opacity = 0;

        const graphics = line.addComponent(cc.Graphics);
        graphics.strokeColor = new cc.Color(255, 220, 132, 180);
        graphics.lineWidth = 2;
        graphics.moveTo(-peel.width * 0.4, 0);
        graphics.lineTo(peel.width * 0.4, 0);
        graphics.stroke();

        card.addChild(line);
        line.setPosition(0, peel.height * 0.16);

        cc.tween(line)
            .repeat(2,
                cc.tween()
                    .set({ x: -peel.width * 0.4, opacity: 0 })
                    .to(0.12, { opacity: 180 })
                    .to(0.32, { x: peel.width * 0.4, opacity: 0 })
            )
            .call(() => {
                if (cc.isValid(line)) {
                    line.destroy();
                }
            })
            .start();
    }

    private getReferencePeel(card: cc.Node): IRubPeelContext | null {
        const faceMask = card.getChildByName("ReferenceRubFaceMask");
        const backMask = card.getChildByName("ReferenceRubBackMask");
        const shadowNode = card.getChildByName("ReferenceRubShadow");
        const glowNode = card.getChildByName("ReferenceRubGlow");
        const hintNode = card.getChildByName("ReferenceRubHint");
        const particleRoot = card.getChildByName("ReferenceRubParticles");

        if (!faceMask || !backMask || !shadowNode || !glowNode || !hintNode || !particleRoot) {
            return null;
        }

        const faceNode = faceMask.getChildByName("ReferenceRubFace");
        const backNode = backMask.getChildByName("ReferenceRubBack");
        if (!faceNode || !backNode) {
            return null;
        }

        return {
            faceMask,
            faceNode,
            backMask,
            backNode,
            shadowNode,
            glowNode,
            hintNode,
            particleRoot,
            width: card.width || faceNode.width || 80,
            height: card.height || faceNode.height || 170
        };
    }

    private clearReferenceRubNodes(card: cc.Node, showFront: boolean) {
        card.targetOff(this);

        const names = [
            "ReferenceRubFaceMask",
            "ReferenceRubBackMask",
            "ReferenceRubShadow",
            "ReferenceRubGlow",
            "ReferenceRubHint",
            "ReferenceRubParticles",
            "ReferenceRubShine"
        ];

        names.forEach(name => {
            const node = card.getChildByName(name);
            if (node) {
                node.destroy();
            }
        });

        const comp = card.getComponent(PaiJiuCard);
        if (comp) {
            if (showFront) {
                comp.showFront();
            } else {
                comp.showBack();
            }
        }
    }

    private unbindReferencePeelEvents(
        card: cc.Node,
        onStart: Function,
        onMove: Function,
        onEnd: Function
    ) {
        card.off(cc.Node.EventType.TOUCH_START, onStart, this);
        card.off(cc.Node.EventType.TOUCH_MOVE, onMove, this);
        card.off(cc.Node.EventType.TOUCH_END, onEnd, this);
        card.off(cc.Node.EventType.TOUCH_CANCEL, onEnd, this);
    }

    private spawnReferenceRubParticles(card: cc.Node, progress: number, count: number) {
        const peel = this.getReferencePeel(card);
        const parent = peel ? peel.particleRoot : card;
        const width = peel ? peel.width : (card.width || 80);
        const height = peel ? peel.height : (card.height || 170);
        const p = Math.max(0, Math.min(progress, 1));
        const edgeX = -width / 2 + width * p;

        for (let i = 0; i < count; i++) {
            const particle = new cc.Node("ReferenceRubParticle");
            const size = 2 + Math.random() * 4;

            particle.opacity = 220;
            particle.scale = 0.8 + Math.random() * 0.55;
            particle.setPosition(
                edgeX + (Math.random() - 0.5) * 18,
                (Math.random() - 0.5) * height * 0.72
            );

            const graphics = particle.addComponent(cc.Graphics);
            graphics.fillColor = new cc.Color(255, 221, 122, 230);
            graphics.circle(0, 0, size);
            graphics.fill();

            parent.addChild(particle);

            cc.tween(particle)
                .by(0.24 + Math.random() * 0.22, {
                    x: 20 + Math.random() * 32,
                    y: -22 + Math.random() * 44,
                    opacity: -220,
                    scale: 0.35
                }, { easing: "quadOut" })
                .call(() => {
                    if (cc.isValid(particle)) {
                        particle.destroy();
                    }
                })
                .start();
        }
    }

    private playReferenceCardGlow(card: cc.Node) {
        const width = card.width || 80;
        const height = card.height || 170;
        const glow = new cc.Node("ReferenceOpenGlow");

        glow.zIndex = 1300;
        glow.opacity = 0;

        const graphics = glow.addComponent(cc.Graphics);
        graphics.strokeColor = new cc.Color(255, 210, 96, 230);
        graphics.lineWidth = 4;
        graphics.roundRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10, 9);
        graphics.stroke();

        card.addChild(glow);

        cc.tween(glow)
            .to(0.12, { opacity: 255, scale: 1.04 })
            .to(0.28, { opacity: 0, scale: 1.22 })
            .call(() => {
                if (cc.isValid(glow)) {
                    glow.destroy();
                }
            })
            .start();
    }

    private returnReferenceRubCardsToSeat(seat: number, cards: cc.Node[], cb?: Function) {
        let finish = 0;

        cards.forEach((card, index) => {
            const targetPos = this.getCardTargetPos(seat, index);

            cc.Tween.stopAllByTarget(card);
            this.clearReferenceRubNodes(card, true);

            cc.tween(card)
                .delay(index * 0.04)
                .to(0.34, {
                    x: targetPos.x,
                    y: targetPos.y,
                    scaleX: 1,
                    scaleY: 1,
                    angle: 0
                }, { easing: "sineOut" })
                .call(() => {
                    finish++;

                    if (finish >= cards.length) {
                        this.sortSeatCards(seat);
                        cb && cb();
                    }
                })
                .start();
        });
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
            if (this.openedSeats[player.seatId]) {
                return;
            }

            this.flipSeatCards(player.seatId, () => {
                this.openedSeats[player.seatId] = true;
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

    public fastShowAllCards() {
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
        this.clearReferenceRubNodes(card, true);

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
