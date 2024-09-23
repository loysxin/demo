import { Component, Event, EventTouch, Input, Layout, Node, NodeEventType, ScrollView, Size, UITransform, Vec2, Vec3, _decorator, instantiate, v2, v3 } from "cc";
import { Second } from "./Utils";
import Logger from "./Logger";

const { ccclass, property, disallowMultiple, requireComponent } = _decorator;

@ccclass('AutoScroller')
@disallowMultiple(true)
@requireComponent(ScrollView)
export class AutoScroller extends Component {

    private scroller: ScrollView;
    private createItem: () => Node;
    public updateItem: (item: Node, data: any, index: number) => void;
    private datas: any[];
    private itemPool: Node[] = [];
    private itemTransForm: UITransform;
    private original: Node;
    private startX: number;
    private startY: number;
    private showing: { [pos: string]: Node } = {};
    private type: number;
    private contentW: number = 0;
    private contentH: number = 0;
    private spaceX: number = 10;
    private spaceY: number = 10;
    private paddingLeft: number = 0;
    private paddingRight: number = 0;
    private paddingTop: number = 0;
    private paddingDown: number = 0;
    private selectIndex: number;

    protected onLoad(): void {
        let scroller = this.getComponent(ScrollView);
        if (!scroller || !scroller.content) throw "滚动组件必须指定一个Content";
        let contentTrans = scroller.content.getComponent(UITransform);
        let ins = this;
        ins.scroller = scroller;
        ins.contentW = contentTrans.width;
        ins.contentH = contentTrans.height;
        if (this.scroller.content.children.length) {
            this.original = this.scroller.content.children[0];
            ins.startX = ins.original.position.x;
            ins.startY = ins.original.position.y;
            var trans = ins.original.getComponent(UITransform);
            ins.original.parent.removeChild(ins.original);
            ins.itemTransForm = trans;
        }

        let layout = scroller.content.getComponent(Layout);
        if (layout) {
            // Layout.Type.VERTICAL
            ins.type = layout.type;
            ins.paddingTop = layout.paddingTop;
            ins.paddingDown = layout.paddingBottom;
            ins.paddingLeft = layout.paddingLeft;
            ins.paddingRight = layout.paddingRight;
            ins.spaceX = layout.spacingX;
            ins.spaceY = layout.spacingY;
            layout.enabled = false;
        } else {
            if (!scroller.vertical && scroller.horizontal) {
                ins.type = Layout.Type.HORIZONTAL;
            } else {
                ins.type = Layout.Type.VERTICAL;
            }
        }
        for (let child of scroller.content.children) {
            ins.itemPool.push(child);
        }
        scroller.content.removeAllChildren();

        scroller.node.on("scrolling", () => {
            ins.flush.apply(ins);
        }, ins);
        
        if (this.datas && (this.original || this.createItem)) {
            this.UpdateDatas(this.datas);
        }
        
    }
    /**
     * 选择第一个
     */
    async SelectFirst(t: number = 0.1) {
        this.ScrollToHead(t);
        await Second(t);
        let children = this.scroller.content.children;
        for (let child of children) {
            if (child['$$index'] == 0) {
                this.onSelect(child);
                return;
            }
        }
    }
    async SelectLast(t: number = 0.1) {
        this.ScrollToLast(t);
        await Second(t);
        let children = this.scroller.content.children;
        for (let child of children) {
            if (child['$$index'] == this.datas.length - 1) {
                this.onSelect(child);
                return;
            }
        }
    }


    ScrollToHead(t: number = 0.1) {
        if (!this.scroller) return;
        if (this.scroller.vertical) {
            this.scroller.scrollToTop(t);
        } else {
            this.scroller.scrollToLeft(t);
        }
    }
    ScrollToLast(t: number = 0.1) {
        if (!this.scroller) return;
        if (this.scroller.vertical) {
            this.scroller.scrollToBottom(t);
        } else {
            this.scroller.scrollToRight(t);
        }
    }
    ScrollNext(t: number = 1) {
        this.scroller.scrollToRight(t);
    }
    ScrollPrev(t: number = 1) {
        this.scroller.scrollToLeft(t);
    }

    SetHandle(updateItem: (item: Node, data: any) => void, craeteItem?: () => Node) {
        this.updateItem = updateItem;
        if (craeteItem) {
            this.createItem = craeteItem;
            if (!this.original) {
                var trans = craeteItem().getComponent(UITransform);
                let box = this.scroller.getComponent(UITransform).getBoundingBoxTo(this.scroller.content.getWorldMatrix());
                this.startX = box.xMin + trans.anchorX * trans.contentSize.width;
                this.startY = box.yMax - (1 - trans.anchorY) * trans.contentSize.height;
            }
        }
    }

    /**
     * 清理列表，并使用null对象初始所有item
     */
    Clean() {
        this.UpdateDatas([]);
        for (let item of this.itemPool) {
            this.updateItem?.(item, null, -1);
        }
    }

    /**
     * 更新数据
     * @param datas 
     * @returns 
     */
    UpdateDatas(datas: any[]) {
        this.datas = datas;
        if (!this.datas) {
            debugger;
            return;
        }
        if (!this.scroller) return;
        let trans = this.scroller.content.getComponent(UITransform);
        let itemSize = this.itemTransForm.contentSize;
        let wide: number;
        let len: number = datas.length;
        if (this.type == Layout.Type.VERTICAL) {
            wide = Math.max(len * (itemSize.height + this.spaceY) - this.spaceY, 0);
            trans.setContentSize(this.contentW, wide + this.paddingTop + this.paddingDown);
        } else if (this.type == Layout.Type.HORIZONTAL) {
            wide = Math.max(len * (itemSize.width + this.spaceX) - this.spaceX, 0);
            trans.setContentSize(wide + this.paddingLeft + this.paddingRight, this.contentH);
        } else {
            let col = this.getGridCol(itemSize.width);
            let row = Math.ceil(len / col);
            wide = Math.max(row * (itemSize.height + this.spaceY) - this.spaceY, 0);
            trans.setContentSize(this.contentW + this.paddingLeft + this.paddingRight, wide + this.paddingTop + this.paddingDown);
        }
        for (let k in this.showing) this.showing[k]["$$index"] = undefined;
        this.flush(true);
    }
    private getGridCol(itemW: number): number {
        let col = Math.floor(this.contentW / itemW);
        while (col > 0) {
            let tempW: number = col * (itemW + this.spaceX) - this.spaceX;
            if (tempW <= this.contentW) {
                break;
            }
            col--;
        }
        return col;
    }
    GetSelectIndex() { return this.selectIndex; }
    reflush() { this.flush(true) }
    get children() {
        return this.scroller.content.children;
    }

    private getItem(index: any): Node {
        if (this.showing[index]) return this.showing[index];
        if (this.itemPool.length) {
            let item = this.itemPool.pop();
            if (!item.hasEventListener(Input.EventType.TOUCH_END, this.onSelect, this)) {
                item.on(Input.EventType.TOUCH_END, this.onSelect, this);
            }
            return item;
        }
        if (this.original) {
            //console.error("-------->创建Item")
            let item = instantiate(this.original);
            item.on(Input.EventType.TOUCH_END, this.onSelect, this);
            return item;
        }
        let item = this.createItem();
        item.on(Input.EventType.TOUCH_END, this.onSelect, this);
        return item;
    }
    private onSelect(e: EventTouch | Node) {
        let item: Node;
        if (e instanceof EventTouch) {
            item = e.target;
        } else {
            item = e;
        }
        this.selectIndex = item["$$index"];
        if (item != undefined) {
            this.node.emit("select", item["$$index"], item);
        }
    }

    private layout(item: Node, nx: number, ny: number) {
        let trans = item.getComponent(UITransform);
        let x = this.startX + nx * (trans.contentSize.width + this.spaceX);
        let y = this.startY - ny * (trans.contentSize.height + this.spaceY);
        if (this.type == Layout.Type.HORIZONTAL || this.type == Layout.Type.GRID) x += this.paddingLeft;
        if (this.type == Layout.Type.VERTICAL || this.type == Layout.Type.GRID) y -= this.paddingTop;
        item.setPosition(x, y, 0);
    }

    private flush(reset: boolean = false) {
        if (!this.datas) return;
        var trans = this.scroller.getComponent(UITransform);
        let box = trans.getBoundingBoxTo(this.scroller.content.getWorldMatrix());
        let leftX = box.xMin, topY = box.yMax;
        let rightX = box.xMax, downY = box.yMin;
        // Logger.log("box", rightX - leftX);
        let views = {};
        let itemSize = this.itemTransForm.contentSize;
        if (this.type == Layout.Type.VERTICAL) {
            let hide = itemSize.height + this.spaceY;
            let start = Math.floor(Math.max(0, this.startY - topY) / hide);
            let end = Math.ceil(Math.max(0, this.startY - downY) / hide);
            // Logger.log("flush", start, end);
            for (let i = start; i <= end; i++) {
                if (i >= this.datas.length) break;
                let item = this.getItem(i);
                if (item['$$index'] != i || reset) this.updateItem?.(item, this.datas[i], i);
                item['$$index'] = i;
                this.scroller.content.addChild(item);
                this.layout(item, 0, i);
                views[i + ''] = item;
                this.showing[i + ''] = item;
            }
        } else if (this.type == Layout.Type.HORIZONTAL) {
            let wide = itemSize.width + this.spaceX;
            let start = Math.floor(Math.max(0, leftX - this.startX) / wide);
            let end = Math.ceil(Math.max(0, rightX - this.startX) / wide);
            // Logger.log("flush", start, end);
            for (let i = start; i <= end; i++) {
                if (i >= this.datas.length) break;
                let item = this.getItem(i);
                if (item['$$index'] != i || reset) this.updateItem?.(item, this.datas[i], i);
                item['$$index'] = i;
                this.scroller.content.addChild(item);
                this.layout(item, i, 0);
                views[i + ''] = item;
                this.showing[i + ''] = item;
            }
        } else if (this.type == Layout.Type.GRID) {
            let hide = itemSize.height + this.spaceY;
            let start = Math.floor(Math.max(0, this.startY - topY) / hide);
            let end = Math.ceil(Math.max(0, this.startY - downY) / hide);
            let col = this.getGridCol(itemSize.width);
            let i = start * col;
            for (let y = start; y <= end; y++) {
                for (let x = 0; x < col; x++) {
                    if (i >= this.datas.length) break;
                    // Logger.log("flush", i, x, y);
                    let item = this.getItem(i);
                    if (item['$$index'] != i || reset) this.updateItem?.(item, this.datas[i], i);
                    item['$$index'] = i;
                    this.scroller.content.addChild(item);
                    this.layout(item, x, y);
                    views[i + ''] = item;
                    this.showing[i + ''] = item;
                    i++;
                }
                if (i >= this.datas.length) break;
            }
        }
        for (let k in this.showing) {
            if (!views[k]) {
                this.receiveItem(this.showing[k]);
                delete this.showing[k];
            }
        }
    }

    private receiveItem(item: Node) {
        //console.error("-------->回收Item")
        if (item.parent) item.parent.removeChild(item);
        item["$$index"] = undefined;
        this.itemPool.push(item);
    }

    // 滑动到指定的位置
    ScrollToIndex(index: number){

        for (let k in this.showing) {
            this.receiveItem(this.showing[k]);
            delete this.showing[k];
        }

        var trans = this.scroller.getComponent(UITransform);
        let box = trans.getBoundingBoxTo(this.scroller.content.getWorldMatrix());

        let views = {};
        let itemSize = this.itemTransForm.contentSize;
        if (this.type == Layout.Type.VERTICAL) {
            let hide = itemSize.height + this.spaceY;
            let start = index;
            let end =  start + Math.ceil((box.yMax - box.yMin) / hide);
            for (let i = start; i <= end; i++) {
                if (i >= this.datas.length) break;
                let item = this.getItem(i);
                if (item['$$index'] != i) this.updateItem?.(item, this.datas[i], i);
                item['$$index'] = i;
                this.scroller.content.addChild(item);
                this.layout(item, 0, i);
                views[i + ''] = item;
                this.showing[i + ''] = item;
            }
            let transform = this.scroller.content.getComponent(UITransform);

            this.scroller.content.setPosition(0, index * hide + this.contentH * (transform.anchorY - 0.5));
        }
        // else if (this.type == Layout.Type.HORIZONTAL) {
        //     let width = itemSize.width + this.spaceX;
        //     let start = index;
        //     let end =  start + Math.ceil((box.xMax - box.xMin) / width);
        //     this.scroller.content.setPosition(0, 0);
        //     for (let i = start; i <= end; i++) {
        //         if (i >= this.datas.length) break;
        //         let item = this.getItem(i);
        //         if (item['$$index'] != i) this.updateItem?.(item, this.datas[i], i);
        //         item['$$index'] = i;
        //         this.scroller.content.addChild(item);
        //         this.layout(item, i, 0);
        //         views[i + ''] = item;
        //         this.showing[i + ''] = item;
        //     }

        //     this.scroller.content.setPosition(index * width, 0);
        // }

    }
}
