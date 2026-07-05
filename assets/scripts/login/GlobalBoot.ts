const { ccclass, property } = cc._decorator;

@ccclass
export default class GlobalBoot extends cc.Component {
    onLoad() {
        const oldNode = this.node.getChildByName("MouseCursorRoot");
        if (oldNode) {
            oldNode.destroy();
        }

        if (cc.sys.isBrowser && cc.game.canvas) {
            cc.game.canvas.style.cursor = "auto";
        }
    }
    
    
}
