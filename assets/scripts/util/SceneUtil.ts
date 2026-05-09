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

export class SceneUtil {

    static loadScene(scene: string, data?: any) {

        SceneData.setData(data);

        cc.director.loadScene(scene);
    }
}