const { ccclass, property } = cc._decorator;

@ccclass
export default class SeatLayout extends cc.Component {

    private seatPrefab: cc.Prefab = null;
    private seatContainer: cc.Node = null;

    private _resolveReady: Function = null;
    private _isReady: boolean = false;

    onLoad() {
        this.seatContainer = cc.find("Canvas/TableRoot/SeatContainer");

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

    createSeats(count: number, selfIndex: number) {

        if (!this.seatPrefab || !this.seatContainer) {
            cc.error("SeatLayout未初始化完成");
            return;
        }

        this.seatContainer.removeAllChildren();

        const radius = this.getRadius(count);

        let seats = [];

        if(count == 8){
            // 设置坐标角度
            seats.push({ x : 30, y : -700, angle:  0 });
            seats.push({ x : 420, y : -300, angle:  0 });
            seats.push({ x : 420, y : 100, angle:  0 });
            seats.push({ x : 420, y : 500, angle:  0 });
            seats.push({ x : 30, y : 700, angle:  0 });
            seats.push({ x : -350, y : -300, angle:  0 });
            seats.push({ x : -350, y : 100, angle:  0 });
            seats.push({ x : -350, y : 500, angle:  0 });
        }else {
            return;
        }

        
       

        seats = this.rotate(seats, selfIndex);

        seats.forEach((s, i) => {

            const node = cc.instantiate(this.seatPrefab);
            node.parent = this.seatContainer;
            node.setPosition(s.x, s.y);
            // 设置角度
            // node.angle = -cc.misc.radiansToDegrees(s.angle);

            const seat = node.getComponent("Seat");

            seat.init({
                name: "玩家" + i,
                isBanker: i === 0
            });

        });
    }

    private getRadius(count: number) {
        if (count <= 6) return { x: 420, y: 650 };
        if (count <= 10) return { x: 520, y: 760 };
        return { x: 580, y: 820 };
    }

    private rotate(arr, index) {
        return arr.slice(index).concat(arr.slice(0, index));
    }
}