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
export default class GameUIManager extends cc.Component {
    private uiNode!: cc.Node;
    private tableNode!: cc.Node;
    private chipSelectPanel!: cc.Node;
    private grabBankerPanel!: cc.Node;
    private lookCardPanel!: cc.Node;
    private betContainer!: cc.Node;
    private rooomTopBarNode!: cc.Node;
    private clockContainerNode!: cc.Node;
    private settleEffectRoot!: cc.Node;
    private phaseTipNode!: cc.Node;
    private bankerBetStatusNode!: cc.Node;
    private phaseTipText: string = "";
    private phaseTipEndLocalTime: number = 0;
    private settleCoinSpriteFrame: cc.SpriteFrame = null;
    private seats: { x: number, y: number, id: number }[] = [];
    private rooomTopBarComponent!: RooomTopBar;
    private readyButtonNode!: cc.Node;


    private static _instance: GameUIManager = null;
    public static get instance(): GameUIManager {
        return this._instance;
    }

    onLoad() {
        const t = Date.now();
        // 保存单例引用
        GameUIManager._instance = this;
        this.uiNode = this.node.getChildByName("UI");
        this.tableNode = cc.find("Canvas/MainLayout/Table");
        this.chipSelectPanel = cc.find("Canvas/MainLayout/Table/ChipSelectPanel");
        this.grabBankerPanel = cc.find("Canvas/MainLayout/Table/GrabBankerPanel");
        this.lookCardPanel = cc.find("Canvas/MainLayout/Table/LookCardPanel");
        this.betContainer = cc.find("Canvas/MainLayout/Table/BetContainer");
        this.rooomTopBarNode = cc.find("Canvas/MainLayout/RoomTopBar");
        this.clockContainerNode = cc.find("Canvas/MainLayout/Table/ClockContainer");
        this.init();
        cc.game.on(cc.game.EVENT_SHOW, this.onGameShow, this);
        console.log("游戏初始化预制体耗时:", Date.now() - t, "ms");
    }

    protected onDestroy(): void {
        cc.game.off(cc.game.EVENT_SHOW, this.onGameShow, this);
    }

    private onGameShow() {
        ClientRoomManager.instance.syncRoomInfo();
    }

    private init() {
        this.intSeatPos();
        this.initRoomTopBar();
        this.initChipSelectPanel();
        this.initGrabBankerPanel();
        this.initLookCardPanel();
        this.loadSettleCoinSpriteFrame();
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

    public showBankerBetStatus(players: any[], bankerSeat: number, mySeatId: number, betMap: Record<number, number>) {
        if (mySeatId !== bankerSeat || bankerSeat < 0) {
            this.hideBankerBetStatus();
            return;
        }

        const betPlayers = (players || []).filter(player => {
            return player && player.seatId != null && player.seatId >= 0 && player.seatId !== bankerSeat;
        });

        if (betPlayers.length <= 0) {
            this.hideBankerBetStatus();
            return;
        }

        const node = this.getBankerBetStatusNode();
        node.active = true;
        node.removeAllChildren();

        this.drawBankerBetStatusBg(node);

        const betCount = betPlayers.filter(player => betMap && betMap[player.userId] != null).length;
        this.createStatusLabel(node, `闲家下注 ${betCount}/${betPlayers.length}`, 0, 106, 28, new cc.Color(255, 232, 140), cc.Label.HorizontalAlign.CENTER);

        const colX = [-150, 150];
        const startY = 58;
        const rowGap = 42;

        betPlayers.forEach((player, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = colX[col];
            const y = startY - row * rowGap;
            const amount = betMap ? betMap[player.userId] : null;
            const hasBet = amount != null;
            const name = this.formatStatusName(player.nickname || `座位${player.seatId}`);
            const status = hasBet ? `已下注 ${this.formatGold(amount)}` : "等待下注";
            const color = hasBet ? new cc.Color(116, 255, 156) : new cc.Color(255, 205, 106);

            this.createStatusLabel(node, name, x - 76, y, 20, cc.Color.WHITE, cc.Label.HorizontalAlign.LEFT);
            this.createStatusLabel(node, status, x + 18, y, 20, color, cc.Label.HorizontalAlign.LEFT);
        });
    }

    public hideBankerBetStatus() {
        if (!this.bankerBetStatusNode || !cc.isValid(this.bankerBetStatusNode)) {
            return;
        }

        this.bankerBetStatusNode.active = false;
        this.bankerBetStatusNode.removeAllChildren();
    }

    private getBankerBetStatusNode(): cc.Node {
        if (this.bankerBetStatusNode && cc.isValid(this.bankerBetStatusNode)) {
            return this.bankerBetStatusNode;
        }

        const node = new cc.Node("BankerBetStatusPanel");
        node.zIndex = 4300;
        node.setPosition(0, -120);
        node.setContentSize(640, 260);
        this.tableNode.addChild(node);
        this.bankerBetStatusNode = node;
        return node;
    }

    private drawBankerBetStatusBg(node: cc.Node) {
        const bgNode = new cc.Node("Bg");
        bgNode.setContentSize(640, 260);
        node.addChild(bgNode);

        const bg = bgNode.addComponent(cc.Graphics);
        bg.fillColor = new cc.Color(0, 0, 0, 132);
        bg.roundRect(-320, -130, 640, 260, 16);
        bg.fill();
        bg.strokeColor = new cc.Color(255, 204, 88, 190);
        bg.lineWidth = 2;
        bg.roundRect(-320, -130, 640, 260, 16);
        bg.stroke();

        const line = new cc.Node("Line");
        line.setPosition(0, 80);
        bgNode.addChild(line);
        const graphics = line.addComponent(cc.Graphics);
        graphics.strokeColor = new cc.Color(255, 204, 88, 120);
        graphics.lineWidth = 1;
        graphics.moveTo(-280, 0);
        graphics.lineTo(280, 0);
        graphics.stroke();
    }

    private createStatusLabel(parent: cc.Node, text: string, x: number, y: number, fontSize: number, color: cc.Color, align: cc.Label.HorizontalAlign) {
        const node = new cc.Node("Label");
        node.setPosition(x, y);
        node.setContentSize(180, 32);
        parent.addChild(node);

        const label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.horizontalAlign = align;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        node.color = color;
    }

    private formatStatusName(name: string): string {
        if (!name) {
            return "";
        }

        return name.length > 4 ? `${name.slice(0, 4)}...` : name;
    }

    private formatGold(value: number): string {
        const amount = Number(value || 0);
        if (amount >= 10000) {
            return `${Math.floor(amount / 1000) / 10}万`;
        }

        return String(amount);
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

    public showPhaseTip(text: string, leftSeconds?: number) {
        if (!this.tableNode || !text) {
            return;
        }

        const node = this.getPhaseTipNode();
        this.phaseTipText = text;
        this.phaseTipEndLocalTime = leftSeconds != null && leftSeconds > 0
            ? Date.now() + leftSeconds * 1000
            : 0;
        this.refreshPhaseTipText();
        node.active = true;
        node.opacity = 255;

        this.unschedule(this.updatePhaseTipCountdown);
        if (this.phaseTipEndLocalTime > 0) {
            this.schedule(this.updatePhaseTipCountdown, 0.2);
        }

        cc.Tween.stopAllByTarget(node);
        cc.tween(node)
            .repeatForever(
                cc.tween()
                    .to(0.7, { opacity: 180 })
                    .to(0.7, { opacity: 255 })
            )
            .start();
    }

    public hidePhaseTip() {
        if (!this.phaseTipNode || !cc.isValid(this.phaseTipNode)) {
            return;
        }

        cc.Tween.stopAllByTarget(this.phaseTipNode);
        this.unschedule(this.updatePhaseTipCountdown);
        this.phaseTipText = "";
        this.phaseTipEndLocalTime = 0;
        this.phaseTipNode.active = false;
    }

    private updatePhaseTipCountdown() {
        this.refreshPhaseTipText();
    }

    private refreshPhaseTipText() {
        const node = this.phaseTipNode && cc.isValid(this.phaseTipNode)
            ? this.phaseTipNode
            : this.getPhaseTipNode();
        const labelNode = node.getChildByName("Label");
        const label = labelNode ? labelNode.getComponent(cc.Label) : null;

        if (!label) {
            return;
        }

        if (this.phaseTipEndLocalTime <= 0) {
            label.string = this.phaseTipText;
            return;
        }

        const leftSeconds = Math.max(0, Math.ceil((this.phaseTipEndLocalTime - Date.now()) / 1000));
        label.string = `${this.phaseTipText} ${leftSeconds}秒`;

        if (leftSeconds <= 0) {
            this.unschedule(this.updatePhaseTipCountdown);
        }
    }

    private getPhaseTipNode(): cc.Node {
        if (this.phaseTipNode && cc.isValid(this.phaseTipNode)) {
            return this.phaseTipNode;
        }

        const node = new cc.Node("PhaseTip");
        node.zIndex = 4500;
        node.setPosition(0, 120);
        node.setContentSize(520, 70);
        this.tableNode.addChild(node);

        const bgNode = new cc.Node("Bg");
        bgNode.setContentSize(520, 70);
        node.addChild(bgNode);
        const bg = bgNode.addComponent(cc.Graphics);
        bg.fillColor = new cc.Color(0, 0, 0, 145);
        bg.roundRect(-260, -35, 520, 70, 18);
        bg.fill();
        bg.strokeColor = new cc.Color(255, 212, 92, 210);
        bg.lineWidth = 2;
        bg.roundRect(-260, -35, 520, 70, 18);
        bg.stroke();

        const labelNode = new cc.Node("Label");
        labelNode.setContentSize(520, 70);
        node.addChild(labelNode);
        const label = labelNode.addComponent(cc.Label);
        label.fontSize = 28;
        label.lineHeight = 34;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        label.string = "";
        labelNode.color = new cc.Color(255, 235, 165);

        this.phaseTipNode = node;
        return node;
    }

     public setLookCardPanelVisible(visible: boolean, immediately: boolean = false, leftSeconds: number = 0) {
        if (this.lookCardPanel) {
            const node = this.lookCardPanel.getChildByName("LookCardPanel");
            if (node) {
                const comp = node.getComponent(LookCardPopup);
                if(comp){
                    if (visible === true) {
                        comp.show(leftSeconds);
                    } else if (immediately && (comp as any).hideImmediately) {
                        (comp as any).hideImmediately();
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
    public clearTable(keepSettleEffects: boolean = false) {
        //console.log("执行全部清理, 房间状态:", ClientRoomManager.instance.getRoomState())
        this.clearCardContainer();
        this.clearBetContainer();
        this.clearClockContainer();
        this.hidePhaseTip();
        this.hideBankerBetStatus();
        if (!keepSettleEffects) {
            this.clearSettleEffects();
        }
        SettleManager.close();
    }

    // 清理发牌区
    public clearCardContainer() {
        const tableNode = GameUIManager.instance.getTableNode();
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


    // 加载结算飞金币图片，失败时会回退到 Graphics 绘制金币
    private loadSettleCoinSpriteFrame() {
        if (this.settleCoinSpriteFrame) {
            return;
        }

        cc.resources.load("common/icon/coin", cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
            if (err) {
                cc.warn("结算金币图片加载失败，使用默认绘制金币", err);
                return;
            }

            this.settleCoinSpriteFrame = spriteFrame;
        });
    }

    // 清理结算时桌面上的飞金币和输赢数字
    public clearSettleEffects() {
        if (this.settleEffectRoot && cc.isValid(this.settleEffectRoot)) {
            this.stopSettleEffectTweens(this.settleEffectRoot);
            this.settleEffectRoot.removeAllChildren();
        }
    }

    private stopSettleEffectTweens(node: cc.Node) {
        if (!node || !cc.isValid(node)) {
            return;
        }

        cc.Tween.stopAllByTarget(node);
        node.children.forEach(child => {
            this.stopSettleEffectTweens(child);
        });
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
                .delay(delay + i * 0.09)
                .parallel(
                    cc.tween().to(0.9, { position: end }, { easing: "quadOut" }),
                    cc.tween().to(0.9, { scale: 1, angle: 540 + Math.random() * 180 }),
                    cc.tween().sequence(
                        cc.tween().to(0.16, { opacity: 255 }),
                        cc.tween().delay(0.54),
                        cc.tween().to(0.2, { opacity: 0 })
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

    // 创建飞金币节点，优先使用资源里的金币图片
    private createSettleCoin(): cc.Node {
        const node = new cc.Node("SettleCoin");
        node.setContentSize(34, 34);
        node.opacity = 0;

        if (this.settleCoinSpriteFrame) {
            const sprite = node.addComponent(cc.Sprite);
            sprite.spriteFrame = this.settleCoinSpriteFrame;
            sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            return node;
        }

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
        GameUIManager.instance.clearTable();
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
        const tableNode = GameUIManager.instance.getTableNode();
        if (tableNode) {
            const paiJiuTableNode = tableNode.getComponent(PaiJiuTable);
            paiJiuTableNode.onClickOpenCard();
        }
    }

    public rubCard(){
        const tableNode = GameUIManager.instance.getTableNode();
        if (tableNode) {
            const paiJiuTableNode = tableNode.getComponent(PaiJiuTable);
            paiJiuTableNode.onClickRubCard();
        }
    }




}
