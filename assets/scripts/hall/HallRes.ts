import UserData from "../login/entity/UserData";

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
        const user = UserData.get();
        const t = Date.now();

        await this.loadHallBundle();

        // 不阻塞
        this.loadHallBgmAudio();
        this.loadHallClickAudio();

        // 必须资源
        await this.loadGameCardPrefabs();
        console.log("大厅可显示耗时:", Date.now() - t, "ms");

      

        const avatar = user != null ? user.avatar : "0";
        this.loadAvatarImg("avatar_" + avatar);

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

     public async loadAvatarImg(name: string): Promise<cc.SpriteFrame> {

        // 已缓存
        if (this.avatarMap[name]) {
            return this.avatarMap[name];
        }

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {

            bundle.load(`avatar/${name}`, cc.SpriteFrame, (err, sp: cc.SpriteFrame) => {

                if (err) {
                    cc.error(`头像加载失败: ${name}`, err);
                    reject(err);
                    return;
                }

                // 缓存
                this.avatarMap[name] = sp;

                cc.log(`头像加载完成: ${name}`);

                resolve(sp);

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

    public async loadBg1Img(name: string): Promise<cc.SpriteFrame> {
        if (this.bg1Map[name]) return this.bg1Map[name];

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.load(`hall/game/bg1/${name}`, cc.SpriteFrame, (err, sp: cc.SpriteFrame) => {
                if (err) {
                    cc.error("游戏卡片背景加载失败:", name, err);
                    reject(err);
                    return;
                }

                this.bg1Map[name] = sp;
                resolve(sp);
            });
        });
    }

    public async loadGameIconImg(name: string): Promise<cc.SpriteFrame> {
        if (this.gameIconMap[name]) return this.gameIconMap[name];

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.load(`hall/game/game_icon/${name}`, cc.SpriteFrame, (err, sp: cc.SpriteFrame) => {
                if (err) {
                    cc.error("游戏ICON加载失败:", name, err);
                    reject(err);
                    return;
                }

                this.gameIconMap[name] = sp;
                resolve(sp);
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