const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {

    start() {
        this.initTable();
    }

    async initTable() {

        const layoutNode = cc.find("Canvas/TableRoot/SeatContainer");

        const layout = layoutNode.getComponent("SeatLayout");

        await layout.ready();   

        layout.createSeats(8, 1);
    }
}