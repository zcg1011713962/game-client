const { ccclass } = cc._decorator;

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
        this.initNode();
        this.showBack();
    }

    private initNode() {
        if (!this.backNode) {
            this.backNode = this.node.getChildByName("Back");
        }

        if (!this.frontNode) {
            this.frontNode = this.node.getChildByName("Front");
        }

        if (!this.shadowNode) {
            this.shadowNode = this.node.getChildByName("Shadow");
        }

        this.node.anchorX = 0.5;
        this.node.anchorY = 0.5;
    }

    public init(cardData?: IPaiJiuCardData) {
        this.initNode();

        this._data = cardData || null;

        cc.Tween.stopAllByTarget(this.node);

        this.node.scaleX = 1;
        this.node.scaleY = 1;
        this.node.angle = 0;

        this.showBack();
    }

    public getCardData(): IPaiJiuCardData | null {
        return this._data;
    }

    public showBack() {
        this.initNode();

        if (this.backNode) {
            this.backNode.active = true;
        }

        if (this.frontNode) {
            this.frontNode.active = false;
        }

        this.node.scaleX = Math.abs(this.node.scaleX || 1);
    }

    public showFront() {
        this.initNode();

        if (this.backNode) {
            this.backNode.active = false;
        }

        if (this.frontNode) {
            this.frontNode.active = true;
        }

        this.node.scaleX = Math.abs(this.node.scaleX || 1);
    }

    public setShadowVisible(visible: boolean) {
        this.initNode();

        if (this.shadowNode) {
            this.shadowNode.active = visible;
        }
    }

    public flipToFront(cb?: Function) {
        this.initNode();

        cc.Tween.stopAllByTarget(this.node);

        this.node.scaleX = Math.abs(this.node.scaleX || 1);
        this.node.scaleY = Math.abs(this.node.scaleY || 1);

        cc.tween(this.node)
            .to(0.12, { scaleX: 0.05 })
            .call(() => {
                this.showFront();
            })
            .to(0.12, { scaleX: 1 })
            .call(() => {
                cb && cb();
            })
            .start();
    }

    public flipToBack(cb?: Function) {
        this.initNode();

        cc.Tween.stopAllByTarget(this.node);

        this.node.scaleX = Math.abs(this.node.scaleX || 1);
        this.node.scaleY = Math.abs(this.node.scaleY || 1);

        cc.tween(this.node)
            .to(0.12, { scaleX: 0.05 })
            .call(() => {
                this.showBack();
            })
            .to(0.12, { scaleX: 1 })
            .call(() => {
                cb && cb();
            })
            .start();
    }
}