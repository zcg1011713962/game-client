export default class GameRes {
    private static _instance: GameRes = null;
    public chipPrefab: cc.Prefab = null;
    public chipImgMap: { [key: string]: cc.SpriteFrame } = {};


    public static get instance(): GameRes {
        if (!this._instance) {
            this._instance = new GameRes();
        }
        return this._instance;
    }

    private constructor() {}

    public async preload() {
        await Promise.all([
            this.loadChipPrefab(),
            this.loadChipImgs()
        ]);
    }

    private loadChipPrefab(): Promise<void> {
        return new Promise((resolve, reject) => {
            cc.resources.load("prefabs/Chip", cc.Prefab, (err, prefab) => {
                if (err) {
                    reject(err);
                    return;
                }

                this.chipPrefab = prefab;
                console.log("筹码预制体加载完成");
                resolve();
            });
        });
    }

    private loadChipImgs(): Promise<void> {
        return new Promise((resolve, reject) => {
            cc.resources.loadDir("chip", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    reject(err);
                    return;
                }

                assets.forEach(sp => {
                    this.chipImgMap[sp.name] = sp;
                });
                console.log("筹码图片加载完成");
                resolve();
            });
        });
    }
}