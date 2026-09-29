export class DelayTaskUtil {
    private static instance: DelayTaskUtil;

    static getInstance() {
        if (!this.instance) {
            this.instance = new DelayTaskUtil();
        }
        return this.instance;
    }

    private taskId: number = 0;
    private taskMap: Map<number, number> = new Map();

    /**
     * 延时执行
     */
    schedule(callback: Function, delayMs: number): number {
        const id = ++this.taskId;

        const timer = window.setTimeout(() => {
            this.taskMap.delete(id);
            callback();
        }, delayMs);

        this.taskMap.set(id, timer);

        return id;
    }

    /**
     * 取消任务
     */
    cancel(id: number) {
        const timer = this.taskMap.get(id);
        if (timer) {
            clearTimeout(timer);
            this.taskMap.delete(id);
        }
    }

    /**
     * 取消所有任务
     */
    cancelAll() {
        this.taskMap.forEach(timer => clearTimeout(timer));
        this.taskMap.clear();
    }
}