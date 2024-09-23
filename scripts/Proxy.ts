import { js } from "cc";
import { EvtPass, getQualifiedClassName } from "./utils/Utils";

/**
 * 解除循环依赖
 */
export function CircularDependency(...args: any[]) {

    /** 注入类,用于各个文档上下文在不import的情况下直接通过类名访问到指定类 **/

    /**单向侦听调度命令,用于固定的一段操作 **/
    EvtPass.on("Reset", () => {

    }, this);
}
