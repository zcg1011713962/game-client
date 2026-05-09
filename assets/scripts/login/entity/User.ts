
/**
 * 用户数据
 */
export interface User {

    /**
     * 用户ID
     */
    id: number;

    /**
     * 账号
     */
    username: string;

    /**
     * 密码
     */
    pwd: string;

    /**
     * 昵称
     */
    nickname: string;

    /**
     * 头像
     */
    avatar: string;

    /**
     * 金币
     */
    gold: number;
}