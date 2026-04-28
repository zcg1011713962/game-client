const { ccclass, property } = cc._decorator;
import CursorManager from "./common/CursorManager";
import RoomManager from "./room/RoomManager";
import { UserInfo } from "./user/UserInfo";
import CurrUserManager from "./user/CurrUserManager";
import UIManager from "./ui/UIManager";
import GameRes from "./GameRes";
import WsClient from "./net/WsClient";
import {Cmd} from "./enum/Cmd";

@ccclass
export default class Game extends cc.Component {

    private cursorNode: cc.Node = null;
    private cursorOkNode: cc.Node = null;
    private canvasNode: cc.Node = null;
    private seatContainerNode: cc.Node = null;
    

    onLoad () {
        console.log("Game onLoad");
        this.disableVConsole();

        this.canvasNode = cc.find("Canvas");
        this.cursorNode = cc.find("Canvas/CursorLayer/Hand");
        this.cursorOkNode = cc.find("Canvas/CursorLayer/Hand_ok");
        this.seatContainerNode = cc.find("Canvas/MainLayout/Table/SeatContainer");
        if (!this.cursorNode) {
            cc.error("找不到 Hand 节点！");
            return;
        }
        CursorManager.init(this.canvasNode, this.cursorNode, this.cursorOkNode);
        // 鼠标移动手势
        this.canvasNode.on(cc.Node.EventType.MOUSE_MOVE, CursorManager.onMove, CursorManager);
     }


    async start() {
        const token = this.getQuery("token");
        const roomId = this.getQuery("roomId");

        const url = "ws://127.0.0.1:19001/ws";
        await WsClient.instance.connectAsync(url, token);

        this.initTable();
        // 进房
        WsClient.instance.send(Cmd.ENTER_ROOM, {roomId: roomId});
    }

    async initTable() {
        await GameRes.instance.preload();

        const seatManager =  this.seatContainerNode.getComponent("SeatManager");
        // 隐藏准备按钮
        UIManager.instance.setStartBtnStatus(false);
        await seatManager.init();
        // 初始化桌子
        seatManager.initSeatLayout();
    }

    


    public enterRoom(roomId : number, selftUserId: number){

        // 准备
        WsClient.instance.send("READY", {
            roomId: roomId
        });

       
       


        // for (let i = 1; i < 8; i++) {
        //      const userId = selftUserId + i;
        //      let user = new UserInfo({ userId: userId, nickname: "玩家" + i , gold: i * 10000, avatar: String(i)});
        //      RoomManager.enterRoom(12345678, user);
        //      RoomManager.sitDown(userId, i);
        //      RoomManager.ready(userId);
        // }
       
    }

    
    disableVConsole(){
        (function () {
        const w: any = window;

        // 1. 干掉已存在
        if (w.vConsole) {
            try { w.vConsole.destroy(); } catch (e) {}
            w.vConsole = null;
        }

        // 2. 删DOM
        const el = document.getElementById('__vconsole');
        if (el) el.remove();

        // 3. 拦截未来创建
        Object.defineProperty(w, "VConsole", {
            configurable: true,
            get() {
                return function () {
                    return { destroy() {} };
                };
            }
        });
        })();
    }

    private getQuery(name: string): string {
        const query = window.location.search.substring(1);
        const arr = query.split("&");

        for (let i = 0; i < arr.length; i++) {
            const kv = arr[i].split("=");
            if (kv[0] === name) {
                return decodeURIComponent(kv[1] || "");
            }
        }

        return "";
    }

}