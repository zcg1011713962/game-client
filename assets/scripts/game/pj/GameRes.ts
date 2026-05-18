import CountDownManager from "../../common/CountDownManager";
import SettleManager from "../../common/SettleManager";
export default class GameRes {
    private static _instance: GameRes = null;
    public chipPrefab: cc.Prefab = null;
    public chipImgMap: { [key: string]: cc.SpriteFrame } = {};
    public settlePrefab: cc.Prefab = null;
    public warnAudio: cc.AudioClip = null;
    public gameBgmAudio: cc.AudioClip = null;
    public clickAudio: cc.AudioClip = null;
    public shuffingAudio: cc.AudioClip = null;
    public dealCardAudio: cc.AudioClip = null;
    public betAudio: cc.AudioClip = null;
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
            this.loadClockCountdownPrefab(),
            this.loadShufflingAudio(),
            this.loadDealCardAudio(),
            this.loadGameBgmAudio(),
            this.loadClickAudio(),
            this.loadBetAudio()
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
                cc.log("结算预制体加载完成");
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
                cc.log("筹码预制体加载完成");
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
                cc.log("筹码图片加载完成");
                resolve();
            });
        });
    }

    private loadLockAudio(): Promise<void>{
        return new Promise((resolve, reject) => {
         cc.resources.load("audio/bgm_warn", cc.AudioClip, (err, clip: cc.AudioClip) => {
            if (err) {
                cc.error("倒计时音乐加载失败:", err);
                reject(err);
                return;
            }
            this.warnAudio = clip;
            cc.log("倒计时音乐加载完成");
            resolve();
        });
        });
    }

    private loadShufflingAudio(): Promise<void>{
         return new Promise((resolve, reject) => {
         cc.resources.load("audio/bgm_shuffling", cc.AudioClip, (err, clip: cc.AudioClip) => {
            if (err) {
                cc.error("洗牌音乐加载失败:", err);
                reject(err);
                return;
            }
            this.shuffingAudio = clip;
            cc.log("洗牌音乐加载完成");
            resolve();
        });
        });
    }

    private loadDealCardAudio(): Promise<void>{
         return new Promise((resolve, reject) => {
         cc.resources.load("audio/bgm_shuffling", cc.AudioClip, (err, clip: cc.AudioClip) => {
            if (err) {
                cc.error("发牌音乐加载失败:", err);
                reject(err);
                return;
            }
            this.dealCardAudio = clip;
            cc.log("发牌音乐加载完成");
            resolve();
        });
         });
    }

     private loadGameBgmAudio(): Promise<void>{
         return new Promise((resolve, reject) => {
         cc.resources.load("audio/bgm_game", cc.AudioClip, (err, clip: cc.AudioClip) => {
            if (err) {
                cc.error("游戏大厅音乐加载失败:", err);
                reject(err);
                return;
            }
            this.gameBgmAudio = clip;
            cc.log("游戏大厅音乐加载完成");
            resolve();
        });
        });
    }

    private loadClickAudio(): Promise<void>{
         return new Promise((resolve, reject) => {
         cc.resources.load("audio/bgm_click", cc.AudioClip, (err, clip: cc.AudioClip) => {
            if (err) {
                cc.error("点击音乐加载失败:", err);
                reject(err);
                return;
            }
            this.clickAudio = clip;
            cc.log("点击音乐加载完成");
            resolve();
        });
        });
    }


    private loadBetAudio(): Promise<void>{
         return new Promise((resolve, reject) => {
         cc.resources.load("audio/bgm_bet", cc.AudioClip, (err, clip: cc.AudioClip) => {
            if (err) {
                cc.error("投注音乐加载失败:", err);
                reject(err);
                return;
            }
            this.betAudio = clip;
            cc.log("投注音乐加载完成");
            resolve();
        });
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