const { ccclass, property } = cc._decorator;

export interface RecordItemDTO {
    roundId: number;
    time: string;
    cardIds: number[];
    cardTypeName: string;
    cardTypeDesc: string;
    betAmount: number;
    winAmount: number;
}

@ccclass
export default class RecordItem extends cc.Component {

    private roundLabel!: cc.Label;
    private timeLabel!: cc.Label;

    private cardRoot!: cc.Node;

    private typeLabel!: cc.Label;
    private typeDescLabel!: cc.Label;

    private betLabel!: cc.Label;
    private amountLabel!: cc.Label;

    private resultSprite!: cc.Sprite;

    protected onLoad(): void {
        const roundRoot = this.node.getChildByName("RoundRoot");
        this.roundLabel = roundRoot.getChildByName("roundLabel").getComponent(cc.Label);
        this.timeLabel = roundRoot.getChildByName("timeLabel").getComponent(cc.Label);
        this.cardRoot = this.node.getChildByName("CardRoot");
        const typeRoot = this.node.getChildByName("TypeRoot");
        this.roundLabel = typeRoot.getChildByName("TypeLabel").getComponent(cc.Label);
        this.typeDescLabel = typeRoot.getChildByName("TypeDescLabel").getComponent(cc.Label);
        const betRoot = this.node.getChildByName("BetRoot");
        this.betLabel = betRoot.getChildByName("BetLabel").getComponent(cc.Label);
        const resultRoot = this.node.getChildByName("ResultRoot");
        this.amountLabel = resultRoot.getChildByName("AmountLabel").getComponent(cc.Label);
        
    }

    public updateView(data: RecordItemDTO) {

        this.roundLabel.string = `第${data.roundId}局`;
        this.timeLabel.string = data.time;

        this.typeLabel.string = data.cardTypeName;
        this.typeDescLabel.string = data.cardTypeDesc;

        this.betLabel.string = data.betAmount.toLocaleString();
        this.amountLabel.string =
            data.winAmount > 0 ? `+${data.winAmount.toLocaleString()}` : data.winAmount.toLocaleString();

        this.updateResultStyle(data.winAmount);
        this.updateTypeColor(data.cardTypeName);
    }

    private updateResultStyle(winAmount: number) {
        if (winAmount > 0) {
            this.amountLabel.node.color = cc.color(255, 122, 0);
        } else if (winAmount < 0) {
            this.amountLabel.node.color = cc.color(24, 160, 70);
        } else {
            this.amountLabel.node.color = cc.color(65, 145, 255);
        }
    }

    private updateTypeColor(typeName: string) {
        if (typeName.indexOf("至尊") >= 0) {
            this.typeLabel.node.color = cc.color(155, 53, 255);
        } else if (typeName.indexOf("天") >= 0) {
            this.typeLabel.node.color = cc.color(233, 137, 0);
        } else if (typeName.indexOf("九") >= 0) {
            this.typeLabel.node.color = cc.color(0, 118, 214);
        } else {
            this.typeLabel.node.color = cc.color(90, 90, 90);
        }
    }
}