import HallUIManager from "./HallUIManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Shop extends cc.Component {
   private closeBtnNode!: cc.Node;
   private mask!: cc.Node;
   private panel!: cc.Node;


   onLoad(): void {
        this.mask = this.node.getChildByName("Mask");
        this.panel = this.node.getChildByName("Panel");

        this.closeBtnNode = this.node.getChildByName("Panel").getChildByName("CloseBtn");

        this.closeBtnNode.on(cc.Node.EventType.TOUCH_END, this.shopHide, this);
        this.node.on(cc.Node.EventType.TOUCH_START, this.stopPropagation ,this);
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
