import HallRes from "./HallRes";
import RoomSelectPopup, { RoomCardType } from "../hall/room/RoomSelectPopup";
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
    private gameCardContainerNode!: cc.Node;
    private roomSelectPanelPrefabNode!: cc.Node;
    public joinRoomPanelPrefabNode!: cc.Node;
    public createRoomPopupPrefabNode!: cc.Node;
    public bannerSprite!: cc.Sprite;
    public btnActivitySprite!: cc.Sprite;
    public btnRankSprite!: cc.Sprite;
    public btnRecordSprite!: cc.Sprite;
    public btnShopSprite!: cc.Sprite;
    
    private topBar!: cc.Node;
    public gameCardNode!: cc.Node;
    public joinRoomPanelNode!: cc.Node;
    public createRoomPopupNode!:cc.Node;
    public roomSelectPanelNode: cc.Node | null = null;
    public canvas: cc.Node | null = null;
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
        this.bannerSprite = this.node.getChildByName("Banner").getChildByName("BannerImg").getComponent(cc.Sprite);
      
        const bottomBar = this.node.getChildByName("BottomBar");
        this.btnActivitySprite = bottomBar.getChildByName("BtnActivity").getComponent(cc.Sprite);
        this.btnRankSprite = bottomBar.getChildByName("BtnRank").getComponent(cc.Sprite);
        this.btnRecordSprite = bottomBar.getChildByName("BtnRecord").getComponent(cc.Sprite);
        this.btnShopSprite = bottomBar.getChildByName("BtnShop").getComponent(cc.Sprite);
        // 动态加载图片
        this.bannerSprite.spriteFrame = HallRes.instance.bannerSpriteFrame;
        this.btnActivitySprite.spriteFrame = HallRes.instance.bottomIconMap["activity"];
        this.btnRankSprite.spriteFrame = HallRes.instance.bottomIconMap["rank"];
        this.btnRecordSprite.spriteFrame = HallRes.instance.bottomIconMap["record"];
        this.btnShopSprite.spriteFrame = HallRes.instance.bottomIconMap["shop"];
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
        await WsClient.instance.connectAsync(Config.WS_URL, guest.token);
        WsClient.instance.send(Cmd.ROOM_INFO, "")
        console.log("连接socket耗时:", Date.now() - t2, "ms");
    }

    public initTopBar(){
        this.topBar.removeAllChildren();
        
        const node = cc.instantiate(HallRes.instance.topBarPrefab);
        node.parent = this.topBar;
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

    

    public onGameCardClick(id : number){
        if(!this.roomSelectPanelPrefabNode){
            this.initSelectPanelPrefabNode();
        }
        this.roomSelectPanelShow();
    }

    

    private initSelectPanelPrefabNode(){
        this.roomSelectPanelPrefabNode = cc.instantiate(HallRes.instance.roomSelectPanelPrefab);  
        if(this.roomSelectPanelNode){
            this.roomSelectPanelPrefabNode.parent = this.roomSelectPanelNode;
        }
    }

    public initJoinRoomPanelPrefabNode(){
        this.joinRoomPanelPrefabNode = cc.instantiate(HallRes.instance.joinRoomPanelPrefab);  
        if(this.joinRoomPanelNode){
            this.joinRoomPanelPrefabNode.parent = this.joinRoomPanelNode;
        }
    }


     public initCreateRoomPopupPrefabNode(){
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


     public roomSelectPanelShow(){
        if(!this.roomSelectPanelPrefabNode){
            this.initSelectPanelPrefabNode();
        }
        const roomSelectPopupNode = this.roomSelectPanelPrefabNode.getComponent(RoomSelectPopup);
        roomSelectPopupNode.show();
    }

    public roomSelectPanelHide(){
        if(!this.roomSelectPanelPrefabNode){
            this.initSelectPanelPrefabNode();
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

    public onClickCard(roomCardType: RoomCardType) {
        if(roomCardType === RoomCardType.MATCH){
            // 匹配
            WsClient.instance.send(Cmd.FREE_MATCH, "");
        }else if(roomCardType === RoomCardType.CREATE){
            // 创房
            WsClient.instance.send(Cmd.CREATE_ROOM, "");
        }
    }

    protected onDestroy(): void {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        cc.audioEngine.stopMusic();

        this.isPlayingBgm = false;

        console.log("hall onDestroy");
    }


}
