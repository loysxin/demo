// ItemChangePush

import { MsgTypeRet } from "../../MsgType";
import { CfgMgr, StdRoleLevel } from "../../manager/CfgMgr";
import { EventMgr, Evt_ConfigData_Update, Evt_FightChange, Evt_Item_Change, Evt_Passive_Skill_Update, Evt_Role_Upgrade } from "../../manager/EventMgr";
import { SyncGameData } from "../../net/MsgProxy";
import { Session } from "../../net/Session";
import Logger from "../../utils/Logger";
import { Second } from "../../utils/Utils";
import { GameSet } from "../GameSet";
import { HomeUI } from "../home/panel/HomeUI";
import { RoleTuPoPanel } from "../role/RoleTuPoPanel";
import { RoleTuPoResultPanel } from "../role/RoleTuPoResultPanel";
import PlayerData, { SPlayerDataRole, SPlayerDataSkill } from "./PlayerData";

export class PlayerModule {
    private tick = 0;

    constructor() {
        Session.on(MsgTypeRet.TotalBattlePowerChangePush, this.onPlayerPower, this);
        Session.on(MsgTypeRet.UpgradeRoleRet, this.onUpgradeRoleRet, this);
        Session.on(MsgTypeRet.SetConfigDataRet, this.onUpdateRoleCfg, this);
        Session.on(MsgTypeRet.UpgradePassiveSkillRet, this.onUpgradePassiveSkill, this);

        GameSet.RegisterUpdate(this.update, this);
    }

    protected fightChangeOff = false;
    protected async onPlayerPower(data: { total_battle_power: number, change_battle_power: number }) {
        PlayerData.roleInfo.battle_power = data.total_battle_power;
        if (this.fightChangeOff) return;
        this.fightChangeOff = true;
        await Second(0.1);
        this.fightChangeOff = false;
        EventMgr.emit(Evt_FightChange);
    }

    private onUpgradeRoleRet(data: { role: SPlayerDataRole }): void {
        let old = structuredClone(PlayerData.GetRoleById(data.role.id));
        PlayerData.AddRole(data.role);
        let isUpgrade: boolean = false;
        //升级或突破
        if (data.role.level > old.level) {
            let stdLv: StdRoleLevel = CfgMgr.GetRoleLevel(old.type, old.level);
            //突破
            if (stdLv && stdLv.BreakItem && stdLv.BreakItem.length > 0) {
                RoleTuPoResultPanel.Show(data.role.id, true);
            } else {
                isUpgrade = true;
            }
        }
        
        EventMgr.emit(Evt_Role_Upgrade, data.role.id, isUpgrade);
    }

    private onUpdateRoleCfg(data: { config_data: { [key: number]: number } }) {
        PlayerData.roleInfo.config_data = data.config_data;
        if (SyncGameData(data.config_data)) EventMgr.emit(Evt_ConfigData_Update);
    }
    private onUpgradePassiveSkill(data: { role: SPlayerDataRole }): void {
        PlayerData.AddRole(data.role);
        EventMgr.emit(Evt_Passive_Skill_Update, data.role.id);
    }
    private update(dt: number) {
        this.tick += dt;
        if (this.tick >= 1) {
            this.tick = 0;
            const timeMap = PlayerData.CycleTimeMap;
            if (!timeMap) return;
            let now = PlayerData.serverTime;
            for (let k in timeMap) {
                let t = Number(k);
                let start = timeMap[k];
                if (now - start >= t) {
                    timeMap[k] = now;
                    // 此处运行更新数据,t表示时间间隔(秒)

                }
            }
        }
    }
}
