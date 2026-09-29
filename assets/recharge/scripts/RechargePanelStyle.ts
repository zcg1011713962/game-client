const { ccclass, property, executeInEditMode } = cc._decorator;

/** Small, editable vector surfaces used by RechargePopup. */
@ccclass
@executeInEditMode
export default class RechargePanelStyle extends cc.Component {
    @property(cc.Color) fill: cc.Color = new cc.Color(8, 19, 39, 245);
    @property(cc.Color) stroke: cc.Color = new cc.Color(37, 72, 123, 255);
    @property radius: number = 12;
    @property lineWidth: number = 2;
    @property glow: boolean = false;

    onLoad() { this.redraw(); }
    onEnable() { this.redraw(); }

    public redraw() {
        const g = this.getComponent(cc.Graphics) || this.addComponent(cc.Graphics);
        g.clear();
        const w = this.node.width;
        const h = this.node.height;
        const draw = (inset: number) => g.roundRect(-w / 2 + inset, -h / 2 + inset,
            Math.max(1, w - inset * 2), Math.max(1, h - inset * 2), this.radius);
        if (this.glow) {
            g.strokeColor = new cc.Color(this.stroke.r, this.stroke.g, this.stroke.b, 40);
            g.lineWidth = 12;
            draw(6);
            g.stroke();
        }
        g.fillColor = this.fill;
        g.strokeColor = this.stroke;
        g.lineWidth = this.lineWidth;
        draw(this.glow ? 6 : this.lineWidth / 2);
        g.fill();
        if (this.lineWidth > 0) g.stroke();
    }
}
