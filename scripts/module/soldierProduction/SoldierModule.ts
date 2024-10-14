import { MsgTypeRet } from "../../MsgType";
import { CfgMgr, MessagId, StdRole } from "../../manager/CfgMgr";
import { EventMgr, Evt_Building_Action, Evt_Building_Complete, Evt_EnterHome, Evt_Soldier_JiaSu, Evt_Soldier_Push } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import TimerMgr from "../../utils/TimerMgr";
import { maxx } from "../../utils/Utils";
import { BuildingType } from "../home/HomeStruct";
import PlayerData, { SPlayerDataSoldierProduction } from "../roleModule/PlayerData";
import { SoldierProductionPanel } from "./SoldierProductionPanel";

export class SoldierModule {
    constructor() {
        window.send = Session.Send;
        Session.on(MsgTypeRet.SoldierProductionRet, this.onSoldierProductionResponse, this);
        Session.on(MsgTypeRet.SoldierProductionPush, this.onSoldierProductionPush, this);
        EventMgr.on(Evt_Soldier_JiaSu, this.onSoldierJiaSu, this);
        EventMgr.on(Evt_Building_Complete, this.onFlushProduction, this);
    }
    protected onSoldierProductionResponse(data: { player_data_soldier_production: SPlayerDataSoldierProduction }) {
        PlayerData.AddSoldierProduction(data.player_data_soldier_production);
        this.addRecruitCompleteTime(data.player_data_soldier_production);
        SoldierProductionPanel.Flush();
        this.flushBuilding();
    }
    protected onSoldierProductionPush(data: any) {
        PlayerData.UpdateSoldier(data);
        this.addRecruitCompleteTime(data);
        EventMgr.emit(Evt_Soldier_Push, data);
        this.flushBuilding();
    }
    private onSoldierJiaSu(id:number, time:number):void{
        for (let i = 0; i < PlayerData.roleInfo.soldier_productions.length; i++) {
            let production = PlayerData.roleInfo.soldier_productions[i];
            if (production.id == id) {
                this.addRecruitCompleteTime(production);
                break;
            }
        }
    }
    protected onFlushProduction(buildingId: number, buildingType: number) {
        if (buildingType == BuildingType.bing_ying) {
            this.flushBuilding();
        }
    }

    protected flushBuilding() {
        /* let stds = CfgMgr.GetBuildingDefine(PlayerData.RunHomeId, BuildingType.bing_ying);
        if (!stds.length) return;
        for (let std of stds) {
            let state = PlayerData.GetBuilding(std.BuildingId, PlayerData.RunHomeId);
            if (!state) return;
            let cfg = CfgMgr.GetSoldierProduction(std.BuildingId);
            if (!cfg) return;
            let stdLv = cfg[state.level];
            if (!stdLv) return;
            let hasProduction = undefined;
            for (let i = 0; i < stdLv.SoldiersType.length; i++) {
                let id = stdLv.SoldiersType[i];
                let production = PlayerData.GetSoldierProduction(id, std.BuildingId);
                if (production) {
                    let lesstime = 0;
                    let [limit, time, cost] = SoldierProductionPanel.GetLimit(production, stdLv);
                    if (production.count) {
                        lesstime = maxx(0, production.start_time + production.count * time - PlayerData.GetServerTime());
                        if (lesstime > 0) {
                            hasProduction = std.BuildingId;
                            break;
                        }
                    }
                }
            }
            if (hasProduction) {
                EventMgr.emit(Evt_Building_Action, std.BuildingId, "Idle");
            } else {
                EventMgr.emit(Evt_Building_Action, std.BuildingId, "Idle_Empty");
            }
        } */
       //按有无兵种库存来出动画
       
       let stds = CfgMgr.GetBuildingDefine(PlayerData.RunHomeId, BuildingType.bing_ying);
       if (!stds.length) return;
       let list = PlayerData.roleInfo.soldiers;
       let checkBuidId:number;
       let isHave:boolean = false;
       for (let std of stds) {
            checkBuidId = std.BuildingId;
            for (let index = 0; index < list.length; index++) {
                let data = list[index];
                if(data.count > 0){
                    isHave = true;
                    break;
                }
            }
            
       }
       if(isHave){
            EventMgr.emit(Evt_Building_Action, checkBuidId, "Idle");
       }else{
            EventMgr.emit(Evt_Building_Action, checkBuidId, "Idle_Empty");
       }
       
    }
    /**
     * 兵营招募增加系统频道消息
     * @param data 
     * @returns 
     */
    private addRecruitCompleteTime(data:SPlayerDataSoldierProduction):void{
        let state = PlayerData.GetBuilding(data.building_id, PlayerData.RunHomeId);
        if(!state) return;
        let cfg = CfgMgr.GetSoldierProduction(data.building_id);
        if(!cfg) return;
        let stdLv = cfg[state.level];
        if(!stdLv) return;
        let index = stdLv.SoldiersType.indexOf(data.soldier_id);
        if(index < 0) return;
        let roleType:number = stdLv.SoldiersType[index];
        let stdRole:StdRole = CfgMgr.GetRole()[roleType];
        if(!stdRole) return;
        let t = data.count * stdLv.SoldiersTime[index];
        let endTime: number = data.start_time + t;
        let funName:string = `OnRecruitTimeComplete_${data.building_id}_${data.id}`;
        let completeCb:Function = this[funName];
        if(!completeCb){
            completeCb = ()=>{
                PlayerData.AddChannelMsg(MessagId.Messag_23, stdRole.Name);
            };
            this[funName] = completeCb;
        }
        TimerMgr.Register(completeCb.bind(this), this, endTime);
    }
}
