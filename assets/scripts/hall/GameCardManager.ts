import HallUIManager from "./HallUIManager";
import CameCardComponentManager from "./CameCardComponentManager";
import GameCardComponent from "./GameCardComponent";
import {SceneUtil} from "../util/SceneUtil";
import UserData from "../login/entity/UserData";
import RoomTopBar from "../game/top/RoomTopBar";
const {ccclass, property} = cc._decorator;


@ccclass
export default class GameCardManager extends cc.Component {
    private gameCardPrefab: cc.Prefab = null; 
    private gameCardContainerNode: cc.Node = null;
    private bg1Map : { [key: string]: cc.SpriteFrame } = {}; // 预加载图片资源
    private gameIconMap : { [key: string]: cc.SpriteFrame } = {}; // 预加载图片资源


    onLoad() {
        this.gameCardContainerNode = cc.find("Canvas/GameCard/View");
        // 监听座位点击
        cc.systemEvent.on("GameCard_CLICK", this.onGameCardClick, this);
        this.init();
    }

    public async init(){
        await this.loadGameCardPrefabs();
        await this.loadBg1Img();
        await this.loadGameIconImg();
        this.initData();
        this.initGameCardLayout();
    }



    private initData() {
        const gameCardPos = HallUIManager.instance.getGameCardPos();
        for (let i = 0; i < gameCardPos.length; i++) {
            CameCardComponentManager.getInstance().gameCardComponentDataList.push({
                id: gameCardPos[i].id,
                x: gameCardPos[i].x,
                y: gameCardPos[i].y,
                name: gameCardPos[i].name,
            });
        }
    }

    initGameCardLayout() {
        if (!this.gameCardPrefab || !this.gameCardContainerNode) {
            cc.error("GameCardManager未初始化完成");
            return;
        }
        this.gameCardContainerNode.removeAllChildren();
    
    
        CameCardComponentManager.getInstance().gameCardComponentDataList.forEach((data, i) => {
            const node = cc.instantiate(this.gameCardPrefab);
            node.parent = this.gameCardContainerNode;
            node.setPosition(data.x, data.y);
    
            const gameCardComponent = node.getComponent(GameCardComponent);
            gameCardComponent.init(data, this.bg1Map, this.gameIconMap);
            CameCardComponentManager.getInstance().gameCardComponentList.push(gameCardComponent);
    
        });
        console.log('GameCardLayout OK')
    }


    loadGameCardPrefabs() {
        return new Promise((resolve, reject) => {
            cc.resources.load("prefabs/GameCard", cc.Prefab, (err, prefab) => {
                if (err) {
                    cc.error("GameCard prefab加载失败", err);
                    reject(err);
                    return;
                }
                this.gameCardPrefab = prefab;
                resolve(prefab);
                console.log("游戏卡片预制体加载完成");
            });
        });
    }

    loadBg1Img() {
        return new Promise((resolve, reject) => {
            cc.resources.loadDir("hall/game/bg1", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                assets.forEach(sp => {
                    this.bg1Map[sp.name] = sp;
                });
                resolve(this.bg1Map);
                console.log("所有游戏卡片背景加载完成");
            });
        });
    }

     loadGameIconImg() {
        return new Promise((resolve, reject) => {
            cc.resources.loadDir("hall/game/game_icon", cc.SpriteFrame, (err, assets: cc.SpriteFrame[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                assets.forEach(sp => {
                    this.gameIconMap[sp.name] = sp;
                });
                resolve(this.gameIconMap);
                console.log("所有游戏ICON加载完成");
            });
        });
    }

    

    public onGameCardClick(id : number){
        console.log("onGameCardClick");
        const guest = UserData.get();
        if(guest){
            // 切换到游戏场景
            SceneUtil.loadScene(`game_${id}`, {
                roomId: null,
                token: guest.token
            });
        }
    }


}
