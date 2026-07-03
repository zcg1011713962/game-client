export interface SettleRecordQueryReq {
    pageNo: number;
    pageSize: number;
    win?: number; // 0输 1平 2赢
}


export interface SettleRecordVO {

    roomId?: number;

    roundId?: number;

    roundCount?: number;

    bankerCount?: number;

    win: number;

    betAmount: number;

    winAmount: number;

    cardTypeName: string;

    settleDesc: string;

    cards?: string;

    settleTime: number;

    startTime?: number;

    endTime?: number;

    duration?: number;
}
