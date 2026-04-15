const { ccclass, property } = cc._decorator;
import Seat from "./Seat";
import { SeatData, SeatState } from "./SeatData";
import CursorManager from "../common/CursorManager";
@ccclass
export default class SeatManager extends cc.Component {

    private seatPrefab: cc.Node = null;
    private seatContainer: cc.Node = null;

    private _resolveReady: Function = null;
    private _isReady: boolean = false;


    private seatList: Seat[] = [];
    private seatDataList: SeatData[] = [];

    onLoad() {
         // 加载座位预制体
        cc.resources.load("prefabs/Seat", cc.Prefab, (err, prefab) => {
            if (err) {
                cc.error("Seat prefab加载失败", err);
                return;
            }
            this.seatPrefab = prefab;
            this._isReady = true;
            // 通知 Promise
            if (this._resolveReady) {
                this._resolveReady(true);
                this._resolveReady = null;
            }
        });
        this.seatContainer = cc.find("Canvas/MainLayout/Table/SeatContainer");
        this.initData();
        // 监听点击
        cc.systemEvent.on("SEAT_CLICK", this.onSeatClick, this);
    }

     /**
     * 初始化数据（可以换成服务端数据）
     */
    private initData() {
        let seats = [];

        // 设置座位坐标
        seats.push({ x : 0, y : -600, id:  0 });
        seats.push({ x : 400, y : -380, id:  1 });
        seats.push({ x : 480, y : 20, id:  2 });
        seats.push({ x : 400, y : 420, id:  3});
        seats.push({ x : 0, y : 700, id:  4});
        seats.push({ x : -400, y : 420, id:  5 });
        seats.push({ x : -480, y : 20, id:  6});
        seats.push({ x : -400, y : -380, id:  7});

        for (let i = 0; i < seats.length; i++) {
            this.seatDataList.push({
                id: seats[i].id,
                x: seats[i].x,
                y: seats[i].y,
                state: SeatState.EMPTY,
                playerName: "player" + i,
            });
        }
    }


    /**
     * 初始化座位布局
     */
    initSeatLayout() {
        if (!this.seatPrefab || !this.seatContainer) {
            cc.error("SeatManager未初始化完成");
            return;
        }
        this.seatContainer.removeAllChildren();


        this.seatDataList.forEach((data, i) => {
            const node = cc.instantiate(this.seatPrefab);
            node.parent = this.seatContainer;
            node.setPosition(data.x, data.y);

            const seat = node.getComponent(Seat);
            seat.setData(data);
            this.seatList.push(seat);

        });
        console.log('SeatLayout OK')
    }


     /**
     * 点击座位
     */
    private onSeatClick(seatId: number) {
        const data = this.seatDataList.find(s => s.id === seatId);
        if (!data) return;

        if (data.state !== SeatState.EMPTY) return;

        // 模拟坐下
        data.state = SeatState.OCCUPIED;

        this.refreshSeat(seatId);
    }

    /**
     * 刷新单个座位
     */
    private refreshSeat(seatId: number) {
        const seat = this.seatList.find(s => s["data"].id === seatId);
        const data = this.seatDataList.find(s => s.id === seatId);

        if (seat && data) {
            seat.setData(data);
        }
    }





   
  public ready(): Promise<boolean> {
        return new Promise((resolve) => {

            // 已经准备好，直接返回
            if (this._isReady) {
                resolve(true);
                return;
            }

            // 没好就等加载完成
            this._resolveReady = resolve;
        });
    }


}