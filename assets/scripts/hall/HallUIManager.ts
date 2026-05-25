import HallRes from "./HallRes";
import RoomSelectPopup from "../hall/room/RoomSelectPopup";
import WsClient from "../game/pj/net/WsClient";
import UserData from "../login/entity/UserData";
import Config from "../config/Config";
import { Cmd } from "../game/pj/enum/Cmd";
import CameCardComponentManager from "./CameCardComponentManager";
import GameCardComponent from "./GameCardComponent";
import ShopRes from "../shop/ShopRes";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HallUIManager extends cc.Component {
    private gameCardPos : { x : number, y : number, id:  number, name: string }[] = [];
    private gameCardContainerNode: cc.Node = null;
    public gameCardNode: cc.Node | null = null;
    public joinRoomPanelNode: cc.Node | null = null;
    public roomSelectPanelNode: cc.Node | null = null;
    public canvas: cc.Node | null = null;
    private shopNode: cc.Node |null = null;
    private static _instance: HallUIManager = null;
    public static get instance(): HallUIManager {
        return this._instance;
    }

    async onLoad() {
        this.canvas = cc.find("Canvas");
        this.gameCardNode = cc.find("Canvas/GameCard");
        this.joinRoomPanelNode = cc.find("Canvas/JoinRoomPanel");
        this.roomSelectPanelNode = cc.find("Canvas/RoomSelectPanel");
        this.gameCardContainerNode = cc.find("Canvas/GameCard/View");
        // 监听座位点击
        cc.systemEvent.on("GameCard_CLICK", this.onGameCardClick, this);
        // 保存单例引用
        HallUIManager._instance = this;
        this.init();
    }

    public async init(){
        await HallRes.instance.preload();
        this.intGameCardPos();
        this.initData();
        this.initGameCardLayout();

        const guest = UserData.get();
        if(!guest){
            cc.log("用户数据为空，进入游戏失败");
            return;
        }
        let t = Date.now();
        await WsClient.instance.connectAsync(Config.WS_URL, guest.token);
        WsClient.instance.send(Cmd.ROOM_INFO, "")
        console.log("连接socket耗时:", Date.now() - t, "ms");
    }


     public intGameCardPos(){
        this.gameCardPos = [];
        // 设置座位坐标
        this.gameCardPos.push({ x : -278, y : 50, id:  1 , name: "牌九"});
    }

    private initData() {
        for (let i = 0; i < this.gameCardPos.length; i++) {
            CameCardComponentManager.getInstance().gameCardComponentDataList.push({
                id: this.gameCardPos[i].id,
                x: this.gameCardPos[i].x,
                y: this.gameCardPos[i].y,
                name: this.gameCardPos[i].name,
            });
        }
    }

    initGameCardLayout() {
        if (!HallRes.instance.gameCardPrefab || !this.gameCardContainerNode) {
            cc.error("GameCardManager未初始化完成");
            return;
        }
        this.gameCardContainerNode.removeAllChildren();
    
        CameCardComponentManager.getInstance().gameCardComponentDataList.forEach((data, i) => {
            const node = cc.instantiate(HallRes.instance.gameCardPrefab);
            node.parent = this.gameCardContainerNode;
            node.setPosition(data.x, data.y);
            const gameCardComponent = node.getComponent(GameCardComponent);
            gameCardComponent.init(data, HallRes.instance.bg1Map);
            CameCardComponentManager.getInstance().gameCardComponentList.push(gameCardComponent);
    
        });
        console.log('GameCardLayout OK')
    }

    

    

    public onGameCardClick(id : number){
        const roomSelectPanelNode = HallUIManager.instance.roomSelectPanelNode;
        if(roomSelectPanelNode){
            const roomSelectPopup = roomSelectPanelNode.getComponent(RoomSelectPopup);
            roomSelectPopup.show();
        }
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

    public async showShop(){
        let shopPrefab = ShopRes.instance.shopPrefab;
        if(!shopPrefab){
            await ShopRes.instance.loadShopPrefab();
            shopPrefab = ShopRes.instance.shopPrefab;
        }
        if(!this.shopNode){
            this.shopNode = cc.instantiate(shopPrefab);
            this.canvas?.addChild(this.shopNode);
        }else{
            this.shopNode.active = true;
        }
    }


     onDestroy() {
      HallRes.instance.close();
    }

}
