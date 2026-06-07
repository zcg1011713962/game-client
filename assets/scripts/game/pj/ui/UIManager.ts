const {ccclass, property} = cc._decorator;
import ClientRoomManager from "../room/ClientRoomManager";
import WsClient from "../net/WsClient";
import {Cmd} from "../enum/Cmd";
import BetArea from "../chip/BetArea";
import { RoomState } from "../room/RoomState";
import SeatComponentManager from "../seat/SeatComponentManager";
import {RoomBarData, RooomTopBar} from "../../top/RoomTopBar";
import PaiJiuTable from "../PaiJiuTable";
import GameRes from "../GameRes";
import RoundStartPopup from "../../../common/RoundStartPopup";
import SettleManager from "../../../common/SettleManager";
import ReadyButton, { ReadyBtnState } from "../../btn/ReadyButton";

@ccclass
export default class UIManager extends cc.Component {
    private uiNode!: cc.Node;
    private tableNode!: cc.Node;
    private chipSelectPanel!: cc.Node;
    private betContainer!: cc.Node;
    private rooomTopBarNode!: cc.Node;
    private clockContainerNode!: cc.Node;
    private seats : { x : number, y : number, id:  number }[] = [];
    private rooomTopBarComponent! : RooomTopBar;
    private readyButtonNode!: cc.Node;
    

    private static _instance: UIManager = null;
    public static get instance(): UIManager {
        return this._instance;
    }

    onLoad() {
        const t = Date.now();
        // 保存单例引用
        UIManager._instance = this;
        this.uiNode = this.node.getChildByName("UI");
        this.tableNode = cc.find("Canvas/MainLayout/Table");
        this.chipSelectPanel = cc.find("Canvas/MainLayout/Table/ChipSelectPanel");
        this.betContainer = cc.find("Canvas/MainLayout/Table/BetContainer");
        this.rooomTopBarNode = cc.find("Canvas/MainLayout/RoomTopBar");
        this.clockContainerNode = cc.find("Canvas/MainLayout/Table/ClockContainer");
        this.init();
        console.log("游戏初始化预制体耗时:", Date.now() - t, "ms");
    }

    private init(){
         this.intSeatPos();
         this.initRoomTopBar();
         this.initChipSelectPanel();
    }

    public initRoomTopBar(){
        this.rooomTopBarNode.removeAllChildren();
            
        const node = cc.instantiate(GameRes.instance.roomTopBarPrefab);
        node.parent = this.rooomTopBarNode;
        this.rooomTopBarComponent = node.getComponent(RooomTopBar);
    }

    public initChipSelectPanel(){
        this.chipSelectPanel.removeAllChildren();
            
        const node = cc.instantiate(GameRes.instance.chipSelectPanelPrefab);
        node.parent = this.chipSelectPanel;
    }

    public getTableNode(){
        return this.tableNode;
    }



    public setNickNameView(labelNode: cc.Node, isBanker: boolean, isSelf: boolean, name : string) {
        const label = labelNode.getComponent(cc.Label);
         label.string = name;
        if (isSelf) {
            label.node.color = cc.Color.GREEN;
        } else if (isBanker) {
            label.node.color = new cc.Color(255, 215, 0); // 金色
        } else {
            label.node.color = cc.Color.WHITE;
        }
    }

    public intSeatPos(){
        this.seats = [];
        // 设置座位坐标
        this.seats.push({ x : 0, y : -800, id:  0 });
        this.seats.push({ x : 420, y : -420, id:  1 });
        this.seats.push({ x : 460, y : 20, id:  2 });
        this.seats.push({ x : 420, y : 420, id:  3});
        this.seats.push({ x : 0, y : 750, id:  4});
        this.seats.push({ x : -420, y : 420, id:  5 });
        this.seats.push({ x : -460, y : 20, id:  6});
        this.seats.push({ x : -420, y : -420, id:  7});
    }



    public getSeat() : { x : number, y : number, id:  number }[] {
        return this.seats;
    }


    public setBetPanelVisible(visible: boolean) {
        if (this.chipSelectPanel) {
            this.chipSelectPanel.active = visible;
        }
    }

    
    public onSelectChip(chip: number, seatId: number) {
        const betArea = this.betContainer.getComponent(BetArea);
        if(betArea){
            const seatComponen = SeatComponentManager.getInstance().seatComponentList.find(s => s["seatData"].id === seatId);
            if(seatComponen){
                // 起点：座位世界坐标
                const worldStartPos = seatComponen.node.convertToWorldSpaceAR(cc.v2(0, 0));
                betArea.addChip(chip, seatId, worldStartPos);
            }
        }else{
            console.error("betArea节点为空");
        }
        
    }
    
    // 全部清理
    public clearTable(){
        //console.log("执行全部清理, 房间状态:", ClientRoomManager.instance.getRoomState())
        this.clearCardContainer();
        this.clearBetContainer();
        this.clearClockContainer();
        SettleManager.close();
    }

    // 清理发牌区
    public clearCardContainer(){
         const tableNode = UIManager.instance.getTableNode();
         if(tableNode){
            const paiJiuTableNode = tableNode.getComponent(PaiJiuTable);
            paiJiuTableNode.clearCardContainer();
            //console.log("清理牌区")
         }
    }

    // 清理投注的筹码
    public clearBetContainer(){
         if(ClientRoomManager.instance.getRoomState() === RoomState.WAIT || ClientRoomManager.instance.getRoomState() === RoomState.READY){
             const betArea = this.betContainer.getComponent(BetArea);
             if(betArea){
                betArea.clearChips(this.seats);
                //console.log("清理筹码区")
             }
         }
    }

    public clearClockContainer(){
        this.clockContainerNode.removeAllChildren();
        //console.log("清理倒计时钟")
    }


    public updateTopView(roomId: number, curPlayer: number, baseScore: number){
        if(this.rooomTopBarComponent){
            const roomBarData: RoomBarData = {
            roomId: roomId,
            curPlayer: curPlayer,
            baseScore: baseScore,
            };
            console.log("update RoomTopBar", roomBarData);
            this.rooomTopBarComponent.setRoomInfo(roomBarData);
        }
    }


     public setFrontView(labelNode: cc.Node, name : string, outlineWidth: number, color : cc.Color) {
        const label = labelNode.getComponent(cc.Label);
        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
                outline = labelNode.addComponent(cc.LabelOutline);
                // 黑色描边
                outline.color = cc.Color.BLACK;
                // 宽度
                outline.width = outlineWidth;
        }
        if(name.length > 0){
            label.string = name;
        }
        label.node.color = color; 
    }


    public async showRoundStartAnim(
        roundId: number,
        serverTime: number,
        roundAnimExpireTime: number
    ): Promise<void> {

        const node = cc.instantiate(
            GameRes.instance.roundStartPrefab
        );

        node.parent = cc.find("Canvas");

        const comp = node.getComponent(RoundStartPopup);

        await comp.play(
            roundId,
            serverTime,
            roundAnimExpireTime
        );

        node.destroy();
    }


    public showReady(status: ReadyBtnState) {
        if(!this.readyButtonNode || !cc.isValid(this.readyButtonNode)){
             this.readyButtonNode = cc.instantiate(GameRes.instance.readyButtonPrefab);
            this.readyButtonNode.parent = this.uiNode;
        }
        const comp = this.readyButtonNode.getComponent(ReadyButton);
        comp.setState(status);
    }

    public readyBtnClick(){
         UIManager.instance.clearTable();
         cc.audioEngine.playEffect(GameRes.instance.clickAudio, false);
         const roomId = ClientRoomManager.instance.getRoomId();
         WsClient.instance.send(Cmd.READY, {
            roomId: roomId
         });
    }

    public cancelBtnClick(){
         cc.audioEngine.playEffect(GameRes.instance.clickAudio, false);
         const roomId = ClientRoomManager.instance.getRoomId();
         WsClient.instance.send(Cmd.CANCEL_READY, {
            roomId: roomId
         });
    }


    
    
}
