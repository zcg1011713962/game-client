const { ccclass } = cc._decorator;

@ccclass
export default class RoundStartPopup extends cc.Component {

    private panel: cc.Node = null;
    private roundLabel: cc.Label = null;

    private serverOffset: number = 0;
    private expireTime: number = 0;

    private resolveCb: Function = null;
    private finished: boolean = false;

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
            cc.error("RoundLabel 缺少 cc.Label");
        }

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
            this.roundLabel.string = `${roundId}`;

            cc.Tween.stopAllByTarget(this.panel);

            this.panel.opacity = 0;
            this.panel.scale = 1;
            this.panel.x = -500;
            this.panel.y = 0;

            cc.tween(this.panel)
                .to(
                    this.flyTime,
                    {
                        x: 0,
                        opacity: 255
                    },
                    {
                        easing: "quadOut"
                    }
                )
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

        if (cc.isValid(this.node)) {
            this.node.active = false;
        }

        const cb = this.resolveCb;
        this.resolveCb = null;

        if (cb) {
            cb();
        }
    }
}