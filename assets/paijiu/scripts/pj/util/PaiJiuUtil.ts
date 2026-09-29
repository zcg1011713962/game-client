

const {ccclass, property} = cc._decorator;

@ccclass
export default class PaiJiuUtil extends cc.Component {

   public static wait(comp: cc.Component, time: number): Promise<void> {
    return new Promise(resolve => {
        comp.scheduleOnce(() => resolve(), time);
    });
    }
}
