import { _decorator, Component, EditBox, EventTouch, find, input, Input, Label, Node, ScrollView, UITransform } from 'cc';
import { AutoScroller } from './AutoScroller';
import { Convert, FindParent, getRoot } from './Utils';
import { GameSet } from '../module/GameSet';
const { ccclass, property } = _decorator;

@ccclass('ComboBox')
export class ComboBox extends Component {

    @property(Node)
    private input: Node;

    @property(Node)
    private open: Node;

    @property(AutoScroller)
    private scroller: AutoScroller;

    private setHead: Function;
    private datas: any[] = [];
    private layout: Node;
    private initx: number;
    private inity: number;
    private scaleX: number;
    private scaleY: number;

    protected onLoad(): void {
        this.layout = this.scroller.node.parent;
        this.input.on(Input.EventType.TOUCH_END, this.onOpen, this);
        this.scroller.node.on("select", this.onSelect, this);
        // this.input.on("editing-did-ended", this.onInput, this);
        let p = this.scroller.node.position;
        this.initx = p.x;
        this.inity = p.y;
        this.scaleX = this.open.getScale().x;
        this.scaleY = this.open.getScale().y;

        let size = this.getComponent(UITransform).contentSize;
        let h = this.scroller.node.getComponent(UITransform).contentSize.height;
        this.scroller.node.getComponent(UITransform).setContentSize(size.width, h);
        this.node.on(Node.EventType.PARENT_CHANGED, this.onHide, this);
        this.hasLoad = true;
        this.complete?.();
    }

    protected onRoot(e: EventTouch) {
        console.log("onRoot", e.target.name);
        if (!FindParent(e.target, this.node)) {
            this.onHide();
        }
    }

    protected complete: Function;
    protected hasLoad = false;
    protected $loadSub: Promise<any>;
    protected get loadSub() {
        if (this.$loadSub) return this.$loadSub;
        let thisObj = this;
        this.$loadSub = new Promise((resolve, reject) => {
            thisObj.complete = resolve;
        });
        return this.$loadSub;
    }

    start() {

    }

    update(deltaTime: number) {

    }

    /**
     * 更新
     * @param updateItem 
     * @param craeteItem 
     */
    async Init(datas: any[], updateItem: (item: Node, data: any) => void, setHead?: (item: Node, data: any) => void, craeteItem?: () => Node) {
        if (!this.hasLoad) await this.loadSub;
        this.setHead = setHead;
        this.UpdateList(datas);
        this.scroller.SetHandle(updateItem, craeteItem);
    }

    Select(index: number) {
        if (!this.input) return;
        let data = this.datas[index];
        if (this.setHead) {
            this.setHead(this.input, data);
        } else {
            this.scroller.updateItem(this.input, data, index);
        }
        return data;
    }

    get string() {
        if (!this.input) return "";
        let input = this.input.getComponent(EditBox);
        if (input) return input.string;
        let label = this.input.getComponent(Label);
        if (label) return label.string;
    }
    set string(value: string) {
        if (!this.input) return;
        let input = this.input.getComponent(EditBox);
        if (input) input.string = value;
        let label = this.input.getComponent(Label);
        if (label) label.string = value;
    }

    async HideList() {
        if (!this.hasLoad) await this.loadSub;
        this.onHide();
    }

    async UpdateList(datas: any[]) {
        if (!this.hasLoad) await this.loadSub;
        this.datas = datas;
        this.scroller.UpdateDatas(datas);
    }

    private onSelect(index: number) {
        this.onHide();
        let data = this.Select(index);
        if (data == "" || data == undefined) return;
        this.node.emit("select", data);
    }
    private onInput(editbox: EditBox) {
        let value = editbox.string;
        if (value == "" || value == undefined) return;
        this.node.emit("select", value);
    }
    private onOpen(e: EventTouch) {
        if (this.scroller.node.active) {
            this.open.setScale(this.scaleX, this.scaleY);
            this.onHide();
        } else {
            this.open.setScale(this.scaleX, -this.scaleY);
            this.onShow();
            this.scroller.UpdateDatas(this.datas);
        }
        this.node.emit("open");
    }

    private onShow() {
        let root = this.node.parent;
        let p = this.scroller.node.position;
        GameSet.GetUICanvas().on(Input.EventType.TOUCH_END, this.onRoot, this, true);
        let [x, y] = Convert(this.initx, this.inity, this.layout, root);
        this.scroller.node.active = true;
        root.addChild(this.scroller.node);
        this.scroller.node.setPosition(x, y);
    }
    private onHide() {
        GameSet.GetUICanvas().off(Input.EventType.TOUCH_END, this.onRoot, this, true);
        this.open.setScale(this.scaleX, this.scaleY);
        let root = this.node.parent;
        let p = this.scroller.node.position;
        this.layout.addChild(this.scroller.node);
        this.scroller.node.setPosition(this.initx, this.inity);
        this.scroller.node.active = false;
    }

    hideScroller() {
        this.open.setScale(this.scaleX, this.scaleY);
        let root = this.scroller.node.parent;
        let p = this.scroller.node.position;
        let [x, y] = Convert(p.x, p.y, root, this.layout);
        this.layout.addChild(this.scroller.node);
        this.scroller.node.setPosition(x, y);
        this.scroller.node.active = false;
    }
}


