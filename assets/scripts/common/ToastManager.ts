import LoginRes from "../login/LoginRes";
import ToastView from "./ToastView";
import UIZOrder from "./ui/UIZOrder";

export default class ToastManager {

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

    
}