import Config from "../config/Config";
import Http from "../util/Http";
import UserData from "../login/entity/UserData";
import { ServerMsg } from "../login/entity/ServerMsg";

export interface PaymentConfig {
    enabled: boolean;
    network: string;
    coinsPerUsdt: number;
    minAmount: string;
    maxAmount: string;
}
export interface PaymentOrder {
    orderId: string;
    amount: string;
    payAmount: string;
    coins: number;
    address: string;
    network: string;
    status: "PENDING" | "EXPIRED" | "CREDITING" | "PAID";
    createdAt: number;
    expiresAt: number;
    paidAt: number | null;
    txId: string | null;
    qrRows?: string[];
    gold?: number;
}

export default class PaymentApi {
    static config(): Promise<PaymentConfig> { return this.post("config", {}); }
    static create(amount: string, requestId: string): Promise<PaymentOrder> { return this.post("create", { amount, requestId }); }
    static status(orderId: string): Promise<PaymentOrder> { return this.post("status", { orderId }); }
    static history(page: number): Promise<PaymentOrder[]> { return this.post("history", { page }); }

    /** Persist before HTTP: a timed-out request can be retried without making a second order. */
    static requestId(amount: string): string {
        const key = this.storageKey("request:" + amount);
        const existing = cc.sys.localStorage.getItem(key);
        if (existing) return existing;
        const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2) + "-" + Math.random().toString(36).slice(2);
        cc.sys.localStorage.setItem(key, id);
        return id;
    }
    static clearRequest(amount: string) { cc.sys.localStorage.removeItem(this.storageKey("request:" + amount)); }
    private static storageKey(suffix: string) {
        const user = UserData.get();
        return "okx-payment:" + (user ? user.userId : "guest") + ":" + suffix;
    }
    private static async post<T>(path: string, data: any): Promise<T> {
        const user = UserData.get();
        if (!user || !user.token) throw new Error("请先登录");
        const res = await Http.postAsync<ServerMsg<T>>(Config.API_URL + "/payment/" + path, data, { token: user.token });
        if (!res || res.code !== 0) throw new Error(res && res.msg ? res.msg : "充值服务暂时不可用");
        return res.data;
    }
}
