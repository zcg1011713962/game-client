import MouseCursorManager from "../common/MouseCursorManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GlobalBoot extends cc.Component {
    private static mouseCursorPrefab: cc.Prefab = null;

    async onLoad() {
        if(!GlobalBoot.mouseCursorPrefab){
             await GlobalBoot.loadCursorPrefab();
        }
        const mouseCursorRootNode = cc.instantiate(GlobalBoot.mouseCursorPrefab);
        const oldNode = this.node.getChildByName("MouseCursorRoot");
        if(!oldNode){
            this.node.addChild(mouseCursorRootNode);
        }

        const mouseCursorManager =  mouseCursorRootNode.getComponent(MouseCursorManager);
        mouseCursorManager.bindCanvas(this.node);
    }

    /** 加载牌预制体 */
    private static loadCursorPrefab(): Promise<cc.Prefab> {
        return new Promise((resolve, reject) => {
            cc.resources.load("prefabs/MouseCursorRoot", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    reject(err);
                    return;
                }

                GlobalBoot.mouseCursorPrefab = prefab;
                console.log("鼠标预制体加载完毕");
                resolve(prefab);
            });
        });
    }
    
}