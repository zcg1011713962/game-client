
import AgreementCheck from "./AgreementCheck"
const {ccclass, property} = cc._decorator;
import Http from "../util/Http";
import { User } from "./entity/User";
import { ServerMsg } from "./entity/ServerMsg";
import {SceneUtil} from "../util/SceneUtil";

export interface LoginData {
    uid: number;
    token: string;
    nickName: string;
}

@ccclass
export default class Login extends cc.Component {
    private agreementNode: cc.Node = null;
    private guestBtnNode : cc.Node = null;
    private apiUrl : String = "http://127.0.0.1:18080/api";


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
        // 游客登录
        Http.post<ServerMsg<User>>(
            `${this.apiUrl}/login/guest`,
            {
                deviceId: "abc123",
            },
            (err, res) => {
                if (err) {
                    console.error("请求失败:", err);
                    return;
                }

                if (!res) {
                    return;
                }

                // 服务端业务错误
                if (res.code !== 0) {
                    console.error("登录失败:", res.msg);
                    return;
                }

                // 用户数据
                const user = res.data;
                console.log("登录成功", user);
                // 切换到大厅场景
                SceneUtil.loadScene("hall", null);
            }
        );
         
    }
}
