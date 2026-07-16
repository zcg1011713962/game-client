import HallUIManager from "../HallUIManager";
import ToastManager from "../../common/ToastManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HallBottomBar extends cc.Component {
   private btnShopNode: cc.Node | null = null;
   private btnRecordNode: cc.Node | null = null;
   private btnActivityNode: cc.Node | null = null;
   private btnRankNode: cc.Node | null = null;

   protected onLoad(): void {
      this.bindButtons();
   }

   private bindButtons(): void {
      this.btnActivityNode = this.node.getChildByName("BtnActivity");
      this.btnRankNode = this.node.getChildByName("BtnRank");
      this.btnShopNode = this.node.getChildByName("BtnShop");
      this.btnRecordNode = this.node.getChildByName("BtnRecord");

      this.bindButton(this.btnActivityNode, this.onActivityClick);
      this.bindButton(this.btnRankNode, this.onRankClick);
      this.bindButton(this.btnRecordNode, this.onRecordClick);
      this.bindButton(this.btnShopNode, this.shopShow);
   }

   private bindButton(node: cc.Node | null, handler: () => void): void {
      if (!node) {
         return;
      }

      node.off(cc.Node.EventType.TOUCH_END, handler, this);
      node.on(cc.Node.EventType.TOUCH_END, handler, this);
   }

   private onActivityClick() {
      ToastManager.show("活动暂未开放");
   }

   private onRankClick() {
      ToastManager.show("排行榜暂未开放");
   }

   private shopShow() {
      HallUIManager.instance.showShop();
   }

   private onRecordClick() {
      HallUIManager.instance.showRecord(cc.find("Canvas"), null);
   }

   protected onDestroy(): void {
      this.btnActivityNode && this.btnActivityNode.off(cc.Node.EventType.TOUCH_END, this.onActivityClick, this);
      this.btnRankNode && this.btnRankNode.off(cc.Node.EventType.TOUCH_END, this.onRankClick, this);
      this.btnRecordNode && this.btnRecordNode.off(cc.Node.EventType.TOUCH_END, this.onRecordClick, this);
      this.btnShopNode && this.btnShopNode.off(cc.Node.EventType.TOUCH_END, this.shopShow, this);
   }


}
