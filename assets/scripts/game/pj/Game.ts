const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {

    start() {
        this.initTable();
    }

    async initTable() {

        const layoutNode = cc.find("Canvas/TableRoot/SeatContainer");

        const layout = layoutNode.getComponent("SeatLayout");

        await layout.ready();   // ⭐ 关键点（不会再报错）

        console.log("SeatLayout 已就绪");

        layout.createSeats(10, 2);
    }
}