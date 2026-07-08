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
     * 获取本机游客设备标识。只生成一次，用来保证一台设备尽量对应一个游客账号。
     */
    static getOrCreateGuestDeviceId(): string {
        try {
            let deviceId = cc.sys.localStorage.getItem(this.GUEST_DEVICE_KEY);
            if (!deviceId) {
                deviceId = this.createGuestDeviceId();
                cc.sys.localStorage.setItem(this.GUEST_DEVICE_KEY, deviceId);
            }
            return deviceId;
        } catch (e) {
            cc.error("读取游客设备标识失败", e);
            return this.createGuestDeviceId();
        }
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
