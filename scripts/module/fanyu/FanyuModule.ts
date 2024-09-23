import { EventMgr, Evt_Passive_Skill_Update, Evt_Role_Update } from "../../manager/EventMgr";
import { MsgTypeRet } from "../../MsgType";
import { Session } from "../../net/Session";
import PlayerData, { SPlayerDataRole } from "../roleModule/PlayerData";
import { FanyuPanel } from "./FanyuPanel";

export class FanyuModule {
    constructor() {
        Session.on(MsgTypeRet.MergeRoleRet, this.onMerge, this);
    }

    /**
     * 繁育结果
     * @param data 
     */
    protected onMerge(data: { role: SPlayerDataRole, success: boolean }) {
        FanyuPanel.ins.OnMerge(data.role);
        if (data.success) {
            PlayerData.AddRole(data.role);
            EventMgr.emit(Evt_Role_Update, data.role);
        } else {
            console.log(`繁育失败`)
        }
    }
}