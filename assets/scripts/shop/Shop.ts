import ToastManager from "../common/ToastManager";
import UserData from "../login/entity/UserData";
import UIColorUtil from "../util/UIColorUtil";
import UIUtil from "../util/UIUtil";
import BuyConfirmPopup from "./BuyConfirmPopup";
import ShopRes from "./ShopRes";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Shop extends cc.Component {
   private closeBtnNode!: cc.Node;
   private buyConfirmNode!: cc.Node;
   private mask!: cc.Node;
   private panel!: cc.Node;
   private itemList!: cc.Node;
   private coinBoxNode!: cc.Node;
   private roomCardBoxNode!: cc.Node;

   onLoad(): void {
        this.mask = this.node.getChildByName("Mask");
        this.panel = this.node.getChildByName("Panel");

        this.closeBtnNode = this.panel.getChildByName("CloseBtn");
        this.coinBoxNode = this.panel.getChildByName("TopBar").getChildByName("CoinBox");
        this.roomCardBoxNode = this.panel.getChildByName("TopBar").getChildByName("RoomCardBox");

        this.closeBtnNode.on(cc.Node.EventType.TOUCH_END, this.shopHide, this);
        this.node.on(cc.Node.EventType.TOUCH_START, this.stopPropagation ,this);

        this.itemList = cc.find("Panel/Content/ItemList", this.node);

        if (!this.itemList) {
            cc.error("找不到 ItemList");
            return;
        }
        this.bindItemEvents();
        this.initTitleStyle();
   }


    /**
        * 刷新顶部栏显示
        */
    public refresh() {
        const user = UserData.get();
        console.log("刷新商城顶部栏显示", user);
        if (!user) return;

        const coinValNode = this.coinBoxNode?.getChildByName("CoinVal");
        const roomCardValNode = this.roomCardBoxNode?.getChildByName("RoomCardVal");
        
   
        UIUtil.setLabel(coinValNode, String(user.gold), UIColorUtil.GOLD, UIColorUtil.TITLE, 1);
        UIUtil.setLabel(roomCardValNode, String(user.roomCard), UIColorUtil.GOLD, UIColorUtil.TITLE, 1);
    }


   private SHOP_CONFIG = [
        { id: 1, name: "1张房卡", price: 1 },
        { id: 2, name: "6张房卡", price: 5 },
        { id: 3, name: "30张房卡", price: 25 },
        { id: 4, name: "60张房卡", price: 45 },
        { id: 5, name: "300张房卡", price: 198 },
        { id: 6, name: "648张房卡", price: 398 }
    ];


    private initTitleStyle() {

        const items = cc.find(
            "Panel/Content/ItemList",
            this.node
        );

        if (!items) return;

        const labels = items.getComponentsInChildren(cc.Label);
        labels.forEach(label => {
            if (label.node.name === "label1") {
                 UIUtil.setLabel(label.node, null, UIColorUtil.SHOP_TEXT, UIColorUtil.SHOP_TEXT_OUTLINE, 2);
            }else if (label.node.name === "label3") {
                 UIUtil.setLabel(label.node, null, UIColorUtil.SHOP_TEXT, UIColorUtil.SHOP_TEXT_OUTLINE, 2);
            }
        })
    }


   private bindItemEvents() {
        this.itemList.children.forEach((item, index) => {

            item.on(
                cc.Node.EventType.TOUCH_END,
                () => {
                    this.onClickItem(index, item);
                },
                this
            );

        });
    }

  

    private onClickItem(index: number, item: cc.Node) {
        const id = index +1;
        console.log("点击商品:", id);
        // 弹购买框
        this.showBuyPopup(id);
    }

    private async showBuyPopup(productId: number) {
        const product = this.SHOP_CONFIG.find(i => i.id === productId);
        if(!product){
            ToastManager.show("点击商品不存在");
            return;
        }

        if (!ShopRes.instance.buyConfirmPrefab) {
            await ShopRes.instance.loadBuyConfirmPrefab();
        }
        if(!ShopRes.instance.buyConfirmPrefab){
            console.error("buyConfirmPrefab not found");
            return;
        }

        if (!this.buyConfirmNode) {
            this.buyConfirmNode = cc.instantiate(
                ShopRes.instance.buyConfirmPrefab
            );
            this.node.addChild(this.buyConfirmNode);
        }
        const popup = this.buyConfirmNode.getComponent("BuyConfirmPopup");
        popup.show(
            product.id,
            product.name,
            product.price
        );
    }


   private shopHide(){
      this.hideAnim();
   }

   private stopPropagation(event: cc.Event.EventTouch){
     event.stopPropagation();
   }

   onEnable () {
        this.showAnim();
   }


   public showAnim () {
        this.node.active = true;

        this.mask.opacity = 0;
        this.panel.scale = 0.75;
        this.panel.opacity = 0;

        cc.tween(this.mask)
            .to(0.18, { opacity: 160 })
            .start();

        cc.tween(this.panel)
            .to(0.22, { scale: 1, opacity: 255 }, { easing: "backOut" })
            .start();
    }

    public hideAnim () {
        cc.tween(this.mask)
            .to(0.15, { opacity: 0 })
            .start();

        cc.tween(this.panel)
            .to(0.15, { scale: 0.75, opacity: 0 })
            .call(() => {
                this.node.active = false;
            })
            .start();
    }



   onDestroy () {
        this.node.off(cc.Node.EventType.TOUCH_START, this.stopPropagation, this);
        this.closeBtnNode.off(cc.Node.EventType.TOUCH_END, this.shopHide, this);
    }

}
