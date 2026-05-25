import CountDownManager from "../../common/CountDownManager";
import SettleManager from "../../common/SettleManager";

export default class GameRes {
    private static _instance: GameRes = null;

    private gameBundle: cc.AssetManager.Bundle = null;

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

    public async preload(): Promise<void> {
        const t = Date.now();

        await this.loadGameBundle();

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

        cc.log("初始化游戏资源耗时:", Date.now() - t, "ms");

        SettleManager.init(this.settlePrefab);
        CountDownManager.init(this.clockCountdownPrefab);
    }

    public loadGameBundle(): Promise<cc.AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            if (this.gameBundle) {
                resolve(this.gameBundle);
                return;
            }

            cc.assetManager.loadBundle("bundle_game", (err, bundle) => {
                if (err) {
                    cc.error("bundle_game 加载失败:", err);
                    reject(err);
                    return;
                }

                this.gameBundle = bundle;
                resolve(bundle);
            });
        });
    }

    public async loadPrefab(path: string): Promise<cc.Prefab> {
        const bundle = await this.loadGameBundle();

        return new Promise((resolve, reject) => {
            bundle.load(path, cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    cc.error(`${path} 预制体加载失败`, err);
                    reject(err);
                    return;
                }

                resolve(prefab);
            });
        });
    }

    private async loadAudio(path: string): Promise<cc.AudioClip> {
        const bundle = await this.loadGameBundle();

        return new Promise((resolve, reject) => {
            bundle.load(path, cc.AudioClip, (err, clip: cc.AudioClip) => {
                if (err) {
                    cc.error(`${path} 音频加载失败`, err);
                    reject(err);
                    return;
                }

                resolve(clip);
            });
        });
    }

    private async loadSettlePrefab(): Promise<void> {
        if (this.settlePrefab) return;

        this.settlePrefab = await this.loadPrefab("prefabs/SettlePopup");
        cc.log("结算预制体加载完成");
    }

    private async loadChipPrefab(): Promise<void> {
        if (this.chipPrefab) return;

        this.chipPrefab = await this.loadPrefab("prefabs/Chip");
        cc.log("筹码预制体加载完成");
    }

    private async loadClockCountdownPrefab(): Promise<void> {
        if (this.clockCountdownPrefab) return;

        this.clockCountdownPrefab = await this.loadPrefab("prefabs/BetCountdown");
        cc.log("时钟预制体加载完成");
    }

    private async loadChipImgs(): Promise<void> {
        if (Object.keys(this.chipImgMap).length > 0) return;

        const bundle = await this.loadGameBundle();

        return new Promise((resolve, reject) => {
            bundle.loadDir("chip", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    cc.error("筹码图片加载失败", err);
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

    private async loadLockAudio(): Promise<void> {
        if (this.warnAudio) return;

        this.warnAudio = await this.loadAudio("audio/bgm_warn");
        cc.log("倒计时音乐加载完成");
    }

    private async loadShufflingAudio(): Promise<void> {
        if (this.shuffingAudio) return;

        this.shuffingAudio = await this.loadAudio("audio/bgm_shuffling");
        cc.log("洗牌音乐加载完成");
    }

    private async loadDealCardAudio(): Promise<void> {
        if (this.dealCardAudio) return;

        // 你原代码这里也是 bgm_shuffling，如果发牌有独立音频，改成 audio/bgm_deal_card
        this.dealCardAudio = await this.loadAudio("audio/bgm_shuffling");
        cc.log("发牌音乐加载完成");
    }

    private async loadGameBgmAudio(): Promise<void> {
        if (this.gameBgmAudio) return;

        this.gameBgmAudio = await this.loadAudio("audio/bgm_game");
        cc.log("游戏背景音乐加载完成");
    }

    private async loadClickAudio(): Promise<void> {
        if (this.clickAudio) return;

        this.clickAudio = await this.loadAudio("audio/bgm_click");
        cc.log("点击音效加载完成");
    }

    private async loadBetAudio(): Promise<void> {
        if (this.betAudio) return;

        this.betAudio = await this.loadAudio("audio/bgm_bet");
        cc.log("投注音效加载完成");
    }
}