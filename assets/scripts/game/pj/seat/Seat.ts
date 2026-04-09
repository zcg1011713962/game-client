const { ccclass, property } = cc._decorator;

@ccclass
export default class Seat extends cc.Component {

    private nameLabel: cc.Label = null;
    private statusLabel: cc.Label = null;
    private bankerNode: cc.Node = null;
    private cardsNode: cc.Node = null;

    onLoad() {
        // ⭐ 动态获取子节点（完全不依赖拖拽）
        this.nameLabel = cc.find("Name", this.node)?.getComponent(cc.Label);
        this.statusLabel = cc.find("Status", this.node)?.getComponent(cc.Label);
        this.bankerNode = cc.find("Banker", this.node);
        this.cardsNode = cc.find("Cards", this.node);
    }

    init(data: { name: string, isBanker: boolean }) {
        if (this.nameLabel) {
            this.nameLabel.string = data.name;
        }

        this.setBanker(data.isBanker);
    }

    setBanker(isBanker: boolean) {
        if (this.bankerNode) {
            this.bankerNode.active = isBanker;
        }
    }

    setStatus(text: string) {
        if (this.statusLabel) {
            this.statusLabel.string = text;
        }
    }

}