
export class NetMsg<T = any> {

    cmd: string = "";

    seq: number = 0;

    code: number = 0;

    msg: string = "";

    data!: T;

    isSuccess(): boolean {
        return this.code === 0;
    }
}