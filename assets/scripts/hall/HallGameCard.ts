import HallRes from "./HallRes";
import ToastManager from "../common/ToastManager";

const { ccclass } = cc._decorator;

export interface HallGameCardData {
    id: number;
    gameCode?: string;
    title: string;
    desc: string;
    online: string;
    tag: "hot" | "new" | "";
    cover: string;
    bgAsset?: string;
    buttonAsset?: string;
    enabled: boolean;
    matchEnabled?: boolean;
    roomEnabled?: boolean;
}

@ccclass
export default class HallGameCard extends cc.Component {
    private data: HallGameCardData = null;
    private clickHandler: (data: HallGameCardData) => void = null;

    public init(data: HallGameCardData, clickHandler: (data: HallGameCardData) => void): void {
        this.data = data;
        this.clickHandler = clickHandler;

        this.setupLayout();
        this.refreshView();
        this.bindClick();
    }

    private setupLayout(): void {
        this.ensureSize(this.node, 250, 560);
        this.ensureNodeSize("Bg", 250, 560);
        this.ensureNodeSize("Cover", 230, 300);
        this.ensureNodeSize("Tag", 76, 42);
        this.ensureNodeSize("BtnStart", 178, 66);
        this.ensureNodeSize("ComingSoonMask", 250, 560);

        this.setPositionIfZero("Cover", 0, 115);
        this.setPositionIfZero("Tag", -78, 248);
        this.setPositionIfZero("TitleLabel", 0, -92);
        this.setPositionIfZero("DescLabel", 0, -135);
        this.setPositionIfZero("OnlineGroup", 0, -178);
        this.setPositionIfZero("BtnStart", 0, -245);
        this.setPositionIfZero("ComingSoonMask", 0, 0);

        const onlineGroup = this.node.getChildByName("OnlineGroup");
        if (onlineGroup) {
            this.ensureSize(onlineGroup, 150, 32);
            const dot = onlineGroup.getChildByName("Dot");
            if (dot) {
                this.ensureSize(dot, 16, 16);
                this.setPositionIfZero("OnlineGroup/Dot", -58, 0);
            }
            this.setPositionIfZero("OnlineGroup/OnlineLabel", 12, 0);
        }
    }

    private refreshView(): void {
        const imgMap = HallRes.instance.centerImgMap;
        this.setSprite("Bg", this.data.bgAsset || (this.data.enabled ? "hall_game_card_bg" : "hall_game_card_disabled_bg"), imgMap);
        this.setSprite("Cover", this.data.cover, imgMap);
        this.setSprite("Tag", this.data.tag === "hot" ? "hall_tag_hot" : this.data.tag === "new" ? "hall_tag_new" : "", imgMap);
        this.setSprite("OnlineGroup/Dot", "hall_online_dot", imgMap);
        this.setSprite("BtnStart", this.data.enabled ? (this.data.buttonAsset || "hall_btn_start_small") : "", imgMap);
        this.setSprite("ComingSoonMask", this.data.enabled ? "" : "hall_game_card_disabled_bg", imgMap);

        this.setLabel("TitleLabel", this.data.title, new cc.Color(255, 245, 220));
        this.setLabel("DescLabel", this.data.desc, new cc.Color(210, 220, 245));
        this.setLabel("OnlineGroup/OnlineLabel", this.data.online, new cc.Color(220, 235, 230));

        const tag = this.node.getChildByName("Tag");
        if (tag) {
            tag.active = !!this.data.tag;
        }

        const mask = this.node.getChildByName("ComingSoonMask");
        if (mask) {
            mask.active = !this.data.enabled;
            mask.opacity = 160;
        }
    }

    private bindClick(): void {
        this.node.targetOff(this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);

        const btn = this.node.getChildByName("BtnStart");
        if (btn) {
            btn.targetOff(this);
            btn.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        }
    }

    private onTouchEnd(event: cc.Event.EventTouch): void {
        event.stopPropagation();
        this.onClick();
    }

    private onClick(): void {
        if (!this.data) {
            return;
        }

        if (!this.data.enabled || this.data.matchEnabled === false) {
            ToastManager.show("敬请期待");
            return;
        }

        if (this.clickHandler) {
            this.clickHandler(this.data);
        }
    }

    private setSprite(path: string, name: string, imgMap: { [key: string]: cc.SpriteFrame }): void {
        const node = this.findNode(path);
        if (!node) {
            return;
        }

        if (!name) {
            node.active = false;
            return;
        }

        const sprite = node.getComponent(cc.Sprite);
        const frame = imgMap[name];
        if (!sprite || !frame) {
            return;
        }

        node.active = true;
        sprite.spriteFrame = frame;
    }

    private setLabel(path: string, text: string, color: cc.Color): void {
        const node = this.findNode(path);
        if (!node) {
            return;
        }

        const label = node.getComponent(cc.Label);
        if (!label) {
            return;
        }

        label.string = text;
        node.color = color;
    }

    private ensureNodeSize(path: string, width: number, height: number): void {
        const node = this.findNode(path);
        if (node) {
            this.ensureSize(node, width, height);
        }
    }

    private ensureSize(node: cc.Node, width: number, height: number): void {
        if (node.width <= 0) {
            node.width = width;
        }
        if (node.height <= 0) {
            node.height = height;
        }
    }

    private setPositionIfZero(path: string, x: number, y: number): void {
        const node = this.findNode(path);
        if (node && node.x === 0 && node.y === 0) {
            node.setPosition(x, y);
        }
    }

    private findNode(path: string): cc.Node {
        return cc.find(path, this.node);
    }

    protected onDestroy(): void {
        this.node.targetOff(this);

        const btn = this.node.getChildByName("BtnStart");
        if (btn) {
            btn.targetOff(this);
        }
    }
}
