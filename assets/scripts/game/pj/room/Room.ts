import { UserInfo } from "../user/UserInfo";
import { Seat } from "../seat/Seat";
export class Room {
    roomId: number;
    maxSeat: number = 8;

    /** 所有座位 */
    seats: Seat[] = [];

    /** 所有用户（包含未入座） */
    users: Map<number, UserInfo> = new Map();

    private static _instance: Room | null = null;

    // 禁止外部 new
    private constructor() {}


      public static getInstance(roomId: number, maxSeat: number = 8): Room {
        if (!this._instance) {
            this._instance = new Room();
            this._instance.roomId = roomId;
            this._instance.maxSeat = maxSeat;
             for (let i = 0; i < maxSeat; i++) {
                this._instance.seats.push(new Seat(i));
            }
        }
        return this._instance;
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