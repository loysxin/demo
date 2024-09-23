import PlayerData from "../module/roleModule/PlayerData";

export type TimerData = {
    endTime: number,//结束时间
    cb: Function,//执行回调
    target: Object,//回调目标
    data?: any,//回调数据
}

export default class TimerMgr {
    private static list: TimerData[] = [];
    private static readonly tick:number = 1000;
    private static isInit:boolean = false;
    private static init():void{
        if(this.isInit) return;
        setInterval(this.update.bind(this), this.tick);
        this.isInit = true;
    }
    /**
     * 注册时间回调
     * @param cb 回调函数
     * @param target 回调目标
     * @param data 回调数据
     * @param endTime 结束时间戳
     * @param unCb 卸载检测（满足条件才卸载）
     * @returns 
     */
    static Register(cb: Function, target: Object, endTime: number = 1, data:any = null) {
        this.Uninstall(cb, target);
        let time:number = endTime - PlayerData.GetServerTime();
        if (time <= 0) {
            cb.call(target, data);
            return;
        }
        
        this.list.push({
            cb: cb,
            target: target,
            data: data,
            endTime: endTime,
        });
        if(!this.isInit) this.init(); 
    }

    static Uninstall(cb: Function, target: Object) {
        let timeData:TimerData;
        for (let index = 0; index < this.list.length; index++) {
            timeData = this.list[index];
            if (timeData.cb == cb && timeData.target == target) {
                this.list.splice(index, 1);
                break;
            }
        }
    }
    private static update() {
        let timeData:TimerData;
        for (let index = 0; index < this.list.length; index++) {
            timeData = this.list[index];
            if (timeData.endTime - PlayerData.GetServerTime() <= 0) {
                timeData.cb.call(timeData.target, timeData.data);
                this.list.splice(index, 1);
                index--;
            }
        }
    }
    
}
