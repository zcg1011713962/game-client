import UIZOrder from "./ui/UIZOrder";
import BetCountdown from "../common/countdown/BetCountdown";
import GameRes from "../game/pj/GameRes";
export default class CountDownManager {

    private static clockPrefab: cc.Prefab = null;
    private static clockNode: cc.Node | null = null;

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
        
        CountDownManager.clockNode = cc.instantiate(this.clockPrefab);
        canvas.addChild(CountDownManager.clockNode);
        const comp = CountDownManager.clockNode.getComponent(BetCountdown);

        comp.startCountdown(time, () => {
            cc.log("投注倒计时结束");
            this.close();
        });
    }

    public static close(){
        if(!CountDownManager.clockNode || !cc.isValid(CountDownManager.clockNode)){
            return;
        }
        const comp = CountDownManager.clockNode.getComponent(BetCountdown);
        comp.close();
        CountDownManager.clockNode = null;
    }
}