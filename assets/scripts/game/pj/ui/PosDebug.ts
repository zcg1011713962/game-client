const { ccclass, property } = cc._decorator;

@ccclass
export default class PosDebug extends cc.Component {

    private label: cc.Label | null = null;

    onLoad() {
        // if (!this.label) {
        //     const labelNode = new cc.Node("PosLabel");
        //     labelNode.parent = this.node;
        //     labelNode.y = 70;

        //     this.label = labelNode.addComponent(cc.Label);
        //     this.label.fontSize = 20;
        //     this.label.lineHeight = 22;
        //     this.label.node.color = cc.Color.YELLOW;
        // }

        // this.updatePosText();
    }

    update(dt: number) {
        this.updatePosText();
    }

    updatePosText() {
        if(this.label){
            this.label.string = `x:${Math.round(this.node.x)}\ny:${Math.round(this.node.y)}`;
        }
    }
}