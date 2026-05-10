const { ccclass, property } = cc._decorator;

@ccclass
export default class ToastView extends cc.Component {

    private msgLabelNode: cc.Node = null;

    protected onLoad(): void {
        this.msgLabelNode = this.node.getChildByName("msgLabel");
    }

    public show(msg: string, duration: number = 1.5) {
        if(this.msgLabelNode){
            const label = this.msgLabelNode.getComponent(cc.Label);
            if(label){
                let outline =  this.msgLabelNode.getComponent(cc.LabelOutline);
                if (!outline) {
                    outline = this.msgLabelNode.addComponent(cc.LabelOutline);
                    // 黑色描边
                    outline.color = cc.Color.BLACK;
                    // 宽度
                    outline.width = 2;
                }
                label.string = msg;
                label.node.color = cc.Color.WHITE; 
            }
      
            }
            this.node.opacity = 0;
            this.node.scale = 0.8;

            cc.tween(this.node)
            .to(0.15, { opacity: 255, scale: 1 })
            .delay(duration)
            .to(0.2, { opacity: 0, scale: 0.9 })
            .call(() => {
                this.node.destroy();
            })
            .start();
        }
       

       
    }
}