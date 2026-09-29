import UserData from "../../scripts/login/entity/UserData";
import ToastManager from "../../scripts/common/ToastManager";
import GameNet from "../../scripts/net/GameNet";
import { GameCode } from "../../scripts/net/GameCode";
import { GomokuCmd } from "./net/GomokuCmd";
import HallRes from "../../hall/scripts/HallRes";

const { ccclass } = cc._decorator;

/** Local Gomoku game flow. Network state will replace this after matchmaking is available. */
@ccclass
export default class GomokuTable extends cc.Component {
    private readonly size = 15;
    private readonly start = -385;
    private readonly cell = 55;
    private turnSeconds = 30;
    private readonly maxUndoCount = 3;
    private board: number[][] = [];
    private stoneLayer: cc.Node = null;
    private stonePrefab: cc.Prefab = null;
    private blackStone: cc.SpriteFrame = null;
    private whiteStone: cc.SpriteFrame = null;
    private lastStoneMark: cc.SpriteFrame = null;
    private lastStoneNode: cc.Node = null;
    private blackTurn = true;
    private finished = false;
    private secondsLeft = this.turnSeconds;
    private resultPopup: cc.Node = null;
    private boardTouchNode: cc.Node = null;
    private roomId: number = 0;
    private userId: number = 0;
    private turnUserId: number = 0;
    private turnStartedAt: number = 0;
    private topUserId: number = 0;
    private pendingServerState: any = null;
    private undoCount = 0;
    private returningToHall = false;

    async onLoad() {
        this.createInputBlocker();
        const boardPanel = this.node.getChildByName("BoardPanel");
        if (!boardPanel) return;
        this.stoneLayer = boardPanel.getChildByName("StoneLayer");
        if (!this.stoneLayer) {
            this.stoneLayer = new cc.Node("StoneLayer");
            this.stoneLayer.setContentSize(920, 920);
            boardPanel.addChild(this.stoneLayer);
        }
        this.bindControls();
        this.userId = Number(UserData.get()?.userId || 0);
        GameNet.on(GomokuCmd.START, this.applyServerState, this);
        GameNet.on(GomokuCmd.STATE, this.applyServerState, this);
        GameNet.on(GomokuCmd.FINISH, this.onServerFinish, this);
        this.updatePlayerInfo();
        this.resetGame();
        this.boardTouchNode = boardPanel.getChildByName("BoardBg") || boardPanel;
        const bundle = cc.assetManager.getBundle("gomoku");
        if (!bundle) return;
        const [black, white, mark, stonePrefab] = await Promise.all([
            this.loadSprite(bundle, "table/gomoku_stone_black"),
            this.loadSprite(bundle, "table/gomoku_stone_white"),
            this.loadSprite(bundle, "table/gomoku_last_stone_mark"),
            this.loadPrefab(bundle, "prefabs/GomokuStone")
        ]);
        if (!cc.isValid(this.node)) return;
        this.blackStone = black;
        this.whiteStone = white;
        this.lastStoneMark = mark;
        this.stonePrefab = stonePrefab;
        this.boardTouchNode.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        if (this.pendingServerState) {
            const state = this.pendingServerState;
            this.pendingServerState = null;
            this.applyServerState(state);
        }
    }

    onDestroy() {
        this.unscheduleAllCallbacks();
        if (this.boardTouchNode) this.boardTouchNode.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        GameNet.off(GomokuCmd.START, this.applyServerState, this);
        GameNet.off(GomokuCmd.STATE, this.applyServerState, this);
        GameNet.off(GomokuCmd.FINISH, this.onServerFinish, this);
    }

    private createInputBlocker() {
        const rootBlocker = this.node.getComponent(cc.BlockInputEvents);
        if (rootBlocker) rootBlocker.destroy();
        if (this.node.getChildByName("InputBlocker")) return;
        const blocker = new cc.Node("InputBlocker");
        blocker.setContentSize(this.node.getContentSize());
        blocker.addComponent(cc.BlockInputEvents);
        this.node.addChild(blocker);
        blocker.setSiblingIndex(0);
    }

    private bindControls() {
        this.bindControl("CloseButton", this.closeGame);
        this.bindControl("UndoButton", this.undoMove);
        this.bindControl("SurrenderButton", this.surrender);
        this.bindControl("DrawButton", this.requestDraw);
    }

    private bindControl(name: string, callback: () => void) {
        const control = this.findNodeByName(this.node, name);
        if (!control) return;
        control.targetOff(this);
        control.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
            callback.call(this);
        }, this);
    }

    private findNodeByName(root: cc.Node, name: string): cc.Node {
        if (root.name === name) return root;
        for (const child of root.children) {
            const found = this.findNodeByName(child, name);
            if (found) return found;
        }
        return null;
    }

    private updatePlayerInfo() {
        const user = UserData.get();
        this.setPlayerInfo("TopPlayerInfo", user?.nickname || "Player", "Bronze II");
        this.setPlayerInfo("BottomPlayerInfo", "AI Opponent", "Bronze II");
    }

    private setPlayerInfo(barName: string, name: string, rank: string) {
        const info = this.node.getChildByName(barName)?.getChildByName("GomokuPlayerInfo");
        this.setLabel(info?.getChildByName("NameLabel"), name);
        this.setLabel(info?.getChildByName("RankLabel"), rank);
    }

    private resetGame() {
        this.board = [];
        this.blackTurn = true;
        this.finished = false;
        this.undoCount = 0;
        this.updateUndoLabel();
        this.setActionButtonsActive(true);
        this.secondsLeft = this.turnSeconds;
        if (this.stoneLayer) this.stoneLayer.destroyAllChildren();
        if (this.resultPopup) {
            this.resultPopup.destroy();
            this.resultPopup = null;
        }
        this.updateTurnView();
        this.unschedule(this.tick);
        this.schedule(this.tick, 1);
    }

    private tick() {
        if (this.finished) return;
        this.refreshServerCountdown();
        this.updateTurnView();
    }

    private refreshServerCountdown() {
        if (!this.turnStartedAt) {
            return;
        }
        const remainingMillis = this.turnSeconds * 1000 - (Date.now() - this.turnStartedAt);
        this.secondsLeft = Math.max(0, Math.ceil(remainingMillis / 1000));
    }

    private updateTurnView() {
        const topTimeNode = this.node.getChildByName("TopPlayerInfo")?.getChildByName("Time");
        const bottomTimeNode = this.node.getChildByName("BottomPlayerInfo")?.getChildByName("Time");
        const topTime = topTimeNode?.getChildByName("TimeLabel");
        const bottomTime = bottomTimeNode?.getChildByName("TimeLabel");
        const time = this.formatTime(this.secondsLeft);
        const topTurn = this.turnUserId === this.topUserId;
        if (topTimeNode) topTimeNode.active = !this.finished && topTurn;
        if (bottomTimeNode) bottomTimeNode.active = !this.finished && !topTurn;
        this.setLabel(topTime, time);
        this.setLabel(bottomTime, time);
        const topTip = this.node.getChildByName("TopTurnTip");
        const bottomTip = this.node.getChildByName("BottomTurnTip");
        if (topTip) topTip.active = !this.finished && this.turnUserId === this.topUserId;
        if (bottomTip) bottomTip.active = !this.finished && this.turnUserId !== this.topUserId;
    }

    private formatTime(seconds: number): string {
        const minute = Math.floor(seconds / 60);
        const second = seconds % 60;
        return (minute < 10 ? "0" : "") + minute + ":" + (second < 10 ? "0" : "") + second;
    }

    private setLabel(node: cc.Node, value: string) {
        const label = node?.getComponent(cc.Label);
        if (label) label.string = value;
    }

    private loadSprite(bundle: cc.AssetManager.Bundle, path: string): Promise<cc.SpriteFrame> {
        return new Promise((resolve, reject) => bundle.load(path, cc.SpriteFrame, (error, asset: cc.SpriteFrame) => error ? reject(error) : resolve(asset)));
    }

    private loadPrefab(bundle: cc.AssetManager.Bundle, path: string): Promise<cc.Prefab> {
        return new Promise((resolve, reject) => bundle.load(path, cc.Prefab, (error, asset: cc.Prefab) => error ? reject(error) : resolve(asset)));
    }

    private onTouchEnd(event: cc.Event.EventTouch) {
        if (this.finished || !this.roomId || this.turnUserId !== this.userId || !this.stoneLayer || !this.stonePrefab || !this.blackStone || !this.whiteStone) return;
        const point = this.stoneLayer.convertToNodeSpaceAR(event.getLocation());
        const x = Math.round((point.x - this.start) / this.cell);
        const y = Math.round((point.y - this.start) / this.cell);
        if (x < 0 || y < 0 || x >= this.size || y >= this.size || (this.board[x] && this.board[x][y])) return;
        GameNet.send(GameCode.GOMOKU, GomokuCmd.MOVE, { roomId: this.roomId, x, y });
    }

    public applyServerState(data: any) {
        if (!data || !data.roomId || !this.stoneLayer) return;
        if (!this.stonePrefab || !this.blackStone || !this.whiteStone) {
            this.pendingServerState = data;
            return;
        }
        this.roomId = Number(data.roomId);
        this.turnUserId = Number(data.turnUserId || 0);
        this.turnStartedAt = Number(data.turnStartedAt || 0);
        this.turnSeconds = Math.max(1, Number(data.turnTimeoutSeconds || this.turnSeconds));
        this.finished = !!data.finished;
        this.blackTurn = Number(data.blackUserId) === this.userId;
        const selfIsBlack = Number(data.blackUserId) === this.userId;
        this.topUserId = selfIsBlack ? this.userId : Number(data.blackUserId || 0);
        const user = UserData.get();
        const botProfile = data.botProfile || {};
        const botName = String(botProfile.nickname || "Robot");
        const botRank = String(botProfile.rankName || "Bronze II");
        const botAvatar = String(botProfile.avatar || "1");
        this.setPlayerInfo("TopPlayerInfo", selfIsBlack ? (user?.nickname || "Player") : botName, selfIsBlack ? "Bronze II" : botRank);
        this.setPlayerInfo("BottomPlayerInfo", selfIsBlack ? botName : (user?.nickname || "Player"), selfIsBlack ? botRank : "Bronze II");
        this.setStoneColor("TopPlayerInfo", selfIsBlack ? "Black" : "White");
        this.setStoneColor("BottomPlayerInfo", selfIsBlack ? "White" : "Black");
        this.setPlayerAvatar(selfIsBlack ? "TopPlayerInfo" : "BottomPlayerInfo", user?.avatar || "0");
        this.setPlayerAvatar(selfIsBlack ? "BottomPlayerInfo" : "TopPlayerInfo", botAvatar);
        this.board = data.board || [];
        this.stoneLayer.destroyAllChildren();
        for (let x = 0; x < this.size; x++) for (let y = 0; y < this.size; y++) {
            const value = this.board[x] && this.board[x][y];
            if (value) this.placeStone(x, y, value);
        }
        if (data.x !== undefined && data.y !== undefined) this.showLastStone(Number(data.x), Number(data.y));
        this.refreshServerCountdown();
        this.updateTurnView();
        if (this.finished) this.setActionButtonsActive(false);
    }

    private onServerFinish(data: any) {
        if (!data) return;
        this.applyServerState(data);
        const winnerUserId = Number(data.winnerUserId || 0);
        const result = winnerUserId === this.userId ? "You win" : "Robot wins";
        if (!this.resultPopup) this.showResultPopup(result);
    }

    private setStoneColor(barName: string, value: string) {
        const info = this.node.getChildByName(barName)?.getChildByName("GomokuPlayerInfo");
        this.setLabel(info?.getChildByName("StoneColor")?.getChildByName("StoneColorLabel"), value === "Black" ? "黑棋" : "白棋");
        const icon = info?.getChildByName("StoneColor")?.getChildByName("StoneColorIcon")?.getComponent(cc.Sprite);
        if (icon) icon.spriteFrame = value === "Black" ? this.blackStone : this.whiteStone;
    }

    private showLastStone(x: number, y: number) {
        if (!this.lastStoneMark || !this.stoneLayer) return;
        if (!this.lastStoneNode || !cc.isValid(this.lastStoneNode)) {
            this.lastStoneNode = new cc.Node("LastStoneMark");
            this.lastStoneNode.setContentSize(68, 68);
            const sprite = this.lastStoneNode.addComponent(cc.Sprite);
            sprite.spriteFrame = this.lastStoneMark;
            this.stoneLayer.addChild(this.lastStoneNode);
        }
        this.lastStoneNode.setPosition(this.start + x * this.cell, this.start + y * this.cell);
        this.lastStoneNode.setSiblingIndex(this.stoneLayer.childrenCount - 1);
    }

    private async setPlayerAvatar(barName: string, avatar: string) {
        try {
            const frame = await HallRes.instance.loadAvatarImg("avatar_" + avatar);
            const node = this.node.getChildByName(barName)?.getChildByName("GomokuPlayerInfo")?.getChildByName("AvatarFrame")?.getChildByName("Avatar");
            const sprite = node?.getComponent(cc.Sprite);
            if (sprite && cc.isValid(this.node)) {
                sprite.spriteFrame = frame;
                sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            }
        } catch (error) {
            cc.warn("Load Gomoku avatar failed", error);
        }
    }

    private placeStone(x: number, y: number, value: number) {
        if (!this.stonePrefab) return;
        if (!this.board[x]) this.board[x] = [];
        const stone = cc.instantiate(this.stonePrefab);
        if (!stone) return;
        stone.name = "Stone_" + x + "_" + y;
        stone.setPosition(this.start + x * this.cell, this.start + y * this.cell);
        const sprite = stone.getComponent(cc.Sprite);
        if (!sprite) return;
        sprite.spriteFrame = value === 1 ? this.blackStone : this.whiteStone;
        this.stoneLayer.addChild(stone);
        this.board[x][y] = value;
    }

    private undoMove() {
        if (this.finished || this.undoCount >= this.maxUndoCount) {
            return;
        }
        if (!this.stoneLayer || this.stoneLayer.childrenCount === 0) {
            ToastManager.show("No move to undo");
            return;
        }
        const stone = this.stoneLayer.children[this.stoneLayer.childrenCount - 1];
        const parts = stone.name.split("_");
        const x = Number(parts[1]);
        const y = Number(parts[2]);
        const value = this.board[x][y];
        this.board[x][y] = 0;
        stone.destroy();
        this.undoCount++;
        this.updateUndoLabel();
        this.blackTurn = value === 1;
        this.updateTurnView();
    }

    private updateUndoLabel() {
        const labelNode = this.node.getChildByName("UndoButton")?.getChildByName("label");
        this.setLabel(labelNode, (this.maxUndoCount - this.undoCount) + "/" + this.maxUndoCount);
        const button = this.node.getChildByName("UndoButton");
        if (button) button.opacity = this.undoCount >= this.maxUndoCount ? 120 : 255;
    }

    private surrender() {
        if (this.finished) return;
        if (this.roomId) {
            GameNet.send(GameCode.GOMOKU, GomokuCmd.LEAVE, { roomId: this.roomId, reason: "surrender" });
            return;
        }
        this.finish("Surrender");
    }

    private requestDraw() {
        if (!this.finished) this.finish("Draw agreed");
    }

    private finish(result: string) {
        if (this.finished) return;
        this.finished = true;
        this.unschedule(this.tick);
        this.setActionButtonsActive(false);
        this.updateTurnView();
        this.node.emit("gomoku-finish", result);
        this.showResultPopup(result);
    }

    private async showResultPopup(result: string) {
        if (this.resultPopup && cc.isValid(this.resultPopup)) return;
        const bundle = cc.assetManager.getBundle("gomoku");
        if (!bundle) return;
        try {
            const prefab = await this.loadPrefab(bundle, "prefabs/GomokuResultPopup");
            if (!cc.isValid(this.node)) return;
            this.resultPopup = cc.instantiate(prefab);
            this.resultPopup.addComponent(cc.BlockInputEvents);
            this.node.addChild(this.resultPopup);
            const title = cc.find("Panel/ResultTitle", this.resultPopup)?.getComponent(cc.Sprite);
            const titlePath = result.indexOf("win") >= 0 && result.indexOf("Robot") < 0 ? "result/gomoku_result_title_win" : "result/gomoku_result_title_lose";
            if (title) title.spriteFrame = await this.loadSprite(bundle, titlePath);
            this.addResultDescription(result);
            this.bindResultButton("Panel/ReturnHallButton", this.returnToHall);
            this.bindResultButton("Panel/MatchAgainButton", this.matchAgain);
        } catch (error) {
            cc.error("Load Gomoku result popup failed", error);
        }
    }

    private bindResultButton(path: string, action: () => void) {
        const button = cc.find(path, this.resultPopup);
        if (!button) return;
        button.targetOff(this);
        button.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
            action.call(this);
        }, this);
    }

    private addResultDescription(result: string) {
        const panel = cc.find("Panel", this.resultPopup);
        if (!panel || panel.getChildByName("ResultDescription")) return;
        const node = new cc.Node("ResultDescription");
        node.setPosition(0, 25);
        node.setContentSize(600, 44);
        const label = node.addComponent(cc.Label);
        label.string = result === "You win" ? "You defeated Robot" : "Robot defeated you";
        label.fontSize = 28;
        label.lineHeight = 36;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        panel.addChild(node);
    }

    private matchAgain() {
        this.returnToHall();
        GameNet.send(GameCode.GOMOKU, GomokuCmd.MATCH);
    }

    private setActionButtonsActive(active: boolean) {
        ["UndoButton", "DrawButton", "SurrenderButton"].forEach(name => {
            const button = this.node.getChildByName(name);
            if (button) button.active = active;
        });
    }

    private returnToHall() {
        if (this.returningToHall) return;
        this.returningToHall = true;
        this.unscheduleAllCallbacks();
        if (this.resultPopup && cc.isValid(this.resultPopup)) this.resultPopup.active = false;
        this.node.destroy();
    }

    private closeGame() {
        if (!this.finished && !this.confirmLeave()) return;
        if (!this.finished) this.surrender();
        this.unscheduleAllCallbacks();
        this.returnToHall();
    }

    private confirmLeave(): boolean {
        if (cc.sys.isBrowser && typeof window !== "undefined") {
            return window.confirm("离开本局将视为认输，是否确认离开？");
        }
        return true;
    }

    private isWin(x: number, y: number, value: number): boolean {
        return [[1, 0], [0, 1], [1, 1], [1, -1]].some(dir => this.count(x, y, dir[0], dir[1], value) + this.count(x, y, -dir[0], -dir[1], value) - 1 >= 5);
    }

    private count(x: number, y: number, dx: number, dy: number, value: number): number {
        let total = 0;
        while (x >= 0 && y >= 0 && x < this.size && y < this.size && this.board[x] && this.board[x][y] === value) {
            total++;
            x += dx;
            y += dy;
        }
        return total;
    }
}
