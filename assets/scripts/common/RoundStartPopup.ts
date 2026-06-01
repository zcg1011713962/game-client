const { ccclass } = cc._decorator;

@ccclass
export default class RoundStartPopup extends cc.Component {

    private panel: cc.Node = null;
    private roundLabel: cc.Label = null;

    onLoad() {
        this.panel = this.node.getChildByName("Panel");

        if (!this.panel) {
            cc.error("RoundStartPopup 找不到 Panel");
            return;
        }

        const roundLabelNode = this.panel.getChildByName("RoundLabel");

        if (!roundLabelNode) {
            cc.error("RoundStartPopup 找不到 RoundLabel");
            return;
        }

        this.roundLabel = roundLabelNode.getComponent(cc.Label);

        if (!this.roundLabel) {
            cc.error("RoundLabel 缺少 cc.Label 组件");
        }
    }

    public play(roundId: number): Promise<void> {
        return new Promise(resolve => {
            if (!this.panel || !this.roundLabel) {
                resolve();
                return;
            }

            this.node.active = true;

            // 只动态展示中间数字
            this.roundLabel.string = `${roundId}`;

            cc.Tween.stopAllByTarget(this.panel);
            cc.Tween.stopAllByTarget(this.roundLabel.node);

            // 背景初始状态
            this.panel.opacity = 0;
            this.panel.scale = 0.8;
            this.panel.x = 0;
            this.panel.y = 0;

            // 数字飞入初始状态
            const labelNode = this.roundLabel.node;
            labelNode.opacity = 0;
            labelNode.scale = 2.2;
            labelNode.x = 0;
            labelNode.y = 180;

            // 背景弹出
            cc.tween(this.panel)
                .to(0.22, { opacity: 255, scale: 1.08 }, { easing: "backOut" })
                .to(0.08, { scale: 1 })
                .delay(1.0)
                .to(0.2, { opacity: 0, scale: 0.9 })
                .call(() => {
                    this.node.active = false;
                    resolve();
                })
                .start();

            // 数字飞入
            cc.tween(labelNode)
                .delay(0.08)
                .to(0.28, {
                    opacity: 255,
                    y: 0,
                    scale: 1
                }, {
                    easing: "backOut"
                })
                .delay(0.65)
                .to(0.15, {
                    opacity: 0,
                    y: -80,
                    scale: 0.8
                })
                .start();
        });
    }
}