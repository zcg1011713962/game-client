import GameRes from "../GameRes";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Chip extends cc.Component {

    private chipValue: number = 0;
    private chipImgMap : { [key: string]: cc.SpriteFrame } = {}; // 筹码图片资源
    private bg : cc.Sprite | null = null;
    private flyEndPos: cc.Vec2 = cc.v2(0, 0);
    private flying: boolean = false;

    protected onLoad(): void {
        const node = this.node.getChildByName("bg");
        if(!node){
           console.log("Chip bg为空");
           return;
        }
        this.bg = node.getComponent(cc.Sprite);
    }

    public init(value: number, chipImgMap : { [key: string]: cc.SpriteFrame }) {
        
        this.chipValue = value;
        this.chipImgMap = chipImgMap;
        if(!this.bg){
           console.log("筹码sprite为空");
           return;
        }
        this.bg.spriteFrame = this.chipImgMap[`chip_${this.chipValue}`];
        this.node.scale = 0;
        this.node.opacity = 255;
        this.node.angle = Math.random() * 20 - 10;
        console.log("Chip init");
    }

    public playShowAnim() {
        cc.tween(this.node)
            .to(0.12, { scale: 1.15 }, { easing: "backOut" })
            .to(0.08, { scale: 1 })
            .start();
    }

    public playFlyAnim(startPos: cc.Vec2, endPos: cc.Vec2, callback?: Function) {
        this.node.setPosition(startPos);
        this.node.scale = 0.6;
        this.flyEndPos = endPos.clone();
        this.flying = true;

        cc.tween(this.node)
            .parallel(
                cc.tween().to(0.28, { position: endPos }, { easing: "quadOut" }),
                cc.tween().to(0.28, { scale: 1 }, { easing: "backOut" }),
                cc.tween().to(0.28, { angle: this.node.angle + 360 })
            )
            .call(() => {
                this.flying = false;
                cc.audioEngine.playEffect(GameRes.instance.betAudio, false);
                if (callback) callback();
            })
            .start();
    }

    public finishFlyImmediately() {
        if (!this.node || !cc.isValid(this.node)) {
            return;
        }

        cc.Tween.stopAllByTarget(this.node);
        this.node.setPosition(this.flyEndPos);
        this.node.scale = 1;
        this.node.opacity = 255;
        this.node.angle = 0;
        this.flying = false;
    }

    public playRemoveAnim(callback?: Function) {
        cc.tween(this.node)
            .to(0.15, { scale: 0, opacity: 0 })
            .call(() => {
                if (callback) callback();
                this.node.destroy();
            })
            .start();
    }
}
