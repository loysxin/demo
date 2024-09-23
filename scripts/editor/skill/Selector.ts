import { _decorator, Component, EditBox, EventTouch, find, Input, Node, ScrollView, UITransform } from 'cc';
import { AutoScroller } from '../../utils/AutoScroller';
import { Convert, getRoot } from '../../utils/Utils';
const { ccclass, property } = _decorator;

@ccclass('Selector')
export class Selector extends Component {

    @property(EditBox)
    private input: EditBox;

    @property(Node)
    private open: Node;

    @property(AutoScroller)
    private scroller: AutoScroller;

    private static current: Selector;

    private datas: any[] = [];
    private layout: Node;

    protected onLoad(): void {
        this.layout = this.scroller.node.parent;
        this.open.on(Input.EventType.TOUCH_END, this.onOpen, this);
        this.scroller.node.on("select", this.onSelect, this);
        this.input.node.on("editing-did-ended", this.onInput, this);

        let size = this.getComponent(UITransform).contentSize;
        let h = this.scroller.node.getComponent(UITransform).contentSize.height;
        this.scroller.node.getComponent(UITransform).setContentSize(size.width, h);
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
    Init(datas: any[], updateItem: (item: Node, data: any) => void, craeteItem?: () => Node) {
        this.UpdateList(datas);
        this.scroller.SetHandle(updateItem, craeteItem);
    }

    Select(index: number) {
        let data = this.datas[index];
        this.scroller.updateItem(this.input.node, data, index);
        return this.input.string;
    }

    get string() {
        return this.input.string;
    }
    set string(value: string) {
        this.input.string = value;
    }

    HideList() {
        this.onHide();
    }

    UpdateList(datas: any[]) {
        this.datas = datas;
        this.scroller.UpdateDatas(datas);
    }

    private onSelect(index: number) {
        if (Selector.current != this) Selector.current = undefined;
        this.onHide();
        let data = this.Select(index);
        if (data == "" || data == undefined) return;
        this.node.emit("select", data, this.datas[index]);
    }
    private onInput(editbox: EditBox) {
        let value = editbox.string;
        if (value == "" || value == undefined) return;
        this.node.emit("select", value);
    }
    private onOpen(e: EventTouch) {
        if (Selector.current && Selector.current != this) {
            Selector.current.onHide();
        }
        if (this.scroller.node.active) {
            if (Selector.current != this) Selector.current = undefined;
            this.onHide();
        } else {
            Selector.current = this;
            this.onShow();
            this.scroller.UpdateDatas(this.datas);
        }
        this.node.emit("open");
    }

    private onShow() {
        let root = getRoot(this.scroller.node);
        let p = this.scroller.node.position;
        let [x, y] = Convert(p.x, p.y, this.layout, root);
        this.scroller.node.active = true;
        root.addChild(this.scroller.node);
        this.scroller.node.setPosition(x, y);
    }
    private onHide() {
        let root = this.scroller.node.parent
        let p = this.scroller.node.position;
        let [x, y] = Convert(p.x, p.y, root, this.layout);
        this.layout.addChild(this.scroller.node);
        this.scroller.node.setPosition(x, y);
        this.scroller.node.active = false;
    }
}


