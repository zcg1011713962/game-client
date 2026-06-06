import { User } from "./User";

export default class UserData {

    private static KEY = "user_login_data";

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