// ServerMsg.ts

/**
 * 服务端统一响应消息
 */
export interface ServerMsg<T = any> {

    /**
     * 消息命令
     * 例如：LOGIN_RESULT / BET_RESULT
     */
    cmd: string;

    /**
     * 请求序号
     */
    seq: number;

    /**
     * 状态码
     * 0 = 成功
     */
    code: number;

    /**
     * 提示信息
     */
    msg: string;

    /**
     * 返回数据
     */
    data: T;
}