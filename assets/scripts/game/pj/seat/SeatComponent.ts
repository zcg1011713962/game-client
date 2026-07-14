const { ccclass } = cc._decorator;
import { UserInfo, UserState } from "../user/UserInfo";
import { SeatData, SeatState } from "./SeatData";
import GameUIManager from "../ui/GameUIManager";
import CurrUserManager from "../user/CurrUserManager";
import ClientRoomManager from "../room/ClientRoomManager";
import { RoomState } from "../room/RoomState";
import HallRes from "../../../hall/HallRes";
import { ReadyBtnState } from "../../btn/ReadyButton";
import UIUtil from "../../../util/UIUtil";
import UIColorUtil from "../../../util/UIColorUtil";

@ccclass
export default class SeatComponent extends cc.Component {
    private static readonly COIN_ICON_PATH = "common/icon/coin";
    private static readonly SCORE_ICON_PATH = "common/icon/score";
    private static iconSpriteFrames: { [path: string]: cc.SpriteFrame } = {};
    private static iconLoading: boolean = false;
    private static iconLoaded: boolean = false;
    private static iconLoadCallbacks: Function[] = [];

    // 普通座位
    private normalNode: cc.Node = null;
    // 高亮座位
    private hoverNode: cc.Node = null;
    // 坐下
    private setOut: cc.Node = null;
    // 座位预制体数据
    private seatData: SeatData = null;

    private avatarLoadToken: number = 0;

    onLoad() {
        SeatComponent.preloadAmountIcons();
       
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

    public init(seatData: SeatData){
        this.setData(seatData);
    }

    public static preloadAmountIcons(callback?: Function) {
        if (SeatComponent.iconLoaded) {
            if (callback) {
                callback();
            }
            return;
        }

        if (callback) {
            SeatComponent.iconLoadCallbacks.push(callback);
        }

        if (SeatComponent.iconLoading) {
            return;
        }

        SeatComponent.iconLoading = true;
        const iconPaths = [SeatComponent.COIN_ICON_PATH, SeatComponent.SCORE_ICON_PATH];
        let finishCount = 0;

        iconPaths.forEach(iconPath => {
            cc.resources.load(iconPath, cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
                if (err) {
                    cc.warn("座位金额图标预加载失败", iconPath, err);
                } else {
                    SeatComponent.iconSpriteFrames[iconPath] = spriteFrame;
                }

                finishCount++;
                if (finishCount >= iconPaths.length) {
                    SeatComponent.iconLoading = false;
                    SeatComponent.iconLoaded = iconPaths.every(path => !!SeatComponent.iconSpriteFrames[path]);
                    const callbacks = SeatComponent.iconLoadCallbacks.slice();
                    SeatComponent.iconLoadCallbacks.length = 0;
                    if (SeatComponent.iconLoaded) {
                        callbacks.forEach(cb => cb());
                    }
                }
            });
        });
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

        
        if (!this.seatData.userInfo){ // 更换座位或离开座位
            if(roomState === RoomState.WAIT || roomState === RoomState.READY){
                this.setNormal(true);
            }else{
                this.node.active = false;
            }
            return;
        }

        const state = this.seatData.userInfo.state;
        const userId =  this.seatData.userInfo.userId;
    
       

        switch (state) {
            case UserState.Idle:
                this.setNormal(true);
                if(userId === ClientRoomManager.instance.getMyUserId()){
                    GameUIManager.instance.showReady(ReadyBtnState.HIDE);
                }
                break;
            case UserState.Sit:
                this.setSetOut(true);
                this.setStautsReady(0);
                // 自己入座状态
                if (userId === ClientRoomManager.instance.getMyUserId()) {
                    GameUIManager.instance.showReady(ReadyBtnState.READY);
                }
                break;
            case UserState.Ready:
                if (userId === ClientRoomManager.instance.getMyUserId()) {
                    GameUIManager.instance.showReady(ReadyBtnState.CANCEL_READY);
                }
                this.setSetOut(true);
                this.setStautsReady(1);
                break;
            case UserState.Playing:
                this.setSetOut(true);
                this.setBankerView(true);
                if(userId === ClientRoomManager.instance.getMyUserId()){
                    GameUIManager.instance.showReady(ReadyBtnState.HIDE);
                }
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
    private async setSetOut(active: boolean) {
        // 获取玩家数据
        const bankerSeat = ClientRoomManager.instance.getBankerSeat();
        
        if(active && this.seatData && this.seatData.userInfo){
            const userInfo = this.seatData.userInfo;
           
            const avatarNode = this.setOut.getChildByName("Avatars");

            await this.updateAvatarAsync(userInfo);
            
            // 昵称
            const name = this.setOut.getChildByName("Name");
            const nicknameNode = name.getChildByName("nickname");
            GameUIManager.instance.setNickNameView(nicknameNode, bankerSeat === userInfo.seatId, CurrUserManager.getCurrentUserId() === userInfo.userId , userInfo.nickname);

            this.updateSetGold(userInfo.gold);
        }
        // 预制体显示
        this.setOut.active = active;
    }

    public updateSetGold(gold: number){
        if(this.setOut){
            this.updateSeatAmountIcon();
            const info = this.setOut.getChildByName("Info");
            // 金额展示
            const coinValNode = info.getChildByName("CoinVal");
            
            UIUtil.setLabel(coinValNode, String(gold) , UIColorUtil.GOLD, UIColorUtil.TITLE, 1)
        }
    }

    private updateSeatAmountIcon() {
        if (!this.setOut) {
            return;
        }

        const info = this.setOut.getChildByName("Info");
        if (!info) {
            return;
        }

        const iconNode = info.getChildByName("CoinIcoin");
        if (!iconNode) {
            return;
        }

        const sprite = iconNode.getComponent(cc.Sprite);
        if (!sprite) {
            return;
        }

        const iconPath = ClientRoomManager.instance.isScoreRoom() ? SeatComponent.SCORE_ICON_PATH : SeatComponent.COIN_ICON_PATH;
        const spriteFrame = SeatComponent.iconSpriteFrames[iconPath];
        if (spriteFrame) {
            sprite.spriteFrame = spriteFrame;
            return;
        }

        SeatComponent.preloadAmountIcons(() => {
            if (cc.isValid(this.node) && cc.isValid(iconNode)) {
                this.updateSeatAmountIcon();
            }
        });
    }

    

    private async updateAvatarAsync(userInfo: UserInfo) {
        try {

            const key = `avatar_${userInfo.avatar}`;

            const spriteFrame = await HallRes.instance.loadAvatarImg(key);

            // 节点销毁
            if (!cc.isValid(this.node)) return;

            // 防止座位已换人
            if (!this.seatData || !this.seatData.userInfo) return;

            if (this.seatData.userInfo.userId !== userInfo.userId) return;

            const avatarNode = this.setOut.getChildByName("Avatars");

            if (!avatarNode) return;

            const avatarSpriteNode = avatarNode.getComponent(cc.Sprite);

            if (avatarSpriteNode) {
                avatarSpriteNode.spriteFrame = spriteFrame;
            }

        } catch (e) {
            cc.error("游戏内头像加载失败:", e);
        }

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
        }else{
             bankerLabelNode.active = false;
        }
    }

}
