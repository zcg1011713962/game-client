export default class ShopRes {
    private static _instance: ShopRes = null;

    private shopBundle: cc.AssetManager.Bundle = null;
    public shopPrefab: cc.Prefab = null;
    public buyConfirmPrefab: cc.Prefab = null;

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

            cc.assetManager.loadBundle("bundle_shop", (err, bundle) => {
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

    public async loadShopPrefab(): Promise<cc.Prefab> {
        if (this.shopPrefab) return this.shopPrefab;

        const bundle = await this.loadShopBundle();

        return new Promise((resolve, reject) => {
            bundle.load("prefabs/Shop", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    cc.error("商城预制体加载失败:", err);
                    reject(err);
                    return;
                }

                this.shopPrefab = prefab;

                //console.log("商城预制体加载完成");
                resolve(prefab);
            });
        });
    }

    public async loadBuyConfirmPrefab(): Promise<cc.Prefab> {
        if (this.buyConfirmPrefab) return this.buyConfirmPrefab;

        const bundle = await this.loadShopBundle();

        return new Promise((resolve, reject) => {
            bundle.load("prefabs/BuyConfirmPopup", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    cc.error("商城弹窗预制体加载失败:", err);
                    reject(err);
                    return;
                }

                this.buyConfirmPrefab = prefab;
                console.log("商城弹窗预制体加载完成");
                resolve(prefab);
            });
        });
    }

}
