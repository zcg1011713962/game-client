const { ccclass } = cc._decorator;
import { UserInfo, UserState } from "../user/UserInfo";
import { SeatData, SeatState } from "./SeatData";
import UIManager from "../ui/UIManager";

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
        this.setStautsReady(false);


        this.node.on(cc.Node.EventType.MOUSE_ENTER, this.onEnter, this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onLeave, this);
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onClick, this);
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
        if (!this.seatData) return;

        switch (this.seatData.state) {
            case SeatState.EMPTY: 
                this.setNormal(true);
                this.setHover(false);
                break;

            case SeatState.OCCUPIED: 
                this.setNormal(false);
                this.setHover(false);
                this.setSetOut(true); 
                break;

            case SeatState.LOCKED:
                this.setNormal(false);
                this.setHover(false);
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
        // console.log("seatData", this.seatData);
        // if(this.seatData){
        //     console.log("userInfo", this.seatData.userInfo);
        // }
        if(this.seatData && this.seatData.userInfo){
            const userInfo = this.seatData.userInfo;
            const info = this.setOut.getChildByName("Info");
            const avatarNode = this.setOut.getChildByName("Avatars");

            const avatarSprite = this.getAvatarSprite(userInfo);
            if(avatarSprite){
                const avatarSpriteNode = avatarNode.getComponent(cc.Sprite);
                avatarSpriteNode.spriteFrame = avatarSprite;
            }
            
            const coinValNode = info.getChildByName("CoinVal");
            coinValNode.getComponent(cc.Label).string = String(userInfo.gold);
            const name = this.setOut.getChildByName("Name");
            const nicknameNode = name.getChildByName("nickname");
            nicknameNode.getComponent(cc.Label).string = userInfo.nickname;

            console.log(userInfo.userId, userInfo.nickname, userInfo.gold)
            if(userInfo.state == UserState.Ready){
                this.setStautsReady(true);
            }else if(userInfo.state == UserState.Sit){
                this.setStautsReady(false);
            }
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
    private setStautsReady(active: boolean) {
        this.setOut.getChildByName("Status").getChildByName("Status1").active = !active;
        this.setOut.getChildByName("Status").getChildByName("Status2").active = active;
    }

}