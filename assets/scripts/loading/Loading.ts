const { ccclass } = cc._decorator;

import LoginRes from "../login/LoginRes";
import HallRes from "../hall/HallRes";
import { SceneUtil } from "../util/SceneUtil";
import UserData from "../login/entity/UserData";
import GameRes from "../game/pj/GameRes";

@ccclass
export default class Loading extends cc.Component {

    private progressBar: cc.ProgressBar = null;
    private percentLabel: cc.Label = null;
    private tipLabel: cc.Label = null;

    private currentProgress: number = 0;
    private targetProgress: number = 0;

    private isLoadingDone: boolean = false;
    private isJumpingScene: boolean = false;

    async onLoad() {

        this.initNodeRefs();

        this.setTargetProgress(0, "准备加载...");

        await this.startLoad();
    }

    update(dt: number): void {
        if (!this.progressBar) return;

        this.currentProgress += (this.targetProgress - this.currentProgress) * dt * 6;

        if (this.isLoadingDone && Math.abs(this.targetProgress - this.currentProgress) < 0.005) {
            this.currentProgress = this.targetProgress;
        }

        this.progressBar.progress = this.currentProgress;

        if (this.percentLabel) {
            this.percentLabel.string = Math.floor(this.currentProgress * 100) + "%";
        }
    }

    private initNodeRefs(): void {
        const loadingRootNode = this.node.getChildByName("LoadingRoot");

        if (!loadingRootNode) {
            cc.error("找不到 LoadingRoot");
            return;
        }

        const progressBgNode = loadingRootNode.getChildByName("ProgressBg");

        if (!progressBgNode) {
            cc.error("找不到 ProgressBg");
            return;
        }

        const progressBarNode = progressBgNode.getChildByName("ProgressBar");

        if (!progressBarNode) {
            cc.error("找不到 ProgressBar");
            return;
        }

        const percentNode = loadingRootNode.getChildByName("Label_Percent");

        if (!percentNode) {
            cc.error("找不到 Label_Percent");
            return;
        }

        const tipNode = loadingRootNode.getChildByName("Label_Tip");

        if (!tipNode) {
            cc.error("找不到 Label_Tip");
            return;
        }

        this.progressBar = progressBarNode.getComponent(cc.ProgressBar);
        this.percentLabel = percentNode.getComponent(cc.Label);
        this.tipLabel = tipNode.getComponent(cc.Label);

        if (!this.progressBar) {
            cc.error("ProgressBar 节点缺少 cc.ProgressBar 组件");
        }

        if (!this.percentLabel) {
            cc.error("Label_Percent 节点缺少 cc.Label 组件");
        }

        if (!this.tipLabel) {
            cc.error("Label_Tip 节点缺少 cc.Label 组件");
        }
    }

    private async startLoad(): Promise<void> {
        const startTime = Date.now();

        try {
            this.setTargetProgress(0.05, "初始化资源...");

            await LoginRes.instance.preload();
            this.setTargetProgress(0.2, "登录资源加载完成...");

            const user = UserData.get();

            await HallRes.instance.preload();
            this.setTargetProgress(0.4, "大厅资源加载完成...");

            if (user) {
                await this.preloadScene("hall");
                this.setTargetProgress(0.6, "大厅场景准备完成...");
            } else {
                await this.preloadScene("login");
                this.setTargetProgress(0.8, "登录场景准备完成...");
            }
            await GameRes.instance.preload();
            this.setTargetProgress(0.9, "游戏场景准备完成...");

            await this.waitMinTime(startTime, 800);

            this.isLoadingDone = true;
            this.setTargetProgress(1, "加载完成");

            await this.waitProgressComplete();
            await this.jumpScene("login");
        } catch (e) {
            cc.error("Loading 加载失败:", e);
            this.setTip("加载失败，请检查网络后重试");
        }
    }

    private setTargetProgress(value: number, tip?: string): void {
        this.targetProgress = Math.max(0, Math.min(1, value));

        if (tip) {
            this.setTip(tip);
        }
    }

    private setTip(text: string): void {
        if (this.tipLabel) {
            this.tipLabel.string = text;
        }
    }

    private async jumpScene(sceneName: string, data?: any): Promise<void> {
        if (this.isJumpingScene) return;

        this.isJumpingScene = true;

        await SceneUtil.loadScene(sceneName, data);
    }

    private preloadScene(sceneName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            cc.director.preloadScene(sceneName, (err) => {
                if (err) {
                    cc.error("预加载场景失败:", sceneName, err);
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    }

    private waitProgressComplete(): Promise<void> {
    return new Promise(resolve => {
        let time = 0;

        const check = () => {
            time += 0.02;

            if (this.currentProgress >= 0.995 || time >= 2) {
                this.currentProgress = 1;
                this.targetProgress = 1;

                if (this.progressBar) {
                    this.progressBar.progress = 1;
                }

                if (this.percentLabel) {
                    this.percentLabel.string = "100%";
                }

                resolve();
                return;
            }

            setTimeout(check, 20);
        };

        check();
    });
    }

   private waitMinTime(startTime: number, minTime: number): Promise<void> {
    const cost = Date.now() - startTime;
    const remain = minTime - cost;

    if (remain <= 0) {
        return Promise.resolve();
    }

    return new Promise(resolve => {
        setTimeout(resolve, remain);
    });
    }
}