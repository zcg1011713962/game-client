export default class UIUtil {

    /**
     * 设置Label文本、颜色、描边
     */
    public static setLabel(
        labelNode: cc.Node,
        text: string | null,
        color: cc.Color = cc.Color.WHITE,
        outlineColor?: cc.Color,
        outlineWidth: number = 0
    ) {

        if (!labelNode) {
            return;
        }

        const label = labelNode.getComponent(cc.Label);

        if (!label) {
            return;
        }
        if(text !== null){
            label.string = text;
        }
        label.node.color = color;

        if (outlineWidth > 0 && outlineColor) {

            let outline =
                labelNode.getComponent(cc.LabelOutline);

            if (!outline) {
                outline =
                    labelNode.addComponent(cc.LabelOutline);
            }

            outline.color = outlineColor;
            outline.width = outlineWidth;
        }
    }

}