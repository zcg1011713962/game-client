import CountDownManager from "../../common/CountDownManager";
import SettleManager from "../../common/SettleManager";
export default class GameRes {
    private static _instance: GameRes = null;
    public chipPrefab: cc.Prefab = null;
    public chipImgMap: { [key: string]: cc.SpriteFrame } = {};
    public settlePrefab: cc.Prefab = null;
    public warnAudio: cc.AudioClip = null;
    public clockCountdownPrefab: cc.Prefab = null;
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
            this.loadChipImgs(),
            this.loadSettlePrefab(),
            this.loadLockAudio(),
            this.loadClockCountdownPrefab()
        ]);
        SettleManager.init(this.settlePrefab);
        CountDownManager.init(this.clockCountdownPrefab);
    }

    private loadSettlePrefab(): Promise<void> {
        return new Promise((resolve, reject) => {
            cc.resources.load("prefabs/SettlePopup", cc.Prefab, (err, prefab) => {
                if (err) {
                    reject(err);
                    return;
                }

                this.settlePrefab = prefab;
                console.log("结算预制体加载完成");
                resolve();
            });
        });
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

    private loadLockAudio(){
         cc.resources.load("audio/bgm_warn", cc.AudioClip, (err, clip: cc.AudioClip) => {
            if (err) {
                cc.error("倒计时音乐加载失败:", err);
                return;
            }
            this.warnAudio = clip;
        });
    }

    private loadClockCountdownPrefab(): Promise<void>{
        return new Promise((resolve, reject) => {
            cc.resources.load("prefabs/BetCountdown", cc.Prefab, (err, prefab) => {
                if (err) {
                    reject(err);
                    return;
                }

                this.clockCountdownPrefab = prefab;
                console.log("时钟预制体加载完成");
                resolve();
            });
        });
    }
}