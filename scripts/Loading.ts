import { Component, Node, ProgressBar, _decorator, find } from "cc";
import { PostUriMsg } from "./Platform";

const { ccclass, property } = _decorator;

@ccclass('Loading')
export class Loading extends Component {

    @property(ProgressBar)
    progress: ProgressBar = null;
    @property(Node)
    canvas: Node = null;

    private static instance: Loading;

    protected onLoad(): void {
        this.node.active = true;
        if (!Loading.instance) {
            Loading.instance = this;
        } else {
            this.destroy();
        }
        PostUriMsg?.("StartGame");
    }

    static get Showing() {
        if (!this.instance) return false;
        return this.instance.node.parent && this.instance.node.active;
    }

    static Show(value?: number, total?: number) {
        if (!this.instance) return;
        if (value != undefined && total > 0 && value < total) {
            if (!this.instance.node.active) {
                this.instance.node.active = true;
            }
            if (this.instance.node.parent != this.instance.canvas) {
                this.instance.canvas.addChild(this.instance.node);
            }
            this.Progress(value, total);
        } else {
            this.Hide();
        }
    }

    static Hide() {
        if (!this.instance) return;
        this.instance.node.active = false;
        if (this.instance.node.parent) this.instance.node.parent.removeChild(this.instance.node);
    }

    private static Progress(value: number, total: number) {
        if (!this.instance) return;
        this.instance.progress.progress = value / total;
    }
}