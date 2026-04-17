export enum UserState {
    Idle = 0,     // 空闲
    Sit = 1,      // 已入座
    Ready = 2,    // 已准备
    Playing = 3   // 游戏中
}

export class UserInfo {
    userId: number = 0;
    nickname: string = "";
    avatar: string = "";
    gold: number = 0;

    seatId: number = -1;
    state: UserState = UserState.Idle;

    constructor(data?: Partial<UserInfo>) {
        if (data) {
            Object.assign(this, data);
        }
    }

    /** 是否已入座 */
    isSeated(): boolean {
        return this.seatId >= 0;
    }

    /** 是否已准备 */
    isReady(): boolean {
        return this.state === UserState.Ready;
    }

    /** 是否游戏中 */
    isPlaying(): boolean {
        return this.state === UserState.Playing;
    }

    /** 入座 */
    sitDown(seatId: number) {
        this.seatId = seatId;
        this.state = UserState.Sit;
    }

    /** 准备 */
    ready() {
        if (this.isSeated()) {
            this.state = UserState.Ready;
        }
    }

    /** 站起 */
    standUp() {
        this.seatId = -1;
        this.state = UserState.Idle;
    }
}