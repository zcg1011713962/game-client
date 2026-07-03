const { ccclass, property } = cc._decorator;
import ClientRoomManager from "../room/ClientRoomManager";
import WsClient from "../net/WsClient";
import { Cmd } from "../enum/Cmd";
import BetArea from "../chip/BetArea";
import { RoomState } from "../room/RoomState";
import SeatComponentManager from "../seat/SeatComponentManager";
import { RoomBarData, RooomTopBar } from "../../top/RoomTopBar";
import PaiJiuTable from "../PaiJiuTable";
import GameRes from "../GameRes";
import RoundStartPopup from "../../../common/RoundStartPopup";
import SettleManager from "../../../common/SettleManager";
import ReadyButton, { ReadyBtnState } from "../../btn/ReadyButton";
import GrabBankerPopup from "../banker/GrabBankerPopup";
import LookCardPopup from "../room/LookCardPopup";

@ccclass
export default class UIManager extends cc.Component {
    private uiNode!: cc.Node;
    private tableNode!: cc.Node;
    private chipSelectPanel!: cc.Node;
    private grabBankerPanel!: cc.Node;
    private lookCardPanel!: cc.Node;
    private betContainer!: cc.Node;
    private rooomTopBarNode!: cc.Node;
    private clockContainerNode!: cc.Node;
    private settleEffectRoot!: cc.Node;
    private seats: { x: number, y: number, id: number }[] = [];
    private rooomTopBarComponent!: RooomTopBar;
    private readyButtonNode!: cc.Node;


    private static _instance: UIManager = null;
    public static get instance(): UIManager {
        return this._instance;
    }

    onLoad() {
        const t = Date.now();
        // 保存单例引用
        UIManager._instance = this;
        this.uiNode = this.node.getChildByName("UI");
        this.tableNode = cc.find("Canvas/MainLayout/Table");
        this.chipSelectPanel = cc.find("Canvas/MainLayout/Table/ChipSelectPanel");
        this.grabBankerPanel = cc.find("Canvas/MainLayout/Table/GrabBankerPanel");
        this.lookCardPanel = cc.find("Canvas/MainLayout/Table/LookCardPanel");
        this.betContainer = cc.find("Canvas/MainLayout/Table/BetContainer");
        this.rooomTopBarNode = cc.find("Canvas/MainLayout/RoomTopBar");
        this.clockContainerNode = cc.find("Canvas/MainLayout/Table/ClockContainer");
        this.init();
        console.log("游戏初始化预制体耗时:", Date.now() - t, "ms");
    }

    private init() {
        this.intSeatPos();
        this.initRoomTopBar();
        this.initChipSelectPanel();
        this.initGrabBankerPanel();
        this.initLookCardPanel();
    }

    public initRoomTopBar() {
        this.rooomTopBarNode.removeAllChildren();

        const node = cc.instantiate(GameRes.instance.roomTopBarPrefab);
        node.parent = this.rooomTopBarNode;
        this.rooomTopBarComponent = node.getComponent(RooomTopBar);
    }

    public initChipSelectPanel() {
        this.chipSelectPanel.removeAllChildren();

        const node = cc.instantiate(GameRes.instance.chipSelectPanelPrefab);
        node.parent = this.chipSelectPanel;
    }

    public initGrabBankerPanel() {
        this.grabBankerPanel.removeAllChildren();
        const node = cc.instantiate(GameRes.instance.grabBankerPanelPrefab);
        node.parent = this.grabBankerPanel;
    }

     public initLookCardPanel() {
        this.lookCardPanel.removeAllChildren();
        const node = cc.instantiate(GameRes.instance.lookCardPanelPrefab);
        node.parent = this.lookCardPanel;
    }


    public getTableNode() {
        return this.tableNode;
    }



    public setNickNameView(labelNode: cc.Node, isBanker: boolean, isSelf: boolean, name: string) {
        const label = labelNode.getComponent(cc.Label);
        label.string = name;
        if (isSelf) {
            label.node.color = cc.Color.GREEN;
        } else if (isBanker) {
            label.node.color = new cc.Color(255, 215, 0); // 金色
        } else {
            label.node.color = cc.Color.WHITE;
        }
    }

    public intSeatPos() {
        this.seats = [];
        // 设置座位坐标
        this.seats.push({ x: 0, y: -800, id: 0 });
        this.seats.push({ x: 420, y: -420, id: 1 });
        this.seats.push({ x: 460, y: 20, id: 2 });
        this.seats.push({ x: 420, y: 420, id: 3 });
        this.seats.push({ x: 0, y: 750, id: 4 });
        this.seats.push({ x: -420, y: 420, id: 5 });
        this.seats.push({ x: -460, y: 20, id: 6 });
        this.seats.push({ x: -420, y: -420, id: 7 });
    }



    public getSeat(): { x: number, y: number, id: number }[] {
        return this.seats;
    }


    public setBetPanelVisible(visible: boolean) {
        if (this.chipSelectPanel) {
            this.chipSelectPanel.active = visible;
        }
    }

    public setGrabBankerPanelVisible(visible: boolean) {
        if (this.grabBankerPanel) {
            const node = this.grabBankerPanel.getChildByName("GrabBankerPanel");
            if (node) {
                const comp = node.getComponent(GrabBankerPopup);
                if(comp){
                    if (visible === true) {
                        comp.show();
                    } else {
                        comp.hide();
                    }
                }
            }
        }
    }

     public setLookCardPanelVisible(visible: boolean) {
        if (this.grabBankerPanel) {
            const node = this.lookCardPanel.getChildByName("LookCardPanel");
            if (node) {
                const comp = node.getComponent(LookCardPopup);
                if(comp){
                    if (visible === true) {
                        comp.show();
                    } else {
                        comp.hide();
                    }
                }
            }
        }
    }


    public onSelectChip(chip: number, seatId: number) {
        const betArea = this.betContainer.getComponent(BetArea);
        if (betArea) {
            const seatComponen = SeatComponentManager.getInstance().seatComponentList.find(s => s["seatData"].id === seatId);
            if (seatComponen) {
                // 起点：座位世界坐标
                const worldStartPos = seatComponen.node.convertToWorldSpaceAR(cc.v2(0, 0));
                betArea.addChip(chip, seatId, worldStartPos);
            }
        } else {
            console.error("betArea节点为空");
        }

    }


    // 全部清理
    public clearTable() {
        //console.log("执行全部清理, 房间状态:", ClientRoomManager.instance.getRoomState())
        this.clearCardContainer();
        this.clearBetContainer();
        this.clearClockContainer();
        this.clearSettleEffects();
        SettleManager.close();
    }

    // 清理发牌区
    public clearCardContainer() {
        const tableNode = UIManager.instance.getTableNode();
        if (tableNode) {
            const paiJiuTableNode = tableNode.getComponent(PaiJiuTable);
            paiJiuTableNode.clearCardContainer();
            //console.log("清理牌区")
        }
    }

    // 清理投注的筹码
    public clearBetContainer() {
        if (ClientRoomManager.instance.getRoomState() === RoomState.WAIT || ClientRoomManager.instance.getRoomState() === RoomState.READY) {
            const betArea = this.betContainer.getComponent(BetArea);
            if (betArea) {
                betArea.clearChips(this.seats);
                //console.log("清理筹码区")
            }
        }
    }

    public clearClockContainer() {
        this.clockContainerNode.removeAllChildren();
        //console.log("清理倒计时钟")
    }


    // 清理结算时桌面上的飞金币和输赢数字
    public clearSettleEffects() {
        if (this.settleEffectRoot && cc.isValid(this.settleEffectRoot)) {
            this.settleEffectRoot.removeAllChildren();
        }
    }

    // 播放结算表现：座位附近显示输赢金额，并按输赢方向飞金币
    public playSettleEffects(settlePlayers: any[], _bankerSeat: number) {
        if (!settlePlayers || !settlePlayers.length || !this.tableNode) {
            return;
        }

        const root = this.getSettleEffectRoot();
        root.removeAllChildren();

        settlePlayers.forEach((settlePlayer, index) => {
            if (!settlePlayer || settlePlayer.seatId == null) {
                return;
            }

            const seatPos = this.getSeatEffectPos(settlePlayer.seatId);
            const tableCenter = cc.v2(0, -30);
            const winAmount = Number(settlePlayer.winAmount || 0);

            this.showSettleAmount(root, seatPos, winAmount, index * 0.04);

            if (winAmount > 0) {
                this.playSettleCoinFly(root, tableCenter, seatPos, 5, index * 0.05);
            } else if (winAmount < 0) {
                this.playSettleCoinFly(root, seatPos, tableCenter, 5, index * 0.05);
            }
        });
    }

    // 结算表现专用层，挂在牌桌节点下，避免弹窗遮挡牌桌
    private getSettleEffectRoot(): cc.Node {
        if (!this.settleEffectRoot || !cc.isValid(this.settleEffectRoot)) {
            this.settleEffectRoot = new cc.Node("SettleEffectRoot");
            this.settleEffectRoot.zIndex = 5000;
            this.tableNode.addChild(this.settleEffectRoot);
        }

        return this.settleEffectRoot;
    }

    // 获取座位在牌桌节点坐标系下的位置，用来定位金币飞行终点和金额文本
    private getSeatEffectPos(seatId: number): cc.Vec2 {
        const seatComponent = SeatComponentManager.getInstance().seatComponentList.find(comp => {
            return comp && comp["seatData"] && comp["seatData"].id === seatId;
        });

        if (seatComponent && cc.isValid(seatComponent.node)) {
            const worldPos = seatComponent.node.convertToWorldSpaceAR(cc.v2(0, 0));
            return this.tableNode.convertToNodeSpaceAR(worldPos);
        }

        const seat = this.seats.find(item => item.id === seatId);
        return seat ? cc.v2(seat.x, seat.y) : cc.v2(0, 0);
    }

    // 在座位附近显示本局输赢金额
    private showSettleAmount(root: cc.Node, seatPos: cc.Vec2, amount: number, delay: number) {
        const node = new cc.Node("SettleAmount");
        node.setPosition(seatPos.x, seatPos.y + 88);
        node.opacity = 0;
        node.scale = 0.8;
        root.addChild(node);

        const label = node.addComponent(cc.Label);
        label.string = amount > 0 ? `+${amount}` : String(amount);
        label.fontSize = 34;
        label.lineHeight = 38;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;

        const outline = node.addComponent(cc.LabelOutline);
        outline.color = cc.Color.BLACK;
        outline.width = 4;

        if (amount > 0) {
            node.color = new cc.Color(255, 226, 76);
        } else if (amount < 0) {
            node.color = new cc.Color(255, 76, 58);
        } else {
            node.color = cc.Color.WHITE;
        }

        cc.tween(node)
            .delay(delay)
            .to(0.16, { opacity: 255, scale: 1.15 }, { easing: "backOut" })
            .to(0.12, { scale: 1 })
            .delay(1.1)
            .to(0.25, { y: node.y + 28, opacity: 0 })
            .call(() => {
                if (cc.isValid(node)) {
                    node.destroy();
                }
            })
            .start();
    }

    // 播放一组金币从起点飞到终点
    private playSettleCoinFly(root: cc.Node, startPos: cc.Vec2, endPos: cc.Vec2, count: number, delay: number) {
        for (let i = 0; i < count; i++) {
            const coin = this.createSettleCoin();
            const start = cc.v2(
                startPos.x + (Math.random() - 0.5) * 42,
                startPos.y + (Math.random() - 0.5) * 36
            );
            const end = cc.v2(
                endPos.x + (Math.random() - 0.5) * 40,
                endPos.y + 18 + (Math.random() - 0.5) * 34
            );

            coin.setPosition(start);
            coin.scale = 0.65;
            root.addChild(coin);

            cc.tween(coin)
                .delay(delay + i * 0.055)
                .parallel(
                    cc.tween().to(0.42, { position: end }, { easing: "quadOut" }),
                    cc.tween().to(0.42, { scale: 1, angle: 360 + Math.random() * 120 }),
                    cc.tween().sequence(
                        cc.tween().to(0.1, { opacity: 255 }),
                        cc.tween().delay(0.22),
                        cc.tween().to(0.1, { opacity: 0 })
                    )
                )
                .call(() => {
                    if (cc.isValid(coin)) {
                        coin.destroy();
                    }
                })
                .start();
        }
    }

    // 临时用 Graphics 画金币，后续有金币图片后可以替换成 Sprite
    private createSettleCoin(): cc.Node {
        const node = new cc.Node("SettleCoin");
        node.setContentSize(34, 34);
        node.opacity = 0;

        const graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(255, 199, 54, 255);
        graphics.circle(0, 0, 17);
        graphics.fill();
        graphics.strokeColor = new cc.Color(142, 86, 16, 255);
        graphics.lineWidth = 3;
        graphics.circle(0, 0, 15);
        graphics.stroke();

        const labelNode = new cc.Node("CoinText");
        const label = labelNode.addComponent(cc.Label);
        label.string = "$";
        label.fontSize = 20;
        label.lineHeight = 22;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        labelNode.color = new cc.Color(130, 75, 8);
        node.addChild(labelNode);

        return node;
    }

    public updateTopView(roomId: number, curPlayer: number, baseScore: number) {
        if (this.rooomTopBarComponent) {
            const roomBarData: RoomBarData = {
                roomId: roomId,
                curPlayer: curPlayer,
                baseScore: baseScore,
            };
            console.log("update RoomTopBar", roomBarData);
            this.rooomTopBarComponent.setRoomInfo(roomBarData);
        }
    }


    public setFrontView(labelNode: cc.Node, name: string, outlineWidth: number, color: cc.Color) {
        const label = labelNode.getComponent(cc.Label);
        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
            outline = labelNode.addComponent(cc.LabelOutline);
            // 黑色描边
            outline.color = cc.Color.BLACK;
            // 宽度
            outline.width = outlineWidth;
        }
        if (name.length > 0) {
            label.string = name;
        }
        label.node.color = color;
    }


    public async showRoundStartAnim(
        roundId: number,
        serverTime: number,
        roundAnimEndTime: number
    ): Promise<void> {

        const node = cc.instantiate(
            GameRes.instance.roundStartPrefab
        );

        node.parent = cc.find("Canvas");

        const comp = node.getComponent(RoundStartPopup);

        await comp.play(
            roundId,
            serverTime,
            roundAnimEndTime
        );

        node.destroy();
    }


    public showReady(status: ReadyBtnState) {
        if (!this.readyButtonNode || !cc.isValid(this.readyButtonNode)) {
            this.readyButtonNode = cc.instantiate(GameRes.instance.readyButtonPrefab);
            this.readyButtonNode.parent = this.uiNode;
        }
        const comp = this.readyButtonNode.getComponent(ReadyButton);
        comp.setState(status);
    }

    public readyBtnClick() {
        UIManager.instance.clearTable();
        cc.audioEngine.playEffect(GameRes.instance.clickAudio, false);
        const roomId = ClientRoomManager.instance.getRoomId();
        WsClient.instance.send(Cmd.READY, {
            roomId: roomId
        });
    }

    public cancelBtnClick() {
        cc.audioEngine.playEffect(GameRes.instance.clickAudio, false);
        const roomId = ClientRoomManager.instance.getRoomId();
        WsClient.instance.send(Cmd.CANCEL_READY, {
            roomId: roomId
        });
    }


    public showCard(){
        const tableNode = UIManager.instance.getTableNode();
        if (tableNode) {
            const paiJiuTableNode = tableNode.getComponent(PaiJiuTable);
            paiJiuTableNode.onClickOpenCard();
        }
    }

    public rubCard(){
        const tableNode = UIManager.instance.getTableNode();
        if (tableNode) {
            const paiJiuTableNode = tableNode.getComponent(PaiJiuTable);
            paiJiuTableNode.onClickRubCard();
        }
    }




}
