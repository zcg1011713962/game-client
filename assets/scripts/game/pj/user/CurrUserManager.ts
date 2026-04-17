export default class CurrUserManager {
    private static _instance: CurrUserManager;

    public static getInstance() {
        if (!this._instance) {
            this._instance = new CurrUserManager();
        }
        return this._instance;
    }

    public currentUserId: number = -1;
    public userInfo: any = null;
}