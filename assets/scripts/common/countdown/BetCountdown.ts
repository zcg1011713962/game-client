import GameRes from "../../game/pj/GameRes";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ClockCountdown extends cc.Component {

    private clock: cc.Node = null;
    private timeLabel: cc.Label = null;

    private warnSecond: number = 5;

    private totalTime = 0;
    private running = false;
    private lastSecond = -1;
    private finishCb: Function = null;
    private originPos: cc.Vec3 = null;

    // 关键：记录结束时间戳
    private endTimeMs: number = 0;

    onLoad() {
        this.clock = this.node.getChildByName("clock");
        this.timeLabel = this.node.getChildByName("timeLabel").getComponent(cc.Label);

        if (this.clock) {
            this.originPos = this.clock.position.clone();
        }

        cc.game.on(cc.game.EVENT_SHOW, this.onGameShow, this);
        cc.game.on(cc.game.EVENT_HIDE, this.onGameHide, this);
    }

    onDestroy() {
        cc.game.off(cc.game.EVENT_SHOW, this.onGameShow, this);
        cc.game.off(cc.game.EVENT_HIDE, this.onGameHide, this);
    }

    public startCountdown(seconds: number, finishCb?: Function) {
        this.totalTime = seconds;
        this.running = true;
        this.finishCb = finishCb;
        this.lastSecond = -1;

        this.endTimeMs = Date.now() + seconds * 1000;

        this.node.active = true;
        this.updateView();
    }

    public stopCountdown() {
        this.running = false;
        this.stopWarnAnim();
    }

    update(dt: number) {
        if (!this.running) return;

        this.updateView();
    }

    private getLeftSecond(): number {
        const leftMs = this.endTimeMs - Date.now();
        return Math.max(0, Math.ceil(leftMs / 1000));
    }

    private updateView() {
        const sec = this.getLeftSecond();

        if (this.timeLabel) {
            this.timeLabel.string = sec.toString();
        }

        if (sec <= 0) {
            this.finishCountdown();
            return;
        }

        if (sec !== this.lastSecond) {
            this.lastSecond = sec;

            if (sec > 0 && sec <= this.warnSecond) {
                this.playWarn();
            }
        }
    }

    private finishCountdown() {
        if (!this.running) return;

        this.running = false;
        this.stopWarnAnim();

        if (this.timeLabel) {
            this.timeLabel.string = "0";
        }

        if (this.finishCb) {
            this.finishCb();
        }
    }

    private onGameShow() {
        if (!this.running) return;

        // 切回前台立刻校准
        this.updateView();
    }

    private onGameHide() {
        // 可选：切后台时停止动画，避免回来位置异常
        this.stopWarnAnim();
    }

    private playWarn() {
        if (GameRes.instance.warnAudio) {
            cc.audioEngine.playEffect(GameRes.instance.warnAudio, false);
        }

        if (!this.clock || !this.originPos) return;

        this.clock.stopAllActions();
        this.clock.setPosition(this.originPos);
        this.clock.angle = 0;

        cc.tween(this.clock)
            .to(0.04, { x: this.originPos.x - 6, angle: -5 })
            .to(0.04, { x: this.originPos.x + 6, angle: 5 })
            .to(0.04, { x: this.originPos.x - 4, angle: -3 })
            .to(0.04, { x: this.originPos.x + 4, angle: 3 })
            .to(0.04, { x: this.originPos.x, angle: 0 })
            .start();
    }

    private stopWarnAnim() {
        if (!this.clock || !this.originPos) return;

        this.clock.stopAllActions();
        this.clock.setPosition(this.originPos);
        this.clock.angle = 0;
    }

    public close() {
        if(this.node){
            this.node.destroy();
        }
    }
}