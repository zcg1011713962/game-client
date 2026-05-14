const { ccclass, property } = cc._decorator;
import GameRes from "./GameRes";
import WsClient from "./net/WsClient";
import {Cmd} from "./enum/Cmd";
import {SceneData, SceneUtil} from "../../util/SceneUtil";
import ClientRoomManager from "./room/ClientRoomManager";
import Config from "../../config/Config";

@ccclass
export default class Game extends cc.Component {
    private seatContainerNode: cc.Node = null;
    private destroyed: boolean = false;
    onLoad () {
        console.log("Game onLoad");
        this.seatContainerNode = cc.find("Canvas/MainLayout/Table/SeatContainer");
        //this.node.on(cc.Node.EventType.TOUCH_END, this.onClick, this);
     }


    async start() {
        const data = SceneData.getData<any>();
        if(!data){
            // 切换到大厅场景
            SceneUtil.loadScene("login", null);
            return;
        }
        const token = data.token;
        if(token){
            await this.initTable();
            await WsClient.instance.connectAsync(Config.WS_URL, token);
            // 进房
            WsClient.instance.send(Cmd.FREE_MATCH, "");
        }else{
            console.log("进入游戏失败", token);
        }
    }

    async initTable() {
        await GameRes.instance.preload();

        const seatManager =  this.seatContainerNode.getComponent("SeatManager");
        await seatManager.init();
        // 初始化桌子
        seatManager.initSeatLayout();
    }

    
    private onClick(event: cc.Event.EventMouse){
        const worldPos = event.getLocation(); // 世界坐标
        console.log("世界坐标:", worldPos);
    }
   
    protected onDestroy(): void {
        if(!this.destroyed){
            this.destroyed = true;
            console.log("game onDestroy")
            SceneData.clear();
            ClientRoomManager.instance.cleanRoom();
        }
        
    }
    

}