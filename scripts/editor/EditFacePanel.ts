import { EditBox, Node, UITransform, find } from "cc";
import { Panel } from "../GameRoot";
import { Convert, ConvertBoundToCavnas } from "../utils/Utils";
import { GameSet } from "../module/GameSet";
import { SceneCamera } from "../module/SceneCamera";

export class EditFacePanel extends Panel {
    protected prefab: string = "prefabs/EditFacePanel";
    private input: EditBox;
    private callback: Function;
    private thisObj: any
    protected onLoad(): void {
        this.input = this.find("input", EditBox);
        this.CloseBy("btn");
        this.input.node.on("editing-did-ended", this.onInput, this)
    }

    protected onShow(): void {

    }
    public flush(node: Node, callback: Function, thisObj: any): void {
        if (node.parent) {
            let p = node.position;
            let [px, py] = Convert(p.x, p.y, node.parent, this.node.parent);
            px = px - SceneCamera.instance.node.position.x;
            py = py - SceneCamera.instance.node.position.y;
            let nodeSize = node.getComponent(UITransform).contentSize;
            let size = this.node.getComponent(UITransform).contentSize;
            // let box = ConvertBoundToCavnas(find("UICanvas"), node);
            let x: number = 0, y: number = 0;
            if (px < 0) {
                x = px + nodeSize.width + size.width / 2;
            } else {
                x = px - nodeSize.width - size.width / 2;
            }
            if (py < 0) {
                y = py + nodeSize.height + size.height / 2;
            } else {
                y = py - nodeSize.height - size.height / 2;
            }
            this.node.setPosition(x, y);
        } else {
            this.node.setPosition(0, 0);
        }
        this.callback = callback;
        this.thisObj = thisObj;
    }
    protected onHide(...args: any[]): void {
        if (!this.callback || !this.thisObj) return;
        this.callback.call(this.thisObj, this.angle);
        this.thisObj = undefined;
        this.callback = undefined;
    }
    private angle: number;
    private onInput() {
        if (!this.callback || !this.thisObj) return;
        this.angle = Number(this.input.string);
        this.callback.call(this.thisObj, this.angle);
    }
}