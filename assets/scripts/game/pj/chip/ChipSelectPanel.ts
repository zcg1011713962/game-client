import BetArea from "../chip/BetArea";

const { ccclass, property } = cc._decorator;



@ccclass
export default class ChipSelectPanel extends cc.Component {

    private chipBtns: cc.Node[] = [];
    private betAreaNode : cc.Node = null;

    onLoad() {
        this.betAreaNode = cc.find(`Canvas/MainLayout/Table/BetContainer/BetArea0`);
        this.chipBtns = this.node.children.filter(n =>
            n.name.startsWith("Chip_")
        );
        // console.log("chipBtns", this.chipBtns);
        this.chipBtns.forEach(node => {
            node.on(cc.Node.EventType.TOUCH_END, () => {

                const value = this.getChipValue(node);

                console.log("点击筹码:", value);

                this.onSelectChip(value);

            }, this);

        });
    }


    private getChipValue(node: cc.Node): number {
        const arr = node.name.split("_");

        if (arr.length < 2) return 0;

        return Number(arr[1]);
    }


    private onSelectChip(value: number) {
        if(this.betAreaNode){
            const betArea = this.betAreaNode.getComponent(BetArea);
            const localStartPos = cc.v2(0, -600);
            const localEndPos = cc.v2(0, 200);
            betArea.addChip(value, localStartPos, localEndPos);
            this.node.active = false;
        }
        cc.log("当前选择筹码:", value);
    }
}