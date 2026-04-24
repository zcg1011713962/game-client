import { CardConfig, CardInfo } from "../card/CardConfig";
export type Hand = [CardInfo, CardInfo];

export interface HandResult {
    cards: Hand;
    type: number;     // 牌型等级（越大越强）
    point: number;    // 点数
    name: string;     // 牌型名称
}

export class CardUtils {
    /** 获取整副牌 */
    static getDeck(): CardInfo[] {
        return Object.values(CardConfig);
    }

    /** 洗牌 */
    static shuffle(deck: CardInfo[]): CardInfo[] {
        const arr = [...deck];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /** 发牌：每人2张 */
    static deal(playerCount: number): Hand[] {
        const deck = this.shuffle(this.getDeck());

        if (playerCount * 2 > deck.length) {
            throw new Error("人数过多，牌不够发");
        }

        const hands: Hand[] = [];

        for (let i = 0; i < playerCount; i++) {
            hands.push([
                deck[i * 2],
                deck[i * 2 + 1],
            ]);
        }

        return hands;
    }

    /** 计算点数：取个位 */
    static calcPoint(cards: Hand): number {
        return (cards[0].value + cards[1].value) % 10;
    }

    /** 是否对子 */
    static isPair(cards: Hand): boolean {
        return cards[0].name === cards[1].name;
    }

    /** 单张牌大小 */
    static getCardRank(card: CardInfo): number {
        return card.id;
    }

    /** 最大单张牌 */
    static getMaxCardRank(cards: Hand): number {
        return Math.max(
            this.getCardRank(cards[0]),
            this.getCardRank(cards[1])
        );
    }

    /** 计算牌型 */
    static calcHand(cards: Hand): HandResult {
        const point = this.calcPoint(cards);

        if (this.isPair(cards)) {
            return {
                cards,
                type: 100 + this.getMaxCardRank(cards),
                point,
                name: `对子-${cards[0].name}`,
            };
        }

        return {
            cards,
            type: point,
            point,
            name: `${point}点`,
        };
    }

    /**
     * 比牌
     * 返回值：
     * > 0  a赢
     * < 0  b赢
     * = 0  平局
     */
    static compare(a: Hand, b: Hand): number {
        const ra = this.calcHand(a);
        const rb = this.calcHand(b);

        if (ra.type !== rb.type) {
            return ra.type - rb.type;
        }

        return this.getMaxCardRank(a) - this.getMaxCardRank(b);
    }

    /** 是否a赢 */
    static isWin(a: Hand, b: Hand): boolean {
        return this.compare(a, b) > 0;
    }
  
}