const { ccclass, property } = cc._decorator;
import UserData from "../../login/entity/UserData";
import {SceneData, SceneUtil} from "../../util/SceneUtil";
import ClientRoomManager from "../pj/room/ClientRoomManager";
import { UserState } from "../pj/user/UserInfo";
import ToastManager from "../../common/ToastManager";
import WsClient from "../pj/net/WsClient";
import { Cmd } from "../pj/enum/Cmd";

export interface RoomBarData {
    roomId: number | string;
    curPlayer: number;
    baseScore: number;
}

@ccclass
export class RooomTopBar extends cc.Component {

    private btnBack: cc.Node = null;

    private btnRule: cc.Node = null;

    private btnSetting: cc.Node = null;

    private btnMore: cc.Node = null;

    private roomIdLabel: cc.Node = null;

    private playerNumLabel: cc.Node = null;

    private baseScoreLabel: cc.Node = null;


    onLoad() {
        this.btnBack = this.node.getChildByName("btnBack");
        this.btnRule = this.node.getChildByName("btnRule");
        this.btnSetting = this.node.getChildByName("btnSetting");
        this.btnMore = this.node.getChildByName("btnMore");
       
        this.roomIdLabel = cc.find("RoomGroup/roomIdLabel", this.node);
        this.playerNumLabel = cc.find("NumGroup/NumLabel", this.node);
        this.baseScoreLabel = cc.find("BaseScoreGroup/ScoreLabel", this.node);
            
        this.bindBtn(this.btnBack, this.onBackClick);
        this.bindBtn(this.btnRule, this.onRuleClick);
        this.bindBtn(this.btnSetting, this.onSettingClick);

    }

 

    public setRoomInfo(data: RoomBarData) {
        this.setText(
            this.roomIdLabel,
            `${data.roomId}`,
            new cc.Color(255, 245, 120),
            cc.Color.BLACK,
            3
        );

        this.setText(
            this.playerNumLabel,
            `${data.curPlayer}`,
            new cc.Color(255, 245, 120),
            cc.Color.BLACK,
            3
        );

        this.setText(
            this.baseScoreLabel,
            `${data.baseScore}`,
            new cc.Color(255, 245, 120),
            cc.Color.BLACK,
            3
        );
    }

    private bindBtn(node: cc.Node, handler: Function) {
        if (!node) return;
        node.on(cc.Node.EventType.TOUCH_END, handler, this);
    }

    private onBackClick() {
        const user = UserData.get();
        if(user){
            const userStatus = ClientRoomManager.instance.getPlayerStatusByUserId(user.userId);
            const roomId = ClientRoomManager.instance.getRoomId();
            if(userStatus === UserState.Ready || userStatus === UserState.Playing){
                console.log("当前状态不允许返回 status:", userStatus);
                ToastManager.show("非空闲状态不允许返回");
                return;
            }
            // 返回
            WsClient.instance.send(Cmd.LEAVE_ROOM, {roomId: roomId});
            cc.director.loadScene("hall");
        }
    }

    private onRuleClick() {
        cc.log("打开规则");
    }

    private onSettingClick() {
        cc.log("打开设置");
    }

    private setText(
        labelNode: cc.Node,
        text: string,
        fontColor: cc.Color,
        outlineColor: cc.Color,
        outlineWidth: number
    ) {
        if (!labelNode) return;

        const label = labelNode.getComponent(cc.Label);
        if(!label){
            return;
        }
        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
            outline = labelNode.addComponent(cc.LabelOutline);
            outline.color = outlineColor;
            outline.width = outlineWidth;
        }
        label.string = text;
        label.node.color = fontColor;

    }
}