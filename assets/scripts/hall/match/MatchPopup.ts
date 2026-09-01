import HallRes from "../HallRes";

const { ccclass } = cc._decorator;

@ccclass
export default class MatchPopup extends cc.Component {
    private mask: cc.Node = null;
    private panel: cc.Node = null;
    private titleLabel: cc.Label = null;
    private tipLabel: cc.Label = null;
    private timerLabel: cc.Label = null;
    private statusLabel: cc.Label = null;
    private cancelButton: cc.Node = null;
    private onCancelHandler: () => void = null;
    private elapsedSeconds: number = 0;

    public show(onCancel?: () => void): void {
        this.onCancelHandler = onCancel || null;
        this.bindNodes();
        this.applySprites();
        this.applyText();
        this.bindEvents();
        this.startTimer();
        this.playShowAnim();
        this.node.active = true;
    }

    public hide(): void {
        this.stopTimer();
        this.node.active = false;
    }

    private bindNodes(): void {
        this.mask = cc.find("Mask", this.node);
        this.panel = cc.find("Panel", this.node);
        this.titleLabel = this.getLabel("Panel/TitleLabel");
        this.tipLabel = this.getLabel("Panel/TipLabel");
        this.timerLabel = this.getLabel("Panel/TimerLabel");
        this.statusLabel = this.getLabel("Panel/StatusLabel");
        this.cancelButton = cc.find("Panel/CancelButton", this.node);

        if (this.mask && !this.mask.getComponent(cc.BlockInputEvents)) {
            this.mask.addComponent(cc.BlockInputEvents);
        }
    }

    private applySprites(): void {
        this.setSprite("Panel/Bg", "match_popup_bg");
        this.setSprite("Panel/TitleBg", "match_title_bg");
        this.setSprite("Panel/CancelButton/BtnBg", "match_cancel_btn");
    }

    private applyText(): void {
        this.setLabel(this.titleLabel, "匹配中", new cc.Color(255, 255, 255), 30);
        this.setLabel(this.tipLabel, "正在寻找对手，请稍候...", new cc.Color(220, 235, 255), 18);
        this.setLabel(this.statusLabel, "竞技匹配", new cc.Color(185, 215, 255), 18);
        const cancelLabel = this.getLabel("Panel/CancelButton/Label");
        this.setLabel(cancelLabel, "取消匹配", new cc.Color(235, 245, 255), 20);
        this.updateTimerLabel();
    }

    private bindEvents(): void {
        if (!this.cancelButton) {
            return;
        }

        this.cancelButton.targetOff(this);
        this.cancelButton.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
            this.hide();
            if (this.onCancelHandler) {
                this.onCancelHandler();
            }
        }, this);
    }

    private startTimer(): void {
        this.stopTimer();
        this.elapsedSeconds = 0;
        this.updateTimerLabel();
        this.schedule(this.tickTimer, 1);
    }

    private stopTimer(): void {
        this.unschedule(this.tickTimer);
    }

    private tickTimer(): void {
        this.elapsedSeconds += 1;
        this.updateTimerLabel();
    }

    private updateTimerLabel(): void {
        if (!this.timerLabel) {
            return;
        }

        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = this.elapsedSeconds % 60;
        this.timerLabel.string = `${this.pad2(minutes)}:${this.pad2(seconds)}`;
    }

    private playShowAnim(): void {
        if (!this.panel) {
            return;
        }

        cc.Tween.stopAllByTarget(this.panel);
        this.panel.opacity = 0;
        this.panel.scale = 0.88;
        cc.tween(this.panel)
            .to(0.18, { opacity: 255, scale: 1 }, { easing: "backOut" })
            .start();

        if (this.statusLabel) {
            cc.Tween.stopAllByTarget(this.statusLabel.node);
            this.statusLabel.node.opacity = 255;
            cc.tween(this.statusLabel.node)
                .repeatForever(
                    cc.tween()
                        .to(0.65, { opacity: 130 })
                        .to(0.65, { opacity: 255 })
                )
                .start();
        }
    }

    private setSprite(path: string, assetName: string): void {
        const node = cc.find(path, this.node);
        if (!node) {
            return;
        }

        const sprite = node.getComponent(cc.Sprite);
        const spriteFrame = HallRes.instance.matchImgMap[assetName];
        if (sprite && spriteFrame) {
            sprite.spriteFrame = spriteFrame;
        }
    }

    private getLabel(path: string): cc.Label {
        const node = cc.find(path, this.node);
        return node ? node.getComponent(cc.Label) : null;
    }

    private setLabel(label: cc.Label, text: string, color: cc.Color, fontSize: number): void {
        if (!label) {
            return;
        }

        label.string = text;
        label.fontSize = fontSize;
        label.node.color = color;
    }

    private pad2(value: number): string {
        return value < 10 ? `0${value}` : `${value}`;
    }

    protected onDestroy(): void {
        this.stopTimer();
        if (this.cancelButton) {
            this.cancelButton.targetOff(this);
        }
        if (this.panel) {
            cc.Tween.stopAllByTarget(this.panel);
        }
        if (this.statusLabel) {
            cc.Tween.stopAllByTarget(this.statusLabel.node);
        }
    }
}
