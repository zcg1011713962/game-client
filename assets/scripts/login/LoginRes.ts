
export default class LoginRes {
    private static _instance: LoginRes = null;
    private loginBundle: cc.AssetManager.Bundle | null= null;
    private mouseCursorPrefab: cc.Prefab | null= null;
    private toastPrefab: cc.Prefab | null= null;
    public static get instance(): LoginRes {
        if (!this._instance) {
            this._instance = new LoginRes();
        }
        return this._instance;
    }
    private constructor() {}


    public async preload(): Promise<void> {
        const t = Date.now();

        await this.loadLoginBundle();

        console.log("初始化登录页资源耗时:", Date.now() - t, "ms");
    }

    private loadLoginBundle(): Promise<cc.AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            if (this.loginBundle) {
                resolve(this.loginBundle);
                return;
            }

            cc.assetManager.loadBundle("bundle_login", (err, bundle) => {
                if (err) {
                    cc.error("bundle_login 加载失败:", err);
                    reject(err);
                    return;
                }

                this.loginBundle = bundle;
                resolve(bundle);
            });
        });
    }

    public async loadCursorPrefab(): Promise<cc.Prefab> {
        if (this.mouseCursorPrefab) return this.mouseCursorPrefab;

        const bundle = await this.loadLoginBundle();

        return new Promise((resolve, reject) => {
            bundle.load("prefabs/MouseCursorRoot", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    cc.error("鼠标预制体加载失败:", err);
                    reject(err);
                    return;
                }

                this.mouseCursorPrefab = prefab;

                console.log("鼠标预制体加载完毕");
                resolve(prefab);
            });
        });
    }

    public async loadToastPrefab(): Promise<cc.Prefab> {
        if (this.toastPrefab) return this.toastPrefab;

        const bundle = await this.loadLoginBundle();

        return new Promise((resolve, reject) => {
            bundle.load("prefabs/ToastPrefab", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    cc.error("提示弹窗制体加载失败:", err);
                    reject(err);
                    return;
                }

                this.toastPrefab = prefab;

                console.log("提示弹窗预制体加载完毕");
                resolve(prefab);
            });
        });
    }

     


}