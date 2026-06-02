import ClientRoomManager from "../game/pj/room/ClientRoomManager";
import UIManager from "../game/pj/ui/UIManager";
import SettleManager from "./SettleManager";

const { ccclass } = cc._decorator;

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

    private label1: cc.Label = null;
    private label2: cc.Label = null;
    private labelDesc1: cc.Node = null;
    private labelDesc2: cc.Node = null;

    private btnClose: cc.Node = null;
    private btnCon: cc.Node = null;

    private finalGold: number = 0;
    private isClosing: boolean = false;

    onLoad() {
        this.bindNodes();
        this.bindEvents();
        this.init();
    }

    onDestroy() {
        this.stopAllTweens();

        if (this.btnClose) {
            this.btnClose.off(cc.Node.EventType.TOUCH_END, this.close, this);
        }

        if (this.btnCon) {
            this.btnCon.off(cc.Node.EventType.TOUCH_END, this.continueGame, this);
        }
    }

    private bindNodes(): void {
        this.mask = this.node.getChildByName("mask");
        this.panel = this.node.getChildByName("panel");

        if (!this.panel) {
            cc.error("SettlePopup 找不到 panel");
            return;
        }

        this.titleWin = this.panel.getChildByName("titleWin");
        this.titleLose = this.panel.getChildByName("titleLose");
        this.titleDraw = this.panel.getChildByName("titleDraw");

        this.goldLabel = this.getLabel(this.panel, "goldLabel");

        const pxNode = this.panel.getChildByName("px");
        if (!pxNode) {
            cc.error("SettlePopup 找不到 px");
            return;
        }

        this.labelDesc1 = pxNode.getChildByName("labelDesc1");
        this.label1 = this.getLabel(pxNode, "label1");

        this.labelDesc2 = pxNode.getChildByName("labelDesc2");
        this.label2 = this.getLabel(pxNode, "label2");

        this.btnClose = this.panel.getChildByName("btnClose");
        this.btnCon = this.panel.getChildByName("btnCon");
    }

    private bindEvents(): void {
        if (this.btnClose) {
            this.btnClose.on(cc.Node.EventType.TOUCH_END, this.close, this);
        }

        if (this.btnCon) {
            this.btnCon.on(cc.Node.EventType.TOUCH_END, this.continueGame, this);
        }
    }

    private init(): void {
        if (this.labelDesc1) {
            UIManager.instance.setFrontView(this.labelDesc1, "", 1, cc.Color.GREEN);
        }

        if (this.labelDesc2) {
            UIManager.instance.setFrontView(this.labelDesc2, "", 1, cc.Color.GREEN);
        }
    }

    public show(
        win: number,
        gold: number,
        afterGold: number,
        cardTypeName: string = "",
        detail: string = ""
    ): void {
        if (!this.node || !cc.isValid(this.node)) {
            return;
        }

        this.stopAllTweens();

        this.finalGold = gold || 0;
        this.isClosing = false;

        this.node.active = true;

        this.resetView();
        this.setTitle(win);
        this.setText(cardTypeName, detail);

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

    private resetView(): void {
        if (this.mask) {
            this.mask.opacity = 0;
        }

        if (this.panel) {
            this.panel.scale = 0.4;
            this.panel.opacity = 0;
        }

        if (this.goldLabel) {
            this.goldLabel.string = "0";
        }

        if (this.btnClose) {
            this.btnClose.active = false;
            this.btnClose.scale = 1;
        }
    }

    private setTitle(win: number): void {
        if (this.titleWin) {
            this.titleWin.active = win === SettleResult.WIN;
        }

        if (this.titleLose) {
            this.titleLose.active = win === SettleResult.LOSE;
        }

        if (this.titleDraw) {
            this.titleDraw.active = win === SettleResult.DRAW;
        }
    }

    private setText(cardTypeName: string, detail: string): void {
        if (this.label1) {
            this.label1.string = cardTypeName || "";
        }

        if (this.label2) {
            this.label2.string = detail || "";
        }
    }

    private playGoldAnim(): void {
        if (!this.goldLabel || !cc.isValid(this.goldLabel.node)) {
            this.showCloseBtnAnim();
            return;
        }

        const obj = { value: 0 };
        const finalGold = this.finalGold;

        cc.tween(obj)
            .to(0.8, { value: finalGold }, {
                progress: (start, end, current, ratio) => {
                    const value = Math.floor(start + (end - start) * ratio);

                    if (this.goldLabel && cc.isValid(this.goldLabel.node)) {
                        this.goldLabel.string = this.formatGold(value);
                    }

                    return value;
                }
            })
            .call(() => {
                if (!cc.isValid(this.node)) {
                    return;
                }

                if (this.goldLabel && cc.isValid(this.goldLabel.node)) {
                    this.goldLabel.string = this.formatGold(finalGold);
                }

                this.showCloseBtnAnim();
            })
            .start();
    }

    private showCloseBtnAnim(): void {
        if (!this.btnClose || !cc.isValid(this.btnClose)) {
            return;
        }

        this.btnClose.active = true;
        this.btnClose.scale = 0.6;

        cc.tween(this.btnClose)
            .to(0.2, { scale: 1.1 })
            .to(0.1, { scale: 1 })
            .start();
    }

    public close(): void {
        if (this.isClosing) {
            return;
        }

        this.isClosing = true;
        this.stopAllTweens();

        if (!this.panel || !cc.isValid(this.panel)) {
            this.safeDestroy();
            return;
        }

        cc.tween(this.panel)
            .to(0.15, { scale: 0.8, opacity: 0 })
            .call(() => {
                this.safeDestroy();
            })
            .start();
    }
    // 继续游戏
    private continueGame(): void {
        if (this.isClosing) {
            return;
        }
        ClientRoomManager.instance.doNextRound();
        SettleManager.close();
        UIManager.instance.readyBtnClick();
        
    }

    private getLabel(parent: cc.Node, name: string): cc.Label {
        const node = parent.getChildByName(name);

        if (!node) {
            cc.error(`SettlePopup 找不到节点: ${name}`);
            return null;
        }

        const label = node.getComponent(cc.Label);

        if (!label) {
            cc.error(`SettlePopup 节点缺少 cc.Label: ${name}`);
            return null;
        }

        return label;
    }

    private formatGold(value: number): string {
        return value > 0 ? `+${value}` : `${value}`;
    }

    private stopAllTweens(): void {
        if (this.mask) {
            cc.Tween.stopAllByTarget(this.mask);
        }

        if (this.panel) {
            cc.Tween.stopAllByTarget(this.panel);
        }

        if (this.btnClose) {
            cc.Tween.stopAllByTarget(this.btnClose);
        }
    }

    private safeDestroy(): void {
        if (this.node && cc.isValid(this.node)) {
            this.node.destroy();
        }
    }
}