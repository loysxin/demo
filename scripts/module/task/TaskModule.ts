import { MsgTypeRet } from "../../MsgType";
import { CfgMgr } from "../../manager/CfgMgr";
import { EventMgr, Evt_TaskChange } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { RewardTips } from "../common/RewardTips";
import { Tips } from "../login/Tips";
import PlayerData, { SMailPlayerData, SPlayerDataTask, SPlayerMailData, STaskState, SThing, SThings } from "../roleModule/PlayerData";

export class TaskModule {

    constructor() {
        Session.on(MsgTypeRet.TaskDataChangedPush, this.onTaskChange, this);
        Session.on(MsgTypeRet.CompleteTaskRet, this.onCompleteTask, this);
    }


    private onTaskChange(data: { task: SPlayerDataTask }) {
        /* for (let key in PlayerData.roleInfo.tasks) {
            if (Number(key) == data.task.id) {
                if (data.task.s != PlayerData.roleInfo.tasks[key].s && data.task.s == STaskState.Finsh) {
                    let datas = CfgMgr.getTaskRewardThings(data.task.id);
                    RewardTips.Show(datas);
                }
            }
        } */
        PlayerData.roleInfo.tasks[data.task.id] = data.task;
        EventMgr.emit(Evt_TaskChange);
    }
    private onCompleteTask(data: { task: SPlayerDataTask }):void{
        this.onTaskChange(data);
        let datas = CfgMgr.getTaskRewardThings(data.task.id);
        RewardTips.Show(datas);
    }
}