export default class LoginRes {
    private static _instance: LoginRes = null;

    private mouseCursorPrefab: cc.Prefab = null;
    private toastPrefab: cc.Prefab = null;

    public static get instance(): LoginRes {
        if (!this._instance) {
            this._instance = new LoginRes();
        }
        return this._instance;
    }

    private constructor() {}

    public async preload(): Promise<void> {
        const t = Date.now();

        await Promise.all([
            this.loadCursorPrefab(),
            this.loadToastPrefab(),
        ]);

        console.log("初始化登录页资源耗时:", Date.now() - t, "ms");
    }

    public async loadCursorPrefab(): Promise<cc.Prefab> {
        if (this.mouseCursorPrefab) {
            return this.mouseCursorPrefab;
        }

        return new Promise((resolve, reject) => {
            cc.resources.load(
                "prefabs/MouseCursorRoot",
                cc.Prefab,
                (err, prefab: cc.Prefab) => {
                    if (err) {
                        cc.error("鼠标预制体加载失败:", err);
                        reject(err);
                        return;
                    }

                    this.mouseCursorPrefab = prefab;
                    //console.log("鼠标预制体加载完毕");
                    resolve(prefab);
                }
            );
        });
    }

    public async loadToastPrefab(): Promise<cc.Prefab> {
        if (this.toastPrefab) {
            return this.toastPrefab;
        }

        return new Promise((resolve, reject) => {
            cc.resources.load(
                "prefabs/ToastPrefab",
                cc.Prefab,
                (err, prefab: cc.Prefab) => {
                    if (err) {
                        cc.error("提示弹窗预制体加载失败:", err);
                        reject(err);
                        return;
                    }

                    this.toastPrefab = prefab;
                    //console.log("提示弹窗预制体加载完毕");
                    resolve(prefab);
                }
            );
        });
    }
}