const { ccclass, property } = cc._decorator;
export enum SettleResult {
    LOSE = 0,
    DRAW = 1,
    WIN = 2,
    Banker = 3 
}

@ccclass
export default class SettlePopup extends cc.Component {

    private mask: cc.Node = null;

    private panel: cc.Node = null;

    private titleWin: cc.Node = null;

    private titleLose: cc.Node = null;

    private titleDraw: cc.Node = null;

    private goldLabel: cc.Label = null;

    private detailLabel: cc.Label = null;

    private btnClose: cc.Node = null;

    private finalGold: number = 0;

    onLoad() {
        this.mask = this.node.getChildByName("mask");
        this.panel = this.node.getChildByName("panel");
        this.titleWin = this.panel.getChildByName("titleWin");
        this.titleLose = this.panel.getChildByName("titleLose");
        this.titleDraw = this.panel.getChildByName("titleDraw");
        this.goldLabel = this.panel.getChildByName("goldLabel").getComponent(cc.Label);
        this.detailLabel = this.panel.getChildByName("detailLabel").getComponent(cc.Label);
        this.btnClose = this.panel.getChildByName("btnClose");

        this.btnClose.on(cc.Node.EventType.TOUCH_END, this.close, this);
    }

    public show(win: number, gold: number, detail: string = "") {
        this.finalGold = gold;

        this.node.active = true;

        this.mask.opacity = 0;
        this.panel.scale = 0.4;
        this.panel.opacity = 0;
        console.log("settle show", win, gold, detail)
        if(win === SettleResult.WIN){
             this.titleWin.active = true;
             this.titleLose.active = false;
             this.titleDraw.active = false;

        }else if(win === SettleResult.LOSE){
             this.titleWin.active = false;
             this.titleLose.active = true;
             this.titleDraw.active = false;

        }else if(win === SettleResult.DRAW){
             this.titleWin.active = false;
             this.titleLose.active = false;
             this.titleDraw.active = true;
        }

        this.goldLabel.string = "0";
        this.detailLabel.string = detail;
        this.btnClose.active = false;

        cc.tween(this.mask)
            .to(0.2, { opacity: 160 })
            .start();

        cc.tween(this.panel)
            .to(0.25, { scale: 1.15, opacity: 255 }, { easing: "backOut" })
            .to(0.1, { scale: 1 })
            .call(() => {
                this.playGoldAnim();
            })
            .start();
    }

    private playGoldAnim() {
        const obj = { value: 0 };

        cc.tween(obj)
            .to(0.8, { value: this.finalGold }, {
                progress: (start, end, current, ratio) => {
                    const value = Math.floor(start + (end - start) * ratio);
                    this.goldLabel.string = value > 0 ? `+${value}` : `${value}`;
                    return value;
                }
            })
            .call(() => {
                this.goldLabel.string =
                    this.finalGold > 0 ? `+${this.finalGold}` : `${this.finalGold}`;

                this.btnClose.active = true;
                this.btnClose.scale = 0.6;

                cc.tween(this.btnClose)
                    .to(0.2, { scale: 1.1 })
                    .to(0.1, { scale: 1 })
                    .start();
            })
            .start();
    }

    private close() {
        cc.tween(this.panel)
            .to(0.15, { scale: 0.8, opacity: 0 })
            .call(() => {
                this.node.destroy();
            })
            .start();
    }
}