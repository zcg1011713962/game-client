
import AgreementCheck from "./AgreementCheck"
const {ccclass, property} = cc._decorator;
import Http from "../util/Http";
import { User } from "./entity/User";
import { ServerMsg } from "./entity/ServerMsg";
import {SceneUtil} from "../util/SceneUtil";
import UserData from "./entity/UserData";
import ToastManager from "../common/ToastManager";
import Config from "../config/Config";

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


    async onLoad () { 
        this.guestBtnNode = cc.find("Canvas/LoginPanel/Btn_Guest");
        this.agreementNode = cc.find("Canvas/Agreement");
        // 游客登录点击
        this.guestBtnNode.on(cc.Node.EventType.TOUCH_END, this.onStartBtnClick, this);
        await this.loadToastPrefab();
        ToastManager.init(this.toastPrefab);
        console.log("Login加载完毕");
        this.init();
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
            ToastManager.show("请阅读并勾选协议");
            return;
        }
        const guest = UserData.get();
        this.autoLogin(guest);
    }

    public autoLogin(guest :{userId : number, token: string} | null){
        // 游客登录
        Http.post<ServerMsg<User>>(
            `${Config.API_URL}/login/guest`,
            {
                token: guest !== null ? guest.token : "",
            },
            (err, res) => {
                if (err) {
                    ToastManager.show("请检查网络");
                    return;
                }

                if (!res) {
                    return;
                }
                if(res.code === 2001){ 
                    this.autoLogin({userId: -1, token: ""});
                    return;
                }
                // 服务端业务错误
                if (res.code !== 0) {
                    ToastManager.show("服务器异常");
                    cc.error("登录失败:", res.msg);
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
