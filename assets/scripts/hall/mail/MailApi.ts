import { PageResult } from "../../common/entity/PageResult";
import Config from "../../config/Config";
import { ServerMsg } from "../../login/entity/ServerMsg";
import UserData from "../../login/entity/UserData";
import Http from "../../util/Http";

export type MailTime = number | string | null;

export interface MailAttachmentVO {
    id: number;
    mailId: number;
    itemType: number;
    itemId: number;
    itemCount: number;
}

export interface MailVO {
    mailId: number;
    mailType: number;
    title: string;
    content: string;
    sender: string;
    startTime: MailTime;
    expireTime: MailTime;
    createTime: MailTime;
    readStatus: number;
    receiveStatus: number;
    deleteStatus: number;
    hasAttachment: boolean;
    attachments: MailAttachmentVO[];
}

export interface MailReceiveResultVO {
    user: any;
    attachments: MailAttachmentVO[];
}

export default class MailApi {
    public static list(pageNo: number, pageSize: number): Promise<ServerMsg<PageResult<MailVO>>> {
        return this.post("/mail/list", { pageNo, pageSize });
    }

    public static unreadCount(): Promise<ServerMsg<number>> {
        return this.post("/mail/unread-count", {});
    }

    public static read(mailId: number): Promise<ServerMsg<MailVO>> {
        return this.post("/mail/read", { mailId });
    }

    public static receive(mailId: number): Promise<ServerMsg<MailReceiveResultVO>> {
        return this.post("/mail/receive", { mailId });
    }

    public static receiveAll(): Promise<ServerMsg<MailReceiveResultVO>> {
        return this.post("/mail/receive-all", {});
    }

    public static deleteMail(mailId: number): Promise<ServerMsg<void>> {
        return this.post("/mail/delete", { mailId });
    }

    private static post<T>(path: string, data: any): Promise<ServerMsg<T>> {
        const user = UserData.get();
        return Http.postAsync<ServerMsg<T>>(
            `${Config.API_URL}${path}`,
            data,
            { token: user ? user.token : "" }
        );
    }
}
