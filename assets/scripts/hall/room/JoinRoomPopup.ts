import { Cmd } from "../../game/pj/enum/Cmd";
import WsClient from "../../game/pj/net/WsClient";
import UserData from "../../login/entity/UserData";
import { SceneUtil } from "../../util/SceneUtil";
import HallUIManager from "../HallUIManager";
import { RoomCardType } from "./RoomSelectPopup";

const { ccclass, property } = cc._decorator;

@ccclass
export default class JoinRoomPopup extends cc.Component {

    private panel: cc.Node = null!;
    private closeBtn: cc.Node = null!;
    private enterBtn: cc.Node = null!;

    private inputItems: cc.Node[] = [];
    private keyRoot: cc.Node = null!;

    private roomId: string = "";
    private readonly maxLen: number = 6;

    onLoad() {
        this.node.active = false;

        this.panel = this.node.getChildByName("Panel");

        this.closeBtn = this.panel.getChildByName("CloseBtn");
        this.enterBtn = this.panel.getChildByName("EnterBtn");

        const inputRoot = this.panel.getChildByName("InputRoot");
        this.inputItems = inputRoot.children;

        this.keyRoot = this.panel.getChildByName("Keyboard");

        this.bindEvents();
    }

    private bindEvents() {
        this.closeBtn.on(cc.Node.EventType.TOUCH_END, this.close, this);
        this.enterBtn.on(cc.Node.EventType.TOUCH_END, this.onEnterRoom, this);

        for (let i = 0; i <= 9; i++) {
            const key = this.keyRoot.getChildByName("Key" + i);
            if (key) {
                key.on(cc.Node.EventType.TOUCH_END, () => {
                    this.inputNumber(i);
                }, this);
            }
        }

        const delBtn = this.keyRoot.getChildByName("KeyDel");
        const clearBtn = this.keyRoot.getChildByName("KeyClear");

        delBtn && delBtn.on(cc.Node.EventType.TOUCH_END, this.deleteNumber, this);
        clearBtn && clearBtn.on(cc.Node.EventType.TOUCH_END, this.clearNumber, this);
    }

    show() {
        this.node.active = true;
        this.roomId = "";
        this.refreshInput();

        this.panel.scale = 0.85;
        this.panel.opacity = 0;

        cc.tween(this.panel)
            .to(0.25, {
                scale: 1,
                opacity: 255
            }, { easing: "backOut" })
            .start();
    }

    hide() {

        cc.tween(this.panel)
            .to(0.15, {
                scale: 0.85,
                opacity: 0
            })
            .call(() => {
                this.node.active = false;
            })
            .start();
    }

    close(){
        this.hide();
        HallUIManager.instance.roomSelectPanelShow();
    }

    private inputNumber(num: number) {
        if (this.roomId.length >= this.maxLen) {
            return;
        }

        this.roomId += num.toString();
        this.refreshInput();
    }

    private deleteNumber() {
        if (this.roomId.length <= 0) {
            return;
        }

        this.roomId = this.roomId.substring(0, this.roomId.length - 1);
        this.refreshInput();
    }

    private clearNumber() {
        this.roomId = "";
        this.refreshInput();
    }

    private refreshInput() {
        for (let i = 0; i < this.inputItems.length; i++) {
            const item = this.inputItems[i];
            const label = item.getComponentInChildren(cc.Label);

            if (label) {
                label.string = this.roomId[i] || "";
            }
        }
    }

    private onEnterRoom() {
        if (this.roomId.length < this.maxLen) {
            cc.log("请输入完整房号");
            return;
        }
        cc.log("进房，房号：", this.roomId);
        // 加入房间
        WsClient.instance.send(Cmd.ENTER_ROOM, {roomId: this.roomId});
    }
}