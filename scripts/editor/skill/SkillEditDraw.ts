import { Component, EventTouch, Graphics, Input, Node, UITransform, instantiate } from "cc";
import { Panel } from "../../GameRoot";

const wide = 32;
export class SkillEditDraw extends Panel {
    protected prefab: string = "prefabs/SkillEditDraw";

    private callBack: Function;
    private graphics: Graphics;
    private origin: Node;
    private bounds: { [idx: string]: { tile: Node, grid: number[] } };
    protected onLoad(): void {
        this.graphics = this.find("drawer", Graphics);
        this.drawGrid();
        this.origin = this.find("wall");
        this.find("hitTest").on(Input.EventType.TOUCH_END, this.onSelect, this);
        this.find('btn').on(Input.EventType.TOUCH_END, this.onTouch, this);

        let size = this.origin.getComponent(UITransform).contentSize;
        let scale = wide/size.width;
        this.origin.setScale(scale,scale);

    }
    private drawGrid() {
        let size = this.graphics.node.getComponent(UITransform).contentSize;
        let col = Math.ceil(size.width / 2 / wide) * 2;
        let row = Math.ceil(size.height / 2 / wide) * 2;
        let startx = col / 2 * wide + wide / 2, starty = col / 2 * wide + wide / 2;
        this.graphics.clear();
        for (let x = 0; x <= col + 1; x++) {
            this.graphics.moveTo(-startx + x * wide, starty);
            this.graphics.lineTo(-startx + x * wide, -starty);
        }
        for (let y = 0; y <= row + 1; y++) {
            this.graphics.moveTo(-startx, starty - y * wide);
            this.graphics.lineTo(startx, starty - y * wide);
        }
        this.graphics.close();
        this.graphics.stroke();
    }
    private drawRang() {
        this.graphics.node.removeAllChildren();
        for (let k in this.bounds) {
            let obj = this.bounds[k];
            let wall = instantiate(this.origin);
            wall.setPosition(obj.grid[0] * wide, obj.grid[1] * wide);
            this.graphics.node.addChild(wall);
            obj.tile = wall;
        }
    }

    private onSelect(e: EventTouch) {
        let size = this.node.getComponent(UITransform).contentSize;
        let px = e.touch.getUILocation().x;
        let py = e.touch.getUILocation().y;
        let x = px - size.width / 2;
        let y = py - size.height / 2;
        let nx = Math.round(x / wide);
        let ny = Math.round(y / wide);
        if (this.bounds[nx + "_" + ny]) {
            let obj = this.bounds[nx + "_" + ny];
            delete this.bounds[nx + "_" + ny];
            obj.tile.parent && obj.tile.parent.removeChild(obj.tile);
        } else {
            let wall = instantiate(this.origin);
            wall.setPosition(nx * wide, ny * wide);
            this.graphics.node.addChild(wall);
            this.bounds[nx + "_" + ny] = { tile: wall, grid: [nx, ny] };
        }
    }
    private onTouch() {
        let bounds = [];
        for (let k in this.bounds) {
            bounds.push(this.bounds[k].grid);
        }
        this.callBack(bounds);
        this.Hide();
    }

    protected onShow(): void {

    }
    public flush(bounds: number[][], callBack: Function): void {
        this.bounds = {};
        for (let bound of bounds) {
            this.bounds[bound[0] + "_" + bound[1]] = { tile: undefined, grid: bound };
        }
        this.callBack = callBack;
        this.drawRang();
    }
    protected onHide(...args: any[]): void {

    }
}