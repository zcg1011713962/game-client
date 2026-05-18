export default class HallRes {
    private static _instance: HallRes = null;
    public hallBgmAudio: cc.AudioClip = null;
    public hallClickAudio: cc.AudioClip = null;
    public static get instance(): HallRes {
        if (!this._instance) {
            this._instance = new HallRes();
        }
        return this._instance;
    }

    private constructor() {}

    public async preload() {
        await Promise.all([
            this.loadHallBgmAudio(),  
            this.loadHallClickAudio()
        ]);
        
    }

    private loadHallBgmAudio(): Promise<void>{
         return new Promise((resolve, reject) => {
         cc.resources.load("audio/bgm_hall", cc.AudioClip, (err, clip: cc.AudioClip) => {
            if (err) {
                cc.error("大厅音乐加载失败:", err);
                reject(err);
                return;
            }
            this.hallBgmAudio = clip;
            cc.log("洗牌音乐加载完成");
            resolve();
        });
        });
    }

    private loadHallClickAudio(): Promise<void>{
         return new Promise((resolve, reject) => {
         cc.resources.load("audio/bgm_hall_click", cc.AudioClip, (err, clip: cc.AudioClip) => {
            if (err) {
                cc.error("大厅点击音乐加载失败:", err);
                reject(err);
                return;
            }
            this.hallClickAudio = clip;
            cc.log("大厅点击音乐加载完成");
            resolve();
        });
        });
    }

}