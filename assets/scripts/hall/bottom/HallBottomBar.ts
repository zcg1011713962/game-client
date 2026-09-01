import HallUIManager from "../HallUIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HallBottomBar extends cc.Component {
   private shopNode: cc.Node | null = null;
   private recordNode: cc.Node | null = null;
   private centerNode: cc.Node | null = null;

   protected onLoad(): void {
      this.bindButtons();
   }

   private bindButtons(): void {
      this.shopNode = this.node.getChildByName("Shop");
      this.recordNode = this.node.getChildByName("Record");
      this.centerNode = this.node.getChildByName("Center");

      this.bindButton(this.centerNode, this.onCenterClick);
      this.bindButton(this.recordNode, this.onRecordClick);
      this.bindButton(this.shopNode, this.shopShow);
   }

   private bindButton(node: cc.Node | null, handler: () => void): void {
      if (!node) {
         return;
      }
      node.off(cc.Node.EventType.TOUCH_END, handler, this);
      node.on(cc.Node.EventType.TOUCH_END, handler, this);
   }

   private shopShow() {
      HallUIManager.instance.showShop();
   }

   private onRecordClick() {
      HallUIManager.instance.showRecord(cc.find("Canvas"), null);
   }

   private onCenterClick() {
      HallUIManager.instance.startMatchWithPopup();
   }

   protected onDestroy(): void {
      this.centerNode && this.centerNode.off(cc.Node.EventType.TOUCH_END, this.onCenterClick, this);
      this.recordNode && this.recordNode.off(cc.Node.EventType.TOUCH_END, this.onRecordClick, this);
      this.shopNode && this.shopNode.off(cc.Node.EventType.TOUCH_END, this.shopShow, this);
   }


}
