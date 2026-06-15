import CountDownManager from "../../common/CountDownManager";
import SettleManager from "../../common/SettleManager";

export default class GameRes {
    private static _instance: GameRes = null;

    private gameBundle!: cc.AssetManager.Bundle;

    public chipPrefab!: cc.Prefab;
    public seatPrefab!: cc.Prefab;
    public chipImgMap: { [key: string]: cc.SpriteFrame } = {};

    public chipSelectPanelPrefab!: cc.Prefab;
    public grabBankerPanelPrefab!: cc.Prefab;
    public roomTopBarPrefab!: cc.Prefab;
    public settlePrefab!: cc.Prefab;
    public warnAudio!: cc.AudioClip;
    public gameBgmAudio!: cc.AudioClip;
    public clickAudio!: cc.AudioClip;
    public shuffingAudio!: cc.AudioClip;
    public betAudio!: cc.AudioClip;
    public clockCountdownPrefab!: cc.Prefab;
    public roundStartPrefab!: cc.Prefab;
    public readyButtonPrefab!: cc.Prefab;
    public recordItemPrefab!: cc.Prefab;
    public recordPopupPrefab!: cc.Prefab;

       /** 牌图片缓存，key 例如 pai_1 */
    public cardImgMap: { [key: string]: cc.SpriteFrame } = {};

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

        // 只加载进入游戏马上要用的资源
        await Promise.all([
            this.loadRoomTopBarPrefab(),
            this.loadSeatPrefabs(),
            this.loadChipPrefab(),
            this.loadChipImgs(),
            this.loadClockCountdownPrefab(),
            this.loadChipSelectPanelPrefab(),
            this.loadGrabBankerPopupPrefab(),
            this.loadRoundStartPrefab(),
            this.loadReadyBtnPrefab(),
            this.loadCardImg()
        ]);

        CountDownManager.init(this.clockCountdownPrefab);

        console.log("游戏首屏资源耗时:", Date.now() - t, "ms");
        // 延迟加载，不阻塞进游戏
        this.preloadLazyRes();
    }

    private async preloadLazyRes(): Promise<void> {
        const t = Date.now();

        try {
            await Promise.all([
                this.loadSettlePrefab(),
                this.loadGameBgmAudio(),
                this.loadClickAudio(),
                this.loadBetAudio(),
                this.loadRecordItemPrefab(),
                this.loadRecordPopupPrefab()
            ]);

            SettleManager.init(this.settlePrefab);

            console.log("游戏延迟资源耗时:", Date.now() - t, "ms");
        } catch (e) {
            cc.error("延迟资源加载失败:", e);
        }
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


    public async getWarnAudio(): Promise<cc.AudioClip> {
        if (!this.warnAudio) {
            this.warnAudio = await this.loadAudio("audio/bgm_warn");
        }
        return this.warnAudio;
    }

    public async getShufflingAudio(): Promise<cc.AudioClip> {
        if (!this.shuffingAudio) {
            this.shuffingAudio = await this.loadAudio("audio/bgm_shuffling");
        }
        return this.shuffingAudio;
    }

    public async getDealCardAudio(): Promise<cc.AudioClip> {
        if (!this.shuffingAudio) {
            this.shuffingAudio = await this.loadAudio("audio/bgm_shuffling");
        }
        return this.shuffingAudio;
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

    

    private async loadReadyBtnPrefab(): Promise<void> {
        if (this.readyButtonPrefab) return;

        this.readyButtonPrefab = await this.loadPrefab("prefabs/ReadyButtonPrefab");
        //cc.log("准备按钮预制体加载完成");
    }

    private async loadRoomTopBarPrefab(): Promise<void> {
        if (this.roomTopBarPrefab) return;

        this.roomTopBarPrefab = await this.loadPrefab("prefabs/RoomTopBar");
        //cc.log("游戏顶部预制体加载完成");
    }

    
    private async loadGrabBankerPopupPrefab(): Promise<void> {
        if (this.grabBankerPanelPrefab) return;

        this.grabBankerPanelPrefab = await this.loadPrefab("prefabs/GrabBankerPanel");
    }

    private async loadChipSelectPanelPrefab(): Promise<void> {
        if (this.chipSelectPanelPrefab) return;

        this.chipSelectPanelPrefab = await this.loadPrefab("prefabs/ChipSelectPanel");
        //cc.log("选择筹码预制体加载完成");
    }
    

    private async loadRecordPopupPrefab(): Promise<void> {
        if (this.recordPopupPrefab) return;

        this.recordPopupPrefab = await this.loadPrefab("prefabs/RecordPopup");
    }

    private async loadRecordItemPrefab(): Promise<void> {
        if (this.recordItemPrefab) return;

        this.recordItemPrefab = await this.loadPrefab("prefabs/RecordItem");
    }

    private async loadSettlePrefab(): Promise<void> {
        if (this.settlePrefab) return;

        this.settlePrefab = await this.loadPrefab("prefabs/SettlePopup");
        //cc.log("结算预制体加载完成");
    }

    private async loadSeatPrefabs(): Promise<void> {
        if (this.seatPrefab) return;
        this.seatPrefab = await  GameRes.instance.loadPrefab("prefabs/Seat");
        //cc.log("座位预制体加载完成");
    }

    private async loadChipPrefab(): Promise<void> {
        if (this.chipPrefab) return;

        this.chipPrefab = await this.loadPrefab("prefabs/Chip");
        //cc.log("筹码预制体加载完成");
    }

    private async loadClockCountdownPrefab(): Promise<void> {
        if (this.clockCountdownPrefab) return;

        this.clockCountdownPrefab = await this.loadPrefab("prefabs/BetCountdown");
        //cc.log("时钟预制体加载完成");
    }

    private async loadRoundStartPrefab(): Promise<void> {
        if (this.roundStartPrefab) return;

        this.roundStartPrefab = await this.loadPrefab("prefabs/RoundStartPrefab");
        //cc.log("轮次预制体加载完成");
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

                //cc.log("筹码图片加载完成");
                resolve();
            });
        });
    }

      /** 加载所有牌图片 */
    private async loadCardImg(): Promise<{ [key: string]: cc.SpriteFrame }> {

        if (Object.keys(this.cardImgMap).length > 0) {
            return this.cardImgMap;
        }

        const bundle = await GameRes.instance.loadGameBundle();

        return new Promise((resolve, reject) => {

            bundle.loadDir("card", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {

                if (err) {
                    cc.error("牌图片加载失败", err);
                    reject(err);
                    return;
                }

                assets.forEach(sp => {
                    this.cardImgMap[sp.name] = sp;
                });

                //console.log("所有牌加载完成", this.cardImgMap);

                resolve(this.cardImgMap);

            });

        });
    }


    public async loadGameBgmAudio(): Promise<void> {
        if (this.gameBgmAudio) return;
        this.gameBgmAudio = await this.loadAudio("audio/bgm_game");
        //cc.log("游戏背景音乐加载完成");
    }

    private async loadClickAudio(): Promise<void> {
        if (this.clickAudio) return;

        this.clickAudio = await this.loadAudio("audio/bgm_click");
        //cc.log("点击音效加载完成");
    }

    private async loadBetAudio(): Promise<void> {
        if (this.betAudio) return;

        this.betAudio = await this.loadAudio("audio/bgm_bet");
        //cc.log("投注音效加载完成");
    }
}