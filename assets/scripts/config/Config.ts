export default class Config {

    public static PROTOCOL = "http";
    public static WS_PROTOCOL = "ws";

    public static HOST = "192.168.5.22";

    public static API_PORT = 18080;
    public static WS_PORT = 19001;

    public static API_PATH = "/api";
    public static WS_PATH = "/ws";

    public static get API_URL(): string {
        return `${this.PROTOCOL}://${this.HOST}:${this.API_PORT}${this.API_PATH}`;
    }

    public static get WS_URL(): string {
        return `${this.WS_PROTOCOL}://${this.HOST}:${this.WS_PORT}${this.WS_PATH}`;
    }
}