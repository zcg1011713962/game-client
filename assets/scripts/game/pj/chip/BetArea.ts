const { ccclass, property } = cc._decorator;

import ChipItem from "./Chip";
import GameRes from "../GameRes";

@ccclass
export default class BetArea extends cc.Component {

    private chipsRoot: cc.Node = null;


    public addChip(value: number, localStartPos?: cc.Vec2, localEndPos?: cc.Vec2) {
        const chipPrefab = GameRes.instance.chipPrefab;
        const chipImgMap = GameRes.instance.chipImgMap;
        this.chipsRoot = this.node.getChildByName("ChipsRoot");

        if (!chipPrefab || !this.chipsRoot) {
            cc.warn("BetArea 缺少 chipPrefab 或 chipsRoot");
            return;
        }
        console.log(" this.chipsRoot ", this.chipsRoot )

        const chipNode = cc.instantiate(chipPrefab);
        if(!chipNode){
             cc.warn("chipNode 缺少");
             return;
        }
        this.chipsRoot.addChild(chipNode);

        const chipItem = chipNode.getComponent(ChipItem);
        chipItem.init(value, chipImgMap);

        if (localStartPos && localEndPos) {
            console.log("筹码动画", localStartPos, localEndPos);
            chipItem.playFlyAnim(localStartPos, localEndPos);
        } 

        if(!localStartPos && localEndPos){
            chipNode.setPosition(localEndPos);
            chipItem.playShowAnim();
        }
    }



    public clearChips() {
        this.chipsRoot.removeAllChildren();
    }
}