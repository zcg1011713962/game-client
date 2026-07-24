import HallRes from "./HallRes";
import RoomSelectPopup, { RoomCardType } from "../hall/room/RoomSelectPopup";
import WsClient from "../game/pj/net/WsClient";
import UserData from "../login/entity/UserData";
import Config from "../config/Config";
import { Cmd } from "../game/pj/enum/Cmd";
import CameCardComponentManager from "./CameCardComponentManager";
import GameCardComponent from "./GameCardComponent";
import ShopRes from "../shop/ShopRes";
import Http from "../util/Http";
import { ServerMsg } from "../login/entity/ServerMsg";
import ToastManager from "../common/ToastManager";
import HallTopBar from "./top/HallTopBar";
import Shop from "../shop/Shop";
import GameRes from "../game/pj/GameRes";
import { ShareRoomUtil } from "../util/SceneUtil";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HallUIManager extends cc.Component {
    private gameCardPos : { x : number, y : number, id:  number, name: string }[] = [];
    private gameCardContainerNode!: cc.Node;
    private roomSelectPanelPrefabNode!: cc.Node;
    public joinRoomPanelPrefabNode!: cc.Node;
    public createRoomPopupPrefabNode!: cc.Node;
    public recordPopupNode!: cc.Node;
    public hallRecordPopupNode!: cc.Node;
    public gameRecordPopupNode!: cc.Node;
   
    
    private topBar!: cc.Node;
    private bottomBar!: cc.Node;
    public gameCardNode!: cc.Node;
    public joinRoomPanelNode!: cc.Node;
    public createRoomPopupNode!:cc.Node;
    public roomSelectPanelNode: cc.Node | null = null;
    public canvas!: cc.Node;
    private shopNode: cc.Node |null = null;
    private destroyed: boolean = false;
    private isPlayingBgm: boolean = false;
    private static _instance: HallUIManager = null;
    
    public static get instance(): HallUIManager {
        return this._instance;
    }

    async onLoad() {
        this.canvas = this.node;
        this.topBar = this.node.getChildByName("TopBar");
        this.gameCardNode = this.node.getChildByName("GameCard");
        this.joinRoomPanelNode = this.node.getChildByName("JoinRoomPanel");
        this.createRoomPopupNode = this.node.getChildByName("CreateRoomPopupPanel");
        this.roomSelectPanelNode = this.node.getChildByName("RoomSelectPanel");
        this.gameCardContainerNode = this.gameCardNode.getChildByName("View");
      
        this.initBottomBar();
        // 监听座位点击
        cc.systemEvent.on("GameCard_CLICK", this.onGameCardClick, this);
        // 保存单例引用
        HallUIManager._instance = this;
        this.init();
    }

    public async init(){
        let t1 = Date.now();
        this.initTopBar();
        this.initGameCard();
        this.playGameBgm();
        
        console.log("HallUIManager init:", Date.now() - t1, "ms");
        const guest = UserData.get();
        if(!guest){
            cc.log("用户数据为空，进入游戏失败");
            return;
        }
        let t2 = Date.now();
        await WsClient.instance.connectAsync(Config.WS_URL, guest.token, false);
        if (this.destroyed || !cc.isValid(this.node)) {
            return;
        }

        const sharedInvite = ShareRoomUtil.peekPendingInvite();
        if (sharedInvite) {
            WsClient.instance.send(Cmd.ENTER_ROOM, { invite: sharedInvite });
        } else {
            WsClient.instance.send(Cmd.ROOM_INFO, "")
        }
        console.log("连接socket耗时:", Date.now() - t2, "ms");
    }

    public initTopBar(){
        this.topBar.removeAllChildren();
        
        const node = cc.instantiate(HallRes.instance.topBarPrefab);
        node.parent = this.topBar;
    }

    private initBottomBar(): void {
        const oldBottomBar = this.node.getChildByName("BottomBar");
        if (oldBottomBar) {
            oldBottomBar.removeFromParent();
            oldBottomBar.destroy();
        }

        if (!HallRes.instance.bottomBarPrefab) {
            cc.error("BottomBar prefab未预加载");
            return;
        }

        this.bottomBar = cc.instantiate(HallRes.instance.bottomBarPrefab);
        this.bottomBar.parent = this.node;
    }

    public initGameCard(){
        this.intGameCardPos();
        this.initData();
        this.initGameCardLayout();
    }


     public intGameCardPos(){
        this.gameCardPos = [];
        // 设置座位坐标
        this.gameCardPos.push({ x : -278, y : 50, id:  1 , name: "牌九"});
    }

    private initData() {
        const gameCardComponentDataList = CameCardComponentManager.getInstance().gameCardComponentDataList;
        if(gameCardComponentDataList.length > 0){
            return;
        }
        for (let i = 0; i < this.gameCardPos.length; i++) {
            CameCardComponentManager.getInstance().gameCardComponentDataList.push({
                id: this.gameCardPos[i].id,
                x: this.gameCardPos[i].x,
                y: this.gameCardPos[i].y,
                name: this.gameCardPos[i].name,
            });
        }
    }

    private initGameCardLayout() {
        if (!HallRes.instance.gameCardPrefab || !this.gameCardContainerNode) {
            cc.error("GameCardManager未初始化完成");
            return;
        }

        this.gameCardContainerNode.removeAllChildren();

        const manager = CameCardComponentManager.getInstance();
        manager.gameCardComponentList.length = 0;

        manager.gameCardComponentDataList.forEach(data => {
            const node = cc.instantiate(HallRes.instance.gameCardPrefab);
            node.parent = this.gameCardContainerNode;
            node.setPosition(data.x, data.y);

            const comp = node.getComponent(GameCardComponent);
            comp.init(data);

            manager.gameCardComponentList.push(comp);
        });

        console.log("GameCardLayout OK");
    }                   

    

    public async onGameCardClick(id : number){
        if(!this.roomSelectPanelPrefabNode){
            await this.initSelectPanelPrefabNode();
        }
        await this.roomSelectPanelShow();
    }

    

    private async initSelectPanelPrefabNode(){
        if (this.roomSelectPanelPrefabNode) {
            return;
        }

        if (!HallRes.instance.roomSelectPanelPrefab) {
            await HallRes.instance.loadRoomSelectPanelPrefabs();
        }

        this.roomSelectPanelPrefabNode = cc.instantiate(HallRes.instance.roomSelectPanelPrefab);  
        if(this.roomSelectPanelNode){
            this.roomSelectPanelPrefabNode.parent = this.roomSelectPanelNode;
        }
    }

    public async initJoinRoomPanelPrefabNode(){
        if (this.joinRoomPanelPrefabNode) {
            return;
        }

        if (!HallRes.instance.joinRoomPanelPrefab) {
            await HallRes.instance.joinRoomPanelPrefabs();
        }

        this.joinRoomPanelPrefabNode = cc.instantiate(HallRes.instance.joinRoomPanelPrefab);  
        if(this.joinRoomPanelNode){
            this.joinRoomPanelPrefabNode.parent = this.joinRoomPanelNode;
        }
    }


     public async initCreateRoomPopupPrefabNode(){
        if (this.createRoomPopupPrefabNode) {
            return;
        }

        if (!HallRes.instance.createRoomPopupPrefab) {
            await HallRes.instance.createRoomPopupPrefabs();
        }

        this.createRoomPopupPrefabNode = cc.instantiate(HallRes.instance.createRoomPopupPrefab);  
        if(this.createRoomPopupNode){
            this.createRoomPopupPrefabNode.parent = this.createRoomPopupNode;
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


     public async roomSelectPanelShow(){
        if(!this.roomSelectPanelPrefabNode){
            await this.initSelectPanelPrefabNode();
        }
        const roomSelectPopupNode = this.roomSelectPanelPrefabNode.getComponent(RoomSelectPopup);
        roomSelectPopupNode.show();
    }

    public async roomSelectPanelHide(){
        if(!this.roomSelectPanelPrefabNode){
            await this.initSelectPanelPrefabNode();
        }
        const roomSelectPopupNode = this.roomSelectPanelPrefabNode.getComponent(RoomSelectPopup);
        roomSelectPopupNode.hide();
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
        this.refreshShopTopBar();
    }

    private async playGameBgm(): Promise<void> {
        if (this.isPlayingBgm) {
            return;
        }

        if (!HallRes.instance.hallBgmAudio) {
            await HallRes.instance.loadHallBgmAudio();
        }

        if (this.destroyed || !cc.isValid(this.node)) {
            return;
        }

        if (!HallRes.instance.hallBgmAudio) {
            cc.error("大厅背景音乐不存在");
            return;
        }

        cc.audioEngine.stopMusic();

        cc.audioEngine.playMusic(HallRes.instance.hallBgmAudio, true);
        cc.audioEngine.setMusicVolume(0.3);

        this.isPlayingBgm = true;

        console.log("播放大厅背景音乐");
    }

    public onClickCard(roomCardType: RoomCardType, req?: any) {
        const data = JSON.stringify(req || {});
        console.log("进房", roomCardType, data)
        if(roomCardType === RoomCardType.MATCH){
            // 匹配
            WsClient.instance.send(Cmd.FREE_MATCH, data);
        }else if(roomCardType === RoomCardType.CREATE){
            // 创房
            WsClient.instance.send(Cmd.CREATE_ROOM, data);
        }
    }


    public buyProduct(productId: number) {

    const token = UserData.get()?.token || "";

    Http.post<ServerMsg<any>>(
        `${Config.API_URL}/shop/buy`,
        { productId: productId },
        (err, res) => {
            if (err) {
                console.error(err);
                ToastManager.show("请检查网络");
                return;
            }

            if (!res) {
                ToastManager.show("服务器异常");
                return;
            }

            if (res.code !== 0) {
                ToastManager.show(res.msg || "购买失败");
                return;
            }

            const data = res.data;
            UserData.updateGold(data.gold);
            UserData.updateRoomCard(data.roomCard);
            ToastManager.show("购买成功", true);

            try{
                this.refreshHallTopBar();
                this.refreshShopTopBar();
            }catch(e){
                console.error(e);
            }
        },
        { token }  
    );
    }

    public refreshHallTopBar(){
        if(this.topBar && this.topBar.getChildByName("TopBar")){
            const hallTopBar = this.topBar.getChildByName("TopBar").getComponent(HallTopBar);
            if (hallTopBar) {
                hallTopBar.refresh();
            }
        }
    }

    public refreshShopTopBar(){
        const shopTopBar = this.canvas.getChildByName("Shop").getComponent(Shop);
        if(shopTopBar){
            shopTopBar.refresh();
        }
    }

    public async showRecord(parent: cc.Node, roomId :number | null) {
        const isHallRecord = roomId == null;
        let recordPopupPrefab = isHallRecord
            ? HallRes.instance.hallRecordPopupPrefab
            : HallRes.instance.gameRecordPopupPrefab;

        if (!recordPopupPrefab) {
            recordPopupPrefab = await HallRes.instance.loadPrefab(
                isHallRecord ? "prefabs/HallRecordPopup" : "prefabs/GameRecordPopup"
            );
            if (isHallRecord) {
                HallRes.instance.hallRecordPopupPrefab = recordPopupPrefab;
            } else {
                HallRes.instance.gameRecordPopupPrefab = recordPopupPrefab;
            }
        }

        if (isHallRecord && !HallRes.instance.hallRecordItemPrefab) {
            HallRes.instance.hallRecordItemPrefab = await HallRes.instance.loadPrefab("prefabs/HallRecordItem");
        }

        if (isHallRecord && Object.keys(HallRes.instance.recordImgMap).length === 0) {
            await HallRes.instance.loadRecordImg();
        }

        if (!isHallRecord && !HallRes.instance.gameRecordItemPrefab) {
            HallRes.instance.gameRecordItemPrefab = await HallRes.instance.loadPrefab("prefabs/GameRecordItem");
            await HallRes.instance.loadResultImg();
        }

        const oldNode = isHallRecord ? this.gameRecordPopupNode : this.hallRecordPopupNode;
        if (oldNode) {
            oldNode.active = false;
        }

        let popupNode = isHallRecord ? this.hallRecordPopupNode : this.gameRecordPopupNode;
        if (!popupNode) {
            popupNode = cc.instantiate(recordPopupPrefab);
            parent.addChild(popupNode);
            if (isHallRecord) {
                this.hallRecordPopupNode = popupNode;
            } else {
                this.gameRecordPopupNode = popupNode;
            }
        } else {
            popupNode.active = true;
        }

        this.recordPopupNode = popupNode;
        const recordPopup = popupNode.getComponent(
            isHallRecord ? "HallRecordPopup" : "GameRecordPopup"
        ) as any;
        recordPopup.loadFirstPage(roomId);
    }
    
    public hideRecord(){
        if (this.recordPopupNode) {
            this.recordPopupNode.active = false;
        }
    }


    protected onDestroy(): void {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        cc.systemEvent.off("GameCard_CLICK", this.onGameCardClick, this);

        cc.audioEngine.stopMusic();

        this.isPlayingBgm = false;

        console.log("hall onDestroy");
    }


}
