export enum AppEnv {
    Test = "test",
    Prod = "prod",
}

interface EnvConfig {
    protocol: string;
    wsProtocol: string;
    host: string;
    apiPort: number;
    wsPort: number;
    shareUrl: string;
}

export default class Config {
    public static readonly CURRENT_ENV: AppEnv = AppEnv.Test;

    private static readonly API_PATH = "/api";
    private static readonly WS_PATH = "/ws";

    private static readonly ENV_CONFIG: { [key in AppEnv]: EnvConfig } = {
        [AppEnv.Test]: {
            protocol: "http",
            wsProtocol: "ws",
            host: "192.168.124.20",
            apiPort: 18080,
            wsPort: 19001,
            shareUrl: "http://192.168.5.11:7456/",
        },
        [AppEnv.Prod]: {
            protocol: "http",
            wsProtocol: "ws",
            host: "47.120.62.233",
            apiPort: 18080,
            wsPort: 19001,
            shareUrl: "http://47.120.62.233:8888/",
        },
    };

    private static get env(): EnvConfig {
        return this.ENV_CONFIG[this.CURRENT_ENV];
    }

    public static get IS_TEST(): boolean {
        return this.CURRENT_ENV === AppEnv.Test;
    }

    public static get IS_PROD(): boolean {
        return this.CURRENT_ENV === AppEnv.Prod;
    }

    public static get PROTOCOL(): string {
        return this.env.protocol;
    }

    public static get WS_PROTOCOL(): string {
        return this.env.wsProtocol;
    }

    public static get HOST(): string {
        return this.env.host;
    }

    public static get API_PORT(): number {
        return this.env.apiPort;
    }

    public static get WS_PORT(): number {
        return this.env.wsPort;
    }

    public static get SHARE_URL(): string {
        return this.env.shareUrl;
    }

    public static get API_URL(): string {
        return `${this.PROTOCOL}://${this.HOST}:${this.API_PORT}${this.API_PATH}`;
    }

    public static get WS_URL(): string {
        return `${this.WS_PROTOCOL}://${this.HOST}:${this.WS_PORT}${this.WS_PATH}`;
    }
}
