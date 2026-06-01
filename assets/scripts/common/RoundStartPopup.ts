const { ccclass } = cc._decorator;

@ccclass
export default class RoundStartPopup extends cc.Component {

    private panel: cc.Node = null;
    private roundLabel: cc.Label = null;

    private flyTime: number = 0.35;
    private stayTime: number = 3.0;
    private fadeTime: number = 0.25;

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

            this.roundLabel.string = `${roundId}`;

            cc.Tween.stopAllByTarget(this.panel);

            // 初始位置：屏幕左侧
            this.panel.opacity = 0;
            this.panel.scale = 1;
            this.panel.x = -500;
            this.panel.y = 0;

            cc.tween(this.panel)
                // 从左到中间
                .to(this.flyTime, {
                    x: 0,
                    opacity: 255
                }, {
                    easing: "quadOut"
                })
                // 停留
                .delay(this.stayTime)
                // 淡出
                .to(this.fadeTime, {
                    opacity: 0
                })
                .call(() => {
                    if (cc.isValid(this.node)) {
                        this.node.active = false;
                    }
                    resolve();
                })
                .start();
        });
    }
}