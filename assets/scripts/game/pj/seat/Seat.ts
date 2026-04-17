import { UserInfo, UserState } from "../user/UserInfo";
export class Seat {
    seatId: number;
    user: UserInfo | null = null;

    constructor(seatId: number) {
        this.seatId = seatId;
    }

    isEmpty(): boolean {
        return this.user === null;
    }

    sit(user: UserInfo) {
        this.user = user;
        user.seatId = this.seatId;
        user.state = UserState.Sit;
    }

    standUp() {
        if (this.user) {
            this.user.seatId = -1;
            this.user.state = UserState.Idle;
        }
        this.user = null;
    }
}