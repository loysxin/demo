import { Button, Canvas, Component, Input, Label, Node } from "cc";
import { GameObj, Panel } from "../../GameRoot";
import { IPointTo } from "./GuideInterface";
import { GetBoundingBoxTo, OutLine, maxx, minn } from "../../utils/Utils";
import { GameSet } from "../GameSet";
import { EventMgr, Evt_Guide_Step } from "../../manager/EventMgr";

export class PointTo1 extends GameObj implements IPointTo {
    protected $prefab: string = "prefabs/guide/PointTo1";
    protected pointer: Node;
    protected target: Node;
    protected msg: string;
    protected lr: number;
    protected offset: number[];
    protected size: number[];
    protected params: any[];
    protected $pause: boolean = false;

    protected onLoad(): void {
        super.onLoad();
        this.name = "PointTo1";
    }

    /**搜寻panel */
    private getPanel(node: Node) {
        let parent: Node = node.parent;
        while (parent) {
            if (parent.getComponent(Canvas)) break;
            let comps = parent.getComponents(Component);
            if (comps.find((value, index, objs) => { if (value instanceof Panel) return value; })) break;
            if (parent.parent) {
                parent = parent.parent;
            } else {
                break;
            }
        }
        return parent;
    }

    /**更新指引对象 */
    Update(target: Node, msgs: string[], angle: number, offset: number[], size: number[], ...params: any[]) {
        if (!target.activeInHierarchy || this.target == target) {
            if (this.parent) this.setSiblingIndex(this.parent.children.length);
            return;
        }
        this.active = !this.$pause;
        this.pointer = undefined;
        this.target = target;
        this.msg = msgs[0];
        this.lr = angle;
        if (offset) {
            this.offset = [offset[0] || 0, offset[1] || 0];
        } else {
            this.offset = [0, 0];
        }
        if (size && size[0] && size[1]) {
            this.size = size;
        } else {
            this.size = undefined
        }
        this.params = params;
        this.getPanel(target).addChild(this);
    }

    protected onTouch() {
        EventMgr.emit(Evt_Guide_Step, ...this.params);
    }
    protected onClick() {
        EventMgr.emit(Evt_Guide_Step, ...this.params);
    }

    Pause(value: boolean) {
        this.$pause = value;
        this.active = !this.$pause;
    }

    Receive(): void {
        this.target = undefined;
        this.$pause = false;
        this.receive();
    }

    /**轮训 */
    protected update(dt: number): void {
        let target = this.target;
        if (!target) return;
        let rect = GetBoundingBoxTo(target, GameSet.GetUICanvas());
        let x = rect.xMin + rect.width / 2;
        let y = rect.yMin + rect.height / 2;
        let angle = 0;
        if (x > 0) {
            // 向右
            angle = 0;
            x = rect.xMin;
        } else {
            // 向左
            angle = 180;
            x = rect.xMax;
        }
        if (this.lr < 0) angle = 0;
        if (this.lr > 0) angle = 180;
        let box = GetBoundingBoxTo(target, this.parent);
        this.setPosition(box.xMin + box.width / 2 + this.offset[0] || 0, box.yMin + box.height / 2 + this.offset[1]);
        if (!this.pointer || this.pointer.name != angle.toString()) {
            let children = this.GetChildren();
            for (let child of children) {
                if (child.name == angle + "") {
                    this.pointer = child;
                    child.active = true;
                } else {
                    child.active = false;
                }
            }
            this.pointer.getChildByName("Label").getComponent(Label).string = this.msg;
        }
    }
}