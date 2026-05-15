const { ccclass } = cc._decorator;
import ClientRoomManager from "../room/ClientRoomManager";
import {Cmd} from "../enum/Cmd";
import ToastManager from "../../../common/ToastManager";
import { SceneUtil } from "../../../util/SceneUtil";
@ccclass
export default class WsClient {
    

    private static _instance: WsClient = null;

    public static get instance(): WsClient {
        if (!this._instance) {
            this._instance = new WsClient();
        }
        return this._instance;
    }

    private ws: WebSocket | null = null;
    private seq: number = 1;
    private token: string = "";
    private url: string = "";

    private constructor() {}

    public connectAsync(baseUrl: string, token: string): Promise<void> {
        return new Promise((resolve, reject) => {

            this.url = `${baseUrl}?token=${encodeURIComponent(token)}`;
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                cc.log("WebSocket连接成功");

                this.startHeartbeat();
                resolve(); // 👉 通知外部可以发消息了
            };

            this.ws.onerror = (err) => {
                reject(err);
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onclose = () => {
                console.log("WebSocket断开连接");
                this.stopHeartbeat();
                this.reconnect();
            };
        });
    }


    private reconnect() {
        if (!this.token || !this.url) return;

        cc.log("WebSocket重连中...");
        this.ws = null;

        // this.url 已经带 token
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            cc.log("WebSocket重连成功");
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.ws.onerror = (event) => {
            cc.error("WebSocket重连错误:", event);
        };

        this.ws.onclose = () => {
            this.stopHeartbeat();
            setTimeout(() => {
                this.reconnect();
            }, 3000);
        };
    }

    public send(cmd: string, data: any = {}) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log("WebSocket未连接，发送失败:", cmd);
            ToastManager.show("网络中断,操作无效!");
            return;
        }

        const msg = {
            cmd: cmd,
            seq: this.seq++,
            data: data
        };
        if(Cmd.PING !== cmd){
            console.log("send", msg);
        }
        this.ws.send(JSON.stringify(msg));
    }

    public sendWithSeq(cmd: string, data: any = {}): number {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            cc.warn("WebSocket未连接，发送失败:", cmd);
            ToastManager.show("网络中断,操作无效!");
            return 0;
        }

        const seq = this.seq++;

        const msg = {
            cmd: cmd,
            seq: seq,
            data: data
        };

        this.ws.send(JSON.stringify(msg));
        return seq;
    }

    private handleMessage(text: string) {
        let msg: any = null;

        try {
            msg = JSON.parse(text);
        } catch (e) {
            console.error("解析JSON失败");
            console.error(text)
            return;
        }

        if(Cmd.PONG !== msg.cmd){
             console.log("收到消息:", msg.cmd);
        }
       
        if (msg.code !== 0) {
            console.error("服务端错误:", msg.cmd, msg.code, msg.msg);
            ToastManager.show(msg.msg)
            if(msg.code === 2002){
                SceneUtil.loadScene("login")
                return;
            }
            return;
        }

        switch (msg.cmd) {
            case Cmd.ENTER_ROOM_RESULT:
                ClientRoomManager.instance.applyEnterRoom(msg.data);
                break;
            case Cmd.ROOM_INFO_RESULT:
                ClientRoomManager.instance.applyRoomInfo(msg.data);
                break;
            case Cmd.PLAYER_ENTER:
                ClientRoomManager.instance.applyPlayerEnter(msg.data);
                break;
            case Cmd.SIT_DOWN_RESULT:
                ClientRoomManager.instance.applySitDown(msg.data);
                break;
            case Cmd.PLAYER_SIT_DOWN:
                ClientRoomManager.instance.applySitDown(msg.data);
                break;    
            case Cmd.READY_RESULT:
                cc.log("自己准备成功");
                ClientRoomManager.instance.selfReadyOk(msg.data);
                break;
            case Cmd.PLAYER_READY:
                ClientRoomManager.instance.applyPlayerReady(msg.data);
                break;
             case Cmd.CANCEL_READY_RESULT:
                cc.log("自己取消准备成功");
                ClientRoomManager.instance.selfCancelReadyOk(msg.data);
                break;
            case Cmd.CANCEL_PLAYER_READY:
                ClientRoomManager.instance.applyCancelPlayerReady(msg.data);
                break;
            case Cmd.GAME_START:
                console.log("game start", msg.data)
                ClientRoomManager.instance.applyGameStart(msg.data);
                break;
            case Cmd.BET_RESULT:
                cc.log("自己下注成功:", msg.data);
                ClientRoomManager.instance.selfBetOk(msg.data);
                break;
            case Cmd.PLAYER_BET:
                ClientRoomManager.instance.applyPlayerBet(msg.data);
                break;
            case Cmd.DEAL_CARD:    
                ClientRoomManager.instance.dealCard(msg.data);
                break
            case Cmd.SETTLE: 
                ClientRoomManager.instance.settle(msg.data);
                break;       
            case Cmd.NEXT_ROUND_RESULT:
                // 下一局
                ClientRoomManager.instance.nextRound(msg.data);
                break;
            case Cmd.LEAVE_ROOM_RESULT:
                ClientRoomManager.instance.leaveRoom(msg.data);
                break;
            case Cmd.PLAYER_LEAVE:
                  ClientRoomManager.instance.playerLeaveRoom(msg.data);
                break;            
            case Cmd.PONG:
                break;
            default:
                cc.log("未处理消息:", msg);
                break;
        }
    }

    private heartbeatTimer: any = null;

    private startHeartbeat() {
        this.stopHeartbeat();

        this.heartbeatTimer = setInterval(() => {
            this.send("PING");
        }, 15000);
    }

    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    public close() {
        this.stopHeartbeat();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}