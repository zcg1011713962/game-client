import UserData from "../login/entity/UserData";

export default class HallRes {
    private static _instance: HallRes = null;

    private hallBundle: cc.AssetManager.Bundle = null;
    public avatarMap: { [key: string]: cc.SpriteFrame } = {}; // 预加载头像图片资源
    public bottomIconMap: { [key: string]: cc.SpriteFrame } = {}; // 预加载底部ICON资源
    public hallBgmAudio: cc.AudioClip = null;
    public hallClickAudio: cc.AudioClip = null;
    public gameCardPrefab: cc.Prefab = null;
    public bannerSpriteFrame: cc.SpriteFrame = null;
    public roomSelectPanelPrefab: cc.Prefab = null;
    public joinRoomPanelPrefab: cc.Prefab = null;
    public topBarPrefab: cc.Prefab = null;
    public createRoomPopupPrefab: cc.Prefab = null;
    public recordPopupPrefab!: cc.Prefab;
    public recordItemPrefab!: cc.Prefab;

    public bg1Map: { [key: string]: cc.SpriteFrame } = {};
    public gameIconMap: { [key: string]: cc.SpriteFrame } = {};
    public resultImgMap: { [key: string]: cc.SpriteFrame } = {};

    public static get instance(): HallRes {
        if (!this._instance) {
            this._instance = new HallRes();
        }
        return this._instance;
    }

    private constructor() { }


    public async preload(): Promise<void> {
        const user = UserData.get();
        const t = Date.now();

        await this.loadHallBundle();

        // 不阻塞
        this.loadHallBgmAudio();
        this.loadHallClickAudio();

        // 必须资源
        await Promise.all([
            this.loadTopBarPrefabs(),
            this.loadGameCardPrefabs(),
            this.loadRoomSelectPanelPrefabs(),
            this.joinRoomPanelPrefabs(),
            this.loadHallBannerImg("banner_paijiu"),
            this.loadBottomIcons(),
            this.createRoomPopupPrefabs(),
            this.loadRecordItemPrefab(),
            this.loadRecordPopupPrefab(),
            this.loadResultImg(),
        ]);

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

    private async loadRecordItemPrefab(): Promise<void> {
        if (this.recordItemPrefab) return;

        this.recordItemPrefab = await this.loadPrefab("prefabs/RecordItem");
    }

    private async loadRecordPopupPrefab(): Promise<void> {
        if (this.recordPopupPrefab) return;

        this.recordPopupPrefab = await this.loadPrefab("prefabs/RecordPopup");
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

                //cc.log(`头像加载完成: ${name}`);

                resolve(sp);

            });

        });
    }

    private async loadResultImg(): Promise<{ [key: string]: cc.SpriteFrame }> {

        if (Object.keys(this.resultImgMap).length > 0) {
            return this.resultImgMap;
        }

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {

            bundle.loadDir("record/result", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {

                if (err) {
                    cc.error("输赢图片加载失败", err);
                    reject(err);
                    return;
                }

                assets.forEach(sp => {
                    this.resultImgMap[sp.name] = sp;
                });

                resolve(this.resultImgMap);

            });

        });
    }
    public async loadHallBgmAudio(): Promise<void> {
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
                //cc.log("大厅音乐加载完成");
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

                //cc.log("大厅点击音效加载完成");
                resolve();
            });
        });
    }


    public async loadTopBarPrefabs(): Promise<cc.Prefab> {
        if (this.topBarPrefab) return this.topBarPrefab;

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.load("prefabs/TopBar", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    cc.error("TopBar prefab加载失败:", err);
                    reject(err);
                    return;
                }

                this.topBarPrefab = prefab;

                //cc.log("顶部预制体加载完成");
                resolve(prefab);
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

                //cc.log("游戏卡片预制体加载完成");
                resolve(prefab);
            });
        });
    }


    public async loadRoomSelectPanelPrefabs(): Promise<cc.Prefab> {
        if (this.roomSelectPanelPrefab) return this.roomSelectPanelPrefab;

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.load("prefabs/RoomSelectPanel", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    cc.error("房间类型选择prefab加载失败:", err);
                    reject(err);
                    return;
                }

                this.roomSelectPanelPrefab = prefab;

                //cc.log("房间类型选择预制体加载完成");
                resolve(prefab);
            });
        });
    }


    public async joinRoomPanelPrefabs(): Promise<cc.Prefab> {
        if (this.joinRoomPanelPrefab) return this.joinRoomPanelPrefab;

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.load("prefabs/JoinRoomPanel", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    cc.error("加入房间prefab加载失败:", err);
                    reject(err);
                    return;
                }

                this.joinRoomPanelPrefab = prefab;

                //cc.log("加入房间预制体加载完成");
                resolve(prefab);
            });
        });
    }


    public async loadPrefab(path: string): Promise<cc.Prefab> {
        const bundle = await this.loadHallBundle();

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


    public async createRoomPopupPrefabs(): Promise<cc.Prefab> {
        if (this.createRoomPopupPrefab) return this.createRoomPopupPrefab;

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.load("prefabs/CreateRoomPopup", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    cc.error("CreateRoomPopupPrefab加载失败:", err);
                    reject(err);
                    return;
                }

                this.createRoomPopupPrefab = prefab;
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


    public async loadHallBannerImg(name: string): Promise<cc.SpriteFrame> {
        if (this.bannerSpriteFrame) return this.bannerSpriteFrame;

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.load(`hall/banner/${name}`, cc.SpriteFrame, (err, sp: cc.SpriteFrame) => {
                if (err) {
                    cc.error("banner加载失败:", name, err);
                    reject(err);
                    return;
                }

                this.bannerSpriteFrame = sp;
                resolve(sp);
            });
        });
    }


    public async loadBottomIcons(): Promise<void> {
        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {

            bundle.loadDir(
                "hall/bottom",
                cc.SpriteFrame,
                (err, assets: cc.SpriteFrame[]) => {

                    if (err) {
                        cc.error("loadBottomIcons");
                        reject(err);
                        return;
                    }

                    assets.forEach((sf) => {
                        this.bottomIconMap[sf.name] = sf;
                    });
                    resolve();
                }
            );

        });
    }

}