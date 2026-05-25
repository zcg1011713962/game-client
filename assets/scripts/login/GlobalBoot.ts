import MouseCursorManager from "../common/MouseCursorManager";
import LoginRes from "./LoginRes";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GlobalBoot extends cc.Component {
    async onLoad() {
        const mouseCursorPrefab = await LoginRes.instance.loadCursorPrefab();
        const mouseCursorRootNode : cc.Node = cc.instantiate(mouseCursorPrefab);
        const oldNode = this.node.getChildByName("MouseCursorRoot");
        if(!oldNode){
            this.node.addChild(mouseCursorRootNode);
        }

        const mouseCursorManager =  mouseCursorRootNode.getComponent(MouseCursorManager);
        mouseCursorManager.bindCanvas(this.node);
    }
    
    
}