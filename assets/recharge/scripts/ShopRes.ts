export default class ShopRes {
    private static _instance: ShopRes = null;

    private shopBundle: cc.AssetManager.Bundle = null;
    public rechargePrefab: cc.Prefab = null;
    public rechargeHistoryItemPrefab: cc.Prefab = null;

    public static get instance(): ShopRes {
        if (!this._instance) {
            this._instance = new ShopRes();
        }
        return this._instance;
    }

    private constructor() {}


    private loadShopBundle(): Promise<cc.AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            if (this.shopBundle) {
                resolve(this.shopBundle);
                return;
            }

            cc.assetManager.loadBundle("recharge", (err, bundle) => {
                if (err) {
                    cc.error("bundle_shop 加载失败:", err);
                    reject(err);
                    return;
                }

                this.shopBundle = bundle;
                resolve(bundle);
            });
        });
    }

    public async loadRechargePrefab(): Promise<cc.Prefab> {
        if (this.rechargePrefab) return this.rechargePrefab;
        const bundle = await this.loadShopBundle();
        return new Promise((resolve, reject) => {
            bundle.load("prefabs/RechargePopup", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) { reject(err); return; }
                this.rechargePrefab = prefab;
                resolve(prefab);
            });
        });
    }

    public async loadRechargeHistoryItemPrefab(): Promise<cc.Prefab> {
        if (this.rechargeHistoryItemPrefab) return this.rechargeHistoryItemPrefab;
        const bundle = await this.loadShopBundle();
        return new Promise((resolve, reject) => {
            bundle.load("prefabs/RechargeHistoryItem", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) { reject(err); return; }
                this.rechargeHistoryItemPrefab = prefab;
                resolve(prefab);
            });
        });
    }

}
