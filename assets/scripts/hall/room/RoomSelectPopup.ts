import Config from "../../config/Config";
import { Cmd } from "../../game/pj/enum/Cmd";
import WsClient from "../../game/pj/net/WsClient";
import UserData from "../../login/entity/UserData";
import { SceneUtil } from "../../util/SceneUtil";
import HallUIManager from "../HallUIManager";
import JoinRoomPopup from "./JoinRoomPopup";

const { ccclass, property } = cc._decorator;
export enum RoomCardType {

    /**
     * 创建房间
     */
    CREATE = 1,

    /**
     * 加入房间
     */
    JOIN = 2,

    /**
     * 自由匹配
     */
    MATCH = 3

}
@ccclass
export default class RoomSelectPopup extends cc.Component {

    // 遮罩层
    private mask: cc.Node = null!;

    // 卡片根节点
    private cardRoot: cc.Node = null!;

    // 三张卡片
    private cards: cc.Node[] = [];

     // 单独卡片
    private createCard: cc.Node = null!;
    private joinCard: cc.Node = null!;
    private matchCard: cc.Node = null!;

    onLoad() {
        // 默认隐藏
        this.node.active = false;

        // 获取节点
        this.mask = this.node.getChildByName("Mask");

        this.cardRoot = this.node.getChildByName("Panel");

        // 获取所有卡片
        // 获取卡片
        this.createCard = this.cardRoot.getChildByName("CreateCard");
        this.joinCard = this.cardRoot.getChildByName("JoinCard");
        this.matchCard = this.cardRoot.getChildByName("MatchCard");
        // 放入数组
        this.cards = [
            this.createCard,
            this.joinCard,
            this.matchCard
        ];

        // 点击Mask关闭
        this.mask.on(cc.Node.EventType.TOUCH_END, () => {
            this.hide();
            HallUIManager.instance.gameCardShow();
        }, this);

        // 创建房间
        this.createCard.on(cc.Node.EventType.TOUCH_END, () => {
            this.playClickAnim(this.createCard);
            this.onClickCard(RoomCardType.CREATE);
        }, this);

        // 加入房间
        this.joinCard.on(cc.Node.EventType.TOUCH_END, () => {
            this.hide();
            this.playClickAnim(this.joinCard);

            if(!HallUIManager.instance.joinRoomPanelPrefabNode){
                HallUIManager.instance.initJoinRoomPanelPrefabNode();
            }
            const joinRoomPopupNode = HallUIManager.instance.joinRoomPanelPrefabNode.getComponent(JoinRoomPopup);
            joinRoomPopupNode.show();
        }, this);

        // 自由匹配
        this.matchCard.on(cc.Node.EventType.TOUCH_END, () => {
            this.playClickAnim(this.matchCard);
           this.onClickCard(RoomCardType.MATCH);
        }, this);

    }


    

    /**
     * 显示弹窗
     */
    show() {
        HallUIManager.instance.gameCardHide();
        this.node.active = true;

        // 遮罩渐变
        this.mask.opacity = 0;

        cc.tween(this.mask)
            .to(0.2, {
                opacity: 180
            })
            .start();

        // 卡片动画
        this.cards.forEach((card, index) => {

            // 记录最终位置
            let targetY = card.y;

            // 初始状态
            card.y = targetY - 120;

            card.scale = 0.8;

            card.opacity = 0;

            // Tween动画
            cc.tween(card)
                .delay(index * 0.08)
                .to(0.3, {
                    y: targetY,
                    scale: 1,
                    opacity: 255
                }, {
                    easing: "backOut"
                })
                .start();

        });

    }


    /**
     * 隐藏弹窗
     */
    hide() {
        // 遮罩淡出
        cc.tween(this.mask)
            .to(0.15, {
                opacity: 0
            })
            .start();

        // 卡片回收动画
        this.cards.forEach((card, index) => {

            cc.tween(card)
                .delay(index * 0.03)
                .to(0.15, {
                    scale: 0.85,
                    opacity: 0
                })
                .call(() => {

                    // 最后一张结束后关闭节点
                    if (index === this.cards.length - 1) {

                        this.node.active = false;

                        // 恢复状态
                        card.scale = 1;

                    }

                })
                .start();

        });

    }

    /**
     * 卡片点击动画
     */
    private playClickAnim(card: cc.Node) {

        cc.tween(card)
            .stop()

        cc.tween(card)
            .to(0.08, {
                scale: 0.92
            })
            .to(0.08, {
                scale: 1
            })
            .start();

    }


    private async onClickCard(roomCardType: RoomCardType) {
        if(roomCardType === RoomCardType.MATCH){
            // 匹配
            WsClient.instance.send(Cmd.FREE_MATCH, "");
        }else if(roomCardType === RoomCardType.CREATE){
            // 创房
            WsClient.instance.send(Cmd.CREATE_ROOM, "");
        }
    }

}
