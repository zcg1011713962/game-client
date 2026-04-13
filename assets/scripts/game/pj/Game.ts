const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {

    start() {
        this.initTable();
    }

    async initTable() {

        const seatContainer = cc.find("Canvas/TableRoot/SeatContainer");
        const cardContainer = cc.find("Canvas/TableRoot/CardContainer");

        const seatLayout = seatContainer.getComponent("SeatLayout");
        const cardLayout = cardContainer.getComponent("CardLayout");

        await seatLayout.ready();   
        await cardLayout.ready();   

        // 初始化座位
        seatLayout.createSeats(8, 0);

        // 发牌
        let data = [1, 1, 1, 1];
        cardLayout.dealPaiJiu(data);
    }
}