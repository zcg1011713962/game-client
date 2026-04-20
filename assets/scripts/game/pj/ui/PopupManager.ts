const { ccclass, property } = cc._decorator;
@ccclass
export default class PopupManager extends cc.Component {

    protected onLoad(): void {
         this.hide();
    }

    show(msg: string) {
        
        this.node.active = true;
        let label = this.node.getChildByName("Label").getComponent(cc.Label);
        label.string = msg;
    }

    hide() {
        this.node.active = false;
    }
}