import SeatComponent from "./SeatComponent";
import { SeatData, SeatState } from "./SeatData";
export default class SeatComponentManager {
    private static _instance: SeatComponentManager;

    public static getInstance() {
        if (!this._instance) {
            this._instance = new SeatComponentManager();
        }
        return this._instance;
    }

      // 座位预制体数组
    public seatComponentList: SeatComponent[] = [];
    // 座位属性
    public seatComponentDataList: SeatData[] = [];
}