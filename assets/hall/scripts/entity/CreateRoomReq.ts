export default class CreateRoomReq {

    /**
     * 游戏ID
     */
    public gameId: number = 0;

    /**
     * 对局数
     * 8 16 24 32
     */
    public roundCount: number = 8;

    /**
     * 玩家人数
     * 4 6 8
     */
    public playerCount: number = 4;

    /**
     * 庄家模式
     * 1 轮庄
     * 2 抢庄
     * 3 房主坐庄
     */
    public bankerMode: number = 1;

    /**
     * 至尊
     */
    public zhiZun: boolean = true;

    /**
     * 双天
     */
    public doubleTian: boolean = true;

    /**
     * 双地
     */
    public doubleDi: boolean = true;

    /**
     * 双人
     */
    public doubleRen: boolean = true;

    /**
     * 双鹅
     */
    public doubleE: boolean = true;
}