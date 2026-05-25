export class SceneData {

    private static _data: any = null;

    static setData(data: any) {
        this._data = data;
    }

    static getData<T>(): T {
        return this._data as T;
    }

    static clear() {
        this._data = null;
    }
}

export class SceneUtil {

    static async loadScene(scene: string, data?: any): Promise<void> {

        SceneData.setData(data);

        if (scene === "game_1") {
            await this.loadBundleScene("bundle_game", "scene/game_1");
            return;
        }

        if (scene === "hall") {
            await this.loadBundleScene("bundle_hall", "scene/hall");
            return;
        }
         if (scene === "login") {
            await this.loadBundleScene("bundle_login", "scene/login");
            return;
        }

        cc.error("未知场景:", scene);
    }

    private static loadBundleScene(bundleName: string, scenePath: string): Promise<void> {

        return new Promise((resolve, reject) => {

            cc.assetManager.loadBundle(bundleName, (err, bundle) => {

                if (err) {
                    cc.error(`${bundleName} 加载失败`, err);
                    reject(err);
                    return;
                }

                bundle.loadScene(scenePath, (err, sceneAsset) => {

                    if (err) {
                        cc.error(`${scenePath} 场景加载失败`, err);
                        reject(err);
                        return;
                    }

                    cc.director.runScene(sceneAsset, () => {
                        cc.log("场景切换完成:", scenePath);
                        resolve();
                    });

                });

            });

        });
    }
}