const { ccclass, property } = cc._decorator;

@ccclass
export default class SeatLayout extends cc.Component {

    private seatPrefab: cc.Prefab = null;
    private seatContainer: cc.Node = null;

    private _resolveReady: Function = null;
    private _isReady: boolean = false;

    onLoad() {
        this.seatContainer = cc.find("Canvas/MainLayout/Table/SeatContainer");

        cc.resources.load("prefabs/Seat", cc.Prefab, (err, prefab) => {
            if (err) {
                cc.error("Seat prefab加载失败", err);
                return;
            }

            this.seatPrefab = prefab;
            this._isReady = true;

            // ⭐ 通知 Promise
            if (this._resolveReady) {
                this._resolveReady(true);
                this._resolveReady = null;
            }
        });
    }

    /**
     * ⭐ Promise初始化
     */
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

    initSeatLayout() {

        if (!this.seatPrefab || !this.seatContainer) {
            cc.error("SeatLayout未初始化完成");
            return;
        }

        this.seatContainer.removeAllChildren();

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


        seats.forEach((s, i) => {

            const node = cc.instantiate(this.seatPrefab);
            node.parent = this.seatContainer;
            node.setPosition(s.x, s.y);

        });
        console.log('SeatLayout OK')
    }



}