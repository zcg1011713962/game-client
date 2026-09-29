import WsClient from "../../paijiu/scripts/pj/net/WsClient";
import { GameCode } from "./GameCode";

export default class GameNet {
    public static send(gameCode: GameCode, cmd: string, data: any = {}): void {
        WsClient.instance.send(cmd, { ...data, gameCode });
    }

    public static request(gameCode: GameCode, cmd: string, data: any = {}, timeoutMs: number = 5000): Promise<any> {
        return WsClient.instance.request(cmd, { ...data, gameCode }, timeoutMs);
    }

    public static on(cmd: string, callback: (data: any) => void, target: any): void {
        cc.systemEvent.on("game:" + cmd, callback, target);
    }

    public static off(cmd: string, callback: (data: any) => void, target: any): void {
        cc.systemEvent.off("game:" + cmd, callback, target);
    }
}
