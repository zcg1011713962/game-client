import Config from "../config/Config";

export class SceneData {

    private static _data: any = null;

    static setData(data: any) {
        this._data = data;
    }

    static getData<T>(): T {
        return this._data as T;
    }

    static clear() {
        this._data = null;
    }
}

export class ShareRoomUtil {
    private static readonly QUERY_INVITE_CODE = "invite";
    private static pendingInviteCode: string = "";
    private static consumedUrlInvite: boolean = false;

    static createShareUrl(inviteCode: string): string {
        if (!this.isValidInviteCode(inviteCode)) {
            throw new Error("invalid invite code");
        }

        const encodedInvite = encodeURIComponent(inviteCode || "");
        if (Config.SHARE_URL) {
            const separator = Config.SHARE_URL.indexOf("?") >= 0 ? "&" : "?";
            return `${Config.SHARE_URL}${separator}${this.QUERY_INVITE_CODE}=${encodedInvite}`;
        }

        const win = typeof window !== "undefined" ? window : null;
        if (!win || !win.location) {
            return `${this.QUERY_INVITE_CODE}=${encodedInvite}`;
        }

        const origin = win.location.origin || `${win.location.protocol}//${win.location.host}`;
        const path = win.location.pathname || "";
        const hash = win.location.hash || "";
        return `${origin}${path}?${this.QUERY_INVITE_CODE}=${encodedInvite}${hash}`;
    }

    static isValidInviteCode(inviteCode: string): boolean {
        return /^[A-Z]{4,12}$/.test(inviteCode || "");
    }

    static getInviteFromUrl(): string {
        const win = typeof window !== "undefined" ? window : null;
        if (!win || !win.location) {
            return "";
        }

        const searchInvite = this.readValueFromSearch(win.location.search || "", this.QUERY_INVITE_CODE);
        if (searchInvite) {
            return searchInvite;
        }

        const hashSearch = this.getHashSearch(win.location.hash || "");
        return this.readValueFromSearch(hashSearch, this.QUERY_INVITE_CODE);
    }

    static setPendingInvite(inviteCode: string): void {
        this.pendingInviteCode = inviteCode || "";
    }

    static hasSharedRoom(): boolean {
        return !!this.getInviteFromUrl() || !!this.pendingInviteCode;
    }

    static getRoomIdFromUrl(): number {
        // 兼容旧编译缓存里的调用；旧 ?roomId=xxx 分享链接不再允许自动进房。
        return 0;
    }

    static setPendingRoomId(_roomId: number): void {
        // 兼容旧编译缓存里的调用；旧 roomId 分享入口已经下线。
    }

    static consumePendingRoomId(): number {
        // 兼容旧编译缓存里的调用；返回 0 表示没有可自动进入的旧房间链接。
        return 0;
    }

    static consumePendingInvite(): string {
        if (this.pendingInviteCode) {
            const inviteCode = this.pendingInviteCode;
            this.pendingInviteCode = "";
            this.consumedUrlInvite = true;
            this.clearInviteFromUrl();
            return inviteCode;
        }

        if (this.consumedUrlInvite) {
            return "";
        }

        const inviteCode = this.getInviteFromUrl();
        if (inviteCode) {
            this.consumedUrlInvite = true;
            this.clearInviteFromUrl();
            return inviteCode;
        }

        return "";
    }

    static async copyText(text: string): Promise<void> {
        const nav = typeof navigator !== "undefined" ? navigator as any : null;
        if (nav && nav.clipboard && nav.clipboard.writeText) {
            await nav.clipboard.writeText(text);
            return;
        }

        const doc = typeof document !== "undefined" ? document : null;
        if (!doc || !doc.body) {
            return Promise.reject("clipboard unavailable");
        }

        const input = doc.createElement("textarea");
        input.value = text;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        input.style.top = "0";
        doc.body.appendChild(input);
        input.focus();
        input.select();

        try {
            const success = doc.execCommand("copy");
            if (!success) {
                return Promise.reject("copy failed");
            }
        } finally {
            doc.body.removeChild(input);
        }
    }

    private static readValueFromSearch(search: string, keyName: string): string {
        if (!search) {
            return "";
        }

        const text = search.charAt(0) === "?" ? search.substring(1) : search;
        const parts = text.split("&");
        for (let i = 0; i < parts.length; i++) {
            const kv = parts[i].split("=");
            if (decodeURIComponent(kv[0] || "") !== keyName) {
                continue;
            }

            return decodeURIComponent(kv[1] || "");
        }

        return "";
    }

    private static getHashSearch(hash: string): string {
        if (!hash) {
            return "";
        }

        const index = hash.indexOf("?");
        return index >= 0 ? hash.substring(index) : "";
    }

    private static clearInviteFromUrl(): void {
        const win = typeof window !== "undefined" ? window : null;
        if (!win || !win.location || !win.history || !win.history.replaceState) {
            return;
        }

        const search = this.removeShareParamsFromSearch(win.location.search || "");
        const hash = this.removeShareParamsFromHash(win.location.hash || "");
        const url = `${win.location.pathname || ""}${search}${hash}`;
        win.history.replaceState(null, "", url || "/");
    }

    private static removeShareParamsFromHash(hash: string): string {
        if (!hash) {
            return "";
        }

        const index = hash.indexOf("?");
        if (index < 0) {
            return hash;
        }

        const path = hash.substring(0, index);
        const search = this.removeShareParamsFromSearch(hash.substring(index));
        return `${path}${search}`;
    }

    private static removeShareParamsFromSearch(search: string): string {
        if (!search) {
            return "";
        }

        const text = search.charAt(0) === "?" ? search.substring(1) : search;
        const parts = text.split("&").filter(part => {
            const key = decodeURIComponent((part.split("=")[0] || ""));
            return key !== this.QUERY_INVITE_CODE;
        });

        return parts.length > 0 ? `?${parts.join("&")}` : "";
    }
}

export class SceneUtil {

    static async preloadScene(scene: string): Promise<void> {
        if (scene === "game_1") {
            await this.preloadBundleScene("bundle_game", "scene/game_1");
        } else if (scene === "hall") {
            await this.preloadNormalScene("hall");
        } else if (scene === "login") {
            await this.preloadNormalScene("login");
        }
    }

    static async loadScene(scene: string, data?: any): Promise<void> {
        SceneData.setData(data);
        const t = Date.now();
        if (scene === "game_1") {
            await this.loadBundleScene("bundle_game", "scene/game_1");
        }else if(scene === "hall"){
            await this.loadNormalScene("hall");
        }else if (scene === "login") {
            await this.loadNormalScene("login");
        }
        console.log("加载场景耗时:", scene, Date.now() - t, "ms");
    }

    private static preloadNormalScene(sceneName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            cc.director.preloadScene(sceneName, (err) => {
                if (err) {
                    cc.error("普通场景预加载失败:", sceneName, err);
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    }

    private static loadNormalScene(sceneName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            cc.director.loadScene(sceneName, (err) => {
                if (err) {
                    cc.error("普通场景加载失败:", sceneName, err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    
    private static loadBundleScene(bundleName: string, scenePath: string): Promise<void> {

        return new Promise((resolve, reject) => {

            cc.assetManager.loadBundle(bundleName, (err, bundle) => {

                if (err) {
                    cc.error(`${bundleName} 加载失败`, err);
                    reject(err);
                    return;
                }

                bundle.loadScene(scenePath, (err, sceneAsset) => {

                    if (err) {
                        cc.error(`${scenePath} 场景加载失败`, err);
                        reject(err);
                        return;
                    }

                    cc.director.runScene(sceneAsset, () => {
                        cc.log("场景切换完成:", scenePath);
                        resolve();
                    });

                });

            });

        });
    }

    private static preloadBundleScene(bundleName: string, scenePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            cc.assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    cc.error(`${bundleName} 加载失败`, err);
                    reject(err);
                    return;
                }

                bundle.loadScene(scenePath, (loadErr) => {
                    if (loadErr) {
                        cc.error(`${scenePath} 场景预加载失败`, loadErr);
                        reject(loadErr);
                        return;
                    }

                    resolve();
                });
            });
        });
    }
}
