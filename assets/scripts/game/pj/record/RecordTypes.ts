export interface RecordCardDTO {
    id: number;
    name: string;
    value: number;
}

export interface RecordItemDTO {
    gameId?: number;
    roomId?: number;
    roundId?: number;
    roundCount?: number;
    bankerCount?: number;
    win: number;
    betAmount: number;
    winAmount: number;
    cardTypeName: string;
    bankerCardTypeName?: string;
    settleDesc: string;
    cards?: RecordCardDTO[];
    bankerCards?: RecordCardDTO[];
    settleTime: number;
    startTime?: number;
    endTime?: number;
    duration?: number;
}
