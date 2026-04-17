import { UserInfo } from "../user/UserInfo";
import { Seat } from "../seat/Seat";
export class Room {
    roomId: number;
    maxSeat: number = 8;

    /** 所有座位 */
    seats: Seat[] = [];

    /** 所有用户（包含未入座） */
    users: Map<number, UserInfo> = new Map();

    constructor(roomId: number, maxSeat: number = 8) {
        this.roomId = roomId;
        this.maxSeat = maxSeat;

        for (let i = 0; i < maxSeat; i++) {
            this.seats.push(new Seat(i));
        }
    }

    /** 获取空座位 */
    getEmptySeat(): Seat | null {
        return this.seats.find(s => s.isEmpty()) || null;
    }

    /** 根据seatId获取座位 */
    getSeat(seatId: number): Seat | null {
        return this.seats[seatId] || null;
    }
}