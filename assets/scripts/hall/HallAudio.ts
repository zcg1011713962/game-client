const { ccclass } = cc._decorator;

@ccclass
export default class HallAudio extends cc.Component {

    private bgmClip: cc.AudioClip = null;

    onLoad() {
        cc.resources.load("audio/bgm_hall", cc.AudioClip, (err, clip: cc.AudioClip) => {
            if (err) {
                cc.error("大厅音乐加载失败:", err);
                return;
            }

            this.bgmClip = clip;

            cc.audioEngine.setMusicVolume(0.5);

            if (!cc.audioEngine.isMusicPlaying()) {
                cc.audioEngine.playMusic(this.bgmClip, true);
            }
        });
    }

    onDestroy() {
        cc.audioEngine.stopMusic();
    }
}