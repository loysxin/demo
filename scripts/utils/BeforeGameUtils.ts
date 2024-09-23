/**
 * 此文件用于游戏初始化前的所有定义与声明，防止其他类文件互相引用时的先后顺序导致的异常
 */

import { js } from "cc";

export class BeforeGameUtils
{
    /**
     * 传入参数转为哈希map布尔值
     * @param args 
     * @returns 
     */
    static toHashMap(...args: any[]):{[key: string]: boolean} {
        let result = js.createMap();
        for (const val of args) {
            result[val] = true;
        }
        return result;
    }
    /**
     * 传入参数转为哈希map对象
     * @param args 
     * @returns 
     */
    static toHashMapObj<T>(...args: any[]): {[key: string]: T} {
        let result = js.createMap();
        var val: any, key: any
        var len: number = args.length;
        for (var i: number = 0; i < len; i++) {
            key = args[i];
            val = args[++i];
            result[key] = val;
        }
        return result;
    }

}