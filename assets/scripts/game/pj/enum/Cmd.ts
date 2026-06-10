export enum Cmd {
    // 网关
    GATEWAY_REGISTER = "GATEWAY_REGISTER",

    // 登录
    LOGIN = "LOGIN",
    LOGIN_RESULT = "LOGIN_RESULT",

    // 心跳
    PING = "PING",
    PONG = "PONG",

    CREATE_ROOM = "CREATE_ROOM",
    FREE_MATCH = "FREE_MATCH",

    // 房间
    ENTER_ROOM = "ENTER_ROOM",
    ENTER_ROOM_RESULT = "ENTER_ROOM_RESULT",

    PLAYER_ENTER = "PLAYER_ENTER",
    // 座位
    SIT_DOWN = "SIT_DOWN",
    SIT_DOWN_RESULT = "SIT_DOWN_RESULT",
    PLAYER_SIT_DOWN = "PLAYER_SIT_DOWN",
    PLAYER_LEAVE_SEAT = "PLAYER_LEAVE_SEAT",

    LEAVE_ROOM = "LEAVE_ROOM",
    LEAVE_ROOM_RESULT = "LEAVE_ROOM_RESULT",
    PLAYER_LEAVE = "PLAYER_LEAVE",

    ROOM_INFO = "ROOM_INFO",
    ROOM_INFO_RESULT = "ROOM_INFO_RESULT",

    // 游戏
    READY = "READY",
    READY_RESULT = "READY_RESULT",

    PLAYER_READY = "PLAYER_READY",


    CANCEL_READY = "CANCEL_READY",
    CANCEL_READY_RESULT = "CANCEL_READY_RESULT",
    CANCEL_PLAYER_READY = "CANCEL_PLAYER_READY",

    GAME_START = "GAME_START",

    GRAB_BANKER_START = "GRAB_BANKER_START",
    GRAB_BANKER_RESULT = "GRAB_BANKER_RESULT",

    // 下注
    BET = "BET",
    BET_RESULT = "BET_RESULT",

    PLAYER_BET = "PLAYER_BET",

    // 发牌 / 结算
    DEAL_CARD = "DEAL_CARD",
    SETTLE = "SETTLE",
    // 下一轮
    NEXT_ROUND = "NEXT_ROUND",
    USER_ASSET_UPDATE = "USER_ASSET_UPDATE",
}

export function parseCmd(cmd: string): Cmd | null {
    const values = Object.values(Cmd) as string[];
    return values.indexOf(cmd) >= 0 ? cmd as Cmd : null;
}