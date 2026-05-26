const { ccclass, property } = cc._decorator;
import GameRes from "./GameRes";
import WsClient from "./net/WsClient";
import {Cmd} from "./enum/Cmd";
import {SceneData, SceneUtil} from "../../util/SceneUtil";
import ClientRoomManager from "./room/ClientRoomManager";
import Config from "../../config/Config";
import { RoomCardType } from "../../hall/room/RoomSelectPopup";

@ccclass
export default class Game extends cc.Component {
    private seatContainerNode: cc.Node = null;
    private destroyed: boolean = false;
    private gameBgmAudio: number | null = null;
    onLoad () {
        console.log("Game onLoad");
        this.seatContainerNode = cc.find("Canvas/MainLayout/Table/SeatContainer");
     }


    async start() {
        cc.log("加载游戏场景");
        await this.initTable();
        ClientRoomManager.instance.onGameSceneReady();
    }

    async initTable() {
        await GameRes.instance.preload();

        const seatManager =  this.seatContainerNode.getComponent("SeatManager");
        await seatManager.init();
        // 初始化桌子
        seatManager.initSeatLayout();
    }

    

   
    protected onDestroy(): void {
        if(!this.destroyed){
            if(this.gameBgmAudio !== null){
                cc.audioEngine.stopEffect(this.gameBgmAudio);
                this.gameBgmAudio = null;
            }
            this.destroyed = true;
           
            console.log("game onDestroy")
            SceneData.clear();
            ClientRoomManager.instance.cleanRoom();
        }
        
    }
    

}