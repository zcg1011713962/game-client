import { RecordItemDTO } from "./GameRecordItem";

const { ccclass } = cc._decorator;

@ccclass
export default class HallRecordItem extends cc.Component {
    private static readonly COLUMN_X = [-300, -105, 25, 155, 300];

    private labels: cc.Label[] = [];

    protected onLoad(): void {
        this.node.children
            .filter(child => child.name !== "Bg")
            .forEach(child => child.active = false);

        this.labels = HallRecordItem.COLUMN_X.map((x, index) => {
            const labelNode = new cc.Node(`HallRecordLabel${index}`);
            labelNode.setPosition(x, 0);
            this.node.addChild(labelNode);

            const label = labelNode.addComponent(cc.Label);
            label.fontSize = 35;
            label.lineHeight = 35;
            label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            label.verticalAlign = cc.Label.VerticalAlign.CENTER;
            labelNode.color = cc.color(60, 35, 20);

            return label;
        });
    }

    public updateView(data: RecordItemDTO) {
        const values = [
            this.formatTime(data.startTime || data.settleTime),
            `${data.roomId || ""}`,
            this.formatAmount(Number(data.winAmount || 0)),
            this.formatDuration(data.duration || 0),
            `${data.bankerCount || 0}`
        ];

        values.forEach((value, index) => {
            const label = this.labels[index];
            if (!label) {
                return;
            }

            label.string = value;
            label.node.color = index === 2
                ? this.getAmountColor(Number(data.winAmount || 0))
                : cc.color(60, 35, 20);
        });
    }

    private formatTime(time: number): string {
        if (!time) {
            return "";
        }

        const date = new Date(time);
        const month = this.pad(date.getMonth() + 1);
        const day = this.pad(date.getDate());
        const hour = this.pad(date.getHours());
        const minute = this.pad(date.getMinutes());
        return `${month}-${day} ${hour}:${minute}`;
    }

    private formatDuration(duration: number): string {
        const totalSeconds = Math.max(0, Math.floor(duration / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const leftMinutes = minutes % 60;
            return `${hours}小时${leftMinutes}分`;
        }

        if (minutes > 0) {
            return `${minutes}分${seconds}秒`;
        }

        return `${seconds}秒`;
    }

    private formatAmount(amount: number): string {
        return amount > 0 ? `+${amount.toLocaleString()}` : amount.toLocaleString();
    }

    private getAmountColor(amount: number): cc.Color {
        if (amount > 0) {
            return cc.color(235, 100, 25);
        }

        if (amount < 0) {
            return cc.color(20, 160, 60);
        }

        return cc.color(70, 140, 255);
    }

    private pad(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
    }
}
