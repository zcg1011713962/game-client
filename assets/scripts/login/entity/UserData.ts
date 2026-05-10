import { User } from "./User";

export default class UserData {

    private static KEY = "user_login_data";

    /**
     * 保存用户信息
     */
    static save(data: User) {

        cc.sys.localStorage.setItem(
            this.KEY,
            JSON.stringify(data)
        );
    }

    /**
     * 获取用户信息
     */
    static get(): User | null {

        const str = cc.sys.localStorage.getItem(this.KEY);

        if (!str) {
            return null;
        }

        return JSON.parse(str);
    }

    /**
     * 清除用户信息
     */
    static clear() {

        cc.sys.localStorage.removeItem(this.KEY);
    }
}