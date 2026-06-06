import UIColorUtil from "../util/UIColorUtil";
import UIUtil from "../util/UIUtil";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ToastView extends cc.Component {

    private msgLabelNode!: cc.Node;
    private duration: number = 1.5

    protected onLoad(): void {
        this.msgLabelNode = this.node.getChildByName("msgLabel");
    }

    public show(msg: string, success: boolean = false) {
        if(this.msgLabelNode){
            if(success){
                UIUtil.setLabel(this.msgLabelNode, msg, UIColorUtil.TOAST_SUCCESS, UIColorUtil.TOAST_OUTLINE, 2);
            }else{
                UIUtil.setLabel(this.msgLabelNode, msg, UIColorUtil.TOAST_ERROR, UIColorUtil.TOAST_OUTLINE, 2);
            }
              
            this.node.opacity = 0;
            this.node.scale = 0.8;

            cc.tween(this.node)
            .to(0.15, { opacity: 255, scale: 1 })
            .delay(this.duration)
            .to(0.2, { opacity: 0, scale: 0.9 })
            .call(() => {
                this.node.destroy();
            })
            .start();
        }
       

       
    }
}