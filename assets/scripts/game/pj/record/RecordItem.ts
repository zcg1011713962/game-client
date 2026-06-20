import GameRes from "../GameRes";

const { ccclass } = cc._decorator;

export interface RecordCardDTO {
    id: number;
    name: string;
    value: number;
}

export interface RecordItemDTO {
    roundId: number;
    win: number;
    betAmount: number;
    winAmount: number;
    cardTypeName: string;
    settleDesc: string;
    cards: RecordCardDTO[];
    settleTime: number;
}

@ccclass
export default class RecordItem extends cc.Component {

    private roundLabel: cc.Label = null;
    private timeLabel: cc.Label = null;

    private typeLabel: cc.Label = null;
    private typeDescLabel: cc.Label = null;

    private betLabel: cc.Label = null;
    private amountLabel: cc.Label = null;
    private resultSprite: cc.Sprite = null;

    private card1: cc.Sprite = null;
    private card2: cc.Sprite = null;

    protected onLoad(): void {
        const roundRoot = this.node.getChildByName("RoundRoot");
        const typeRoot = this.node.getChildByName("TypeRoot");
        const betRoot = this.node.getChildByName("BetRoot");
        const resultRoot = this.node.getChildByName("ResultRoot");
        const cardRoot = this.node.getChildByName("CardRoot");

        this.roundLabel = roundRoot.getChildByName("RoundLabel").getComponent(cc.Label);
       

        this.card1 = cardRoot.getChildByName("Card1").getComponent(cc.Sprite);
        this.card2 = cardRoot.getChildByName("Card2").getComponent(cc.Sprite);

        this.typeLabel = typeRoot.getChildByName("TypeLabel").getComponent(cc.Label);
        this.typeDescLabel = typeRoot.getChildByName("TypeDescLabel").getComponent(cc.Label);

        this.betLabel = betRoot.getChildByName("BetLabel").getComponent(cc.Label);
        this.amountLabel = resultRoot.getChildByName("AmountLabel").getComponent(cc.Label);
        this.timeLabel = resultRoot.getChildByName("TimeLabel").getComponent(cc.Label);
        this.resultSprite = resultRoot.getChildByName("ResultSprite").getComponent(cc.Sprite);


        this.roundLabel.fontSize = 35;
        this.roundLabel.lineHeight = 35;
        this.roundLabel.node.color = cc.color(60, 35, 20);

        this.timeLabel.fontSize = 28;
        this.timeLabel.lineHeight = 28;
        this.timeLabel.node.color = cc.color(60, 35, 20);

        this.typeLabel.fontSize = 40;
        this.typeLabel.lineHeight = 42;

        this.typeDescLabel.fontSize = 35;
        this.typeDescLabel.lineHeight = 35;
        this.typeDescLabel.node.color = cc.color(90, 90, 90);

        this.betLabel.fontSize = 35;
        this.betLabel.lineHeight = 35;
        this.betLabel.node.color = cc.color(70, 50, 30);


        this.amountLabel.fontSize = 40;
        this.amountLabel.lineHeight = 40;
    }

    public updateView(data: RecordItemDTO) {
        if (!this.roundLabel || !this.timeLabel || !this.typeLabel || !this.typeDescLabel || !this.betLabel || !this.amountLabel) {
            cc.error("RecordItem 节点绑定失败，请检查预制体节点名");
            return;
        }

        this.roundLabel.string = `第${data.roundId}局`;
        this.timeLabel.string = this.formatTime(data.settleTime);

        const card1Spirte = GameRes.instance.cardImgMap[`pai_${data.cards[0].id}`];
        this.card1.spriteFrame = card1Spirte;
        const card2Spirte = GameRes.instance.cardImgMap[`pai_${data.cards[1].id}`];
        this.card2.spriteFrame = card2Spirte;



        this.typeLabel.string = data.cardTypeName;
        this.typeDescLabel.string = data.settleDesc;

        this.betLabel.string = data.betAmount.toLocaleString();

        this.amountLabel.string =
            data.winAmount > 0
                ? `+${data.winAmount.toLocaleString()}`
                : data.winAmount.toLocaleString();

        this.resultSprite.spriteFrame = GameRes.instance.resultImgMap[`icon_result_${data.win}`];        

        this.updateResultStyle(data.winAmount);
        this.updateTypeColor(data.cardTypeName);
    }

    private formatTime(time: number): string {
        const date = new Date(time);

        const month = this.pad(date.getMonth() + 1);
        const day = this.pad(date.getDate());
        const hour = this.pad(date.getHours());
        const minute = this.pad(date.getMinutes());

        return `${month}-${day} ${hour}:${minute}`;
    }

    private pad(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
    }

    private updateResultStyle(winAmount: number) {

        if (winAmount > 0) {

            this.amountLabel.string =
                `+${winAmount.toLocaleString()}`;

            this.amountLabel.node.color =
                cc.color(235, 100, 25);

        } else if (winAmount < 0) {

            this.amountLabel.string =
                winAmount.toLocaleString();

            this.amountLabel.node.color =
                cc.color(20, 160, 60);

        } else {

            this.amountLabel.string = "0";

            this.amountLabel.node.color =
                cc.color(70, 140, 255);
        }
    }

    private updateTypeColor(typeName: string) {

        if (typeName.indexOf("至尊") >= 0) {

            this.typeLabel.node.color =
                cc.color(175, 60, 255);

        } else if (typeName.indexOf("天") >= 0) {

            this.typeLabel.node.color =
                cc.color(245, 160, 20);

        } else if (
            typeName.indexOf("杂") >= 0 ||
            typeName.indexOf("九") >= 0
        ) {

            this.typeLabel.node.color =
                cc.color(0, 95, 220);

        } else {

            this.typeLabel.node.color =
                cc.color(80, 80, 80);
        }
    }
}