import GameCardComponent from "./GameCardComponent";
import { GameCardData } from "./entity/GameCardData";
export default class CameCardComponentManager {
    private static _instance: CameCardComponentManager;

    public static getInstance() {
        if (!this._instance) {
            this._instance = new CameCardComponentManager();
        }
        return this._instance;
    }

    // 游戏卡片预制体数组
    public gameCardComponentList: GameCardComponent[] = [];
    // 游戏卡片属性
    public gameCardComponentDataList: GameCardData[] = [];
}
