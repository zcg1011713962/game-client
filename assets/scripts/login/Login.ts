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
    private guestBtnNode: cc.Node = null;

    // 防止重复登录
    private isLoginning: boolean = false;

    // 防止回调回来时节点已经销毁
    private destroyed: boolean = false;

    async onLoad() {
        this.guestBtnNode = cc.find("Canvas/LoginPanel/Btn_Guest");
        this.agreementNode = cc.find("Canvas/Agreement");
        this.guestBtnNode.on(cc.Node.EventType.TOUCH_END, this.onStartBtnClick, this);
        this.init();
    }

    public async init() {
        const guest = UserData.get();
        // 有游客缓存，自动登录
        if (guest) {
            this.autoLogin(guest);
        }
    }

    private onStartBtnClick() {
        if (this.isLoginning) {
            return;
        }

        const agreementCheck = this.agreementNode.getComponent(AgreementCheck);
        if (!agreementCheck || !agreementCheck.isChecked()) {
            ToastManager.show("请阅读并勾选协议");
            return;
        }

        const guest = UserData.get();
        this.autoLogin(guest);
    }

   public autoLogin(
    guest: { userId: number, token: string } | null,
    retryWithoutToken: boolean = true
) {
    if (this.isLoginning) {
        return;
    }

    this.isLoginning = true;
    this.setGuestBtnEnable(false);

    const t = Date.now();

    Http.post<ServerMsg<User>>(
        `${Config.API_URL}/login/guest`,
        {
            token: guest && guest.token ? guest.token : null,
        },
        (err, res) => {
            if (this.destroyed || !cc.isValid(this.node)) {
                return;
            }

            /**
             * HTTP 401：token 失效
             */
            if (err) {
                console.error("登录HTTP错误:", err);
                this.isLoginning = false;
                this.setGuestBtnEnable(true);
                ToastManager.show("请检查网络");
                return;
            }

            if (!res) {
                this.isLoginning = false;
                this.setGuestBtnEnable(true);
                ToastManager.show("系统更新中");
                return;
            }

            /**
             * 业务 token 失效
             */
            if (res.code === 2001 || res.code === 401) {
                console.error("登录HTTP失败:", res);
                this.isLoginning = false;
                UserData.clearUserData();

                if (retryWithoutToken) {
                    ToastManager.show("原登录失效，注册中");
                    this.autoLogin(null, false);
                } else {
                    this.setGuestBtnEnable(true);
                    ToastManager.show("登录失效，请重新登录");
                }

                return;
            }

            if (res.code !== 0) {
                cc.error("登录失败:", res.msg);
                this.isLoginning = false;
                this.setGuestBtnEnable(true);
                ToastManager.show("服务器错误");
                return;
            }

            const user = res.data;

            if (user) {
                console.log("登录成功耗时:", Date.now() - t, "ms", user);
                UserData.save(user);
                SceneUtil.loadScene("hall", user);
                return;
            }

            this.isLoginning = false;
            this.setGuestBtnEnable(true);
        }
    );
    }

    private setGuestBtnEnable(enable: boolean): void {
        if (!this.guestBtnNode) return;

        this.guestBtnNode.active = enable;
    }

      onDestroy() {
        this.destroyed = true;

        if (this.guestBtnNode) {
            this.guestBtnNode.off(cc.Node.EventType.TOUCH_END, this.onStartBtnClick, this);
        }
    }
}