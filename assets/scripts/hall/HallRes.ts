import UserData from "../login/entity/UserData";

export default class HallRes {
    private static _instance: HallRes = null;

    private hallBundle: cc.AssetManager.Bundle = null;
    public avatarMap: { [key: string]: cc.SpriteFrame } = {}; // 预加载头像图片资源
    public hallBgmAudio: cc.AudioClip = null;
    public hallClickAudio: cc.AudioClip = null;
    public gameCardPrefab: cc.Prefab = null;
    public bannerSpriteFrame: cc.SpriteFrame = null;
    public roomSelectPanelPrefab: cc.Prefab = null;
    public joinRoomPanelPrefab: cc.Prefab = null;
    public topBarPrefab: cc.Prefab = null;
    public bottomBarPrefab: cc.Prefab = null;
    public hallGameCardPrefab: cc.Prefab = null;
    public createRoomPopupPrefab: cc.Prefab = null;
    public hallRecordPopupPrefab!: cc.Prefab;
    public hallRecordItemPrefab!: cc.Prefab;
    public hallRecordDetailPopupPrefab!: cc.Prefab;
    public hallRecordDetailItemPrefab!: cc.Prefab;
    public mailPopupPrefab!: cc.Prefab;
    public mailItemPrefab!: cc.Prefab;
    public mailDetailPopupPrefab!: cc.Prefab;

    public bg1Map: { [key: string]: cc.SpriteFrame } = {};
    public gameIconMap: { [key: string]: cc.SpriteFrame } = {};
    public topImgMap: { [key: string]: cc.SpriteFrame } = {};
    public centerImgMap: { [key: string]: cc.SpriteFrame } = {};
    public recordImgMap: { [key: string]: cc.SpriteFrame } = {};
    public recordDetailImgMap: { [key: string]: cc.SpriteFrame } = {};
    public mailImgMap: { [key: string]: cc.SpriteFrame } = {};

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

        // 首屏必须资源，只保留大厅一进入就能看到的内容
        await Promise.all([
            this.loadTopBarPrefabs(),
            this.loadTopImg(),
            this.loadCenterImg(),
            this.loadBottomBarPrefabs(),
            this.loadHallGameCardPrefab(),
            this.loadGameCardPrefabs(),
        ]);

        const avatar = user != null ? user.avatar : "0";
        this.loadAvatarImg("avatar_" + avatar);
        this.preloadLazyRes();
        console.log("初始化大厅资源耗时:", Date.now() - t, "ms");
    }

    private preloadLazyRes(): void {
        setTimeout(() => {
            Promise.all([
                this.loadHallBgmAudio(),
                this.loadHallClickAudio(),
                this.loadRoomSelectPanelPrefabs(),
                this.joinRoomPanelPrefabs(),
                this.createRoomPopupPrefabs(),
                this.loadHallRecordItemPrefab(),
                this.loadHallRecordPopupPrefab(),
                this.loadRecordImg(),
                this.loadMailPopupPrefab(),
                this.loadMailItemPrefab(),
                this.loadMailDetailPopupPrefab(),
                this.loadMailImg(),
            ]).catch(e => {
                cc.error("大厅延迟资源加载失败:", e);
            });
        }, 1000);
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

    private async loadHallRecordItemPrefab(): Promise<void> {
        if (this.hallRecordItemPrefab) return;

        this.hallRecordItemPrefab = await this.loadPrefab("prefabs/HallRecordItem");
    }

    private async loadHallRecordPopupPrefab(): Promise<void> {
        if (this.hallRecordPopupPrefab) return;

        this.hallRecordPopupPrefab = await this.loadPrefab("prefabs/HallRecordPopup");
    }

    public async loadHallRecordDetailPopupPrefab(): Promise<cc.Prefab> {
        if (this.hallRecordDetailPopupPrefab) return this.hallRecordDetailPopupPrefab;

        this.hallRecordDetailPopupPrefab = await this.loadPrefab("prefabs/HallRecordDetailPopup");
        return this.hallRecordDetailPopupPrefab;
    }

    public async loadHallRecordDetailItemPrefab(): Promise<cc.Prefab> {
        if (this.hallRecordDetailItemPrefab) return this.hallRecordDetailItemPrefab;

        this.hallRecordDetailItemPrefab = await this.loadPrefab("prefabs/HallRecordDetailItem");
        return this.hallRecordDetailItemPrefab;
    }

    public async loadMailPopupPrefab(): Promise<cc.Prefab> {
        if (this.mailPopupPrefab) return this.mailPopupPrefab;

        this.mailPopupPrefab = await this.loadPrefab("prefabs/MailPopup");
        return this.mailPopupPrefab;
    }

    public async loadMailItemPrefab(): Promise<cc.Prefab> {
        if (this.mailItemPrefab) return this.mailItemPrefab;

        this.mailItemPrefab = await this.loadPrefab("prefabs/MailItem");
        return this.mailItemPrefab;
    }

    public async loadMailDetailPopupPrefab(): Promise<cc.Prefab> {
        if (this.mailDetailPopupPrefab) return this.mailDetailPopupPrefab;

        this.mailDetailPopupPrefab = await this.loadPrefab("prefabs/MailDetailPopup");
        return this.mailDetailPopupPrefab;
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

    public async loadRecordImg(): Promise<{ [key: string]: cc.SpriteFrame }> {
        if (Object.keys(this.recordImgMap).length > 0) {
            return this.recordImgMap;
        }

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.loadDir("hall/record", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    cc.error("大厅战绩图片加载失败", err);
                    reject(err);
                    return;
                }

                assets.forEach(sp => {
                    this.recordImgMap[sp.name] = sp;
                });

                resolve(this.recordImgMap);
            });
        });
    }

    public async loadTopImg(): Promise<{ [key: string]: cc.SpriteFrame }> {
        if (Object.keys(this.topImgMap).length > 0) {
            return this.topImgMap;
        }

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.loadDir("hall/top", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    cc.error("大厅顶部图片加载失败", err);
                    reject(err);
                    return;
                }

                assets.forEach(sp => {
                    this.topImgMap[sp.name] = sp;
                });

                resolve(this.topImgMap);
            });
        });
    }

    public async loadCenterImg(): Promise<{ [key: string]: cc.SpriteFrame }> {
        if (Object.keys(this.centerImgMap).length > 0) {
            return this.centerImgMap;
        }

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.loadDir("hall/center", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    cc.error("大厅中心图片加载失败", err);
                    reject(err);
                    return;
                }

                assets.forEach(sp => {
                    this.centerImgMap[sp.name] = sp;
                });

                resolve(this.centerImgMap);
            });
        });
    }

    public async loadRecordDetailImg(): Promise<{ [key: string]: cc.SpriteFrame }> {
        if (Object.keys(this.recordDetailImgMap).length > 0) {
            return this.recordDetailImgMap;
        }

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.loadDir("hall/record/detail", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    cc.error("大厅战绩详情图片加载失败", err);
                    reject(err);
                    return;
                }

                assets.forEach(sp => {
                    this.recordDetailImgMap[sp.name] = sp;
                });

                resolve(this.recordDetailImgMap);
            });
        });
    }

    public async loadMailImg(): Promise<{ [key: string]: cc.SpriteFrame }> {
        if (Object.keys(this.mailImgMap).length > 0) {
            return this.mailImgMap;
        }

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.loadDir("hall/mail", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    cc.error("邮件图片加载失败", err);
                    reject(err);
                    return;
                }

                assets.forEach(sp => {
                    this.mailImgMap[sp.name] = sp;
                });

                resolve(this.mailImgMap);
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

    public async loadBottomBarPrefabs(): Promise<cc.Prefab> {
        if (this.bottomBarPrefab) return this.bottomBarPrefab;

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.load("prefabs/BottomBar", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    cc.error("BottomBar prefab加载失败:", err);
                    reject(err);
                    return;
                }

                this.bottomBarPrefab = prefab;
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

    public async loadHallGameCardPrefab(): Promise<cc.Prefab> {
        if (this.hallGameCardPrefab) return this.hallGameCardPrefab;

        const bundle = await this.loadHallBundle();

        return new Promise((resolve, reject) => {
            bundle.load("prefabs/HallGameCard", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    cc.error("HallGameCard prefab加载失败:", err);
                    reject(err);
                    return;
                }

                this.hallGameCardPrefab = prefab;
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





}
