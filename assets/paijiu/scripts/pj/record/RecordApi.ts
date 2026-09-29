import { PageResult } from "../../../../scripts/common/entity/PageResult";
import Config from "../../../../scripts/config/Config";
import UserData from "../../../../scripts/login/entity/UserData";
import Http from "../../../../scripts/util/Http";
import { RecordItemDTO } from "./RecordTypes";
export interface ApiResult<T> {

    cmd: string;

    seq: number;

    code: number;

    msg: string;

    data: T;
}

export default class RecordApi {

    public static queryRecord(
        pageNo: number,
        pageSize: number,
        roomId: number | null,
        gameId: number | null = null
    ): Promise<ApiResult<PageResult<RecordItemDTO>>> {

        const guest = UserData.get();

        return Http.postAsync<
            ApiResult<PageResult<RecordItemDTO>>
        >(
            Config.API_URL + "/settle/record",
            {
                "pageNo": pageNo,
                "pageSize": pageSize,
                "roomId": roomId,
                "gameId": gameId
            },
            {
                token: guest ? guest.token : ""
            }
        );
    }
}
