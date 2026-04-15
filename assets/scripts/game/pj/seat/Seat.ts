const { ccclass } = cc._decorator;
import { SeatData, SeatState } from "./SeatData";

@ccclass
export default class Seat extends cc.Component {

    private normalNode: cc.Node = null;
    private hoverNode: cc.Node = null;

    private seatData: SeatData = null;

    onLoad() {
        this.normalNode = this.node.getChildByName("Normal");
        this.hoverNode = this.node.getChildByName("Hover");
        this.setHover(false);

        this.node.on(cc.Node.EventType.MOUSE_ENTER, this.onEnter, this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onLeave, this);
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onClick, this);
    }

    /**
     * 更新座位数据
     */
    public setData(seatData: SeatData) {
        this.seatData = seatData;
        this.updateView();
    }

    /**
     * 更新座位UI状态
     */
    private updateView() {
        if (!this.seatData) return;

        switch (this.seatData.state) {
            case SeatState.EMPTY:
                this.normalNode.active = true;
                break;

            case SeatState.OCCUPIED:
                this.normalNode.active = false;
                break;

            case SeatState.LOCKED:
                this.normalNode.active = false;
                break;
        }
    }

    private onEnter() {
        if (this.seatData.state === SeatState.EMPTY) {
            this.setHover(true);
        }
    }

    private onLeave() {
        this.setHover(false);
    }

    private onClick() {
        if (this.seatData.state !== SeatState.EMPTY) return;
        console.log(this.seatData)
        // 通知 SeatManager
        cc.systemEvent.emit("SEAT_CLICK", this.seatData.id);
    }

    /**
     * 座位高亮
     */
    private setHover(active: boolean) {
        this.hoverNode.active = active;
    }
}