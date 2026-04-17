const { ccclass } = cc._decorator;
import { SeatData, SeatState } from "./SeatData";

@ccclass
export default class SeatComponent extends cc.Component {

    private normalNode: cc.Node = null;
    private hoverNode: cc.Node = null;
    private setOut: cc.Node = null;
    private setOut: cc.Node = null;
    

    private seatData: SeatData = null;

    onLoad() {
        this.normalNode = this.node.getChildByName("Normal");
        this.hoverNode = this.node.getChildByName("Hover");
        this.setOut = this.node.getChildByName("SetOut");
        this.setHover(false);
        this.setSetOut(false);
        this.setStautsReady(false);


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
                this.setNormal(true);
                this.setHover(false);
                break;

            case SeatState.OCCUPIED: 
                this.setNormal(false);
                this.setHover(false);
                this.setSetOut(true);
                break;

            case SeatState.LOCKED:
                this.setNormal(false);
                this.setHover(false);
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
        console.log('座位预制体状态:', this.seatData.id, this.seatData.state)
        // 通知 SeatManager
        cc.systemEvent.emit("SEAT_CLICK", this.seatData.id);
    }

    /**
     * 高亮座位控制
     */
    private setHover(active: boolean) {
        this.hoverNode.active = active;
    }

    /**
     * 普通座位控制
     */
    private setNormal(active: boolean) {
        this.normalNode.active = active;
    }


    /**
     * 已加入座位控制
     */
    private setSetOut(active: boolean) {
        this.setOut.active = active;
    }


    /**
     * 状态
     */
    private setStautsReady(active: boolean) {
        this.setOut.getChildByName("Status").getChildByName("Status1").active = !active;
        this.setOut.getChildByName("Status").getChildByName("Status2").active = active;
    }

}