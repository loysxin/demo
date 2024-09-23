import { Animation, AnimationClip, Asset, AssetManager, CCString, Component, Node, Sprite, SpriteFrame, UITransform, Vec3, _decorator, animation, game, v3 } from "cc";
import { minn } from "./Utils";
import Logger from "./Logger";
const { ccclass, property, disallowMultiple, requireComponent } = _decorator;


type ClipZ = { offset: { x: number, y: number }[], frames: SpriteFrame[] };
type ClipMap = Map<string, ClipZ>;
/**动画剪辑总表 */
let $AllClips: ClipMap = new Map<string, ClipZ>();

/**动画分组表 */
let $AllAnims: Map<string, ClipMap> = new Map<string, ClipMap>();

/**排序 */
const SortReg = /[0-9]+/g;

/**
 * 加载动画
 * @param path
 * @param cb 
 * @returns 
 */
async function LoadFrameFolder(path: string, cb?: (data: ClipMap) => void) {
    if (path.charAt(path.length - 1) == "/" || path.charAt(path.length - 1) == "\\") {
        path = path.substring(0, path.length - 1);
    }
    if ($AllAnims.has(path)) {
        let anim = $AllAnims.get(path);
        cb && cb(anim);
        return Promise.resolve(anim);
    }
    let rootFolder = "";
    let r = path.match(/[\\\/]?[^\\\/]+/);
    if (!r || !r.length) return [];
    rootFolder = r[0];
    let anim = new Map<string, ClipZ>();
    let groups: { [folder: string]: string[] } = {};
    let ab = AssetManager.instance.getBundle("res");
    let lst = ab.getDirWithPath(path);
    for (var child of lst) {
        if (child.ctor == SpriteFrame) {
            let folder = child.path.replace(/[\\\/]spriteFrame$/, "").replace(/[\\\/]?[^\\\/]+$/, "");
            if (!folder || folder == "") continue;
            if (anim.has(folder)) continue;
            if ($AllClips.has(folder)) {
                anim.set(folder, $AllClips.get(folder));
            } else {
                let urls = groups[folder] || [];
                urls.push(child.path);
                groups[folder] = urls;
            }
        }
    }
    for (let k in groups) {
        // Logger.log("loadGrouop", k);
        let frames = await loadGroup(groups[k]);
        let w = 0, h = 0;
        for (let frame of frames) {
            if (!w) w = frame.getOriginalSize().width;
            if (!h) h = frame.getOriginalSize().height;
            frame["sortId"] = Number(frame.name.match(SortReg).join(""));
        }
        frames.sort((a, b) => {
            return a['sortId'] - b['sortId'];
        });
        // Logger.log("size", w, h);
        let offsets = [];
        for (let i = 0; i < frames.length; i++) {
            let rect = frames[i]['_rect'];
            let originalSize = frames[i]['_originalSize'];
            offsets[i] = {
                x: -1 * (originalSize.width / 2 - rect.x - rect.width / 2),
                y: originalSize.height / 2 - rect.y - rect.height / 2
            };
        }

        let clip = { offset: offsets, frames: frames };
        $AllClips.set(k, clip);
        anim.set(k, clip);
    }
    cb && cb(anim);
    return Promise.resolve(anim);
}

async function loadGroup(paths: string[]) {
    let ab = AssetManager.instance.getBundle("res");
    let loaders: Promise<SpriteFrame>[] = [];
    for (var path of paths) {
        let p = new Promise<SpriteFrame>((resolve, reject) => {
            ab.load(path, SpriteFrame, (err, data) => {
                resolve(data);
            });
        })
        loaders.push(p);
    }
    return Promise.all(loaders);
}

const Stoping = 0;
const Pausing = 1;
const Playing = 2;

@ccclass('FrameAni')
@disallowMultiple(true)
@requireComponent(Sprite)
export class FrameAni extends Component {

    @property({ type: CCString, tooltip: "指定动画根目录" })
    private rootUrl: string = undefined;

    /**设置动画根目录 */
    async SetRootUrl(path: string) {
        if (!this._loaded) await this.loadSub;
        this.rootUrl = path;
        this._loaded = false;
        this.reset();
        await this.loadSub;
        Logger.log("SetRoolUrl", this._state, this._actionName, this._loop);
        if (this._state == Playing) {
            this.Play(this._actionName, this._loop);
        }
    }

    private _host: string = "";
    private _loadSub: Promise<any>;
    private _loadEnd: Function;
    private _loaded: boolean = false;
    private _loop: number = 0;
    private _index = 0;
    private _actionName: string = "";
    private _state: 0 | 1 | 2 = Stoping;
    private _frameTick = 0;
    private _frameRate = 30;
    private _loopTime = 0;
    private _startTime = 0;
    private _fixedTick: boolean = false;
    private _clipMap: ClipMap = new Map();
    private _currentClip: ClipZ;
    private _sprite: Sprite;
    private $setPostion: (val: Readonly<Vec3> | number, y?: number, z?: number) => void;

    protected onLoad(): void {
        this._sprite = this.node.getComponent(Sprite);
        if (this.rootUrl) {
            this.reset();
        } else {
            let ab = AssetManager.instance.getBundle("res");
            let info: any = ab.getAssetInfo(this._sprite.spriteFrame.uuid);
            if (info && info.path) {
                Logger.log(info.path);
                this.rootUrl = info.path.replace(/db:[\/\\]+assets[\/\\]+res[\/\\]+/, "").replace(/[^\/\\]+[\/\\]spriteFrame/, "");
                Logger.log("rootUrl", this.rootUrl);
                this.reset();
            }
        }
        Logger.log("onLoaded");
    }

    protected reset(): void {
        let path = this.rootUrl;
        if (path.charAt(path.length - 1) == "/" || path.charAt(path.length - 1) == "\\") {
            path = path.substring(0, path.length - 1);
        }
        this._host = path;
        this.beforLoad();
        if ($AllAnims.has(path)) {
            let anim = $AllAnims.get(path);
            anim.forEach((clip, key) => {
                this.addClip(clip, key);
            });
            this.init();
        } else {
            let t = this;
            LoadFrameFolder(path, data => {
                $AllAnims.set(path, data);
                data.forEach((clip, key) => {
                    t.addClip(clip, key);
                });
                t.init();
            });
        }
    }

    beforLoad(): void {
        if (!this.$setPostion) {
            this.$setPostion = this.node.setPosition.bind(this.node);
            this.node.setPosition = this.setPosition.bind(this);
            this.node.getPosition = this.getPostion.bind(this);
            Vec3.copy(this.$lpos, this.node.position);
        }
        let thisObj = this;
        this._loadSub = new Promise((resolve, reject) => {
            thisObj._loadEnd = resolve;
        });
    }

    private init() {
        this._loaded = true;
        if (this._state == Playing) {
            let path = this._host + "/" + this._actionName;
            if (this._actionName == "") path = this._host;
            path = path.replace(/\/\//g, "");
            this._currentClip = this._clipMap.get(path);
            if (!this._currentClip) {
                this._sprite.spriteFrame = null;
                // this._state = Stoping;
            } else {
                if (this._loopTime) {
                    this._frameRate = 1 / (this._loopTime / this._currentClip.frames.length);
                }
                let dt = (game.totalTime - this._startTime) / 1000;
                this._frameTick = 1 / this._frameRate;
                let duration = this._currentClip.frames.length * this._frameTick;
                this._loop -= Math.floor(dt / duration);
                if (this._loop <= 0) {
                    this._state = Stoping;
                    return;
                }
                dt = dt % duration;
                this._index = Math.floor(dt / this._frameTick);
                this._frameTick = dt % this._frameTick;
                this._sprite.spriteFrame = this._currentClip.frames[this._index];
            }
        }
        this._loadEnd();
    }

    Play(name: string = "", loop: number = Infinity, startFrame: number = 0) {
        this._actionName = name;
        this._loop = loop;
        this._startTime = game.totalTime;
        this._state = Playing;
        if (this._loaded) {
            let path = this._host + "/" + name;
            if (name == "") path = this._host;
            path = path.replace(/\/\//g, "");
            this._currentClip = this._clipMap.get(path);
            if (!this._currentClip || !this._currentClip.frames.length) {
                this._sprite.spriteFrame = null;
                this._state = Stoping;
                return;
            }
            if (this._loopTime) {
                this._frameRate = 1 / (this._loopTime / this._currentClip.frames.length);
            }
            this._frameTick = 1 / this._frameRate;
            this._index = startFrame;
        }
    }

    Pause() {
        this._state = Pausing;
    }
    Resume() {
        this._state = Playing;
    }
    Stop() {
        this._state = Stoping;
    }
    set frameRate(value: number) {
        this._loopTime = 0;
        this._frameRate = value;
    }
    get frameRate() { return this._frameRate; }

    SetLoopTime(value: number) {
        this._loopTime = value;
        if (this._currentClip && this._currentClip.frames.length) {
            this._frameRate = 1 / (this._loopTime / this._currentClip.frames.length);
        }
    }
    GetLoopTime() {
        if (this._loopTime) return this._loopTime;
        if (this._currentClip && this._currentClip.frames.length) {
            return 1 / this._frameRate * this._currentClip.frames.length;
        }
        return 0;
    }

    get currentAction() {
        return this._actionName;
    }

    private $lpos: Vec3 = v3();
    public setPosition(val: Readonly<Vec3> | number, y?: number, z?: number): void {
        if (y === undefined && z === undefined) {
            Vec3.copy(this.$lpos, val as Vec3);
        } else if (z === undefined) {
            Vec3.set(this.$lpos, val as number, y!, this.$lpos.z);
        } else {
            Vec3.set(this.$lpos, val as number, y!, z);
        }
        if (this._currentClip) {
            // let ap = this.getComponent(UITransform).anchorPoint;
            // let wide = this.getComponent(UITransform).width, hide = this.getComponent(UITransform).height;
            // Logger.log(this._currentClip.w, this._currentClip.h, wide, hide);
            // let dx = this._currentClip.w * ap.x - wide * ap.x;
            // let dy = this._currentClip.h * ap.y - hide * ap.y;
            // this.$setPostion(this.$lpos.x + dx, this.$lpos.y + dy, 0);
            let offset = this._currentClip.offset[this._index] || { x: 0, y: 0 };
            this.$setPostion(this.$lpos.x + offset.x, this.$lpos.y + offset.y, 0);
        } else {
            this.$setPostion(this.$lpos);
        }
    }
    public getPostion(out?: Vec3) {
        if (out) {
            Vec3.copy(out, this.$lpos);
            return out;
        }
        return Vec3.copy(new Vec3(), this.$lpos);
    }
    public get postion() { return this.$lpos; }

    protected update(dt: number): void {
        if (!this._loaded) return;
        if (this._state != Playing) return;
        let ave = 1 / this._frameRate;
        if (this._fixedTick) {
            let dt = game.totalTime - this._startTime;
            let duration = ave * this._currentClip.frames.length;
            if (Math.floor(dt / duration) > this._loop) {
                this._state = Stoping;
                return;
            }
            this._index = minn(Math.floor((dt % duration) / ave), this._currentClip.frames.length - 1);
            this._sprite.spriteFrame = this._currentClip.frames[this._index];
            this.setPosition(this.$lpos);
        } else {
            this._frameTick += dt;
            if (this._frameTick >= ave) {
                this._frameTick = 0;
                this._sprite.spriteFrame = this._currentClip.frames[this._index];
                this.setPosition(this.$lpos);
                this._index++;
                if (this._index >= this._currentClip.frames.length) {
                    if (this._loop <= 0) {
                        this._state = Stoping;
                        return;
                    }
                    this._index = 0;
                    this._loop--;
                }
            }
        }
    }
    private addClip(frames: ClipZ, key: string) {
        this._clipMap.set(key, frames);
    }

    get loadSub() {
        return this._loadSub;
    }

    get playing() {
        if (!this._actionName) return false;
        return this._state == Playing;
    }

    SyncTime(value: boolean) {
        this._fixedTick = value;
    }
}