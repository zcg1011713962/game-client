import HallUIManager from "../HallUIManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HallBottomBar extends cc.Component {
   private btnShopNode: cc.Node | null = null;


   protected onLoad(): void {
       this.btnShopNode = this.node.getChildByName("BtnShop");

       this.btnShopNode.on(cc.Node.EventType.TOUCH_END, this.shopShow, this);
   }


   private shopShow(){
      HallUIManager.instance.showShop();
   }


}
