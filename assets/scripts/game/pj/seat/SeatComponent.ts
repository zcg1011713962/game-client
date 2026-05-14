const { ccclass } = cc._decorator;
import { UserInfo, UserState } from "../user/UserInfo";
import { SeatData, SeatState } from "./SeatData";
import UIManager from "../ui/UIManager";
import CurrUserManager from "../user/CurrUserManager";
import ClientRoomManager from "../room/ClientRoomManager";
import { RoomState } from "../room/RoomState";

@ccclass
export default class SeatComponent extends cc.Component {
    // 普通座位
    private normalNode: cc.Node = null;
    // 高亮座位
    private hoverNode: cc.Node = null;
    // 坐下
    private setOut: cc.Node = null;
    // 座位预制体数据
    private seatData: SeatData = null;

    private avatarMap : { [key: string]: cc.SpriteFrame } = {}; // 头像图片资源

    onLoad() {
        this.normalNode = this.node.getChildByName("Normal");
        this.hoverNode = this.node.getChildByName("Hover");
        this.setOut = this.node.getChildByName("SetOut");
        this.setHover(false);
        this.setSetOut(false);
        this.setStautsReady(-1);


        this.node.on(cc.Node.EventType.MOUSE_ENTER, this.onEnter, this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onLeave, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onClick, this);
    }

    public init(seatData: SeatData, avatarMap : { [key: string]: cc.SpriteFrame }){
        this.avatarMap = avatarMap;
        this.setData(seatData);
    }

    /**
     * 更新座位数据
     */
    public setData(seatData: SeatData) {
        this.seatData = seatData;
        this.updateView();
    }

    public getData() {
        return this.seatData;
    }


    /**
     * 更新座位UI状态
     */
    private updateView() {
        const roomState = ClientRoomManager.instance.getRoomState();
        //console.log("更新UI用户信息", this.seatData.id, this.seatData.userInfo, "roomStatus",  roomState);
        this.node.active = true;
        // 清理 UI
        // 普通座位
        this.setNormal(false);
        // 高亮座位
        this.setHover(false);
        // 金币 昵称
        this.setSetOut(false);
        // 准备状态
        this.setStautsReady(-1);
        // 庄家
        this.setBankerView(false);
        // 输赢
        this.setResultStatusView(-1);

        
        if (!this.seatData.userInfo){ // 更换座位
            if(roomState === RoomState.WAIT || roomState === RoomState.READY){
                this.setNormal(true);
            }else{
                this.node.active = false;
            }
            return;
        }

        const state = this.seatData.userInfo.state;
        const userId =  this.seatData.userInfo.userId;
    
        if(userId === ClientRoomManager.instance.getMyUserId()){
            UIManager.instance.setStartBtnStatus(false);
            UIManager.instance.setCancelReadyBtnStatus(false);
        }

        switch (state) {
            case UserState.Idle:
                this.setNormal(true);
                break;
            case UserState.Sit:
                this.setSetOut(true);
                this.setStautsReady(0);
                // 自己入座状态
                if (userId === ClientRoomManager.instance.getMyUserId()) {
                    UIManager.instance.setStartBtnStatus(true);
                }
                break;
            case UserState.Ready:
                if (userId === ClientRoomManager.instance.getMyUserId()) {
                    UIManager.instance.setCancelReadyBtnStatus(true);
                }
                this.setSetOut(true);
                this.setStautsReady(1);
                break;
            case UserState.Playing:
                this.setSetOut(true);
                this.setBankerView(true);
                break;
        }

    }



    private onEnter() {
        if (this.seatData.state === SeatState.EMPTY) {
            this.setHover(true);
        }
    }

    private onLeave() {
        this.setHover(false);
    }

    private onClick() {
        if (this.seatData.state !== SeatState.EMPTY) return;
        console.log('座位预制体状态:', this.seatData.id, this.seatData.state)
        // 通知 SeatManager
        cc.systemEvent.emit("SEAT_CLICK", this.seatData.id);
    }

    /**
     * 高亮座位控制
     */
    private setHover(active: boolean) {
        this.hoverNode.active = active;
    }

    /**
     * 普通座位控制
     */
    private setNormal(active: boolean) {
        this.normalNode.active = active;
    }


    /**
     * 坐下
     */
    private setSetOut(active: boolean) {
        // 获取玩家数据
        const bankerSeat = ClientRoomManager.instance.getBankerSeat();
        
        if(active && this.seatData && this.seatData.userInfo){
            const userInfo = this.seatData.userInfo;
            const info = this.setOut.getChildByName("Info");
            const avatarNode = this.setOut.getChildByName("Avatars");

            const avatarSprite = this.getAvatarSprite(userInfo);
            // 头像
            if(avatarSprite){
                const avatarSpriteNode = avatarNode.getComponent(cc.Sprite);
                avatarSpriteNode.spriteFrame = avatarSprite;
            }
            
            // 昵称
            const name = this.setOut.getChildByName("Name");
            const nicknameNode = name.getChildByName("nickname");
            UIManager.instance.setNickNameView(nicknameNode, bankerSeat === userInfo.seatId, CurrUserManager.getInstance().currentUserId === userInfo.userId , userInfo.nickname);

            // 金币展示
            const coinValNode = info.getChildByName("CoinVal");
            UIManager.instance.setCoinView(coinValNode, userInfo.gold);

        }
        // 预制体显示
        this.setOut.active = active;
    }

    private getAvatarSprite(userInfo : UserInfo){
        const key = `avatar_${userInfo.avatar}`;
        const spriteFrame = this.avatarMap[key];
        if (!spriteFrame) {
            console.error("找不到头像:", key);
            return;
        }
        return spriteFrame; 
    }


    /**
     * 状态
     */
    private setStautsReady(status: number) {
        const statusNode =this.setOut.getChildByName("Status");
        if(status == 0){ // 显示未准备
            statusNode.getChildByName("Status1").active = true;
            statusNode.getChildByName("Status2").active = false;
        }else if(status == 1){ // 显示已准备
            statusNode.getChildByName("Status1").active = false;
            statusNode.getChildByName("Status2").active = true;
        }else{ // 不显示
            statusNode.getChildByName("Status1").active = false;
            statusNode.getChildByName("Status2").active = false;
        }
    }
    /**
     * 
     * 庄家闲家
     */
    private setBankerView(active: boolean) {
        const bankerLabelNode = this.setOut.getChildByName("Banker").getChildByName("Label1");
        // 获取玩家数据
        const bankerSeat = ClientRoomManager.instance.getBankerSeat();
        if(active && this.seatData && this.seatData.userInfo){
            const userInfo = this.seatData.userInfo;
            const isBanker = bankerSeat === userInfo.seatId;
            const txt = isBanker ? "庄" : "闲"; 
            if(bankerSeat > -1 && bankerLabelNode){
                const lable = bankerLabelNode.getComponent(cc.Label);
                if(lable){
                    lable.string = txt;
                    let outline = bankerLabelNode.getComponent(cc.LabelOutline);
                    if (!outline) {
                        outline = bankerLabelNode.addComponent(cc.LabelOutline);
                    }
                    // 黑色描边
                    outline.color = cc.Color.BLACK;
                    // 宽度
                    if(isBanker){
                        // 设置字体颜色
                        lable.node.color = cc.Color.YELLOW;
                        outline.width = 5;
                    }else{
                        lable.node.color = cc.Color.WHITE;
                        outline.width = 2;
                    }
                }
            }
         }
         bankerLabelNode.active = active;
       
    }


    /**
     * 
     * 输赢平
     */
    public setResultStatusView(result: number) {
        const bankerLabelNode = this.setOut.getChildByName("Banker").getChildByName("Label2");
        if(bankerLabelNode && result > 0){
            const label = bankerLabelNode.getComponent(cc.Label);
            let outline = bankerLabelNode.getComponent(cc.LabelOutline);
            if (!outline) {
                outline = bankerLabelNode.addComponent(cc.LabelOutline);
                // 黑色描边
                outline.color = cc.Color.BLACK;
                // 宽度
                outline.width = 5;
            }
            if (result == 0) {
                label.string = "输";
                label.node.color = new cc.Color(255, 0, 0); // 红色
            } else if (result == 1) {
                label.string = "平";
                label.node.color = new cc.Color(255, 215, 0); // 金黄色
            } else if(result == 2){
               label.string = "赢";
               label.node.color = new cc.Color(0, 255, 0); // 绿色
            } else if(result == 3){
               label.string = "--";
               label.node.color = cc.Color.WHITE; 
            }
             bankerLabelNode.active = true;
             console.log("展示输赢")
        }else{
             bankerLabelNode.active = false;
        }
    }

}