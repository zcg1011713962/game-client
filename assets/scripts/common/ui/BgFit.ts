const { ccclass } = cc._decorator;

@ccclass
export default class BgFit extends cc.Component {

    onLoad() {

        const visible = cc.view.getVisibleSize();

        const scaleX = visible.width / this.node.width;
        const scaleY = visible.height / this.node.height;

        this.node.scale = Math.min(scaleX, scaleY);
    }
}