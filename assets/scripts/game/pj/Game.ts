const { ccclass } = cc._decorator;

import GameRes from "./GameRes";
import { SceneData } from "../../util/SceneUtil";
import ClientRoomManager from "./room/ClientRoomManager";

@ccclass
export default class Game extends cc.Component {

    private seatContainerNode: cc.Node = null;
    private destroyed: boolean = false;
    private isPlayingBgm: boolean = false;

    onLoad() {
        console.log("Game onLoad");
        this.seatContainerNode = cc.find("Canvas/MainLayout/Table/SeatContainer");
        if (!this.seatContainerNode) {
            cc.error("找不到 SeatContainer");
        }
    }

    async start() {
        const t = Date.now();
        await this.initTable();
        ClientRoomManager.instance.onGameSceneReady();
        console.log("初始化游戏桌子耗时:", Date.now() - t, "ms");
    }

    private async initTable(): Promise<void> {
        if (!this.seatContainerNode) {
            return;
        }

        const seatManager = this.seatContainerNode.getComponent("SeatManager") as any;

        if (!seatManager) {
            cc.error("SeatContainer 缺少 SeatManager 组件");
            return;
        }

        await seatManager.init();

        seatManager.initSeatLayout();

        // BGM 不阻塞桌子初始化
        this.playGameBgm();
    }

    private async playGameBgm(): Promise<void> {
        if (this.isPlayingBgm) {
            return;
        }

        if (!GameRes.instance.gameBgmAudio) {
            await GameRes.instance.loadGameBgmAudio();
        }

        if (this.destroyed || !cc.isValid(this.node)) {
            return;
        }

        if (!GameRes.instance.gameBgmAudio) {
            cc.error("游戏背景音乐不存在");
            return;
        }

        cc.audioEngine.stopMusic();

        cc.audioEngine.playMusic(GameRes.instance.gameBgmAudio, true);
        cc.audioEngine.setMusicVolume(0.3);

        this.isPlayingBgm = true;

        console.log("播放游戏背景音乐");
    }

    protected onDestroy(): void {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        cc.audioEngine.stopMusic();

        this.isPlayingBgm = false;

        SceneData.clear();

        ClientRoomManager.instance.cleanRoom();

        console.log("game onDestroy");
    }
}