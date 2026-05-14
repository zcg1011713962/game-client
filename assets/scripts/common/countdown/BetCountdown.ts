import GameRes from "../../game/pj/GameRes";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ClockCountdown extends cc.Component {

    private clock: cc.Node = null;

    private timeLabel: cc.Label = null;

    private warnSecond: number = 5;

    private totalTime = 0;
    private leftTime = 0;
    private running = false;
    private lastSecond = -1;
    private finishCb: Function = null;
    private originPos: cc.Vec3 = null;

    onLoad() {
        if (this.clock) {
            this.originPos = this.clock.position.clone();
        }
        this.clock = this.node.getChildByName("clock");
        this.timeLabel = this.node.getChildByName("timeLabel").getComponent(cc.Label);
    }

    public startCountdown(seconds: number, finishCb?: Function) {
        this.totalTime = seconds;
        this.leftTime = seconds;
        this.running = true;
        this.finishCb = finishCb;
        this.lastSecond = -1;

        this.node.active = true;
        this.updateView();
    }

    public stopCountdown() {
        this.running = false;
        this.stopWarnAnim();
    }

    update(dt: number) {
        if (!this.running) return;

        this.leftTime -= dt;

        if (this.leftTime <= 0) {
            this.leftTime = 0;
            this.running = false;
            this.updateView();
            this.stopWarnAnim();

            if (this.finishCb) {
                this.finishCb();
            }
            return;
        }

        this.updateView();
    }

    private updateView() {
        const sec = Math.ceil(this.leftTime);

        if (this.timeLabel) {
            this.timeLabel.string = sec.toString();
        }

        if (sec !== this.lastSecond) {
            this.lastSecond = sec;

            if (sec > 0 && sec <= this.warnSecond) {
                this.playWarn();
            }
        }
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

    public close(){
        this.node.destroy();
    }

}