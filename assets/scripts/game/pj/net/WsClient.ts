const { ccclass } = cc._decorator;

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

    public connect(baseUrl: string, token: string) {
        this.token = token;
        this.url = `${baseUrl}?token=${encodeURIComponent(token)}`;

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            cc.log("WebSocket连接成功");
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            cc.log("收到消息:", event.data);
            this.handleMessage(event.data);
        };

        this.ws.onerror = (event) => {
            cc.error("WebSocket错误:", event);
        };

        this.ws.onclose = () => {
            cc.warn("WebSocket已关闭");
            this.stopHeartbeat();

            // 简单重连
            setTimeout(() => {
                this.reconnect();
            }, 3000);
        };
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
            cc.warn("WebSocket未连接，发送失败:", cmd);
            return;
        }

        const msg = {
            cmd: cmd,
            seq: this.seq++,
            data: data
        };

        this.ws.send(JSON.stringify(msg));
    }

    public sendWithSeq(cmd: string, data: any = {}): number {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            cc.warn("WebSocket未连接，发送失败:", cmd);
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
            cc.error("消息JSON解析失败:", text);
            return;
        }

        switch (msg.cmd) {
            case "PONG":
                break;

            case "JOIN_ROOM_RESULT":
                cc.log("进房结果:", msg);
                break;

            case "READY_RESULT":
                cc.log("准备结果:", msg);
                break;

            case "BET_RESULT":
                cc.log("投注结果:", msg);
                break;

            case "PLAYER_BET":
                cc.log("玩家投注广播:", msg);
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