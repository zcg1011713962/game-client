import { CardConfig, CardInfo } from "../card/CardConfig";

export class CardUtils {

    /** 获取牌信息 */
    static getCard(cardId: number): CardInfo {
        return CardConfig[cardId];
    }

    /** 获取资源名 */
    static getSpriteName(cardId: number): string {
        return `pai_${cardId < 10 ? "0" + cardId : cardId}`;
    }

    /** 计算点数 */
    static calcPoint(id1: number, id2: number): number {
        const c1 = this.getCard(id1);
        const c2 = this.getCard(id2);
        return (c1.value + c2.value) % 10;
    }

    /** 是否对子 */
    static isPair(id1: number, id2: number): boolean {
        const c1 = this.getCard(id1);
        const c2 = this.getCard(id2);
        return c1.name === c2.name;
    }
}