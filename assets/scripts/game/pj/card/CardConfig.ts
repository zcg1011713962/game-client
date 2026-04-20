export interface CardInfo {
    id: number;
    name: string;
    value: number; // 点数
}

export const CardConfig: Record<number, CardInfo> = {
    1:  { id: 1, name: "天牌", value: 6 },
    2:  { id: 2, name: "天牌", value: 6 },
    3:  { id: 3, name: "地牌", value: 2 },
    4:  { id: 4, name: "地牌", value: 2 },
    5:  { id: 5, name: "人牌", value: 8 },
    6:  { id: 6, name: "人牌", value: 8 },
    7:  { id: 7, name: "和牌", value: 4 },
    8:  { id: 8, name: "和牌", value: 4 },
    9:  { id: 9, name: "梅花", value: 0 },
    10: { id: 10, name: "梅花", value: 0 },
    11: { id: 11, name: "长三", value: 3 },
    12: { id: 12, name: "长三", value: 3 },
    13: { id: 13, name: "板凳", value: 2 },
    14: { id: 14, name: "板凳", value: 2 },
    15: { id: 15, name: "斧头", value: 1 },
    16: { id: 16, name: "斧头", value: 1 },
    17: { id: 17, name: "红头十", value: 0 },
    18: { id: 18, name: "红头十", value: 0 },
    19: { id: 19, name: "高脚七", value: 7 },
    20: { id: 20, name: "高脚七", value: 7 },
    21: { id: 21, name: "零霖六", value: 6 },
    22: { id: 22, name: "零霖六", value: 6 },
    23: { id: 23, name: "杂五", value: 5 },
    24: { id: 24, name: "杂五", value: 5 },
    25: { id: 25, name: "杂四", value: 4 },
    26: { id: 26, name: "杂四", value: 4 },
    27: { id: 27, name: "杂三", value: 3 },
    28: { id: 28, name: "杂三", value: 3 },
    29: { id: 29, name: "杂二", value: 2 },
    30: { id: 30, name: "杂二", value: 2 },
    31: { id: 31, name: "杂一", value: 1 },
    32: { id: 32, name: "杂一", value: 1 },
};