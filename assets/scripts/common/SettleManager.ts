import SettlePopup from "../common/SettlePopup";

export default class SettleManager {

    private static settlePrefab: cc.Prefab = null;

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

        const node = cc.instantiate(this.settlePrefab);
        canvas.addChild(node);
        node.zIndex = 998;
        const comp = node.getComponent(SettlePopup);
        comp.show(win, gold, afterGold, cardTypeName , detail);
    }
}