import SettlePopup from "../common/SettlePopup";
import UIZOrder from "./ui/UIZOrder";

export default class SettleManager {

    private static settlePrefab: cc.Prefab = null;
    private static settlePrefabNode: cc.Node = null;

    /**
     * 初始化
     */
    public static init(prefab: cc.Prefab) {
        this.settlePrefab = prefab;
    }

    /**
     * 显示结算
     */
    public static show(
        win: number,
        gold: number,
        afterGold: number,
        cardTypeName : string,
        detail: string = ""
    ) {
        if (!this.settlePrefab) {
            cc.error("SettleManager 未初始化");
            return;
        }

        const canvas = cc.find("Canvas");
        if (!canvas) {
            cc.error("找不到 Canvas");
            return;
        }

        this.settlePrefabNode= cc.instantiate(this.settlePrefab);
        canvas.addChild(this.settlePrefabNode);
        this.settlePrefabNode.zIndex = UIZOrder.POPUP;
        const comp = this.settlePrefabNode.getComponent(SettlePopup);
        comp.show(win, gold, afterGold, cardTypeName , detail);
    }

    public static close(){
        if(this.settlePrefabNode && cc.isValid(this.settlePrefabNode)){
            const comp = this.settlePrefabNode.getComponent(SettlePopup);
            comp.close();
        }
    }
}