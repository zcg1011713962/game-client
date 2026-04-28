export enum Cmd {

    // 网关
    GATEWAY_REGISTER = "GATEWAY_REGISTER",

    // 登录
    LOGIN = "LOGIN",
    LOGIN_RESULT = "LOGIN_RESULT",

    // 心跳
    PING = "PING",
    PONG = "PONG",

    // 房间
    ENTER_ROOM = "ENTER_ROOM",
    ENTER_ROOM_RESULT = "ENTER_ROOM_RESULT",

    // 游戏
    READY = "READY",
    READY_RESULT = "READY_RESULT",

    // 下注
    BET = "BET",
    BET_RESULT = "BET_RESULT",

    // 广播
    PLAYER_BET = "PLAYER_BET"
}