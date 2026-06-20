import UIManager from "../../game/pj/ui/UIManager";
import HallUIManager from "../HallUIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HallBottomBar extends cc.Component {
   private btnShopNode: cc.Node | null = null;
   private btnRecordNode: cc.Node | null = null;

   protected onLoad(): void {
      this.btnShopNode = this.node.getChildByName("BtnShop");
      this.btnRecordNode = this.node.getChildByName("BtnRecord");

      this.btnShopNode.on(cc.Node.EventType.TOUCH_END, this.shopShow, this);
      this.btnRecordNode.on(cc.Node.EventType.TOUCH_END, this.onRecordClick, this);
   }


   private shopShow() {
      HallUIManager.instance.showShop();
   }

   private onRecordClick() {
      HallUIManager.instance.showRecord(cc.find("Canvas"));
   }


}
