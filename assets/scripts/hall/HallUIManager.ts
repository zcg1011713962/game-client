import HallRes from "./HallRes";
import RoomSelectPopup, { RoomCardType } from "../hall/room/RoomSelectPopup";
import WsClient from "../game/pj/net/WsClient";
import UserData from "../login/entity/UserData";
import Config from "../config/Config";
import { Cmd } from "../game/pj/enum/Cmd";
import ShopRes from "../shop/ShopRes";
import Http from "../util/Http";
import { ServerMsg } from "../login/entity/ServerMsg";
import ToastManager from "../common/ToastManager";
import HallTopBar from "./top/HallTopBar";
import Shop from "../shop/Shop";
import { ShareRoomUtil } from "../util/SceneUtil";
import MailPopup from "./mail/MailPopup";
import HallMainManager from "./HallMainManager";
import MatchPopup from "./match/MatchPopup";
import { HallGameCardData } from "./HallGameCard";

const {ccclass} = cc._decorator;

@ccclass
export default class HallUIManager extends cc.Component {
    private roomSelectPanelPrefabNode!: cc.Node;
    public joinRoomPanelPrefabNode!: cc.Node;
    public createRoomPopupPrefabNode!: cc.Node;
    public recordPopupNode!: cc.Node;
    public hallRecordPopupNode!: cc.Node;
    public mailPopupNode!: cc.Node;
    public matchPopupNode!: cc.Node;
   
    
    private topBar!: cc.Node;
    private bottomBar!: cc.Node;
    private hallMain!: cc.Node;
    public joinRoomPanelNode!: cc.Node;
    public createRoomPopupNode!:cc.Node;
    public roomSelectPanelNode: cc.Node | null = null;
    public canvas!: cc.Node;
    private shopNode: cc.Node |null = null;
    private destroyed: boolean = false;
    private isPlayingBgm: boolean = false;
    private isMatching: boolean = false;
    private static _instance: HallUIManager = null;
    
    public static get instance(): HallUIManager {
        return this._instance;
    }

    async onLoad() {
        this.canvas = this.node;
        this.topBar = this.node.getChildByName("TopBar");
        this.hallMain = this.node.getChildByName("HallMain");
        this.joinRoomPanelNode = this.node.getChildByName("JoinRoomPanel");
        this.createRoomPopupNode = this.node.getChildByName("CreateRoomPopupPanel");
        this.roomSelectPanelNode = this.node.getChildByName("RoomSelectPanel");
      
        this.initBottomBar();
        // 保存单例引用
        HallUIManager._instance = this;
        this.init();
    }

    public async init(){
        let t1 = Date.now();
        this.initTopBar();
        await this.initHallMain();
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

    private async initHallMain(): Promise<void> {
        if (Object.keys(HallRes.instance.centerImgMap).length === 0) {
            await HallRes.instance.loadCenterImg();
            if (this.destroyed || !cc.isValid(this.node)) {
                return;
            }
        }

        if (!HallRes.instance.hallGameCardPrefab) {
            await HallRes.instance.loadHallGameCardPrefab();
            if (this.destroyed || !cc.isValid(this.node)) {
                return;
            }
        }

        if (!this.hallMain || !cc.isValid(this.hallMain) || this.hallMain.childrenCount === 0) {
            const prefab = await HallRes.instance.loadPrefab("prefabs/HallMain");
            if (this.destroyed || !cc.isValid(this.node)) {
                return;
            }
            const oldHallMain = this.hallMain;
            const oldPosition = oldHallMain && cc.isValid(oldHallMain) ? oldHallMain.getPosition() : cc.v2(0, -80);
            const oldIndex = oldHallMain && cc.isValid(oldHallMain) ? oldHallMain.getSiblingIndex() : -1;

            this.hallMain = cc.instantiate(prefab);
            this.hallMain.parent = this.node;
            this.hallMain.setPosition(oldPosition);
            if (oldIndex >= 0) {
                this.hallMain.setSiblingIndex(oldIndex);
            }

            if (oldHallMain && cc.isValid(oldHallMain)) {
                oldHallMain.removeFromParent();
                oldHallMain.destroy();
            }
        }

        let manager = this.hallMain.getComponent(HallMainManager);
        if (!manager) {
            manager = this.hallMain.addComponent(HallMainManager);
        }
        manager.init(game => this.startMatchWithPopup(game));
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

    public async showRecord(parent: cc.Node, _roomId :number | null) {
        const valid = () => !this.destroyed && cc.isValid(this.node) && cc.isValid(parent);
        let recordPopupPrefab = HallRes.instance.hallRecordPopupPrefab;

        if (!recordPopupPrefab) {
            recordPopupPrefab = await HallRes.instance.loadPrefab("prefabs/HallRecordPopup");
            if (!valid()) {
                return;
            }

            HallRes.instance.hallRecordPopupPrefab = recordPopupPrefab;
        }

        if (!HallRes.instance.hallRecordItemPrefab) {
            HallRes.instance.hallRecordItemPrefab = await HallRes.instance.loadPrefab("prefabs/HallRecordItem");
            if (!valid()) {
                return;
            }
        }

        if (Object.keys(HallRes.instance.recordImgMap).length === 0) {
            await HallRes.instance.loadRecordImg();
            if (!valid()) {
                return;
            }
        }

        let popupNode = this.hallRecordPopupNode;
        if (!popupNode) {
            if (!valid()) {
                return;
            }

            popupNode = cc.instantiate(recordPopupPrefab);
            parent.addChild(popupNode);
            this.hallRecordPopupNode = popupNode;
        } else {
            popupNode.active = true;
        }

        this.recordPopupNode = popupNode;
        const recordPopup = popupNode.getComponent("HallRecordPopup") as any;
        if (recordPopup && cc.isValid(popupNode)) {
            recordPopup.loadFirstPage(null);
        }
    }

    public async startMatchWithPopup(game?: HallGameCardData): Promise<void> {
        if (this.isMatching) {
            return;
        }

        this.isMatching = true;
        try {
            await this.showMatchPopup(this.canvas);
        } catch (e) {
            this.isMatching = false;
            cc.error("打开匹配弹窗失败", e);
            ToastManager.show("打开匹配界面失败");
            return;
        }

        if (this.destroyed || !cc.isValid(this.node)) {
            return;
        }

        this.onClickCard(RoomCardType.MATCH, {
            gameId: game ? game.id : 1,
            gameCode: game ? game.gameCode : "",
        });
    }

    public async showMatchPopup(parent: cc.Node): Promise<void> {
        const valid = () => !this.destroyed && cc.isValid(this.node) && cc.isValid(parent);

        if (!HallRes.instance.matchPopupPrefab) {
            HallRes.instance.matchPopupPrefab = await HallRes.instance.loadMatchPopupPrefab();
            if (!valid()) {
                return;
            }
        }

        if (Object.keys(HallRes.instance.matchImgMap).length === 0) {
            await HallRes.instance.loadMatchImg();
            if (!valid()) {
                return;
            }
        }

        let popupNode = this.matchPopupNode;
        if (!popupNode || !cc.isValid(popupNode)) {
            popupNode = cc.instantiate(HallRes.instance.matchPopupPrefab);
            parent.addChild(popupNode);
            this.matchPopupNode = popupNode;
        } else {
            popupNode.active = true;
            popupNode.setSiblingIndex(parent.childrenCount - 1);
        }

        let popup = popupNode.getComponent(MatchPopup);
        if (!popup) {
            popup = popupNode.addComponent(MatchPopup);
        }

        popup.show(() => {
            this.isMatching = false;
            ToastManager.show("已取消匹配");
        });
    }

    public hideMatchPopup(): void {
        if (this.matchPopupNode && cc.isValid(this.matchPopupNode)) {
            const popup = this.matchPopupNode.getComponent(MatchPopup);
            if (popup) {
                popup.hide();
            } else {
                this.matchPopupNode.active = false;
            }
        }
        this.isMatching = false;
    }
    
    public hideRecord(){
        if (this.recordPopupNode) {
            this.recordPopupNode.active = false;
        }
    }

    public async showMail(parent: cc.Node) {
        const valid = () => !this.destroyed && cc.isValid(this.node) && cc.isValid(parent);

        if (!HallRes.instance.mailPopupPrefab) {
            HallRes.instance.mailPopupPrefab = await HallRes.instance.loadMailPopupPrefab();
            if (!valid()) {
                return;
            }
        }

        if (!HallRes.instance.mailItemPrefab) {
            HallRes.instance.mailItemPrefab = await HallRes.instance.loadMailItemPrefab();
            if (!valid()) {
                return;
            }
        }

        if (Object.keys(HallRes.instance.mailImgMap).length === 0) {
            await HallRes.instance.loadMailImg();
            if (!valid()) {
                return;
            }
        }

        let popupNode = this.mailPopupNode;
        if (!popupNode || !cc.isValid(popupNode)) {
            popupNode = cc.instantiate(HallRes.instance.mailPopupPrefab);
            parent.addChild(popupNode);
            this.mailPopupNode = popupNode;
        } else {
            popupNode.active = true;
        }

        let popup = popupNode.getComponent(MailPopup);
        if (!popup) {
            popup = popupNode.addComponent(MailPopup);
        }
        if (popup && cc.isValid(popupNode)) {
            popup.loadFirstPage();
        }
    }

    public hideMail(): void {
        if (this.mailPopupNode && cc.isValid(this.mailPopupNode)) {
            this.mailPopupNode.active = false;
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
