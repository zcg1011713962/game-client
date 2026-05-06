
import AgreementCheck from "./AgreementCheck"
const {ccclass, property} = cc._decorator;

@ccclass
export default class Login extends cc.Component {
    private agreementNode: cc.Node = null;
    private guestBtnNode : cc.Node = null;


    onLoad () {
        this.guestBtnNode = cc.find("Canvas/LoginPanel/Btn_Guest");
        this.agreementNode = cc.find("Canvas/Agreement");
        // 游客登录点击
        this.guestBtnNode.on(cc.Node.EventType.MOUSE_DOWN, this.onStartBtnClick, this);
    }

    start () {

    }

    private onStartBtnClick(){
        const agreementCheck = this.agreementNode.getComponent(AgreementCheck);
        if(!agreementCheck.isChecked()){
            return;
        }

        console.log("游客登录");

         
    }
}
