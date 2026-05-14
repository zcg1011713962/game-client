import UIZOrder from "./ui/UIZOrder";
import BetCountdown from "../common/countdown/BetCountdown";
import GameRes from "../game/pj/GameRes";
export default class CountDownManager {

    private static clockPrefab: cc.Prefab = null;

    /**
     * 初始化
     */
    public static init(prefab: cc.Prefab) {
        this.clockPrefab = prefab;
    }

  
    public static show(time: number) {
        if (!this.clockPrefab) {
            cc.error("CountDownManager 未初始化");
            return;
        }

        const canvas = cc.find("Canvas/MainLayout/Table/ClockContainer");
        if (!canvas) {
            cc.error("找不到 Canvas");
            return;
        }
        
        const node = cc.instantiate(this.clockPrefab);
        canvas.addChild(node);
        const comp = node.getComponent(BetCountdown);

        comp.startCountdown(time, () => {
            cc.log("投注倒计时结束");
            let audioId = cc.audioEngine.playEffect(GameRes.instance.warnAudio, false);
            // 停止
            cc.audioEngine.stopEffect(audioId);
            comp.close();
        });
    }
}