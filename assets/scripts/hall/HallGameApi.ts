import Config from "../config/Config";
import { ServerMsg } from "../login/entity/ServerMsg";
import UserData from "../login/entity/UserData";
import Http from "../util/Http";

export interface HallBannerConfig {
    gameId: number;
    title: string;
    subtitle: string;
    tagText: string;
    bgAsset: string;
    buttonAsset: string;
    onlineCount: number;
    enabled: boolean;
}

export interface HallGameEntryConfig {
    gameId: number;
    gameCode: string;
    gameName: string;
    gameType: number;
    title: string;
    subtitle: string;
    tag: string;
    coverAsset: string;
    bgAsset: string;
    buttonAsset: string;
    onlineCount: number;
    enabled: boolean;
    matchEnabled: boolean;
    roomEnabled: boolean;
}

export interface HallGameListResp {
    banner: HallBannerConfig;
    games: HallGameEntryConfig[];
}

export default class HallGameApi {
    public static list(): Promise<ServerMsg<HallGameListResp>> {
        const user = UserData.get();
        return Http.postAsync<ServerMsg<HallGameListResp>>(
            `${Config.API_URL}/hall/game-list`,
            {},
            { token: user ? user.token : "" }
        );
    }
}
