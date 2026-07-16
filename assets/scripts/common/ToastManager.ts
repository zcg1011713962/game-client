import LoginRes from "../login/LoginRes";
import ToastView from "./ToastView";
import UIZOrder from "./ui/UIZOrder";

export default class ToastManager {

    private static persistentToastNode: cc.Node = null;

    public static async show(msg: string, success: boolean = false) {
        const toastPrefab = await LoginRes.instance.loadToastPrefab();

        const scene = cc.director.getScene();
        const canvas = cc.find("Canvas", scene);

        if (!canvas) {
            cc.error("找不到 Canvas");
            return;
        }

        const node = cc.instantiate(toastPrefab);
        canvas.addChild(node);
        node.zIndex = UIZOrder.TOAST;
        node.setPosition(0, 0);

        node.getComponent(ToastView).show(msg, success);
    }

    public static async showPersistent(msg: string, success: boolean = false) {
        const toastPrefab = await LoginRes.instance.loadToastPrefab();

        const scene = cc.director.getScene();
        const canvas = cc.find("Canvas", scene);

        if (!canvas) {
            cc.error("找不到 Canvas");
            return;
        }

        if (this.persistentToastNode && cc.isValid(this.persistentToastNode)) {
            this.persistentToastNode.getComponent(ToastView).showPersistent(msg, success);
            return;
        }

        const node = cc.instantiate(toastPrefab);
        this.persistentToastNode = node;
        canvas.addChild(node);
        node.zIndex = UIZOrder.TOAST;
        node.setPosition(0, 0);

        node.once("destroy", () => {
            if (this.persistentToastNode === node) {
                this.persistentToastNode = null;
            }
        });

        node.getComponent(ToastView).showPersistent(msg, success);
    }

    
}
