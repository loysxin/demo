import { Input, Label, Node } from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_PvpSerchFinsh } from "../../manager/EventMgr";

export class Tips extends Panel {
    protected prefab: string = "prefabs/ui/Tips";
    private label: Label;
    private btn1: Node;
    private btn2: Node;
    private okCallback: Function;
    private noCallback: Function;
    protected onLoad(): void {
        this.label = this.find("Label", Label);
        this.btn1 = this.find("btn1");
        this.btn2 = this.find("btn2");
        this.btn1.on(Input.EventType.TOUCH_END, this.onOk, this);
        this.btn2.on(Input.EventType.TOUCH_END, this.onNo, this);
        this.CloseBy("mask");
    }

    protected onShow(): void {

    }
    public flush(msg: string, okCallBack?: Function, noCallBack?: Function): void {
        this.label.string = msg;
        this.okCallback = okCallBack;
        this.noCallback = noCallBack;
        if (okCallBack) {
            this.btn1.active = true;
            this.btn2.active = true;
        } else {
            this.btn1.active = false;
            this.btn2.active = false;
        }
        EventMgr.emit(Evt_PvpSerchFinsh);
    }
    protected onHide(...args: any[]): void {
        this.okCallback = undefined;
        this.noCallback = undefined;
    }
    private onOk() {
        this.okCallback && this.okCallback();
        this.Hide();
    }
    private onNo() {
        this.noCallback && this.noCallback();
        this.Hide();
    }
}