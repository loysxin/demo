import { _decorator, Camera, Component, find, Node, Rect, RenderTexture, SpriteFrame, UITransform, v2 } from 'cc';
import { GetBoundingBoxTo, MapChildrenFor, } from '../utils/Utils';

const { ccclass, property } = _decorator;

@ccclass('FilmMaker')
export class FilmMaker extends Component {
    private static instance: FilmMaker;
    private caches: { [uuid: string]: SpriteFrame } = {};
    private camera: Camera;
    private queue: FilmParam[] = [];
    private current: FilmParam;

    protected onLoad(): void {
        if (FilmMaker.instance) {
            throw "FilmUtils instance error!";
        }
        FilmMaker.instance = this;
        this.camera = this.getComponent(Camera);
    }

    protected update(dt: number): void {
        if (this.current) this.render();
        if (this.queue.length) {
            let param = this.queue.shift();
            this.shoot(param);
        }
    }

    static async Shoot(node: Node, cb?: (sf: SpriteFrame) => void) {
        if (this.instance.caches[node.uuid]) {
            return Promise.resolve(this.instance.caches[node.uuid]);
        }
        if (!node.activeInHierarchy || !node.getComponent(UITransform)) {
            return Promise.reject();
        }
        if (this.instance.current && this.instance.current.target == node) {
            return this.instance.current.p;
        }
        let queue = this.instance.queue;
        for (let param of queue) {
            if (param.target == node) return param.p;
        }
        let h: Function;
        let promise = new Promise<SpriteFrame>((resolve, reject) => {
            h = resolve;
        })
        let param: FilmParam = {
            cb: cb,
            handle: h,
            tex: undefined,
            rect: undefined,
            target: node,
            layers: {},
            p: promise
        }
        this.instance.queue.push(param);
        return promise;
    }

    protected shoot(param: FilmParam) {
        let layers = {};
        let target = param.target;
        MapChildrenFor(target, (child: Node) => {
            layers[child.uuid] = child.layer;
            child.layer = 4;
        })
        param.layers = layers;

        let canvas = find(target.getPathInHierarchy().split("/")[0]);
        param.rect = GetBoundingBoxTo(target, canvas);
        this.camera.node.setPosition(param.rect.center.x, param.rect.center.y);
        let size = canvas.getComponent(UITransform).contentSize;
        param.rect.center = v2(-size.width / 2, -size.height / 2);

        param.tex = new RenderTexture();
        param.tex.initialize({ width: size.width, height: size.height });
        this.camera.targetTexture = param.tex;

        this.current = param;

    }

    protected render() {
        if (!this.current) return;

        let spriteFrame = new SpriteFrame();
        spriteFrame.texture = this.current.tex;
        spriteFrame.rect = this.current.rect;

        let layers = this.current.layers;
        MapChildrenFor(this.current.target, (child: Node) => {
            child.layer = layers[child.uuid];
        })
        this.caches[this.current.target.uuid] = spriteFrame;
        this.current.cb && this.current.cb(spriteFrame);
        this.current.handle(spriteFrame);
        this.current.cb = undefined;
        this.current.handle = undefined;
        this.current.rect = undefined;
        this.current.target = undefined;
        this.current.tex = undefined;
        this.current = undefined;
        
    }

}
type FilmParam = {
    cb: Function;
    handle: Function;
    tex: RenderTexture;
    rect: Rect;
    target: Node;
    layers: { [uuid: string]: number };
    p: Promise<SpriteFrame>;
}

