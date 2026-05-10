import ToastView from "./ToastView";

export default class ToastManager {

    private static toastPrefab: cc.Prefab = null;

    public static init(prefab: cc.Prefab) {
        this.toastPrefab = prefab;
    }

    public static show(msg: string) {
        if (!this.toastPrefab) {
            cc.error("ToastManager 未初始化");
            return;
        }

        const scene = cc.director.getScene();
        const canvas = cc.find("Canvas", scene);

        if (!canvas) {
            cc.error("找不到 Canvas");
            return;
        }

        const node = cc.instantiate(this.toastPrefab);
        canvas.addChild(node);

        node.zIndex = 999;
        node.setPosition(0, 0);

        node.getComponent(ToastView).show(msg);
    }

    
}