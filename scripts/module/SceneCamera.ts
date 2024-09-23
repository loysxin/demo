import { Camera, Node, Tween, UITransform, Vec3, easing, tween, v3 } from "cc";
import { Convert, Second, maxx, minn } from "../utils/Utils";
import { GameSet } from "./GameSet";
import { EventMgr } from "../manager/EventMgr";

export class SceneCamera {
    public static instance: Camera;
    public static canvas: Node;
    private static default_orthHeight = 960;
    private static position: { x: number, y: number };
    private static shakeSeed = 0;
    static Init(camera: Camera, canvas: Node) {
        this.instance = camera;
        this.canvas = canvas;
        this.default_orthHeight = this.instance.orthoHeight;
        let p = this.instance.node.position;
        this.position = { x: p.x, y: p.y };
    }

    static get initOrthHeight() { return this.default_orthHeight; }

    /**
     * 获取屏幕到指定节点的投影
     * @param uiNode 
     * @returns 
     */
    static GetViewPort() {
        let size = this.canvas.getComponent(UITransform).contentSize;
        let p = this.instance.node.position;
        let target = this.instance.node.parent;
        let [x, y] = Convert(0, 0, this.canvas, target);
        let dx = p.x - x, dy = p.y - y;
        let [x1, y1] = Convert(-size.width / 2, -size.height / 2, this.canvas, target);
        let [x2, y2] = Convert(size.width / 2, size.height / 2, this.canvas, target);
        return [x1 + dx, y1 + dy, x2 + dx, y2 + dy, x, y];
    }

    /**摄像机移动移动 */
    static Move(dx: number, dy: number, emit: boolean = true) {
        let p = this.instance.node.position;
        let x = p.x + dx;
        let y = p.y + dy;
        // x = maxx(x, GameSet.Half_Width_SceneCanvas / GameSet.HomeScale);
        // y = maxx(y, GameSet.Half_Height_SceneCanvas / GameSet.HomeScale);

        // let scalew = 1, scaleh = 1;
        // if (GameSet.HomeScale <= 1) {
        //     scalew = -GameSet.Half_Width_SceneCanvas * (1 - GameSet.HomeScale) * 2;
        //     scaleh = -GameSet.Half_Height_SceneCanvas * (1 - GameSet.HomeScale) * 2;
        // } else {
        //     scalew = -GameSet.Half_Width_SceneCanvas * (1 - GameSet.HomeScale) / 2;
        //     scaleh = -GameSet.Half_Height_SceneCanvas * (1 - GameSet.HomeScale) / 2;
        // }
        // x = minn(x, (GameSet.HomeWidth - GameSet.Half_Width_SceneCanvas) + scalew);
        // y = minn(y, (GameSet.HomeHeight - GameSet.Half_Height_SceneCanvas) + scaleh);

        let w = GameSet.Half_Width_SceneCanvas * (1 + (this.instance.orthoHeight - this.initOrthHeight) / this.default_orthHeight);
        let h = GameSet.Half_Height_SceneCanvas * (1 + (this.instance.orthoHeight - this.initOrthHeight) / this.default_orthHeight);

        x = maxx(x, w);
        y = maxx(y, h);
        x = minn(x, GameSet.HomeWidth - w);
        y = minn(y, GameSet.HomeHeight - h);

        this.position.x = x;
        this.position.y = y;
        this.instance.node.setPosition(this.position.x, this.position.y);
        if (emit) EventMgr.emit("camera_trans");
    }

    static LookAt(x: number, y: number, emit = true) {
        this.position.x = x;
        this.position.y = y;
        this.instance.node.setPosition(this.position.x, this.position.y);
        if (emit) EventMgr.emit("camera_trans");
    }

    static Zoom(zoom: number, emit = true) {
        GameSet.HomeScale = zoom;
        this.instance.orthoHeight = this.initOrthHeight * (1 / zoom);
        if (emit) EventMgr.emit("camera_trans");
    }

    static mask(value: boolean) {
        this.instance.node.getChildByName("mask").active = value;
    }

    /**
     * 缓动到指定坐标
     * @param x 
     * @param y 
     */
    private static _isTween: boolean = false;
    private static _speed: number = 1000;
    private static _oldCameraPos: Vec3;
    private static _oldHomeScale: number;
    static TweenTo(x: number, y: number, scale: number, callBack?: Function) {
        if (this._isTween) return;
        this._isTween = true;
        Tween.stopAllByTarget(this.instance.node);
        this._oldCameraPos = this.instance.node.position.clone();
        this._oldHomeScale = GameSet.HomeScale;

        tween(this.instance.node).to(.2, { position: new Vec3(x, y, 0) }).call(() => {
            this._isTween = false;
            callBack?.();
            EventMgr.emit("camera_trans");
        }).start();
        let prevScale = GameSet.HomeScale > 1 / scale;
        GameSet.HomeScale = (1 / scale);
        tween(this.instance).to(.2, { orthoHeight: this.initOrthHeight * scale }).start();
        if (prevScale) EventMgr.emit("camera_trans", scale);
    }
    static recoverCamera() {
        if (!this._isTween && this._oldCameraPos && !this._oldCameraPos.strictEquals(this.instance.node.position)) {
            this.TweenTo(this._oldCameraPos.x, this._oldCameraPos.y, 1 / this._oldHomeScale);
        }
        // if (!this._isTween && this._oldCameraPos && !this._oldCameraPos.strictEquals(this.instance.node.position)) {
        //     this._isTween = true;
        //     Tween.stopAllByTarget(this.instance.node);
        //     tween(this.instance.node).to(2, { position: new Vec3(this._oldCameraPos.x, this._oldCameraPos.y, 0) }).call(() => {
        //         this._isTween = false;
        //         EventMgr.emit("camera_trans");
        //     }).start();
        //     GameSet.HomeScale = (1 / this._oldHomeScale);
        //     tween(this.instance).to(2, { orthoHeight: this.orthHeight * this._oldHomeScale }).start();
        //     EventMgr.emit("camera_trans", this._oldHomeScale);
        // }
    }
    /**
     * 震屏
     * @param power 
     * @param tick 
     * @param loop 
     * @param type 
     * @returns 
     */
    static async Shake(power: number, tick: number, loop: number, type: number = 1) {
        if (type == 1) {
            let target = this.instance.node;
            let seed = ++this.shakeSeed;
            let position = this.position;
            for (let i = 0; i < loop; i++) {
                if (seed != this.shakeSeed) return;
                let rad = Math.PI * 2 * Math.random();
                let x = position.x + power * Math.cos(rad);
                let y = position.y + power * Math.sin(rad);
                target.setPosition(x, y, 0);
                await Second(tick);
            }
            target.setPosition(position.x, position.y);
            ++this.shakeSeed;
        } else if (type == 2) {
            let target = this.instance;
            let seed = ++this.shakeSeed;
            let orthoHeight = target.orthoHeight;
            for (let i = 0; i < loop; i++) {
                if (seed != this.shakeSeed) return;
                target.orthoHeight = orthoHeight + (Math.random() * 2 - 1) * power;
                await Second(tick);
            }
            target.orthoHeight = orthoHeight;
            ++this.shakeSeed;
        } else {
            let camera = this.instance;
            let target = this.instance.node;
            let seed = ++this.shakeSeed;
            let position = this.position;
            let orthoHeight = camera.orthoHeight;
            for (let i = 0; i < loop; i++) {
                if (seed != this.shakeSeed) return;
                let rad = Math.PI * 2 * Math.random();
                let x = position.x + power * Math.cos(rad);
                let y = position.y + power * Math.sin(rad);
                target.setPosition(x, y, 0);
                camera.orthoHeight = orthoHeight + (Math.random() * 2 - 1) * power;
                await Second(tick);
            }
            target.setPosition(position.x, position.y);
            camera.orthoHeight = orthoHeight;
            ++this.shakeSeed;
        }
    }
}
