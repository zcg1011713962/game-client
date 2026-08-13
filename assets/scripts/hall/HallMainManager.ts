import HallRes from "./HallRes";
import HallGameApi, { HallBannerConfig, HallGameEntryConfig } from "./HallGameApi";
import HallGameCard, { HallGameCardData } from "./HallGameCard";
import ToastManager from "../common/ToastManager";

const { ccclass } = cc._decorator;

@ccclass
export default class HallMainManager extends cc.Component {
    private gameCards: HallGameCardData[] = [
        { id: 1, gameCode: "paijiu", title: "竞技牌九", desc: "经典牌九 · 策略对决", online: "856 在线", tag: "new", cover: "hall_game_cover_paijiu", enabled: true, matchEnabled: true, roomEnabled: true },
        { id: 2, title: "敬请期待", desc: "COMING SOON", online: "", tag: "", cover: "hall_game_cover_coming", enabled: false },
    ];
    private bannerConfig: HallBannerConfig = null;
    private enterMatchHandler: () => void = null;

    public init(enterMatchHandler: () => void): void {
        this.enterMatchHandler = enterMatchHandler;
        this.refreshLocalView();
        this.loadRemoteConfig();
    }

    private refreshLocalView(): void {
        this.refreshTaskArea();
        this.refreshBanner();
        this.refreshTabs();
        this.refreshGameList();
    }

    private async loadRemoteConfig(): Promise<void> {
        try {
            const res = await HallGameApi.list();
            if (!cc.isValid(this.node)) {
                return;
            }

            if (!res || res.code !== 0 || !res.data) {
                cc.warn("大厅游戏配置加载失败，使用本地默认配置", res && res.msg);
                return;
            }

            this.applyRemoteConfig(res.data.banner, res.data.games || []);
            this.refreshLocalView();
        } catch (e) {
            cc.warn("大厅游戏配置请求异常，使用本地默认配置", e);
        }
    }

    private applyRemoteConfig(banner: HallBannerConfig, games: HallGameEntryConfig[]): void {
        this.bannerConfig = banner || null;

        if (games.length === 0) {
            return;
        }

        this.gameCards = games.map(item => ({
            id: item.gameId,
            gameCode: item.gameCode,
            title: item.title || item.gameName || "敬请期待",
            desc: item.subtitle || "",
            online: this.formatOnline(item.onlineCount),
            tag: this.normalizeTag(item.tag),
            cover: item.coverAsset || "hall_game_cover_coming",
            bgAsset: item.bgAsset,
            buttonAsset: item.buttonAsset,
            enabled: item.enabled === true,
            matchEnabled: item.matchEnabled === true,
            roomEnabled: item.roomEnabled === true,
        }));
    }

    private refreshTaskArea(): void {
        this.setLabelColor("TaskArea/SignEntry/TitleLabel", new cc.Color(245, 248, 255));
        this.setLabelColor("TaskArea/SignEntry/DescLabel", new cc.Color(225, 235, 255));

        this.setLabelColor("TaskArea/RewardEntry/TitleLabel", new cc.Color(255, 250, 226));
        this.setLabelColor("TaskArea/RewardEntry/DescLabel", new cc.Color(255, 238, 190));

        this.bindTouch("TaskArea/SignEntry", () => ToastManager.show("每日签到暂未开放"));
        this.bindTouch("TaskArea/RewardEntry", () => ToastManager.show("每日奖励暂未开放"));
    }

    private refreshBanner(): void {
        if (this.bannerConfig) {
            this.setLabelText("BannerArea/HallBanner/TagLabel", this.bannerConfig.tagText || "");
            this.setLabelText("BannerArea/HallBanner/TitleLabel", this.bannerConfig.title || "");
            this.setLabelText("BannerArea/HallBanner/SubTitleLabel", this.bannerConfig.subtitle || "");
            this.setLabelText("BannerArea/HallBanner/OnlineLabel", this.formatOnline(this.bannerConfig.onlineCount));
            this.setSprite("BannerArea/HallBanner/Bg", this.bannerConfig.bgAsset);
            this.setSprite("BannerArea/HallBanner/BtnStart", this.bannerConfig.buttonAsset);
        }

        this.setLabelColor("BannerArea/HallBanner/TagLabel", new cc.Color(255, 255, 255));
        this.setLabelColor("BannerArea/HallBanner/TitleLabel", new cc.Color(255, 255, 255));
        this.setLabelColor("BannerArea/HallBanner/SubTitleLabel", new cc.Color(255, 230, 80));
        this.setLabelColor("BannerArea/HallBanner/OnlineLabel", new cc.Color(220, 235, 230));

        this.bindTouch("BannerArea/HallBanner/BtnStart", () => this.enterBannerGame());
    }

    private refreshTabs(): void {
        this.refreshTab("TabBar/TabRecommend", true);
        this.refreshTab("TabBar/TabArena", false);
        this.refreshTab("TabBar/TabAll", false);

        this.setLabelColor("TabBar/BtnViewAll/Label", new cc.Color(235, 240, 255));

        this.bindTouch("TabBar/TabRecommend", () => ToastManager.show("当前已是推荐"));
        this.bindTouch("TabBar/TabArena", () => ToastManager.show("竞技分类暂未开放"));
        this.bindTouch("TabBar/TabAll", () => ToastManager.show("全部分类暂未开放"));
        this.bindTouch("TabBar/BtnViewAll", () => ToastManager.show("更多游戏敬请期待"));
    }

    private refreshTab(path: string, selected: boolean): void {
        this.setLabelColor(`${path}/Label`, selected ? new cc.Color(255, 255, 255) : new cc.Color(205, 210, 230));
    }

    private refreshGameList(): void {
        const content = this.findGameListContent();
        if (!content || !HallRes.instance.hallGameCardPrefab) {
            cc.warn("大厅游戏列表容器或卡片预制体缺失");
            return;
        }

        content.removeAllChildren();
        this.gameCards.forEach(data => {
            const node = cc.instantiate(HallRes.instance.hallGameCardPrefab);
            node.parent = content;
            const comp = node.getComponent(HallGameCard) || node.addComponent(HallGameCard);
            comp.init(data, clickedData => this.enterGame(clickedData.gameCode, clickedData.id));
        });
    }

    private findGameListContent(): cc.Node {
        return this.find("GameList/View/Content") || this.find("GameList/Content");
    }

    private enterPaijiuMatch(): void {
        if (this.enterMatchHandler) {
            this.enterMatchHandler();
        }
    }

    private enterBannerGame(): void {
        if (this.bannerConfig && this.bannerConfig.enabled === false) {
            ToastManager.show("敬请期待");
            return;
        }

        this.enterGame(null, this.bannerConfig ? this.bannerConfig.gameId : 1);
    }

    private enterGame(gameCode: string, gameId: number): void {
        if (gameCode === "paijiu" || gameId === 1) {
            this.enterPaijiuMatch();
            return;
        }

        ToastManager.show("敬请期待");
    }

    private formatOnline(count: number): string {
        return `${count || 0} 在线`;
    }

    private normalizeTag(tag: string): "hot" | "new" | "" {
        if (tag === "hot" || tag === "new") {
            return tag;
        }
        return "";
    }

    private setSprite(path: string, assetName: string): void {
        if (!assetName) {
            return;
        }

        const node = this.find(path);
        if (!node) {
            return;
        }

        const sprite = node.getComponent(cc.Sprite);
        const frame = HallRes.instance.centerImgMap[assetName];
        if (!sprite || !frame) {
            cc.warn(`大厅配置图片缺失: ${path} -> ${assetName}`);
            return;
        }

        sprite.spriteFrame = frame;
    }

    private setLabelText(path: string, text: string): void {
        const node = this.find(path);
        if (!node) {
            return;
        }

        const label = node.getComponent(cc.Label);
        if (!label) {
            return;
        }

        label.string = text || "";
    }

    private bindTouch(path: string, handler: () => void): void {
        const node = this.find(path);
        if (!node) {
            return;
        }
        node.targetOff(this);
        node.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
            handler();
        }, this);
    }

    private setLabelColor(path: string, color: cc.Color): void {
        const node = this.find(path);
        if (!node) {
            return;
        }

        const label = node.getComponent(cc.Label);
        if (!label) {
            return;
        }

        node.color = color;
    }

    private find(path: string): cc.Node {
        return cc.find(path, this.node);
    }
}
