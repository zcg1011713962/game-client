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

        let seats = [];

        const CARD_DIR = {
            LEFT: 0,
            RIGHT: 1
        };

        if(count == 8){
            // 设置座位坐标
            seats.push({ x : -30, y : -700, angle:  0 , dir: CARD_DIR.RIGHT});
            seats.push({ x : 480, y : -380, angle:  0, dir: CARD_DIR.LEFT });
            seats.push({ x : 480, y : 20, angle:  0 , dir: CARD_DIR.LEFT });
            seats.push({ x : 480, y : 420, angle:  0, dir: CARD_DIR.LEFT  });
            seats.push({ x : -30, y : 700, angle:  0 , dir: CARD_DIR.RIGHT});
            seats.push({ x : -400, y : 420, angle:  0 , dir: CARD_DIR.RIGHT});
            seats.push({ x : -400, y : 20, angle:  0, dir: CARD_DIR.RIGHT });
            seats.push({ x : -400, y : -380, angle:  0 , dir: CARD_DIR.RIGHT});
        }else {
            return;
        }


        seats.forEach((s, i) => {

            const node = cc.instantiate(this.seatPrefab);
            node.parent = this.seatContainer;
            node.setPosition(s.x, s.y);
        
            const seat = node.getComponent("Seat");
            // 初始化座位信息
            seat.init({
                name: "入座" + i,
                isBanker: i === 0
            });

        });

        console.log('座位坐标' + seats)
    }



}