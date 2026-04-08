const { ccclass, property } = cc._decorator;

@ccclass
export default class Seat extends cc.Component {

    @property(cc.Label)
    nameLabel: cc.Label = null;

    @property(cc.Node)
    cardsNode: cc.Node = null;

    @property(cc.Label)
    statusLabel: cc.Label = null;

    @property(cc.Node)
    bankerNode: cc.Node = null;

    private angle: number = 0;

    /**
     * 初始化玩家
     */
    init(data: { name: string, isBanker: boolean }) {
        if (this.nameLabel) {
            this.nameLabel.string = data.name || "玩家";
        }

        if (this.statusLabel) {
            this.statusLabel.string = "准备";
        }

        this.setBanker(data.isBanker);
    }

    /**
     * 设置庄家
     */
    setBanker(isBanker: boolean) {
        if (this.bankerNode) {
            this.bankerNode.active = isBanker;
        }
    }

    /**
     * 更新朝向
     */
    updateView(angle: number) {
        this.angle = angle;

        // 上半区翻转（防倒置）
        if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
            this.node.scaleX = -1;
        } else {
            this.node.scaleX = 1;
        }

        // 手牌永远正向
        if (this.cardsNode) {
            this.cardsNode.angle = 0;
        }
    }

    /**
     * 设置状态
     */
    setStatus(text: string) {
        if (this.statusLabel) {
            this.statusLabel.string = text;
        }
    }
}