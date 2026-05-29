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
        const t = Date.now();
        if (scene === "game_1") {
            await this.loadBundleScene("bundle_game", "scene/game_1");
        }else if(scene === "hall"){
            await this.loadNormalScene("hall");
        }else if (scene === "login") {
            await this.loadNormalScene("login");
        }
        console.log("加载场景耗时:", scene, Date.now() - t, "ms");
    }

    private static loadNormalScene(sceneName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            cc.director.loadScene(sceneName, (err) => {
                if (err) {
                    cc.error("普通场景加载失败:", sceneName, err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
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