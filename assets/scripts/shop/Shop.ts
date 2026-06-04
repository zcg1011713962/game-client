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

   onLoad(): void {
        this.mask = this.node.getChildByName("Mask");
        this.panel = this.node.getChildByName("Panel");

        this.closeBtnNode = this.node.getChildByName("Panel").getChildByName("CloseBtn");

        this.closeBtnNode.on(cc.Node.EventType.TOUCH_END, this.shopHide, this);
        this.node.on(cc.Node.EventType.TOUCH_START, this.stopPropagation ,this);

        this.itemList = cc.find("Panel/Content/ItemList", this.node);

        if (!this.itemList) {
            cc.error("找不到 ItemList");
            return;
        }
        this.bindItemEvents();
   }


   private SHOP_CONFIG = [
        { id: 1, name: "1张房卡", price: 1 },
        { id: 2, name: "6张房卡", price: 5 },
        { id: 3, name: "30张房卡", price: 25 },
        { id: 4, name: "60张房卡", price: 45 },
        { id: 5, name: "300张房卡", price: 198 },
        { id: 6, name: "648张房卡", price: 398 }
    ];

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
        console.log("点击商品:", index + 1);
        // 弹购买框
        this.showBuyPopup(index + 1);
    }

    private async showBuyPopup(productId: number) {
        const product = this.SHOP_CONFIG[productId];

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
