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
    private pendingRequests: { [seq: number]: { resolve: Function, reject: Function } } = {};

    private constructor() {}

    public connectAsync(baseUrl: string, token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN){
                resolve();
                return;
            }

            this.url = `${baseUrl}?token=${encodeURIComponent(token)}`;
            this.ws = new WebSocket(this.url);
            this.token = token;

            this.ws.onopen = () => {
                console.log("WebSocket连接成功");
                this.startHeartbeat();
                ClientRoomManager.instance.syncRoomInfo();
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
        console.log("reconnect", this.url)
        if (!this.url) return;

        console.log("WebSocket重连中...");
        this.ws = null;

        // this.url 已经带 token
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log("WebSocket重连成功");
            this.startHeartbeat();
            ClientRoomManager.instance.syncRoomInfo();
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.ws.onerror = (event) => {
            console.log("WebSocket重连错误:", event);
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

    public request(cmd: string, data: any = {}, timeoutMs: number = 5000): Promise<any> {
        return new Promise((resolve, reject) => {
            const seq = this.sendWithSeq(cmd, data);
            if (!seq) {
                reject("send failed");
                return;
            }

            const timer = setTimeout(() => {
                delete this.pendingRequests[seq];
                reject("request timeout");
            }, timeoutMs);

            this.pendingRequests[seq] = {
                resolve: (data: any) => {
                    clearTimeout(timer);
                    resolve(data);
                },
                reject: (err: any) => {
                    clearTimeout(timer);
                    reject(err);
                }
            };
        });
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
       
        const pending = this.pendingRequests[msg.seq];
        if (pending) {
            delete this.pendingRequests[msg.seq];
            if (msg.code === 0) {
                pending.resolve(msg.data);
            } else {
                pending.reject(msg.msg || msg.code);
            }
            return;
        }

        if (msg.code !== 0) {
            console.error("服务端错误:", msg.cmd, msg.code, msg.msg);
            if (msg.cmd === Cmd.READY && msg.code === 1019) {
                if (!ClientRoomManager.instance.showLatestRoomFinalSettle()) {
                    ClientRoomManager.instance.syncRoomInfo();
                }
            } else if(msg.code === 2002){
                ToastManager.show("网络中断")
            }else{
                ToastManager.show(msg.msg)
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
            case Cmd.CREATE_INVITE_RESULT:
                cc.systemEvent.emit(Cmd.CREATE_INVITE_RESULT, msg.data);
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
                ClientRoomManager.instance.selfReadyOk(msg.data);
                break;
            case Cmd.PLAYER_LEAVE_SEAT:
                ClientRoomManager.instance.leaveSeat(msg.data);
                break;    
            case Cmd.PLAYER_READY:
                ClientRoomManager.instance.applyPlayerReady(msg.data);
                break;
             case Cmd.CANCEL_READY_RESULT:
                ClientRoomManager.instance.selfCancelReadyOk(msg.data);
                break;
            case Cmd.CANCEL_PLAYER_READY:
                ClientRoomManager.instance.applyCancelPlayerReady(msg.data);
                break;
            case Cmd.GAME_START:
                ClientRoomManager.instance.applyGameStart(msg.data);
                break;
            case Cmd.GRAB_BANKER_START:
                ClientRoomManager.instance.grabBankerStart(msg.data);
                break;
            case Cmd.PLAYER_GRAB_BANKER:
                ClientRoomManager.instance.playerGrabBanker(msg.data);
                break;
            case Cmd.GRAB_BANKER_RESULT:
                ClientRoomManager.instance.grabBankerEnd(msg.data);
                break;        
            case Cmd.BET_RESULT:
                ClientRoomManager.instance.selfBetOk(msg.data);
                break;
            case Cmd.PLAYER_BET:
                ClientRoomManager.instance.applyPlayerBet(msg.data);
                break;
            case Cmd.DEAL_CARD:    
                ClientRoomManager.instance.dealCard(msg.data);
                break
            case Cmd.PLAYER_OPEN_CARD:
                ClientRoomManager.instance.playerOpenCard(msg.data);
                break;
            case Cmd.SETTLE: 
                ClientRoomManager.instance.settle(msg.data);
                break;       
            case Cmd.NEXT_ROUND:
                // 下一局
                ClientRoomManager.instance.nextRound(msg.data);
                break;
            case Cmd.ROOM_FINAL_SETTLE:
                ClientRoomManager.instance.roomFinalSettle(msg.data);
                break;
            case Cmd.LEAVE_ROOM_RESULT:
                ClientRoomManager.instance.leaveRoom(msg.data);
                break;
            case Cmd.PLAYER_LEAVE:
                ClientRoomManager.instance.playerLeaveRoom(msg.data);
                break;     
            case Cmd.USER_ASSET_UPDATE:
                ClientRoomManager.instance.userAssetUpdate(msg.data);
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
