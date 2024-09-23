import { EditBox, Input, Node, Vec2, instantiate, path, v2 } from "cc";
import { Panel } from "../../GameRoot";
import { Bezier, CreateBezier } from "../../utils/Bezier";
import Logger from "../../utils/Logger";

const pathLeng = 500;

export class SkillEditPath extends Panel {
    protected prefab: string = "prefabs/SkillEditPath";

    private pathLay: Node;
    private input1: EditBox;
    private input2: EditBox;
    private input3: EditBox;
    private page1: Node;
    private page2: Node;
    private page3: Node;
    private bezier: Vec2[] = [];
    private values = [];
    private point: Node;
    private pool: Node[] = [];
    private handle: Function;

    protected onLoad(): void {
        this.input1 = this.find("page2/EditBox1", EditBox);
        this.input2 = this.find("page2/EditBox2", EditBox);
        this.input3 = this.find("page3/EditBox1", EditBox);
        this.page1 = this.find("page1");
        this.page2 = this.find("page2");
        this.page3 = this.find("page3");
        this.pathLay = this.find("pathLay");
        this.point = this.find("point");
        this.find("btn").on(Input.EventType.TOUCH_END, this.onBtn, this);
        this.find("draw").on(Input.EventType.TOUCH_END, this.onDraw, this);
        this.find("nav/path1").on(Input.EventType.TOUCH_END, this.onBtn1, this);
        this.find("nav/path2").on(Input.EventType.TOUCH_END, this.onBtn2, this);
        this.find("nav/path3").on(Input.EventType.TOUCH_END, this.onBtn3, this);
        this.input1.string = "200";
        this.input2.string = "250";
    }

    private onBtn1() {
        this.bezier = [];
        this.page1.active = true;
        this.page2.active = false;
        this.page3.active = false;
        this.onDraw();
    }
    private onBtn2() {
        this.page1.active = false;
        this.page2.active = true;
        this.page3.active = false;
        this.onDraw();
    }
    private onBtn3() {
        this.page1.active = false;
        this.page2.active = false;
        this.page3.active = true;
        this.onDraw();
    }

    private onDraw() {
        if (this.page2.active) {
            let cy = Number(this.input1.string) || 0;
            let cx = Number(this.input2.string) || 0;
            this.bezier = [
                v2(0, 0),
                v2(cx, cy),
                v2(pathLeng, 0)
            ];
        } else if (this.page3.active) {
            this.values = [Number(this.input3.string)];
        }
        this.draw();
    }

    private onBtn() {
        this.onDraw();
        let path = [];
        if (this.page3.active) {
            path = [this.values];
        } else {
            for (let v of this.bezier) {
                path.push([v.x, v.y]);
            }
        }
        let hanle = this.handle;
        this.handle = undefined;
        hanle?.(path);
        this.Hide();
    }

    private createPoint(x: number, y: number) {
        let point: Node;
        if (this.pool.length) {
            point = this.pool.pop();
        } else {
            point = instantiate(this.point);
        }
        this.pathLay.addChild(point);
        point.setPosition(x, y);
    }

    private draw() {
        this.pool.push(...this.pathLay.children);
        this.pathLay.removeAllChildren();
        const num = pathLeng / 25;
        if (this.bezier.length <= 1) {
            for (let x = 0; x < num; x++) {
                this.createPoint(x * 25, 0);
            }
        } else {
            const targets = [
                v2(0, 300 - 50),
                v2(pathLeng * .8, 200 - 50),
                v2(pathLeng, 0 - 50),
                v2(pathLeng * .8, -200 - 50),
                v2(0, -300 - 50)
            ]
            let v = 1 / num;
            for (let target of targets) {
                let bezier = CreateBezier(this.bezier[0], this.bezier[1], this.bezier[2], v2(0, 0), target);
                let t = 0;
                while (t < 1) {
                    let p = Bezier(bezier[0], bezier[1], bezier[2], t);
                    this.createPoint(p.x, p.y);
                    t += v;
                }
            }
        }
    }

    protected onShow(): void {

    }

    public flush(path: number[], callBack: Function): void {
        this.handle = callBack;
        if (path && path.length >= 3) {
            this.bezier = [];
            for (let p of path) {
                this.bezier.push(v2(p[0], p[1]));
            }
            this.input1.string = this.bezier[1].y + "";
            this.input2.string = this.bezier[1].x + "";
            this.onBtn2();
        } else {
            this.bezier = [v2(0, 0)];
            this.onBtn1();
        }
    }

    protected onHide(...args: any[]): void {

    }
}