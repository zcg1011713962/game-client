const {ccclass, property} = cc._decorator;

@ccclass
export default class AgreementCheck extends cc.Component {
    private checkbox: cc.Node = null;

    private onNode: cc.Node = null;

    private offNode: cc.Node = null;

    private checked: boolean = false;

    protected onLoad(): void {
        this.checkbox = this.node.getChildByName("Checkbox");
        this.onNode = this.checkbox.getChildByName("checkbox_on");
        this.offNode = this.checkbox.getChildByName("checkbox_off");
        this.checkbox.on(cc.Node.EventType.TOUCH_END, this.onClickAgreement, this);
    }

    start() {
        this.refresh();
    }

    onClickAgreement() {
        this.checked = !this.checked;
        this.refresh();
    }

    refresh() {
        this.onNode.active = this.checked;
        this.offNode.active = !this.checked;
    }

    isChecked() {
        return this.checked;
    }

}
