import ToastManager from "../common/ToastManager";
import UserData from "../login/entity/UserData";
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
   
        this.setLabel(coinValNode, String(user.gold), new cc.Color(255, 215, 0), new cc.Color(80, 40, 0), 1);
        this.setLabel(roomCardValNode, String(user.roomCard), new cc.Color(255, 215, 0), new cc.Color(80, 40, 0), 1);
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

    /**
     * 通用设置 Label 文本和描边
     */
    private setLabel(
        labelNode: cc.Node,
        text: string,
        color: cc.Color,
        outlineColor: cc.Color,
        outlineWidth: number
    ) {
        if (!labelNode) return;

        const label = labelNode.getComponent(cc.Label);
        if (!label) return;

        let outline = labelNode.getComponent(cc.LabelOutline);
        if (!outline) {
            outline = labelNode.addComponent(cc.LabelOutline);
        }

        outline.color = outlineColor;
        outline.width = outlineWidth;

        label.string = text;
        label.node.color = color;
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
