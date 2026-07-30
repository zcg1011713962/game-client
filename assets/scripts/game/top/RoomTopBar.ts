const { ccclass } = cc._decorator;
import UserData from "../../login/entity/UserData";
import ClientRoomManager from "../pj/room/ClientRoomManager";
import { UserState } from "../pj/user/UserInfo";
import ToastManager from "../../common/ToastManager";
import WsClient from "../pj/net/WsClient";
import { Cmd } from "../pj/enum/Cmd";
import HallRes from "../../hall/HallRes";
import { ShareRoomUtil } from "../../util/SceneUtil";

export interface RoomBarData {
    roomId: number;
    curPlayer: number;
    baseScore: number;
}

@ccclass
export class RooomTopBar extends cc.Component {

    private btnBack: cc.Node = null;

    private shareRule: cc.Node = null;

    private btnRecord: cc.Node = null;

    private btnMore: cc.Node = null;

    private roomIdLabel: cc.Node = null;

    private playerNumLabel: cc.Node = null;

    private baseScoreLabel: cc.Node = null;

    private roomId: number = null;

    private hallRecordPopupNode: cc.Node = null;

    private openingRecord: boolean = false;


    onLoad() {
        this.btnBack = this.node.getChildByName("btnBack");
        this.shareRule = this.node.getChildByName("shareRule");
        this.btnRecord = this.node.getChildByName("btnRecord");
        this.btnMore = this.node.getChildByName("btnMore");
       
        this.roomIdLabel = cc.find("RoomGroup/roomIdLabel", this.node);
        this.playerNumLabel = cc.find("NumGroup/NumLabel", this.node);
        this.baseScoreLabel = cc.find("BaseScoreGroup/ScoreLabel", this.node);
            
        this.bindBtn(this.btnBack, this.onBackClick);
        this.bindBtn(this.shareRule, this.onShareRuleClick);
        this.bindBtn(this.btnRecord, this.onRecordClick);

    }

 

    public setRoomInfo(data: RoomBarData) {
        if(data.roomId){
            this.roomId = data.roomId;
            this.setText(
                this.roomIdLabel,
                `${data.roomId}`,
                new cc.Color(255, 245, 120),
                cc.Color.BLACK,
                3
            );
        }
        
        if(data.curPlayer > -1){
            this.setText(
                this.playerNumLabel,
                `${data.curPlayer}`,
                new cc.Color(255, 245, 120),
                cc.Color.BLACK,
                3
            );
        }
        
        if(data.baseScore > -1){
            this.setText(
                this.baseScoreLabel,
                `${data.baseScore}`,
                new cc.Color(255, 245, 120),
                cc.Color.BLACK,
                3
            );
        }
        
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
        }
    }

    private async onShareRuleClick() {
        const roomId = this.roomId || ClientRoomManager.instance.getRoomId();
        if (!roomId || roomId <= 0) {
            ToastManager.show("房间号不存在");
            return;
        }

        try {
            const data = await this.createInvite(roomId);
            const invite = data && data.invite ? String(data.invite) : "";
            if (!ShareRoomUtil.isValidInviteCode(invite)) {
                cc.log("服务端返回的邀请码无效:", data);
                ToastManager.show("生成邀请链接失败");
                return;
            }

            const url = ShareRoomUtil.createShareUrl(invite);
            cc.log("房间分享链接:", url);
            await ShareRoomUtil.copyText(url);
            ToastManager.show("房间链接已复制");
        } catch (e) {
             cc.error("生成邀请链接失败:", e);
            ToastManager.show("生成邀请链接失败");
        }
    }

    private createInvite(roomId: number): Promise<any> {
        return new Promise((resolve, reject) => {
            let finished = false;
            let onResult: Function = null;
            const timeout = setTimeout(() => {
                if (finished) {
                    return;
                }

                finished = true;
                cc.systemEvent.off(Cmd.CREATE_INVITE_RESULT, onResult);
                reject("create invite timeout");
            }, 5000);

            onResult = (data: any) => {
                if (finished) {
                    return;
                }

                finished = true;
                clearTimeout(timeout);
                cc.systemEvent.off(Cmd.CREATE_INVITE_RESULT, onResult);
                resolve(data);
            };

            cc.systemEvent.on(Cmd.CREATE_INVITE_RESULT, onResult);
            WsClient.instance.send(Cmd.CREATE_INVITE, {roomId: roomId});
        });
    }

    private async onRecordClick() {
        cc.log("打开大厅战绩");

        const canvas = cc.find("Canvas");
        if (!canvas) {
            ToastManager.show("打开战绩失败");
            return;
        }

        if (this.hallRecordPopupNode && cc.isValid(this.hallRecordPopupNode)) {
            this.hallRecordPopupNode.active = true;
            const popup = this.hallRecordPopupNode.getComponent("HallRecordPopup") as any;
            if (popup) {
                popup.loadFirstPage(null);
            }
            return;
        }

        if (this.openingRecord) {
            return;
        }

        this.openingRecord = true;
        try {
            const res = HallRes.instance;
            if (!res.hallRecordPopupPrefab) {
                res.hallRecordPopupPrefab = await res.loadPrefab("prefabs/HallRecordPopup");
            }

            if (!res.hallRecordItemPrefab) {
                res.hallRecordItemPrefab = await res.loadPrefab("prefabs/HallRecordItem");
            }

            if (Object.keys(res.recordImgMap).length === 0) {
                await res.loadRecordImg();
            }

            if (!cc.isValid(this.node) || !cc.isValid(canvas)) {
                return;
            }

            const popupNode = cc.instantiate(res.hallRecordPopupPrefab);
            canvas.addChild(popupNode);
            this.hallRecordPopupNode = popupNode;

            const popup = popupNode.getComponent("HallRecordPopup") as any;
            if (popup) {
                popup.loadFirstPage(null);
            }
        } catch (e) {
            cc.error("打开大厅战绩失败:", e);
            ToastManager.show("打开战绩失败");
        } finally {
            this.openingRecord = false;
        }
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

    public setRoundInfo(currentRound: number, maxRound: number): void {
        // 兼容旧接口：局数显示已迁移到 GameUIManager 的 RoundView。
    }
}
