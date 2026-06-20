export interface SettleRecordQueryReq {
    pageNo: number;
    pageSize: number;
    win?: number; // 0输 1平 2赢
}


export interface SettleRecordVO {

    roundId: number;

    win: number;

    betAmount: number;

    winAmount: number;

    cardTypeName: string;

    settleDesc: string;

    cards: string;

    settleTime: number;
}