const { ccclass } = cc._decorator;

@ccclass
export default class RoundStartPopup extends cc.Component {

    private panel: cc.Node = null;
    private roundLabel: cc.Label = null;

    private endTime: number = 0;
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

            // 记录动画应该结束的时间
            this.endTime = Date.now()
                + this.flyTime * 1000
                + this.stayTime * 1000
                + this.fadeTime * 1000;

            cc.Tween.stopAllByTarget(this.panel);

            this.panel.opacity = 0;
            this.panel.scale = 1;
            this.panel.x = -500;
            this.panel.y = 0;

            cc.tween(this.panel)
                .to(this.flyTime, {
                    x: 0,
                    opacity: 255
                }, {
                    easing: "quadOut"
                })
                .delay(this.stayTime)
                .to(this.fadeTime, {
                    opacity: 0
                })
                .call(() => {
                    this.hideImmediately();
                    resolve();
                })
                .start();
        });
    }

    private hideImmediately() {
        cc.Tween.stopAllByTarget(this.panel);

        this.panel.opacity = 0;

        if (cc.isValid(this.node)) {
            this.node.active = false;
        }
    }
}