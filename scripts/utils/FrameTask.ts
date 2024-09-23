import { Component } from "cc";
/**
 * 分帧任务
 */
export class FrameTask extends Component{
    private static _ins: FrameTask;
    public static get ins():FrameTask {
        if (this._ins == null) this._ins = new FrameTask();
        return this._ins;
    }
    /**
     * 分帧处理
     * @param cb 处理回调
     * @param target 处理目标
     * @param max 最大处理数
     * @param mini 初始处理数
     * @param lTime 限制处理时间
     * @param data 数据源
     * @returns 
     */
    public ToTask(cb: Function, target: any, max: number, data: any = null, mini: number = 0, lTime: number = 1):void{
        let sTime:number = new Date().getTime();
        let eTime:number;
        let count = mini;
        for (let i = count; i < max; i++) {
            cb.call(target, count, data);
            count++;
            if (count >= max) return;
            eTime = new Date().getTime() - sTime;
            if (eTime > lTime) {
                this.scheduleOnce(() => { 
                    this.ToTask(cb, target, max, data, count, lTime); 
                });
                return;
            }
        }
    }
}