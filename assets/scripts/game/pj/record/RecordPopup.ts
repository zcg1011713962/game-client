import GameRes from "../GameRes";
import RecordItem, {RecordItemDTO} from "./RecordItem";


const { ccclass, property } = cc._decorator;
@ccclass
export default class RecordPopup extends cc.Component {

    private content: cc.Node = null;

    protected onLoad(): void {
        this.content = cc.find("ListView/View/Content", this.node);
    }

    public refresh(list: RecordItemDTO[]) {
        this.content.removeAllChildren();

        list.forEach((data, index) => {
            const itemNode = cc.instantiate(GameRes.instance.recordItemPrefab);
            this.content.addChild(itemNode);
            const item = itemNode.getComponent(RecordItem);

            item.updateView(data);
        });
    }
}