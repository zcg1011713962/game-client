import GameRes from "../GameRes";
import { RecordItemDTO } from "./GameRecordItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HallRecordDetailItem extends cc.Component {
    @property(cc.Label)
    roundLabel: cc.Label = null;

    @property(cc.Sprite)
    card1: cc.Sprite = null;

    @property(cc.Sprite)
    card2: cc.Sprite = null;

    @property(cc.Label)
    typeLabel: cc.Label = null;

    @property(cc.Label)
    betLabel: cc.Label = null;

    @property(cc.Label)
    settleLabel: cc.Label = null;

    @property(cc.Label)
    timeLabel: cc.Label = null;

    protected onLoad(): void {
        this.bindNodesByName();
    }

    public updateView(data: RecordItemDTO, index: number): void {
        this.bindNodesByName();
        this.assertRequiredNodes(index);

        const round = data.roundId || index;
        const amount = Number(data.winAmount || 0);
        const typeName = this.formatCardTypeName(data.cardTypeName);

        this.setLabel(this.roundLabel, String(round));
        this.setLabel(this.typeLabel, `牌型：${typeName}`);
        this.setLabel(this.betLabel, `下注：${Number(data.betAmount || 0).toLocaleString()}`);
        this.setLabel(this.settleLabel, `结算：${this.formatAmount(amount)}`, this.getAmountColor(amount));
        this.setLabel(this.timeLabel, this.formatClock(data.settleTime));

        const cards = data.cards || [];
        this.setCard(this.card1, cards[0] ? cards[0].id : 0);
        this.setCard(this.card2, cards[1] ? cards[1].id : 0);
    }

    private bindNodesByName(): void {
        this.roundLabel = this.roundLabel || this.findLabel("RoundLabel");
        this.card1 = this.card1 || this.findSprite("Card1");
        this.card2 = this.card2 || this.findSprite("Card2");
        this.typeLabel = this.typeLabel || this.findLabel("TypeLabel");
        this.betLabel = this.betLabel || this.findLabel("BetLabel");
        this.settleLabel = this.settleLabel || this.findLabel("SettleLabel");
        this.timeLabel = this.timeLabel || this.findLabel("TimeLabel");
    }

    private assertRequiredNodes(index: number): void {
        const missing: string[] = [];
        if (!this.roundLabel) missing.push("RoundLabel");
        if (!this.card1) missing.push("Card1");
        if (!this.card2) missing.push("Card2");
        if (!this.typeLabel) missing.push("TypeLabel");
        if (!this.betLabel) missing.push("BetLabel");
        if (!this.settleLabel) missing.push("SettleLabel");
        if (!this.timeLabel) missing.push("TimeLabel");

        if (missing.length > 0) {
            throw new Error(`HallRecordDetailItem 第${index}条节点绑定缺失: ${missing.join(", ")}`);
        }
    }

    private setCard(sprite: cc.Sprite, cardId: number): void {
        if (!sprite) {
            return;
        }

        const width = sprite.node.width;
        const height = sprite.node.height;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = GameRes.instance.cardImgMap[`pai_${cardId}`] || null;
        sprite.node.setContentSize(width, height);
    }

    private setLabel(label: cc.Label, text: string, color?: cc.Color): void {
        if (!label) {
            return;
        }

        label.string = text;
        if (color) {
            label.node.color = color;
        }
    }

    private findLabel(name: string): cc.Label {
        const node = this.findChildDeep(this.node, name);
        return node ? node.getComponent(cc.Label) : null;
    }

    private findSprite(name: string): cc.Sprite {
        const node = this.findChildDeep(this.node, name);
        return node ? node.getComponent(cc.Sprite) : null;
    }

    private findChildDeep(root: cc.Node, name: string): cc.Node {
        if (!root) {
            return null;
        }

        if (root.name === name) {
            return root;
        }

        for (let i = 0; i < root.children.length; i++) {
            const found = this.findChildDeep(root.children[i], name);
            if (found) {
                return found;
            }
        }

        return null;
    }

    private formatCardTypeName(typeName: string): string {
        if (!typeName) {
            return "";
        }

        return typeName.indexOf("对子") === 0 ? "对子" : typeName;
    }

    private formatAmount(amount: number): string {
        if (amount > 0) {
            return `+${amount.toLocaleString()}`;
        }

        if (amount < 0) {
            return amount.toLocaleString();
        }

        return "0";
    }

    private getAmountColor(amount: number): cc.Color {
        if (amount > 0) {
            return cc.color(80, 235, 80);
        }

        if (amount < 0) {
            return cc.color(255, 58, 62);
        }

        return cc.color(255, 190, 35);
    }

    private formatClock(time: number): string {
        if (!time) {
            return "";
        }

        const date = new Date(time);
        return `${this.pad(date.getHours())}:${this.pad(date.getMinutes())}:${this.pad(date.getSeconds())}`;
    }

    private pad(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
    }
}
