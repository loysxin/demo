import { BlockInputEvents, Button, Camera, Canvas, Color, Component, EventHandler, EventTouch, Graphics, IVec2Like, ImageAsset, Input, Label, Mat4, Material, Node, Rect, Scene, Sprite, SpriteFrame, Texture2D, Tween, UITransform, Vec2, Vec3, find, game, js, math, sp, toDegree, tween, v2, v3 } from "cc";
import PlayerData, { SPlayerDataItem } from "../module/roleModule/PlayerData";
import { CfgMgr } from "../manager/CfgMgr";
import { DateUtils } from "./DateUtils";


/**
 * 精度范围内对比两个数
 * @param value1 
 * @param value2 
 */
export function Equals(value1: number, value2: number): boolean;
/**
 * 精度范围内对比两个坐标
 * @param v1 
 * @param v2 
 */
export function Equals(v1: { x: number, y: number }, v2: { x: number, y: number }): boolean;
export function Equals(value1: any, value2: any) {
    if (value1 == undefined && value2 == undefined) return true;
    if (value1 == undefined && value2 != undefined) return false;
    if (value1 != undefined && value2 == undefined) return false;
    if (typeof (value1) == "number") return math.equals(value1, value2);
    return Vec2.equals(value1, value2);
}

/**
 * 获取对象的类名称
 * @param value 
 * @returns 
 */
export function getQualifiedClassName(value: any): string {
    for (let k in getDefinitionByNameCache) {
        if (getDefinitionByNameCache[k] == value) return k;
    }
    var className = js.getClassName(value);
    if (className) return className;
    var type = typeof value;
    if (!value || (type != "object" && !value.prototype)) {
        return type;
    }
    var prototype = value.prototype ? value.prototype : Object.getPrototypeOf(value);
    if (prototype.hasOwnProperty("__class__")) {
        return prototype["__class__"];
    }

    if (typeof value == "function" && value.name !== undefined) return value.name;

    var constructorString: string = prototype.constructor.toString().trim();

    var index = constructorString.indexOf("class ");
    if (index != -1) {
        constructorString = constructorString.substring(index + 6);
        index = constructorString.search(/[\s\{]/);
        if (index != -1) {
            var className = constructorString.substring(0, index);
        } else {
            var className = String(typeof (value));
        }
    } else {
        var className = String(typeof (value));
    }

    Object.defineProperty(prototype, "__class__", {
        value: className,
        enumerable: false,
        writable: true
    });
    return className;
}

let getDefinitionByNameCache = {};

/**
 * 获取对象类型
 * @param name 
 * @returns 
 */
export function getDefinitionByName(name: string): any {
    var classz = js.getClassByName(name);
    if (classz) return classz;
    if (!name)
        return null;
    var definition = getDefinitionByNameCache[name];
    if (definition) {
        return definition;
    }
    var paths = name.split(".");
    var length = paths.length;
    definition = window;
    for (var i = 0; i < length; i++) {
        var path = paths[i];
        definition = definition[path];
        if (!definition) {
            return null;
        }
    }
    getDefinitionByNameCache[name] = definition;
    return definition;
}

/**是否数组 */
export function IsArray(obj: any) {
    if (!Array.isArray) {
        Array["isArray"] = function (arg): arg is any[] {
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }
    return Array.isArray(obj);
}

/**给对象附上默认值 */
export function ParseJson(json: any, target: any) {
    if (IsArray(target) && IsArray(json)) {
        for (let i = 0; i < target.length; i++) {
            if (json[i] == undefined) {
                json[i] = target[i];
            } else {
                json[i] = ParseJson(json[i], target[i]);
            }
        }
        return json;
    } else if (typeof (target) == "object" && typeof (json) == "object") {
        for (let key in target) {
            if (target.hasOwnProperty(key)) {
                let obj = target[key];
                if (json[key] == undefined) {
                    json[key] = obj;
                } else {
                    json[key] = ParseJson(json[key], obj);
                }
            }
        }
        return json;
    } else {
        if (json == undefined) return target;
        return json;
    }
}

/**
 * 循环缓动
 * @param target 
 * @param time 
 * @param props 
 */
export function CycleTween(target: Node, time: number, ...props: any[]) {
    Tween.stopAllByTarget(target);
    let obj = { props: props, index: -1 };
    let callback: Function;
    callback = function (t) {
        obj.index = (obj.index + 1) % obj.props.length;
        let prop = obj.props[obj.index];
        if (typeof (prop) == "function") {
            let results = prop();
            if (results.length) {
                if (t == undefined) time = results[0];
                prop = results[1];
            } else {
                prop = results;
            }
        }
        tween(target).to(time, prop).call(callback).start();
    }
    callback(time);
}

function noTouch(touch: EventTouch) {
    touch.preventSwallow = true;
}

/**屏蔽点击 */
export function NoTouch(target: Node) {
    let block = target.getComponent(BlockInputEvents);
    if (block) block.destroy();
    target.on(Input.EventType.TOUCH_START, noTouch);
    target.on(Input.EventType.TOUCH_MOVE, noTouch);
    target.on(Input.EventType.TOUCH_END, noTouch);
    target.on(Input.EventType.TOUCH_CANCEL, noTouch);
}

/**获取目标所处Cavans */
export function getRoot(node: Node) {
    let parent: Node = node.parent;
    while (parent && !parent.getComponent(Canvas)) {
        if (parent.parent) {
            parent = parent.parent;
        } else {
            break;
        }
    }
    return parent;
}

/**遍历 */
export function FindParent(child: Node, target: Node) {
    let parent = child;
    let loop = 0;
    while (true) {
        if (parent == target) return true;
        if (!parent || parent.getComponent(Canvas)) return false;
        parent = parent.parent;
        if (++loop > 10000) throw "FindParent " + loop;
    }
}

/**
 * 是否数字
 * @param arg 
 * @returns 
 */
export function isNumber(arg: any): arg is number {
    return isNaN(Number(arg)) != false;
}

/**
 * 枚举比较
 * @param e 
 * @param value 
 * @param target 
 * @returns 
 */
export function EquipEnum(e: any, value: any, target: any) {
    if (value == target) return true;
    if (e[value] == target) return true;
    if (e[target] == value) return true;
    if (e[target] == e[value]) return true;
    return false;
}

export class EvtPass {
    static passls = {};
    static ins = new Node();
    static on(type: string, listener: Function, thisObj: any) {
        if (this.passls[type]) throw "事件通道每个事件只允许注册一个侦听接口";
        this.passls[type] = [listener, thisObj];
        this.ins.on(type, listener, thisObj);
    }
    static off(type: string) {
        let obj = this.passls[type];
        this.ins.off(type, obj[0], obj[1]);
        delete this.passls[type];
    }
    static Pass(type: string, ...datas: any[]) {
        this.ins.emit(type, ...datas);
    }
}

let trans1: Vec3 = new Vec3();
let trans2: Vec3 = new Vec3();
/**
 * 转换坐标
 * @param x 
 * @param y 
 * @param from 
 * @param to 
 * @returns 
 */
export function Convert(x: number, y: number, from: Node, to?: Node) {
    trans1.set(x, y);
    from.getComponent(UITransform).convertToWorldSpaceAR(trans1, trans2);
    if (!to) {
        return [trans2.x, trans2.y];
    }
    to.getComponent(UITransform).convertToNodeSpaceAR(trans2, trans1);
    return [trans1.x, trans1.y];
}

export function ConvertNode(node: Node, to: Node) {
    let x = node.position.x, y = node.position.y;
    return Convert(x, y, node.parent, to);
}

export function ConvertBoundToCavnas(canvas: Node, node: Node) {
    let canvasMat4: Mat4 = canvas.getWorldMatrix();
    return node.getComponent(UITransform).getBoundingBoxTo(canvasMat4);
}

/**屏幕到指定节点 */
export function CanvasToNode(canvas: Node, node: Node) {
    const size = canvas.getComponent(UITransform).contentSize;
    let [x1, y1] = Convert(-size.width / 2, size.height / 2, canvas, node);
    let [x2, y2] = Convert(size.width / 2, -size.height / 2, canvas, node);
    return [x1, y1, x2, y2];
}

/**
 * 获取指定节点到目标容器的包围盒（自动计算缩放）
 * @param node 
 * @param parent 
 * @returns 
 */
export function GetBoundingBoxTo(node: Node, parent: Node): Rect {
    if (!node.activeInHierarchy) return new Rect();
    let rect = node.getComponent(UITransform).getBoundingBox();
    let [xMin, yMin] = Convert(rect.xMin, rect.yMin, node.parent, parent);
    let [xMax, yMax] = Convert(rect.xMax, rect.yMax, node.parent, parent);
    return new Rect(xMin, yMin, xMax - xMin, yMax - yMin);
}

/**
 * 
 * @param point 
 * @param lineStart 
 * @param lineEnd 
 * @returns 
 */
export function ProjectPointOnLine(point: { x: number, y: number }, lineStart: { x: number, y: number }, lineEnd: { x: number, y: number }) {
    // 计算向量
    var vector = { x: lineEnd.x - lineStart.x, y: lineEnd.y - lineStart.y };
    // 计算向量的模
    var magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    // 单位化向量
    vector.x /= magnitude;
    vector.y /= magnitude;

    // 计算点到线段起点的向量
    var pointToStart = { x: point.x - lineStart.x, y: point.y - lineStart.y };
    // 投影长度
    var projectionLength = pointToStart.x * vector.x + pointToStart.y * vector.y;
    // 计算投影点坐标
    var projectionPoint = {
        x: lineStart.x + projectionLength * vector.x,
        y: lineStart.y + projectionLength * vector.y
    };
    return projectionPoint;
}

let csn1: Vec3 = new Vec3();
let csn2: Vec3 = new Vec3();
/**计算屏幕到节点的坐标 */
export function ConvertScreenToNode(camera: Camera, x: number, y: number, z: number, uiNode: Node) {
    camera.screenToWorld(v3(x, y, z), csn1);
    camera.convertToUINode(csn1, uiNode, csn2);
    return [csn2.x, csn2.y];
}

/**
 * 字符串转字32位字节流
 * @param base64 
 * @returns 
 */
export function Base64ToUints(base64: string) {
    // let encode = encodeURI(base64);
    // let binaryString = btoa(encode);
    let binaryString = Base64_Encode(base64);
    while (binaryString.length % 4 != 0) {
        binaryString += " ";
    }
    console.log("Base64ToUints", binaryString);
    let results: number[] = [];
    for (let i = 0; i < binaryString.length;) {
        let uint: number = 0;
        for (let n = 0; n < 4; n++) {
            uint = uint | (binaryString.charCodeAt(i++) << (8 * n));
        }
        results.push(uint);
    }
    return results;
}

/**
 * 32位无符号整形数组转字符串
 * @param uints 
 * @returns 
 */
export function UintsToBase64(uints: number[]) {
    let base64 = [];
    for (let i = 0; i < uints.length; i++) {
        let uint = uints[i];
        for (let n = 0; n < 4; n++) {
            base64.push(String.fromCharCode((uint >> (n * 8)) & 0xff));
        }
    }
    let code = base64.join("");
    code = code.trim();
    console.log("UintsToBase64", code);
    return Base64_Decode(code);
    // return decodeURI(atob(base64.join("")));
}

/**
 * base64转SpriteFrame
 * @param base64 
 * @returns 
 */
export async function base64ToImage(base64: string) {
    let success: Function;
    let promise = new Promise<SpriteFrame>((resolve, reject) => {
        success = resolve;
    })
    let image = new Image();
    image.onload = function () {
        let img = new ImageAsset(image);
        let texture = new Texture2D();
        texture.image = img;
        let spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;
        success(spriteFrame);
    };
    image.onerror = function (err) {
        console.error("base64图片错误", err)
    }

    if (base64.indexOf("data:image") == 0) {
        console.log("base64ToImage", base64);
        image.src = base64;
    } else {
        base64 = "data:image/png;base64," + base64;
        console.log("base64ToImage", base64);
        image.src = base64;
    }

    // assetManager.loadRemote(base64,{ext:".png"},(err,res:ImageAsset)=>{
    //     let spriteFrame = SpriteFrame.createWithImage(res);
    //     success(spriteFrame);
    // })
    return promise;
}

/**
 * 字节数组转base64
 * @param bytes 
 * @returns 
 */
export function BytesToBase64(bytes: Uint8Array) {
    // 将Uint8Array转换为二进制字符串
    let binaryString = '';
    bytes.forEach(function (byte) {
        binaryString += String.fromCharCode(byte);
    });

    // 使用btoa()函数将二进制字符串转换为base64编码
    let base64String = btoa(binaryString);

    return base64String;
}

export function ImageToBase64(image, callback) {
    const reader = new FileReader();
    reader.onload = function (event) {
        callback(event.target.result);
    };
    reader.readAsDataURL(image);
}

let lerpV2: Vec2 = new Vec2();
/**
 * 将节点移动到两个向量差值的位置
 * @param node 
 * @param from 
 * @param to 
 * @param t 
 */
export function Lerp(node: Node | IVec2Like, from: IVec2Like, to: IVec2Like, t: number) {
    Vec2.lerp(lerpV2, from, to, t);
    if (node instanceof Node) {
        node.setPosition(lerpV2.x, lerpV2.y, 0);
    } else {
        node.x = lerpV2.x;
        node.y = lerpV2.y;
    }
}

/**
 * 将节点移动到两个向量直接指定的距离
 * @param node 
 * @param from 
 * @param to 
 * @param pixel 
 */
export function LerpByPixel(node: Node | IVec2Like, from: IVec2Like, to: IVec2Like, pixel: number) {
    let dx = to.x - from.x, dy = to.y - from.y;
    let t = Math.min(pixel / Math.sqrt(dx * dx + dy * dy), 1);
    Vec2.lerp(lerpV2, from, to, t);
    if (node instanceof Node) {
        node.setPosition(lerpV2.x, lerpV2.y, 0);
    } else {
        node.x = lerpV2.x;
        node.y = lerpV2.y;
    }
}

type classz<T = unknown> = new (...args: any[]) => T;
type _classz<T = unknown> = new (...args: any[]) => T;
/**
 * 获取所有子节点
 * @param node 
 * @returns 
 */
export function MapChildren<T extends Component>(node: Node, type: classz<T> | _classz<T>): T[] {
    let result: T[] = [];
    let list: Node[] = [node];
    while (list.length) {
        let child = list.pop();
        if (child.getComponent(type)) {
            result.push(child.getComponent(type));
        }
        if (child.children.length) {
            list.push(...child.children);
        }
    }
    return result;
}

/**
 * 遍历所有子节点
 * @param node 
 * @param handle 
 */
export function MapChildrenFor(node: Node, handle: (child: Node) => any) {
    let list: Node[] = [node];
    while (list.length) {
        let child = list.pop();
        let result = handle(child);
        if (result) break;
        if (child.children.length) {
            list.push(...child.children);
        }
    }
}

/**
 * 描边
 * @param node 
 */
export function OutLine(target: Node | Sprite, rt: boolean = false, inner: boolean = false) {
    let sprite: Sprite;
    if (target instanceof Node) {
        sprite = target.getComponent(Sprite);
    } else {
        sprite = target;
    }
    if (!sprite) return;
    let material = new Material();
    let define = { USE_ALPHA_TEST: true, USE_TEXTURE: true };
    if (rt) define["SAMPLE_FROM_RT"] = true;
    material.initialize({ effectName: '../resources/material/out-line', defines: define });
    let size = sprite.getComponent(UITransform);
    if (size.width <= 180 && size.height <= 180) {
        material.setProperty("radius", 0.002);
    } else {
        material.setProperty("radius", 0.01);
    }
    if (inner) material.setProperty("inner", 1);
    sprite.customMaterial = material;
}

/**
 * 随机指定范围
 * @param x 
 * @param y 
 * @param r 
 * @returns 
 */
export function RandomOffset(x: number, y: number, r: number) {
    let rad = Math.random() * PI2;
    return [x + r * Math.cos(rad), y + Math.sin(rad)];
}


export const RadToDeg: number = 180 / Math.PI;
export const DegToRad: number = Math.PI / 180;
export const PI90: number = Math.PI / 2;
export const PI2: number = Math.PI * 2;

export function abss(a: number, b: number = 0) {
    return Math.abs(a - b);
}
export function maxx(...args: number[]) {
    return Math.max(...args);
}
export function minn(...args: number[]) {
    return Math.min(...args);
}

/**
 * 弧度取正
 * @param rad 
 * @returns 
 */
export function ForwardRad(rad: number) {
    while (rad < 0) {
        rad += PI2;
    }
    rad = rad % PI2;
    if (math.equals(rad, PI2)) {
        return 0;
    } else {
        return rad;
    }
}

/**
 * 角度取正
 * @param deg 
 * @returns 
 */
export function ForwardDeg(deg: number) {
    while (deg < 0) {
        deg += 360;
    }
    deg = deg % 360;
    if (math.equals(deg, 360)) {
        return 0;
    } else {
        return deg;
    }
}

/**
 * 两点朝向(角度)
 * @param x1 
 * @param y1 
 * @param x2 
 * @param y2 
 * @returns 
 */
export function TowardDeg(x1: number, y1: number, x2: number, y2: number) {
    return ForwardDeg(toDegree(Math.atan2(y2 - y1, x2 - x1)));
}

/**
 * 两点朝向(弧度)
 * @param x1 
 * @param y1 
 * @param x2 
 * @param y2 
 * @returns 
 */
export function towardRad(x1: number, y1: number, x2: number, y2: number) {
    return ForwardRad(Math.atan2(y2 - y1, x2 - x1));
}

/**
 * 延迟
 * @param second 
 * @returns 
 */
export async function Second(second: number) {
    let timeout: Function;
    let p = new Promise<number>((resolve, reject) => {
        timeout = resolve;
    });
    let tick = game.totalTime;
    setTimeout(() => {
        timeout(game.totalTime - tick);
    }, second * 1000);
    return p;
}

/**
 * 所有数字相加
 * @param args 
 * @returns 
 */
export function Sum(...args: number[]) {
    let result = 0;
    for (let arg of args) {
        let value = Number(arg);
        if (isNaN(value)) value = 0;
        result += value;
    }
    return result;
}

/**
 * 筛选出两数组不同部分
 * @param ary1 
 * @param ary2 
 * @returns 
 */
export function HitAryV(ary1: any[], ary2: any[]) {
    let d1 = [], d2 = [];
    for (let obj of ary1) {
        if (ary2.indexOf(obj) == -1) d1.push(obj);
    }
    for (let obj of ary2) {
        if (ary1.indexOf(obj) == -1) d2.push(obj);
    }
    return [d1, d2];
}

/**
 * 筛选出两数组不同索引
 * @param ary1 
 * @param ary2 
 * @returns 
 */
export function HitAryI(ary1: any[], ary2: any[]) {
    let d1 = [], d2 = [];
    for (let i = 0; i < ary1.length; i++) {
        if (ary1[i] != undefined && ary2[i] == undefined) d1.push(i);
    }
    for (let i = 0; i < ary2.length; i++) {
        if (ary2[i] != undefined && ary1[i] == undefined) d2.push(i);
    }
    return [d1, d2];
}

/**
     * 最大值和最小值之间随机
     * @param cusMax 
     * @param cusMin 
     * @returns 
     */
export function randomf(cusMax: number, cusMin: number) {
    return Math.random() * (cusMax - cusMin) + cusMin;
}
export function randomI(cusMax: number, cusMin: number) {
    return Math.round(Math.random() * (cusMax - cusMin) + cusMin);
}

/**将对象转成ASCII */
export function ToASCII(obj: any) {
    let str = "";
    if (typeof (obj) != "string") {
        if (obj['toString']) {
            str = obj['toString']();
        } else {
            str = String(obj) || "";
        }
    } else {
        str = obj;
    }
    var asciiArr = [];
    for (var i = 0; i < str.length; i++) {
        asciiArr.push(str.charCodeAt(i));
    }
    return Sum(...asciiArr);
}

/**
 * 设置按钮事件
 * @param button 
 * @param thisObj 
 * @param handle 
 */
export function AddBtnClick(button: Button, thisObj: Component, handle: Function) {
    button.clickEvents = [];
    let clickEventHandler = new EventHandler();
    clickEventHandler.target = thisObj.node;
    clickEventHandler.component = js.getClassName(thisObj);
    clickEventHandler.handler = js.getClassName(handle);
    button.clickEvents.push(clickEventHandler);
}

/**
 * 移除事件
 * @param button 
 * @param thisObj 
 * @param handle 
 */
export function RemoveBtnClick(button: Button, thisObj: Component, handle: Function) {
    let events = button.clickEvents;
    if (events && events.length) {
        let className = <unknown>js.getClassByName(thisObj);
        let handler = <unknown>js.getClassByName(handle);
        for (let i = 0; i < events.length;) {
            if (events[i].target == thisObj.node && events[i].component == className && events[i].handler == handler) {
                events.splice(i, 1);
            } else {
                i++;
            }
        }
    }
}

export function formatK(value: number, fd?: number) {
    if (fd != undefined) {
        if (value >= 1000) return ToFixed(value / 1000, fd) + "k";
        return ToFixed(value, fd) + "k";
    }
    if (value >= 1000) return (value / 1000).toFixed(2) + "k";
    return value + "";
}
export function BigNumber(value: number, fd?: number) {
    if (value >= 1000000000) return ToFixed(value / 1000000000, fd) + "b";
    if (value >= 1000000) return ToFixed(value / 1000000, fd) + "m";
    if (value >= 1000) return ToFixed(value / 1000, fd) + "k";
    return ToFixed(value, fd);
}

export function formatBigNumber(value: number) {
    const chineseNum = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    var numStr = value.toString();
    var chineseStr = '';

    for (var i = 0; i < numStr.length; i++) {
        var index = parseInt(numStr[i]);
        chineseStr += chineseNum[index];
    }

    return chineseStr;
}
/***
 * 获取上周时间戳
 */
export function lastWeek() {
    const today = new Date(); // 创建一个表示当前时间的 Date 对象
    // 获取今天是星期几（0-6）
    let dayOfWeekIndex = today.getDay();
    if (dayOfWeekIndex == 0) {
        dayOfWeekIndex = 7
    }
    let curDate1: any
    let curDate2: any
    curDate1 = new Date();
    curDate2 = new Date();

    let hour1 = curDate1.getHours();
    let minutes1 = curDate1.getMinutes();
    let sec1 = curDate1.getSeconds();
    let allSec1 = hour1 * 60 * 60 + minutes1 * 60 + sec1;

    let hour2 = curDate2.getHours();
    let minutes2 = curDate2.getMinutes();
    let sec2 = curDate2.getSeconds();
    let allSec2 = hour2 * 60 * 60 + minutes2 * 60 + sec2;

    let endTime: number;
    let startTime: number;

    curDate1.setDate(curDate1.getDate() - dayOfWeekIndex);
    endTime = getTimesTamp(curDate1);


    curDate2.setDate(curDate2.getDate() - dayOfWeekIndex - 6);
    startTime = getTimesTamp(curDate2);

    startTime = startTime - allSec1;
    endTime = endTime - allSec2 + 24 * 60 * 60 - 1;

    let data = {
        startTime: startTime,
        endTime: endTime,
    }
    return data;
}

/***
 * 获取这周时间戳
 */
export function nowWeek() {
    const today = new Date(); // 创建一个表示当前时间的 Date 对象
    // 获取今天是星期几（0-6）
    let dayOfWeekIndex = today.getDay();
    if (dayOfWeekIndex == 0) {
        dayOfWeekIndex = 7
    }
    let curDate1: Date;
    let curDate2: Date;
    curDate1 = new Date();
    curDate2 = new Date();

    let hour1 = curDate1.getHours();
    let minutes1 = curDate1.getMinutes();
    let sec1 = curDate1.getSeconds();
    let allSec1 = hour1 * 60 * 60 + minutes1 * 60 + sec1;

    let hour2 = curDate2.getHours();
    let minutes2 = curDate2.getMinutes();
    let sec2 = curDate2.getSeconds();
    let allSec2 = hour2 * 60 * 60 + minutes2 * 60 + sec2;

    let endTime: number;
    let startTime: number;
    curDate1.setDate(curDate1.getDate() - dayOfWeekIndex + 1);
    startTime = getTimesTamp(curDate1) - allSec1;

    endTime = getTimesTamp(curDate2);

    let data = {
        startTime: startTime,
        endTime: endTime,
    }
    return data;
}

/**
 * 时间戳转换（秒）
 * @param curDate 需要转换的时间
 * @returns 
 */
export function getTimesTamp(curDate) {
    return Math.trunc(curDate.getTime() / 1000);
}

let hashMap: { [key: string]: string } = {};
export function Underline(str: string) {
    if (hashMap[str]) return hashMap[str];
    let value = str.replace(/([A-Z])/g, (match, word) => "_" + word.toLowerCase());
    hashMap[str] = value;
    return value;
}
export function UpperCamel(str: string) {
    if (hashMap[str]) return hashMap[str];
    let value = str.replace(/(\_[a-z])/g, (match, word) => word.replace("_", "").toUpperCase());
    hashMap[str] = value;
    return value;
}

/**
 * 获取画线的点位
 * @param mapWith 地图的宽度
 * @param mapHight 地图的高度
 * @param rhombusWith 菱形的宽度
 * @param rhombusHight 菱形的高度
 * @param type  格子类型 1 矩形  2菱形
 * @returns 
 */
export function drawLine(mapWith: number, mapHight: number, rhombusWith: number, rhombusHight: number, grid: Graphics, type: number = 1) {

    let row = Math.ceil(mapWith / rhombusWith);
    let col = Math.ceil(mapHight / rhombusHight);
    console.log('行 row', row)
    console.log('列 col', col)

    let startPos = v2(-mapWith / 2, -mapHight / 2);

    let arrRowVec = [];
    let arrRowVecRight = [];

    let startWith = rhombusWith / 2;

    let endPos = v2(mapWith / 2, mapHight / 2);
    let startHight = rhombusHight / 2;
    let arrColVec = [];
    let arrColVecRight = [];

    if (type == 1) {
        for (let index = 0; index < row; index++) {
            let pos = v2(startPos.x + index * rhombusWith, startPos.y);
            arrRowVec.push(pos);
            let pos1 = v2(startPos.x + index * rhombusWith, endPos.y);
            arrColVec.push(pos1);
        }
        for (let index = 0; index < col; index++) {
            let pos = v2(startPos.x, startPos.y + index * rhombusHight);
            arrRowVecRight.push(pos);

            let pos1 = v2(endPos.x, startPos.y + + index * rhombusHight);
            arrColVecRight.push(pos1);
        }

        for (let index = 0; index < arrRowVec.length; index++) {
            let line1 = v2(arrRowVec[index].x, arrRowVec[index].y);
            let line2 = v2(arrColVec[index].x, arrColVec[index].y);
            grid.moveTo(line1.x, line1.y);
            grid.lineTo(line2.x, line2.y);
        }
        for (let index = 0; index < arrRowVecRight.length; index++) {
            let line3 = v2(arrRowVecRight[index].x, arrRowVecRight[index].y);
            let line4 = v2(arrColVecRight[index].x, arrColVecRight[index].y);
            grid.moveTo(line3.x, line3.y);
            grid.lineTo(line4.x, line4.y);
        }

    } else if (type == 2) {
        for (let index = 0; index < row; index++) {
            let pos = v2(startPos.x + startWith + index * rhombusWith, startPos.y);
            arrRowVec.push(pos);

            arrRowVecRight.push(pos);
        }

        arrRowVec.reverse();
        for (let index = 0; index < col; index++) {
            let pos = v2(startPos.x, startPos.y + startHight + index * rhombusHight);
            arrRowVec.push(pos);

            let pos1 = v2(endPos.x, startPos.y + startHight + index * rhombusHight);
            arrRowVecRight.push(pos1);
        }

        for (let index = 0; index < col; index++) {
            let pos = v2(endPos.x, startPos.y + startHight + index * rhombusHight);
            arrColVec.push(pos);

            let pos1 = v2(startPos.x, startPos.y + startHight + index * rhombusHight);
            arrColVecRight.push(pos1);
        }

        let tempArr = [];
        for (let index = 0; index < row; index++) {
            let pos = v2(startPos.x + startWith + index * rhombusWith, endPos.y);
            tempArr.push(pos);
            arrColVecRight.push(pos);
        }
        tempArr.reverse();
        arrColVec = arrColVec.concat(tempArr);
        // return [arrRowVec, arrColVec, arrRowVecRight, arrColVecRight];
        for (let index = 0; index < arrRowVec.length; index++) {
            let line1 = v2(arrRowVec[index].x, arrRowVec[index].y);
            let line2 = v2(arrColVec[index].x, arrColVec[index].y);
            grid.moveTo(line1.x, line1.y);
            grid.lineTo(line2.x, line2.y);

            let line3 = v2(arrRowVecRight[index].x, arrRowVecRight[index].y);
            let line4 = v2(arrColVecRight[index].x, arrColVecRight[index].y);
            grid.moveTo(line3.x, line3.y);
            grid.lineTo(line4.x, line4.y);
        }
    }





    grid.stroke();
}

/**
 * 判断是否有指定动作
 * @param ske 
 * @param action 
 * @returns 
 */
export function CheckAnimation(ske: sp.Skeleton, action: string) {
    if (!ske || !ske.skeletonData) return false;
    let actions = ske.skeletonData.getAnimsEnum();
    if (!actions[action]) {
        return false;
    }
    return true;
}


/**
* 格式化时间戳
* @param {string} cusFormat 格式串，eg:'yyyy-MM-dd hh:mm:ss'
* @返回 格式化后的时间字符串 
* eg: new Date().format('yyyy-MM-dd hh:mm:ss') -> '2020-06-30 16:28:14'
*/
export function formatDate(cusTime: number, cusFormat: string): string {
    const _date: Date = new Date();
    _date.setTime(cusTime);

    const _info = {
        'M+': _date.getMonth() + 1,
        'd+': _date.getDate(),
        'h+': _date.getHours(),
        'm+': _date.getMinutes(),
        's+': _date.getSeconds(),
        'q+': Math.floor((_date.getMonth() + 3) / 3),
        'S+': _date.getMilliseconds()
    };

    if (/(y+)/i.test(cusFormat)) {
        cusFormat = cusFormat.replace(RegExp.$1, (_date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }

    for (const _key in _info) {
        if (new RegExp('(' + _key + ')').test(cusFormat)) {
            cusFormat = cusFormat.replace(RegExp.$1, RegExp.$1.length === 1
                ? _info[_key] : ('00' + _info[_key]).substr(('' + _info[_key]).length));
        }
    }
    return cusFormat;
}
type myNumber = number;
type myString = string;
type myDecimal = myNumber | myString
/**
 * 
 * @param decimal 传入数据 数字或者字符串
 * @param count 需要保留的小数位数
 * @returns 
 */
export function ToFixed(decimal: myDecimal, count = 0) {
    const ss = 10000000000;
    let value = Number(decimal);
    if (isNaN(value) || value == undefined || value == Infinity) return '0';
    if (typeof (decimal) == "number") {
        value = Math.round(value * ss) / ss;
        if (count) {
            let seed = Math.pow(10, count);
            value = Math.floor(value * seed) / seed;
            return value + "";
        } else return value + "";
    } else if (typeof (decimal) == "string") {
        let index = decimal.indexOf(".");
        if (index != -1) {
            if (count > 0) {
                return decimal.substring(0, index + count + 1)
            } else {
                return decimal.substring(0, index);
            }
        } else {
            return decimal;
        }
    }
    return "0";
}

export class Mathf {
    static distance(v1: { x: number, y: number }, vs: { x: number, y: number }): number;
    static distance(x1: number, y1: number, x2: number, y2: number): number;
    static distance(...args) {
        if (args.length == 2) {
            let v1 = args[0], v2 = args[1];
            return Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
        } else {
            let x1 = args[0], y1 = args[1], x2 = args[2], y2 = args[3];
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        }
    }


}

/**
 * 转为格式为 [保留值][单位] 的字符串，可用于UI显示
 * @param accuracy 保留几位小数
 */
/** 单位数组 */
//const unitArr = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const unitArr = ["K", "M", "B", "百万", "千万", "亿", "十亿", "百亿", "千亿", "万亿", "兆"]
export function formatNumber(n: number, accuracy: number = 0): string {
    return BigNumber(n, accuracy);
    n = Number(Number(n).toFixed(4));
    // 转成整数
    let accuracyNum = Math.pow(10, accuracy);
    //乘以100 1000 1000会有丢失精度问题
    let val: number = Math.round((n * accuracyNum) * 1000) / 1000;
    let num = Math.floor(val);
    num = num / accuracyNum;

    // 字符串形式，方便裁剪
    let str = num.toString();
    // 科学计数法要转成正常数值
    if (str.indexOf("e+") !== -1) {
        // 基数，10的次方
        let [baseNum, tenNum] = str.split("e+");
        // 个位，小数点部分
        let [baseOne, dotNum] = baseNum.split(".");

        // 消除小数点
        baseNum = baseOne;
        let zeroLength = Number(tenNum);
        if (dotNum) {
            baseNum += dotNum;
            zeroLength -= dotNum.length;
        }
        for (let i = 0; i < zeroLength; i++) {
            baseNum += "0";
        }

        str = baseNum;
    }

    // 符号
    let sign = "";
    if (num < 0) {
        sign = "-";
        str = str.slice(1);
    }

    let strLength = str.length;
    if (accuracyNum > 0) {
        let list = str.split(".");
        strLength = list[0].length;
    }
    // 如果小于5位，直接返回
    if (strLength < 4) {
        if (accuracy > 0) {
            let finalStr = sign + str;
            let list = finalStr.split(".");
            if (list.length === 1) finalStr += ".";
            let _num = list.length === 1 ? accuracy : (accuracy - list[1].length);
            for (let i = 0; i < _num; i++) {
                finalStr += "0";
            }
            return finalStr;
        } else {
            return sign + str;
        }
    }

    // 头3位
    let head = str.slice(0, 3);
    // 尾部
    let tail = str.slice(3);
    //是否有小数
    if (tail.indexOf(".") !== -1) {
        tail = tail.split(".")[0];
    }
    // 单位索引
    let unitIdx = Math.floor(tail.length / 3);
    // 小数点偏移
    let offset = tail.length % 3;
    if (offset !== 0) {
        offset = 3 - offset;
        let finalStr = sign + head.slice(0, -offset) + "." + head.slice(3 - offset);
        if (accuracy > 0) {
            let list = finalStr.split(".");
            if (list.length === 1) finalStr += ".";
            let _num = list.length === 1 ? accuracy : (accuracy - list[1].length);
            for (let i = 0; i < _num; i++) {
                finalStr = finalStr + (tail[i] ? tail[i] : "0");
            }
        }
        return finalStr + unitArr[unitIdx];
    } else {
        unitIdx--;
        let finalStr = sign + head;
        if (accuracy > 0) {
            let list = finalStr.split(".");
            if (list.length === 1) finalStr += ".";
            let _num = list.length === 1 ? accuracy : (accuracy - list[1].length);
            for (let i = 0; i < _num; i++) {
                finalStr = finalStr + (tail[i] ? tail[i] : "0");
            }
        }
        return finalStr + unitArr[unitIdx];
    }
}

/**
 * 倒计时 同步服务器时间
 * @param timestamp 秒时间戳
 */
export function countDown(timestamp: number): string {
    // 计算剩余时间
    let leftTime = timestamp - PlayerData.GetServerTime();
    if (leftTime <= 0) return "00:00:00";
    // 计算剩余时间的各个单位
    let leftH = Math.floor(leftTime / 60 / 60);
    let leftM = Math.floor((leftTime / 60) % 60);
    let leftS = Math.floor((leftTime) % 60);
    // 将剩余时间拼接成字符串，如'12:34:56'，并返回
    return `${leftH.toString()['padStart'](2, '0')}:${leftM.toString()['padStart'](2, '0')}:${leftS.toString()['padStart'](2, '0')}`;
}

/**获取当前时间到未来某一时间的倒计时 */
export function countDown2(timestamp: number):{d:number, h:number, m:number, s:number} {

    let leftTime = timestamp - PlayerData.GetServerTime();
    // 计算剩余时间的各个单位
    let leftD = Math.floor((leftTime)/60 / 60 / 24);
    let leftH = Math.floor((leftTime / 60 / 60) % 24);
    let leftM = Math.floor((leftTime / 60) % 60);
    let leftS = Math.floor((leftTime) % 60);
    return {d:leftD, h:leftH, m:leftM, s:leftS}
}

export function formatTime(totalSeconds: number): string {
    if (totalSeconds < 0) return
    // let hours: number = Math.floor((totalSeconds / 3600));
    // let hh: string = (hours < 10 ? "0" + hours : hours).toString();
    // let minutes: number = Math.floor(totalSeconds / 60);
    // let mm: string = minutes < 10 ? "0" + minutes : minutes.toString();
    // let seconds: number = Math.floor(totalSeconds - minutes * 60);
    // let ss: string = seconds < 10 ? "0" + seconds : seconds.toString();
    // let num: string = mm + ":" + ss;
    // return num;

    return DateUtils.FormatTime(totalSeconds);
}


/**
 * 保存本地
 * @param data 
 * @param fileName 
 */
export function SaveFile(data: string, fileName: string) {
    // 创建一个Blob实例，里面包含要下载的数据
    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });

    // 创建一个指向Blob对象的URL地址
    const url = URL.createObjectURL(blob);

    // 创建一个a标签
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理并移除元素和对象URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

type Checker = { index: number, info: SPlayerDataItem, count: number, exp: number };
let items: Checker[];
export function FillExp(exps: SPlayerDataItem[], target: number) {
    this.items = [];
    for (let i = 0; i < exps.length; i++) {
        let info = exps[i];
        let std = CfgMgr.Getitem(info.id);
        this.items[i] = {
            index: i,
            info: info,
            count: info.count,
            exp: std.ItemEffect1
        }
    }

    let results: { offset: 0, index: number, num: number }[] = [];
    let checks = [this.items[0]];
    while (checks.length) {
        let check = checks.shift();

    }
}
function checkNext(index: number) {
    let check = items[index];
    for (let i = 1; i <= check.count; i++) {
        check.count * check.exp
    }
}

/**数字文本滚动 */
export function numTween(item: Label, count: number, max: number, time: number, per: string) {
    let num = 0;
    tween(item.node)
        .repeat(count,
            tween()
                .delay(time)
                .call(() => {
                    num += 1;
                    if (num > max) {
                        num = max;
                    }
                    item.string = `${num}`;
                })
        )
        .call(() => {
            item.string = `${max}` + per;
        })
        .start();
}
/**
 * 深拷贝
 * @param source 源数据
 */
export function DeepCopy<T>(source: T): T {
    if (typeof source !== "object" || source === null || source instanceof RegExp) {
        return source;
    }
    let result: any = null;
    if (Array.isArray(source)) {
        result = [];
        for (let item of source) {
            result.push(DeepCopy(item));
        }
    } else if (source instanceof Map) {
        result = new Map();
        source.forEach((val, key) => {
            result.set(key, DeepCopy(val));
        });
    } else {
        result = {};
        for (let key in source) {
            result[key] = DeepCopy(source[key]);
        }
    }
    return result;
}
/**
 * 将字符串里的{0}{1}{2}{3}替换成参数
 * @param str 原字符串
 * @param arg 替换参数
 * @returns 
 */
export function ReplaceStr(str: string, ...arg: any[]): string {
    let result = str;
    for (const key in arg) {
        result = result.replace(/%s|%d|%f/, arg[key]);
    }
    return result
}
/**
 * 有小数时保留N位小数,没有时保留整数
 * @param num 
 * @param length 
 */
export function GetNumberAccuracy(num: number, length: number) {
    let floor = Math.floor(num);
    let fix = parseFloat(num.toFixed(length));
    if (floor == fix) {
        return floor;
    } else {
        return fix;
    }
}

/**设置字体颜色，已有资源是否满足条件 */
export function SetLabelColor(lbl: Label, has: number, need: number, color1: string = "98FF54", color2: string = "FF0000") {
    lbl.color = (has >= need ? new Color().fromHEX(color1) : new Color().fromHEX(color2))
}

const _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function _utf8_encode(e) {
    e = e.replace(/rn/g, "n");
    var t = "";
    for (var n = 0; n < e.length; n++) {
        var r = e.charCodeAt(n);
        if (r < 128) {
            t += String.fromCharCode(r)
        } else if (r > 127 && r < 2048) {
            t += String.fromCharCode(r >> 6 | 192);
            t += String.fromCharCode(r & 63 | 128)
        } else {
            t += String.fromCharCode(r >> 12 | 224);
            t += String.fromCharCode(r >> 6 & 63 | 128);
            t += String.fromCharCode(r & 63 | 128)
        }
    }
    return t
}
function _utf8_decode(e) {
    var t = "";
    var n = 0;
    var r = 0, c1 = 0, c2 = 0, c3;
    while (n < e.length) {
        r = e.charCodeAt(n);
        if (r < 128) {
            t += String.fromCharCode(r);
            n++
        } else if (r > 191 && r < 224) {
            c2 = e.charCodeAt(n + 1);
            t += String.fromCharCode((r & 31) << 6 | c2 & 63);
            n += 2
        } else {
            c2 = e.charCodeAt(n + 1);
            c3 = e.charCodeAt(n + 2);
            t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
            n += 3
        }
    }
    return t
}
export function Base64_Encode(e) {
    var t = "";
    var n, r, i, s, o, u, a;
    var f = 0;
    e = _utf8_encode(e);
    while (f < e.length) {
        n = e.charCodeAt(f++);
        r = e.charCodeAt(f++);
        i = e.charCodeAt(f++);
        s = n >> 2;
        o = (n & 3) << 4 | r >> 4;
        u = (r & 15) << 2 | i >> 6;
        a = i & 63;
        if (isNaN(r)) {
            u = a = 64
        } else if (isNaN(i)) {
            a = 64
        }
        t = t + _keyStr.charAt(s) + _keyStr.charAt(o) + _keyStr.charAt(u) + _keyStr.charAt(a)
    }
    return t
}
export function Base64_Decode(e) {
    var t = "";
    var n, r, i;
    var s, o, u, a;
    var f = 0;
    e = e.replace(/[^A-Za-z0-9+/=]/g, "");
    while (f < e.length) {
        s = _keyStr.indexOf(e.charAt(f++));
        o = _keyStr.indexOf(e.charAt(f++));
        u = _keyStr.indexOf(e.charAt(f++));
        a = _keyStr.indexOf(e.charAt(f++));
        n = s << 2 | o >> 4;
        r = (o & 15) << 4 | u >> 2;
        i = (u & 3) << 6 | a;
        t = t + String.fromCharCode(n);
        if (u != 64) {
            t = t + String.fromCharCode(r)
        }
        if (a != 64) {
            t = t + String.fromCharCode(i)
        }
    }
    t = _utf8_decode(t);
    return t
}

export function copyToClip(value: string) {
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