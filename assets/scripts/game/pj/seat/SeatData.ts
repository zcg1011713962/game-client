// SeatData.ts
export enum SeatState {
    EMPTY, // 空闲
    OCCUPIED, // 坐下
    LOCKED // 锁定
}

export interface SeatData {
    id: number;
    x: number;
    y: number;
    state: SeatState;
    playerName: string;
}