export default class HallRes {
    private static _instance: HallRes = null;

    private hallBundle: cc.AssetManager.Bundle = null;
    public avatarMap : { [key: string]: cc.SpriteFrame } = {}; // 预加载头像图片资源
    public hallBgmAudio: cc.AudioClip = null;
    public hallClickAudio: cc.AudioClip = null;
    public gameCardPrefab: cc.Prefab = null;

    public bg1Map: { [key: string]: cc.SpriteFrame } = {};
    public gameIconMap: { [key: string]: cc.SpriteFrame } = {};

    public static get instance(): HallRes {
        if (!this._instance) {
            this._instance = new HallRes();
        }
        return this._instance;
    }

    private constructor() {}


    public async preload(): Promise<void> {
        const t = Date.now();

        await this.loadHallBundle();

        // BGM 不阻塞大厅进入
        this.loadHallBgmAudio();

        await Promise.all([
            this.loadHallClickAudio(),
            this.loadGameCardPrefabs(),
            this.loadBg1Img(),
            this.loadGameIconImg(),
            this.loadAvatarImg()
        ]);

         console.log("初始化大厅资源耗时:", Date.now() - t, "ms");
    }


    private loadHallBundle(): Promise<cc.AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            if (this.hallBundle) {
                resolve(this.hallBundle);
                return;
            }

            cc.assetManager.loadBundle("bundle_hall", (err, bundle) => {
                if (err) {
                    cc.error("bundle_hall 加载失败:", err);
                    reject(err);
                    return;
                }

                this.hallBundle = bundle;
                resolve(bundle);
            });
        });
    }

     public async loadAvatarImg(): Promise<{ [key: string]: cc.SpriteFrame }> {
       
        if (Object.keys(this.avatarMap).length > 0) {
            return this.avatarMap;
        }
    
        const bundle = await this.loadHallBundle();
    
        return new Promise((resolve, reject) => {
    
            bundle.loadDir("avatar", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
    
                if (err) {
                    cc.error("头像加载失败", err);
                    reject(err);
                    return;
                }
    
                assets.forEach(sp => {
                    this.avatarMap[sp.name] = sp;
                });
    
                cc.log("所有头像加载完成");
                resolve(this.avatarMap);
    
            });
    
        });
    }

    private async loadHallBgmAudio(): Promise<void> {
        if (this.hallBgmAudio) return;

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.load("audio/bgm_hall", cc.AudioClip, (err, clip: cc.AudioClip) => {
                if (err) {
                    cc.error("大厅音乐加载失败:", err);
                    reject(err);
                    return;
                }

                this.hallBgmAudio = clip;

                cc.audioEngine.playMusic(this.hallBgmAudio, true);
                cc.audioEngine.setMusicVolume(0.3);

                cc.log("大厅音乐加载完成");
                resolve();
            });
        });
    }

    private async loadHallClickAudio(): Promise<void> {
        if (this.hallClickAudio) return;

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.load("audio/bgm_hall_click", cc.AudioClip, (err, clip: cc.AudioClip) => {
                if (err) {
                    cc.error("大厅点击音效加载失败:", err);
                    reject(err);
                    return;
                }

                this.hallClickAudio = clip;

                cc.log("大厅点击音效加载完成");
                resolve();
            });
        });
    }

    public async loadGameCardPrefabs(): Promise<cc.Prefab> {
        if (this.gameCardPrefab) return this.gameCardPrefab;

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.load("prefabs/GameCard", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    cc.error("GameCard prefab加载失败:", err);
                    reject(err);
                    return;
                }

                this.gameCardPrefab = prefab;

                cc.log("游戏卡片预制体加载完成");
                resolve(prefab);
            });
        });
    }

    public async loadBg1Img(): Promise<{ [key: string]: cc.SpriteFrame }> {
        if (Object.keys(this.bg1Map).length > 0) return this.bg1Map;

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.loadDir("hall/game/bg1", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    cc.error("游戏卡片背景加载失败:", err);
                    reject(err);
                    return;
                }

                assets.forEach(sp => {
                    this.bg1Map[sp.name] = sp;
                });

                cc.log("所有游戏卡片背景加载完成");
                resolve(this.bg1Map);
            });
        });
    }

    public async loadGameIconImg(): Promise<{ [key: string]: cc.SpriteFrame }> {
        if (Object.keys(this.gameIconMap).length > 0) return this.gameIconMap;

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.loadDir("hall/game/game_icon", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    cc.error("游戏ICON加载失败:", err);
                    reject(err);
                    return;
                }

                assets.forEach(sp => {
                    this.gameIconMap[sp.name] = sp;
                });

                cc.log("所有游戏ICON加载完成");
                resolve(this.gameIconMap);
            });
        });
    }

    

    public playClickAudio(): void {
        if (!this.hallClickAudio) return;

        cc.audioEngine.playEffect(this.hallClickAudio, false);
    }

    public close(): void {
        cc.audioEngine.stopMusic();
    }
}