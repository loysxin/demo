import { ITweenOption, Vec2, Vec3, js, tween, v2, v3 } from "cc";
import { Mathf, ProjectPointOnLine } from "./Utils";
import Logger from "./Logger";

/**
 * 创建曲线1
 * @param p1 
 * @param p2 
 * @param p3 
 */
export function CreateBezier(p1: Vec2, p2: Vec2, p3: Vec2, start: Vec2, end: Vec2, offsetx: number = 0, offsety: number = 0) {
    let p = ProjectPointOnLine(p2, p1, p3);
    let t = (p.x - p1.x) / (p3.x - p1.x);
    let h = Mathf.distance(p2, p);
    let leng = Vec2.distance(start, end);
    let radio = leng / (Vec2.distance(p1, p3));
    let center = v2();
    Vec2.lerp(center, start, end, t);
    center.y += (h *= radio);
    Logger.log("CreateBezier", start);
    if (offsetx || offsety) {
        let rad = Math.atan2(end.y - start.y, end.x - start.x);
        rad += Math.atan2(offsety, offsetx);
        let s = Math.sqrt(offsetx * offsetx + offsety * offsety);
        start.x += (s * Math.cos(rad));
        start.y += (s * Math.sin(rad));
        Logger.log("offset", start);
    }
    return [start, center, end];
}

/**
 * 曲线
 * @param p1 
 * @param p2 
 * @param p3 
 * @param t 
 * @returns 
 */
export function Bezier(p1: Vec2, p2: Vec2, p3: Vec2, t: number) {
    Vec2.lerp(l1, p1, p2, t);
    Vec2.lerp(l2, p2, p3, t);
    let result = v2();
    Vec2.lerp(result, l1, l2, t);
    return result;
}
let l1: Vec2 = v2(), l2: Vec2 = v2();
/**
 * 二段式贝塞尔曲线缓动
 * @param target 缓动目标
 * @param t 持续时间
 * @param p1 开始点
 * @param cp1 控制点1
 * @param cp2 控制点2
 * @param p2 结束点
 * @param delay 延迟时间
 * @param endCb 完成回调
 * @param opts 
 */
export function BezierTween2(target:any, t:number, p1:Vec3, c1:Vec3, p2:Vec3, delay:number = 0, endCb:() => void = null, opts:ITweenOption = null){
    opts = opts || js.createMap();
    
    //t 当前百分比 p1 起点坐标 cp 控制点 p2 终点坐标
    let getBezier = (r:number, p1: Vec3, cp: Vec3, p2: Vec3) => {
        let x = (1 - r) * (1 - r) * p1.x + 2 * r * (1 - r) * cp.x + r * r * p2.x;
        let y = (1 - r) * (1 - r) * p1.y + 2 * r * (1 - r) * cp.y + r * r * p2.y;
        return v3(x, y, 0);
    };
    opts.onUpdate = (arg: Vec3, ratio: number) => {
        target.worldPosition = getBezier(ratio, p1, c1, p2);
    };
    tween(target)
    .delay(delay)
    .to(t, {}, opts)
    .call(()=>{

    })
    .start();
}

/**
 * 三段式贝塞尔曲线缓动
 * @param target 缓动目标
 * @param t 持续时间
 * @param p1 开始点
 * @param c1 控制点1
 * @param c2 控制点2
 * @param p2 结束点
 * @param delay 延迟时间
 * @param endCb 完成回调
 * @param opts 
 */
export function BezierTween3(target:any, t:number,  p1:Vec3, c1:Vec3, c2:Vec3, p2:Vec3, delay:number = 0, endCb:() => void = null, opts:ITweenOption = null){
    opts = opts || js.createMap();
    //r 当前百分比 p1 起点坐标 cp1 控制点1 cp2 控制点2 p2 终点坐标
    let getBezier = (r:number, p1: Vec3, cp1: Vec3, cp2: Vec3, p2: Vec3) =>{
        let x =
            (1 - r) * (1 - r) * (1 - r) * p1.x +
            3 * r * (1 - r) * (1 - r) * cp1.x +
            3 * r * r * (1 - r) * cp2.x +
            r * r * r * p2.x;
        let y =
            (1 - r) * (1 - r) * (1 - r) * p1.y +
            3 * r * (1 - r) * (1 - r) * cp1.y +
            3 * r * r * (1 - r) * cp2.y +
            r * r * r * p2.y;
        return v3(x, y, 0);
    };
    opts.onUpdate = (arg: Vec3, ratio: number) => {
        target.worldPosition = getBezier(ratio, p1, c1, c2, p2);
    };
    tween(target)
    .delay(delay)
    .to(t, {}, opts)
    .call(()=>{
        if(endCb) endCb();
    })
    .start();
}