const { ccclass } = cc._decorator;

@ccclass
export default class RoundStartPopup extends cc.Component {

    private panel: cc.Node = null;
    private roundLabel: cc.Label = null;

    private serverOffset: number = 0;
    private expireTime: number = 0;

    private resolveCb: Function = null;
    private finished: boolean = false;

    private enterTime: number = 0.18;
    private stayTime: number = 0.75;
    private sweepTime: number = 0.32;
    private fadeTime: number = 0.22;
    private sweepNode: cc.Node = null;

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
            cc.error("RoundLabel 缺少 cc.Label");
        }

        this.rebuildTitleStyle();
        cc.game.on(cc.game.EVENT_SHOW, this.onGameShow, this);
    }

    onDestroy() {
        cc.game.off(cc.game.EVENT_SHOW, this.onGameShow, this);

        if (this.panel) {
            cc.Tween.stopAllByTarget(this.panel);
        }

        this.resolveCb = null;
    }

    public play(
        roundId: number,
        serverTime: number,
        roundAnimExpireTime: number
    ): Promise<void> {

        return new Promise(resolve => {

            if (!this.panel || !this.roundLabel) {
                resolve();
                return;
            }

            this.finished = false;
            this.resolveCb = resolve;

            this.serverOffset = serverTime - Date.now();
            this.expireTime = roundAnimExpireTime;

            const nowServer = this.getServerNow();

            // 已经过期，直接不播放
            if (nowServer >= this.expireTime) {
                this.finish();
                return;
            }

            this.node.active = true;
            this.roundLabel.string = `第 ${roundId} 局`;

            cc.Tween.stopAllByTarget(this.panel);
            if (this.sweepNode) {
                cc.Tween.stopAllByTarget(this.sweepNode);
            }

            this.panel.opacity = 0;
            this.panel.scale = 0.9;
            this.panel.x = 0;
            this.panel.y = 0;
            if (this.sweepNode) {
                this.sweepNode.opacity = 0;
                this.sweepNode.x = -290;
            }

            cc.tween(this.panel)
                .to(
                    this.enterTime,
                    {
                        opacity: 255,
                        scale: 1.06
                    },
                    {
                        easing: "sineOut"
                    }
                )
                .to(0.1, { scale: 1 })
                .delay(this.stayTime)
                .to(
                    this.fadeTime,
                    {
                        opacity: 0
                    }
                )
                .call(() => {
                    this.finish();
                })
                .start();

            if (this.sweepNode) {
                cc.tween(this.sweepNode)
                    .delay(this.enterTime + 0.12)
                    .set({ x: -290, opacity: 0 })
                    .to(0.08, { opacity: 210 })
                    .to(this.sweepTime, { x: 290 }, { easing: "quadOut" })
                    .to(0.08, { opacity: 0 })
                    .start();
            }
        });
    }

    update() {
        if (!this.node.active || this.finished || this.expireTime <= 0) {
            return;
        }

        if (this.getServerNow() >= this.expireTime) {
            this.finish();
        }
    }

    private onGameShow() {
        if (!this.node.active || this.finished || this.expireTime <= 0) {
            return;
        }

        if (this.getServerNow() >= this.expireTime) {
            this.finish();
        }
    }

    private getServerNow(): number {
        return Date.now() + this.serverOffset;
    }

    private finish() {
        if (this.finished) {
            return;
        }

        this.finished = true;

        if (this.panel) {
            cc.Tween.stopAllByTarget(this.panel);
            this.panel.opacity = 0;
        }
        if (this.sweepNode) {
            cc.Tween.stopAllByTarget(this.sweepNode);
            this.sweepNode.opacity = 0;
        }

        if (cc.isValid(this.node)) {
            this.node.active = false;
        }

        const cb = this.resolveCb;
        this.resolveCb = null;

        if (cb) {
            cb();
        }
    }

    private rebuildTitleStyle() {
        if (!this.panel || !this.roundLabel) {
            return;
        }

        this.panel.removeAllChildren();
        this.panel.setContentSize(660, 180);

        this.createTitleBackground();
        this.createSideLines();
        this.createSweep();
        this.createRoundLabel();
    }

    private createTitleBackground() {
        const bgNode = new cc.Node("TitleBg");
        bgNode.setContentSize(660, 128);
        this.panel.addChild(bgNode);

        const graphics = bgNode.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(18, 10, 4, 190);
        graphics.roundRect(-300, -42, 600, 84, 14);
        graphics.fill();

        graphics.fillColor = new cc.Color(118, 65, 16, 92);
        graphics.roundRect(-250, -30, 500, 60, 10);
        graphics.fill();

        graphics.strokeColor = new cc.Color(255, 207, 96, 210);
        graphics.lineWidth = 2;
        graphics.moveTo(-285, 42);
        graphics.lineTo(285, 42);
        graphics.moveTo(-285, -42);
        graphics.lineTo(285, -42);
        graphics.stroke();
    }

    private createSideLines() {
        const lineNode = new cc.Node("SideLines");
        this.panel.addChild(lineNode);

        const graphics = lineNode.addComponent(cc.Graphics);
        graphics.strokeColor = new cc.Color(255, 220, 126, 235);
        graphics.lineWidth = 4;
        graphics.moveTo(-330, 0);
        graphics.lineTo(-160, 0);
        graphics.moveTo(160, 0);
        graphics.lineTo(330, 0);
        graphics.stroke();

        graphics.strokeColor = new cc.Color(255, 190, 62, 130);
        graphics.lineWidth = 1;
        graphics.moveTo(-310, 18);
        graphics.lineTo(-190, 18);
        graphics.moveTo(190, 18);
        graphics.lineTo(310, 18);
        graphics.moveTo(-310, -18);
        graphics.lineTo(-190, -18);
        graphics.moveTo(190, -18);
        graphics.lineTo(310, -18);
        graphics.stroke();
    }

    private createSweep() {
        this.sweepNode = new cc.Node("SweepLight");
        this.sweepNode.setContentSize(86, 96);
        this.sweepNode.opacity = 0;
        this.panel.addChild(this.sweepNode);

        const graphics = this.sweepNode.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(255, 244, 176, 90);
        graphics.moveTo(-30, -46);
        graphics.lineTo(8, -46);
        graphics.lineTo(34, 46);
        graphics.lineTo(-4, 46);
        graphics.close();
        graphics.fill();
    }

    private createRoundLabel() {
        const labelNode = new cc.Node("RoundLabel");
        labelNode.setContentSize(360, 72);
        this.panel.addChild(labelNode);

        this.roundLabel = labelNode.addComponent(cc.Label);
        this.roundLabel.fontSize = 50;
        this.roundLabel.lineHeight = 58;
        this.roundLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        this.roundLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
        labelNode.color = new cc.Color(255, 229, 130);

        const outline = labelNode.addComponent(cc.LabelOutline);
        outline.color = new cc.Color(70, 32, 4);
        outline.width = 4;
    }
}
