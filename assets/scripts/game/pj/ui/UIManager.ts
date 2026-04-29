const {ccclass, property} = cc._decorator;
import RoomManager from "../room/RoomManager";
import CurrUserManager from "../user/CurrUserManager";
import PaiJiuUtil from "../util/PaiJiuUtil";
import ClientRoomManager from "../room/ClientRoomManager";
import WsClient from "../net/WsClient";
import {Cmd} from "../enum/Cmd";
import BetArea from "../chip/BetArea";
@ccclass
export default class UIManager extends cc.Component {
    private startBtnNode: cc.Node = null;
    private tableNode: cc.Node = null;
    private topNode: cc.Node = null;
    private chipSelectPanel: cc.Node = null;
    private betAreaNode: cc.Node = null;
    private seats : { x : number, y : number, id:  number }[] = [];

    private static _instance: UIManager = null;
    public static get instance(): UIManager {
        return this._instance;
    }

    onLoad() {
        // 保存单例引用
        UIManager._instance = this;
        this.tableNode = cc.find("Canvas/MainLayout/Table");
        this.startBtnNode = cc.find("Canvas/MainLayout/Table/Table/StartBtn");
         // 准备按钮点击
        this.startBtnNode.on(cc.Node.EventType.MOUSE_UP, this.onStartBtnClick, this);
        this.startBtnNode = cc.find("Canvas/MainLayout/Table/Table/StartBtn");
        this.topNode = cc.find("Canvas/MainLayout/Top");
        this.chipSelectPanel = cc.find("Canvas/MainLayout/Table/ChipSelectPanel");
        this.betAreaNode = cc.find(`Canvas/MainLayout/Table/BetContainer/BetArea0`);
        this.setStartBtnStatus(false);
        this.init();
    }

    private init(){
         this.intSeatPos();
         const label1 = this.topNode.getChildByName("label1");
         const label2 = this.topNode.getChildByName("label2");
         const label3 = this.topNode.getChildByName("label3");
         const label4 = this.topNode.getChildByName("label4");
         const label5 = this.topNode.getChildByName("label5");

        this.setLabelView(label1);
        this.setLabelView(label3);
        this.setLabelView(label5);
    }

    public getTableNode(){
        return this.tableNode;
    }

    public setStartBtnStatus(active: boolean) {
        this.startBtnNode.active = active;
    }


    /**
     * 开始或者准备按钮点击
     */
    // private async onStartBtnClick(){
    //      console.log("点击准备或开始")
    //      const userId = CurrUserManager.getInstance().currentUserId;
    //      const room = RoomManager.getRoom();
    //      RoomManager.ready(userId);
    //      const flag = await RoomManager.isAllReady(userId);
        
    //      if(flag){
    //         RoomManager.settle();
    //         console.log("完成一局，进入下一局");
    //         await PaiJiuUtil.wait(this, 2);
    //         UIManager.instance.setStartBtnStatus(true);
    //      }
    // }

     private async onStartBtnClick(){
         console.log("点击准备");
         const roomId = ClientRoomManager.instance.getRoomId();

         WsClient.instance.send(Cmd.READY, {
            roomId: roomId
         });
    }


    public setLabelView(labelNode: cc.Node) {
        if(labelNode){
            const label = labelNode.getComponent(cc.Label);
            let outline = labelNode.getComponent(cc.LabelOutline);
            if (!outline) {
                outline = labelNode.addComponent(cc.LabelOutline);
                // 黑色描边
                outline.color = cc.Color.BLACK;
                // 宽度
                outline.width = 5;
            }
            label.node.color = cc.Color.YELLOW; 
        }
    }

    public setCoinView(coinValNode : cc.Node, coin: number){
        const label = coinValNode.getComponent(cc.Label);
        let outline = coinValNode.getComponent(cc.LabelOutline);
        if (!outline) {
                outline = coinValNode.addComponent(cc.LabelOutline);
                // 黑色描边
                outline.color = cc.Color.BLACK;
                // 宽度
                outline.width = 10;
        }
        label.string = String(coin);
        label.node.color = new cc.Color(255, 215, 0); // 金黄色
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
        this.seats.push({ x : 0, y : -600, id:  0 });
        this.seats.push({ x : 400, y : -380, id:  1 });
        this.seats.push({ x : 480, y : 20, id:  2 });
        this.seats.push({ x : 400, y : 420, id:  3});
        this.seats.push({ x : 0, y : 700, id:  4});
        this.seats.push({ x : -400, y : 420, id:  5 });
        this.seats.push({ x : -480, y : 20, id:  6});
        this.seats.push({ x : -400, y : -380, id:  7});
    }

    public getSeat() : { x : number, y : number, id:  number }[] {
        return this.seats;
    }


    public setBetPanelVisible(visible: boolean) {
        if (this.chipSelectPanel) {
            this.chipSelectPanel.active = visible;
        }
    }

    
     public onSelectChip(chip: number) {
            if(this.betAreaNode){
                const betArea = this.betAreaNode.getComponent(BetArea);

                
                const localStartPos = cc.v2(0, 0);
                const localEndPos = cc.v2(0, 200);
                betArea.addChip(chip, localStartPos, localEndPos);
                this.node.active = false;
            }
    }


}
