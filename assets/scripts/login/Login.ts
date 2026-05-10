
import AgreementCheck from "./AgreementCheck"
const {ccclass, property} = cc._decorator;
import Http from "../util/Http";
import { User } from "./entity/User";
import { ServerMsg } from "./entity/ServerMsg";
import {SceneUtil} from "../util/SceneUtil";
import UserData from "./entity/UserData";
import ToastManager from "../common/ToastManager";

export interface LoginData {
    uid: number;
    token: string;
    nickName: string;
}

@ccclass
export default class Login extends cc.Component {
    private agreementNode: cc.Node = null;
    private guestBtnNode : cc.Node = null;
    private toastPrefab: cc.Prefab = null;
    private apiUrl : String = "http://127.0.0.1:18080/api";


    async onLoad () { 
        this.guestBtnNode = cc.find("Canvas/LoginPanel/Btn_Guest");
        this.agreementNode = cc.find("Canvas/Agreement");
        // 游客登录点击
        this.guestBtnNode.on(cc.Node.EventType.MOUSE_DOWN, this.onStartBtnClick, this);
        await this.loadToastPrefab();
        ToastManager.init(this.toastPrefab);
        console.log("Login加载完毕");
    }

    public init(){
        const guest = UserData.get();
        // 有游客缓存
        if (guest) {
            this.autoLogin(guest);
        }
    }

    private onStartBtnClick(){
        const agreementCheck = this.agreementNode.getComponent(AgreementCheck);
        if(!agreementCheck.isChecked()){
            return;
        }
        const guest = UserData.get();
        this.autoLogin(guest);
    }

    public autoLogin(guest :{userId : number, token: string} | null){
        console.log("游客登录");
        // 游客登录
        Http.post<ServerMsg<User>>(
            `${this.apiUrl}/login/guest`,
            {
                token: guest !== null ? guest.token : "",
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
                if(user){
                    console.log("登录成功", user);
                    UserData.save(user);
                    // 切换到大厅场景
                    SceneUtil.loadScene("hall", user);
                }
            }
        );
    }


    
    private loadToastPrefab(): Promise<cc.Prefab> {
        return new Promise((resolve, reject) => {
            cc.resources.load("prefabs/ToastPrefab", cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    reject(err);
                    return;
                }

                this.toastPrefab = prefab;
                console.log("公共弹窗预制体加载完毕");
                resolve(prefab);
            });
        });
    }
}
