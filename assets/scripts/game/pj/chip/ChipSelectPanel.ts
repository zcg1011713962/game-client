import {Cmd} from "../enum/Cmd";
import WsClient from "../net/WsClient";
import ClientRoomManager from "../room/ClientRoomManager";

const { ccclass, property } = cc._decorator;



@ccclass
export default class ChipSelectPanel extends cc.Component {

    private chipBtns: cc.Node[] = [];

    onLoad() {
        this.chipBtns = this.node.children.filter(n =>
            n.name.startsWith("Chip_")
        );
        this.node.active = false;
        // console.log("chipBtns", this.chipBtns);
        this.chipBtns.forEach(node => {
            node.on(cc.Node.EventType.TOUCH_END, () => {
                const chip = this.getChipValue(node);
                const roomId = ClientRoomManager.instance.getRoomId();
                // 位置跟下注区域一样的索引
                const betArea = ClientRoomManager.instance.getMySeatId();
                // 进房
                WsClient.instance.send(Cmd.BET, {roomId: roomId, chip: chip, betArea: betArea});
            }, this);

        });
    }


    private getChipValue(node: cc.Node): number {
        const arr = node.name.split("_");

        if (arr.length < 2) return 0;

        return Number(arr[1]);
    }


}