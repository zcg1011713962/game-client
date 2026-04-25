const {ccclass, property} = cc._decorator;
import RoomManager from "../room/RoomManager";
import CurrUserManager from "../user/CurrUserManager";
import PaiJiuUtil from "../util/PaiJiuUtil";
@ccclass
export default class UIManager extends cc.Component {
    private startBtnNode: cc.Node = null;
    private tableNode: cc.Node = null;

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

    }

    public getTableNode(){
        return this.tableNode;
    }

    public setStartBtnStatus(active: boolean) {
        // 如果是房主显示开始，非房主显示准备
        if(RoomManager.roomOwerUserId == CurrUserManager.getInstance().currentUserId){
            const btnNameNode = this.startBtnNode.getChildByName("Label");
            btnNameNode.getComponent(cc.Label).string = "开始";
        }
        this.startBtnNode.active = active;
    }


    /**
     * 开始或者准备按钮点击
     */
    private async onStartBtnClick(){
         console.log("点击准备或开始")
         const userId = CurrUserManager.getInstance().currentUserId;
         const room = RoomManager.getRoom();
         RoomManager.ready(userId);
         const flag = await RoomManager.isAllReady(userId);
        
         if(flag){
            RoomManager.settle();
            console.log("完成一局，进入下一局");
            await PaiJiuUtil.wait(this, 2);
            UIManager.instance.setStartBtnStatus(true);
         }
    }



}
