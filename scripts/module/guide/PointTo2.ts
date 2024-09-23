import { Button, EventTouch, Input, Label, Node, RichText, Sprite, Tween, UITransform, Widget, easing, math, tween, v3 } from "cc";
import { GameObj } from "../../GameRoot";
import { IPointTo } from "./GuideInterface";
import { Convert, ConvertNode, GetBoundingBoxTo, OutLine, maxx, minn } from "../../utils/Utils";
import { GameSet } from "../GameSet";
import { FilmMaker } from "../../manager/FilmMaker";
import { EventMgr, Evt_Guide_Step } from "../../manager/EventMgr";

export class PointTo2 extends GameObj implements IPointTo {
    protected $prefab: string = "prefabs/guide/PointTo2";
    protected pointer: Node;
    protected target: Node;
    protected msgs: string[];
    protected index: number = 0;
    protected lr: number;
    protected offset: number[];
    protected size: number[];
    protected params: any[];
    protected $btn: Node;
    protected mask: Node;
    protected next: Node;
    protected $pause: boolean = false;
    protected seed: number = 0;
    protected pointers: Node[];

    protected onLoad(): void {
        super.onLoad();
        this.mask = this.find("mask");
        this.mask.setSiblingIndex(0);
        this.name = "PointTo2";
        this.$proxy.node.addChild(this.btn);
        this.btn.setSiblingIndex(1);

        this.pointers = [this.find("0"), this.find("180")];

    }

    protected get btn() {
        if (!this.$btn) {
            this.$btn = new Node();
            this.$btn.name = "frame";
            this.$btn.addComponent(Sprite);
        }
        return this.$btn;
    }

    async Update(target: Node, msgs: string[], angle: number, offset: number[], size: number[], ...params: any[]) {
        if (!target.activeInHierarchy || this.target == target) return;
        this.active = !this.$pause;
        GameSet.GetUICanvas().addChild(this);
        if (!this.$hasLoad) await this.loadSub;
        this.pointer = undefined;
        this.target = target;
        this.msgs = msgs;
        this.index = 0;
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
        let seed = ++this.seed;
        let spriteFrame = await FilmMaker.Shoot(target);
        if (seed == this.seed) {
            this.btn.getComponent(Sprite).spriteFrame = spriteFrame;
            if (target.getComponent(Button) && !this.btn.getComponent(Button)) {
                let button = this.btn.addComponent(Button);
                button.transition = Button.Transition.SCALE;
            } else if (!target.getComponent(Button) && this.btn.getComponent(Button)) {
                this.btn.getComponent(Button).destroy();
            }
            this.$proxy.node.addChild(this.btn);
            this.btn.setSiblingIndex(1);
            let tran = target.getComponent(UITransform);
            this.btn.getComponent(UITransform).setAnchorPoint(tran.anchorX, tran.anchorY);
        }
        this.btn.targetOff(this);
        if (target.hasEventListener(Button.EventType.CLICK)) {
            this.btn.once(Button.EventType.CLICK, this.onButton, this);
        } else if (target.hasEventListener(Input.EventType.TOUCH_END)) {
            this.btn.once(Input.EventType.TOUCH_END, this.onTouch, this);
        } else {
            this.btn.once(Input.EventType.TOUCH_START, this.onTouch, this);
        }

    }

    Pause(value: boolean) {
        this.$pause = value;
        this.active = !this.$pause;
    }

    protected onTouch(e: any) {
        this.target.dispatchEvent(e);
        EventMgr.emit(Evt_Guide_Step, ...this.params);
    }
    protected onButton(e: any) {
        this.target.emit(Button.EventType.CLICK, this.target.getComponent(Button));
        EventMgr.emit(Evt_Guide_Step, ...this.params);
    }

    Receive(): void {
        this.btn.targetOff(this);
        this.$pause = false;
        let children = this.GetChildren();
        for (let child of children) {
            Tween.stopAllByTarget(child);
        }
        this.receive();
    }

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

        let box = GetBoundingBoxTo(target, this);
        // this.setPosition(box.xMin + box.width / 2 + this.offset[0] || 0, box.yMin + box.height / 2 + this.offset[1]);
        if (!this.pointer || this.pointer.name != angle.toString()) {
            for (let child of this.pointers) {
                if (child.name == angle + "") {
                    this.pointer = child;
                    child.active = true;
                } else {
                    child.active = false;
                }
            }
            let [px, py] = ConvertNode(target, this);
            this.btn.setPosition(px, py);
            this.pointer.setPosition(box.xMin + box.width / 2 + this.offset[0] || 0, box.yMin + box.height / 2 + this.offset[1]);
            this.pointer.getChildByPath("layout/label").getComponent(RichText).string = this.msgs[this.index];
            let next = this.pointer.getChildByPath("layout/guide_xin");
            if(this.msgs.length > 1 && this.index < this.msgs.length-1) {
                next.on(Input.EventType.TOUCH_END,this.onNext,this);
                next.active = true;
            }else{
                next.active = false;
            }
        }
    }
    protected onNext() {
        if(!this.pointer)return;
        this.index++;
        this.pointer.getChildByPath("layout/label").getComponent(RichText).string = this.msgs[this.index];
    }
}
