import HallRes from "./HallRes";
import RoomSelectPopup from "../hall/room/RoomSelectPopup";
import WsClient from "../game/pj/net/WsClient";
import UserData from "../login/entity/UserData";
import Config from "../config/Config";
import { Cmd } from "../game/pj/enum/Cmd";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HallUIManager extends cc.Component {
    public hallBmgAudioId: number | null = null;
    private gameCardPos : { x : number, y : number, id:  number, name: string }[] = [];
    public gameCardNode: cc.Node | null = null;
    public joinRoomPanelNode: cc.Node | null = null;
    public roomSelectPanelNode: cc.Node | null = null;
    private static _instance: HallUIManager = null;
    public static get instance(): HallUIManager {
        return this._instance;
    }

    async onLoad() {
        // 保存单例引用
        HallUIManager._instance = this;
        this.init();
    }

    public async init(){
        this.intGameCardPos();
        await HallRes.instance.preload();
        if(this.hallBmgAudioId === null){
            this.hallBmgAudioId = cc.audioEngine.playEffect(HallRes.instance.hallBgmAudio, true);
            cc.audioEngine.setVolume(this.hallBmgAudioId, 0.3);
        } 
        this.gameCardNode = cc.find("Canvas/GameCard");
        this.joinRoomPanelNode = cc.find("Canvas/JoinRoomPanel");
        this.roomSelectPanelNode = cc.find("Canvas/RoomSelectPanel");

        const guest = UserData.get();
        if(!guest){
            cc.log("用户数据为空，进入游戏失败");
            return;
        }
        await WsClient.instance.connectAsync(Config.WS_URL, guest.token);
        WsClient.instance.send(Cmd.ROOM_INFO, "")
    }

    public intGameCardPos(){
        this.gameCardPos = [];
        // 设置座位坐标
        this.gameCardPos.push({ x : -278, y : 50, id:  1 , name: "牌九"});
    }



    public getGameCardPos() : { x : number, y : number, id:  number, name: string }[] {
        return this.gameCardPos;
    }

    public gameCardShow(){
        const gameCardNode = this.gameCardNode;
        if(gameCardNode){
            gameCardNode.active = true;
        }
    }

    public gameCardHide(){
        const gameCardNode = this.gameCardNode;
        if(gameCardNode){
            gameCardNode.active = false;
        }
    }


     public roomSelectPanelShow(){
        const roomSelectPopupNode = this.roomSelectPanelNode?.getComponent(RoomSelectPopup);
        roomSelectPopupNode?.show();
    }

    public roomSelectPanelHide(){
        const roomSelectPopupNode = this.roomSelectPanelNode?.getComponent(RoomSelectPopup);
        roomSelectPopupNode?.hide();
    }


 

    public setCardIconNameView(labelNode: cc.Node, name : string) {
        const label = labelNode.getComponent(cc.Label);
        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
                outline = labelNode.addComponent(cc.LabelOutline);
                // 黑色描边
                outline.color = cc.Color.BLACK;
                // 宽度
                outline.width = 5;
        }
        label.string = name;
        label.node.color = new cc.Color(255, 215, 0); // 金色
    }

    public setGameOnlineCountView(labelNode: cc.Node, count : number) {
        const label = labelNode.getComponent(cc.Label);
        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
                outline = labelNode.addComponent(cc.LabelOutline);
                // 黑色描边
                outline.color = cc.Color.BLACK;
                // 宽度
                outline.width = 5;
        }
        label.string = String(count);
        label.node.color = new cc.Color(255, 215, 0); // 金色
    }

     onDestroy() {
        if(this.hallBmgAudioId !== null){
            cc.audioEngine.stopEffect(this.hallBmgAudioId);
            this.hallBmgAudioId = null;
        }
    }

}
