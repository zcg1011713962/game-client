const { ccclass, property } = cc._decorator;

import ChipItem from "./Chip";
import GameRes from "../GameRes";

@ccclass
export default class BetArea extends cc.Component {

    public addChip(value: number, seatId: number, worldStartPos: cc.Vec2) {
        const targetPosNode = this.node.getChildByName(`BetArea${seatId}`);
        if (!targetPosNode) {
            cc.warn(`找不到下注区域 BetArea${seatId}`);
            return;
        }

        const chipPrefab = GameRes.instance.chipPrefab;
        const chipImgMap = GameRes.instance.chipImgMap;

        if (!chipPrefab) {
            cc.error("缺少 chipPrefab");
            return;
        }

        const chipNode = cc.instantiate(chipPrefab);
        if (!chipNode) {
            cc.warn("chipNode 创建失败");
            return;
        }

        // 筹码挂到下注区域节点下
        targetPosNode.addChild(chipNode);

        const startLocalPos = targetPosNode.convertToNodeSpaceAR(worldStartPos);
        chipNode.setPosition(startLocalPos);

        const chipItem = chipNode.getComponent(ChipItem);
        if (!chipItem) {
            cc.error("chipNode 缺少 ChipItem 组件");
            chipNode.destroy();
            return;
        }

        chipItem.init(value, chipImgMap);
        // targetPosNode中心点，chipNode挂在了这个节点
        const endLocalPos = cc.v2(0, 0);

        chipItem.playFlyAnim(startLocalPos, endLocalPos);
    }


    public clearChips(seats : { x : number, y : number, id:  number }[]) {
        seats.forEach(seat => {
            const targetPosNode = this.node.getChildByName(`BetArea${seat.id}`);
            targetPosNode.removeAllChildren();
        });
    }
}