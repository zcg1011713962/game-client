const { ccclass, property } = cc._decorator;

interface SeatPos {
    x: number;
    y: number;
    angle: number;
}

@ccclass
export default class SeatLayout extends cc.Component {

    @property(cc.Prefab)
    seatPrefab: cc.Prefab = null;

    @property(cc.Node)
    seatContainer: cc.Node = null;

    /**
     * 创建座位
     */
    createSeats(count: number, selfIndex: number) {
        this.seatContainer.removeAllChildren();

        const radius = this.getRadius(count);
        let seats: SeatPos[] = [];

        for (let i = 0; i < count; i++) {

            const angle = (Math.PI * 2 / count) * i - Math.PI / 2;

            let x = Math.cos(angle) * radius.x;
            let y = Math.sin(angle) * radius.y;

            const safe = this.applySafeArea(x, y);

            seats.push({
                x: safe.x,
                y: safe.y,
                angle: angle
            });
        }

        // ⭐ 让自己在底部
        seats = this.rotateSeats(seats, selfIndex);

        // 创建节点
        seats.forEach((seat, i) => {

            const node = cc.instantiate(this.seatPrefab);
            node.parent = this.seatContainer;
            node.setPosition(seat.x, seat.y);

            // 朝向中心
            node.angle = -cc.misc.radiansToDegrees(seat.angle);

            const comp = node.getComponent('Seat') as any;

            if (comp) {
                comp.init({
                    name: "玩家" + i,
                    isBanker: i === 0
                });

                comp.updateView(seat.angle);
            }
        });
    }

    /**
     * 半径
     */
    private getRadius(count: number) {
        if (count <= 6) {
            return { x: 420, y: 650 };
        } else if (count <= 10) {
            return { x: 520, y: 760 };
        } else {
            return { x: 580, y: 820 };
        }
    }

    /**
     * 安全区
     */
    private applySafeArea(x: number, y: number) {

        if (y > 700) y = 700;
        if (y < -720) y = -720;

        if (x > 540) x = 540;
        if (x < -540) x = -540;

        return { x, y };
    }

    /**
     * 旋转数组（自己在底部）
     */
    private rotateSeats(seats: SeatPos[], selfIndex: number) {
        return seats.slice(selfIndex).concat(seats.slice(0, selfIndex));
    }
}