import { Canvas, EventMouse, EventTouch, Input, KeyCode, Node, Sprite, SpriteFrame, Tween, UIOpacity, UITransform, Widget, easing, find, input, instantiate, tween } from "cc";
import { ANDROID, DEV, EDITOR, HTML5, IOS } from "cc/env";
import { Convert } from "../utils/Utils";
import { FilmMaker } from "../manager/FilmMaker";

export class EditorGuide {

    private isCtrlDown: boolean = false;

    constructor() {
        if (!EDITOR) return;
        input.on(Input.EventType.KEY_DOWN, this.onKey, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onKey(e: any) {
        if (e.keyCode == KeyCode.CTRL_LEFT || e.keyCode == KeyCode.CTRL_RIGHT) {
            this.isCtrlDown = true;
            if (DEV && !find("Canvas").hasEventListener(Input.EventType.TOUCH_START, this.onTouch, this)) {
                find("Canvas").on(Input.EventType.TOUCH_START, this.onTouch, this, true);
                // find("SceneCanvas").on(Node.EventType.MOUSE_DOWN, this.onTouch, this);
            }
        } else {
            find("Canvas").off(Input.EventType.TOUCH_START, this.onTouch, this, true);
            this.isCtrlDown = false;
        }
    }
    private onKeyUp(e: any) {
        this.isCtrlDown = false;
        find("Canvas").off(Input.EventType.TOUCH_START, this.onTouch, this, true);
    }

    private async onTouch(e: EventTouch) {
        if (!this.isCtrlDown) return;
        let target: Node = e.target;
        let path: string = target.getPathInHierarchy();
        let canvas: Node = find(path.split("/")[0]);
        console.log(path);
        if (this.copyToClip(path)) {
            target = find(path);
            let [x, y] = Convert(target.position.x, target.position.y, target.parent, canvas);

            const scale = target.getScale().x * 1.5;
            let tran = target.getComponent(UITransform);
            // let clone = instantiate(target);
            let clone = new Node();
            let sprite = clone.addComponent(Sprite);
            let sf = await FilmMaker.Shoot(target);
            sprite.spriteFrame = sf;
            // if (clone.getComponent(Widget)) clone.getComponent(Widget).destroy();
            clone.getComponent(UITransform).setAnchorPoint(tran.anchorX, tran.anchorY);
            canvas.addChild(clone);
            clone.setPosition(x, y);

            let alpha = clone.getComponent(UIOpacity);
            if (!alpha) alpha = clone.addComponent(UIOpacity);
            tween(alpha).to(1, { opacity: 0 }, {
                progress: (start: number, end: number, current: number, ratio: number) => {
                    clone.setScale(ratio * scale, ratio * scale);
                    return current;
                }, easing: easing.circOut
            }).call(() => {
                Tween.stopAllByTarget(alpha);
                clone.destroy();
            }).start();
        }
    }
    private copyToClip(value: string) {
        // 创建一个临时的textarea元素，将文本放入其中
        const textarea = document.createElement('textarea');
        textarea.value = value;
        document.body.appendChild(textarea);
        // 选中文本
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        let success = false;
        try {
            // 尝试执行复制操作
            document.execCommand('copy');
            console.log('Text copied to clipboard:', value);
            success = true;
        } catch (err) {
            console.error('Unable to copy text to clipboard');
            success = false;
        }
        // 移除临时元素
        document.body.removeChild(textarea);
        return success;
    }
}