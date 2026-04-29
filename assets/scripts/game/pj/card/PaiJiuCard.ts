const { ccclass, property } = cc._decorator;

export interface IPaiJiuCardData {
    id?: number;
    name?: string;
    seatId?: number;
    index?: number;
}

@ccclass
export default class PaiJiuCard extends cc.Component {

    private backNode: cc.Node = null;

    private frontNode: cc.Node = null;

    private shadowNode: cc.Node = null;

    private _data: IPaiJiuCardData | null = null;

    onLoad() {
        this.backNode = this.node.getChildByName("Back");
        this.frontNode = this.node.getChildByName("Front");
        this.shadowNode = this.node.getChildByName("Shadow");
        this.showBack();
    }

    public init(cardData?: IPaiJiuCardData) {
        this._data = cardData || null;
        this.showBack();
    }

    public getCardData(): IPaiJiuCardData | null {
        return this._data;
    }

    public showBack() {
        if (this.backNode) this.backNode.active = true;
        if (this.frontNode) this.frontNode.active = false;
    }

    public showFront() {
        if (this.backNode) this.backNode.active = false;
        if (this.frontNode) this.frontNode.active = true;
    }

    public flipToFront(cb?: Function) {
        cc.tween(this.node)
            .to(0.12, { scaleX: 0.05 })
            .call(() => {
                this.showFront();
            })
            .to(0.12, { scaleX: 1.0 })
            .call(() => {
                cb && cb();
            })
            .start();
    }

    public flipToBack(cb?: Function) {
        cc.tween(this.node)
            .to(0.12, { scaleX: 0.05 })
            .call(() => {
                this.showBack();
            })
            .to(0.12, { scaleX: 1.0 })
            .call(() => {
                cb && cb();
            })
            .start();
    }
}