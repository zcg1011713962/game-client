const {ccclass, property} = cc._decorator;
import RoomManager from "../room/RoomManager";
import CurrUserManager from "../user/CurrUserManager";
@ccclass
export default class UIManager extends cc.Component {
    private startBtnNode: cc.Node = null;

    private static _instance: UIManager = null;
    public static get instance(): UIManager {
        return this._instance;
    }

     onLoad() {
        // 保存单例引用
        UIManager._instance = this;
        this.startBtnNode = cc.find("Canvas/MainLayout/Table/Table/StartBtn");
         // 准备按钮点击
        this.startBtnNode.on(cc.Node.EventType.MOUSE_UP, this.onStartBtnClick, this);
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
    private onStartBtnClick(){
         console.log("点击准备或开始")
         const userId = CurrUserManager.getInstance().currentUserId;
         const room = RoomManager.getRoom();
         if(room){
            RoomManager.ready(userId);
            RoomManager.isAllReady(userId);
         }else{
            console.log("房间未初始化")
         } 
    }


}
