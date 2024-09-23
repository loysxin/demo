import { Vec2, v2 } from "cc";
import { maxx, minn } from "./Utils";

let check = v2();
let check1 = v2();
/**
 * 计算指定时间差值的抛物线点
 * @param start 起始点
 * @param end   终点
 * @param h     抛物线顶部高度
 * @param t     时间差值
 */
export function Parabola(start: Vec2, end: Vec2, h: number, t: number) {
    Vec2.lerp(check, start, end, t);
    let g = 2 * h / 0.25;//重力加速度
    let v = g * 0.5;//初始速度
    if (t >= 0.5) {
        var dv = (h - 0.5 * g * Math.pow(t - .5, 2));//下落阶段，加速公式
    } else {
        var dv = v * t - 0.5 * g * t * t;//上升阶段，减速公式
    }
    check.y = maxx(check.y, check.y + dv);
    return [check.x, check.y];
}