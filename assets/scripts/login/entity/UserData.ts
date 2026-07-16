import { User } from "./User";

export default class UserData {

    private static KEY = "user_login_data";
    private static GUEST_DEVICE_KEY = "guest_device_id";

    /**
     * 保存用户信息
     */
    static save(data: User) {
        if (!data) return;
        try {
            cc.sys.localStorage.setItem(
                this.KEY,
                JSON.stringify(data)
            );
        } catch (e) {
            cc.error("保存用户信息失败", e);
        }
    }

    /**
     * 获取用户信息
     */
    static get(): User | null {
        try {
            const str = cc.sys.localStorage.getItem(this.KEY);
            if (!str) return null;
            return JSON.parse(str) as User;
        } catch (e) {
            cc.error("读取用户信息失败", e);
            return null;
        }
    }

    /**
     * 清除用户信息
     */
    static clearUserData() {
        cc.sys.localStorage.removeItem(this.KEY);
    }

    /**
     * 获取游客设备标识。优先使用可重复计算的设备短码，让同一台设备的不同浏览器尽量命中同一个游客账号。
     */
    static getOrCreateGuestDeviceId(): string {
        try {
            const deviceId = this.createStableGuestDeviceId();
            if (deviceId) {
                cc.sys.localStorage.setItem(this.GUEST_DEVICE_KEY, deviceId);
                return deviceId;
            }

            let cachedDeviceId = cc.sys.localStorage.getItem(this.GUEST_DEVICE_KEY);
            if (!cachedDeviceId) {
                cachedDeviceId = this.createGuestDeviceId();
                cc.sys.localStorage.setItem(this.GUEST_DEVICE_KEY, cachedDeviceId);
            }
            return cachedDeviceId;
        } catch (e) {
            cc.error("读取游客设备标识失败", e);
            return this.createGuestDeviceId();
        }
    }

    private static createStableGuestDeviceId(): string {
        if (!cc.sys.isBrowser || typeof window === "undefined") {
            return "";
        }

        const nav: any = window.navigator || {};
        const screenInfo: any = window.screen || {};
        const width = Number(screenInfo.width || 0);
        const height = Number(screenInfo.height || 0);
        const minSide = Math.min(width, height);
        const maxSide = Math.max(width, height);
        const timezone = (() => {
            try {
                const intl = (window as any).Intl;
                return intl ? intl.DateTimeFormat().resolvedOptions().timeZone || "" : "";
            } catch (e) {
                return "";
            }
        })();
        const os = this.getBrowserIndependentOS(nav);

        const raw = [
            os,
            minSide,
            maxSide,
            screenInfo.colorDepth || "",
            window.devicePixelRatio || "",
            timezone,
            new Date().getTimezoneOffset()
        ].join("|");

        return `guest_${this.hashToBase36(raw)}`;
    }

    private static getBrowserIndependentOS(nav: any): string {
        const ua = String(nav.userAgent || "").toLowerCase();
        const platform = String(nav.platform || "").toLowerCase();
        const source = `${ua}|${platform}`;

        if (source.indexOf("windows") >= 0 || source.indexOf("win32") >= 0 || source.indexOf("win64") >= 0) {
            return "windows";
        }
        if (source.indexOf("android") >= 0) {
            return "android";
        }
        if (source.indexOf("iphone") >= 0 || source.indexOf("ipad") >= 0 || source.indexOf("ipod") >= 0) {
            return "ios";
        }
        if (source.indexOf("mac") >= 0) {
            return "mac";
        }
        if (source.indexOf("linux") >= 0) {
            return "linux";
        }
        return platform || "unknown";
    }

    private static hashToBase36(raw: string): string {
        let h1 = 0xdeadbeef;
        let h2 = 0x41c6ce57;
        for (let i = 0; i < raw.length; i++) {
            const ch = raw.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return `${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`;
    }

    private static createGuestDeviceId(): string {
        const random = Math.floor(Math.random() * 100000000).toString(36);
        return `guest_${Date.now().toString(36)}_${random}`;
    }

    /**
     * 更新金币
     */
    static updateGold(gold: number) {
        const user = this.get();
        if (!user) return;
        user.gold = gold;
        this.save(user);
    }

    /**
     * 更新房卡
     */
    static updateRoomCard(roomCard: number) {
        const user = this.get();
        if (!user) return;
        user.roomCard = roomCard;
        this.save(user);
    }

    /**
     * 更新昵称
     */
    static updateNickname(nickname: string) {
        const user = this.get();
        if (!user) return;
        user.nickname = nickname;
        this.save(user);
    }

    /**
     * 更新头像
     */
    static updateAvatar(avatar: string) {
        const user = this.get();
        if (!user) return;
        user.avatar = avatar;
        this.save(user);
    }
}
