import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { BattleReadyLogic } from "../../battle/Ready/BattleReadyLogic";
import { EventMgr, Evt_BuyPlunderTimes, Evt_LootGetPlayerBattleData, Evt_LootPlayerData, Evt_LootPlunder, Evt_LootPlunderRecord, Evt_LootSeasonData, Evt_Matching, Evt_Matching2 } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { HomeUI } from "../home/panel/HomeUI";
import PlayerData from "../roleModule/PlayerData";
import { LootVsPanel } from "./LootVsPanel";

export class LootModule {
    constructor() {
        Session.on(MsgTypeRet.GetMatchPlayerDataRet, this.onPlayerData, this);
        Session.on(MsgTypeRet.GetCurrentSeasonInfoRet, this.onSeasonData, this);
        Session.on(MsgTypeRet.MatchmakingRet, this.onMatchking, this);
        Session.on(MsgTypeRet.GetPlayerBattleDataRet, this.onGetPlayerBattleData, this);
        Session.on(MsgTypeRet.QueryBattlePlunderRecordRet, this.onPlunderRecord, this);
        Session.on(MsgTypeRet.PlunderRet, this.onPlunder, this);
        Session.on(MsgTypeRet.BuyPlunderTimesRet, this.onBuyPlunderTimes, this);
    }

    private onPlayerData(data) {
        PlayerData.LootPlayerData = data.match_player_data;
        if(PlayerData.LootPlayerData)
            PlayerData.LootPlayerData.is_use_item = false;
        EventMgr.emit(Evt_LootPlayerData, data);
    }
    private onSeasonData(data) {
        PlayerData.LootSeasonInfo = data;
        EventMgr.emit(Evt_LootSeasonData, data);
    }

    private onMatchking(data) {
        PlayerData.LootMatchList = data.matches;
        LootVsPanel.Show(data.matches);
        EventMgr.emit(Evt_Matching);
        EventMgr.emit(Evt_Matching2);
    }
    private onGetPlayerBattleData(data: any) {
        // LootRoleInfoPanel.Show(data.battle_data);
        EventMgr.emit(Evt_LootGetPlayerBattleData, data);
    }
    private onPlunder(data) {
        EventMgr.emit(Evt_LootPlunder, data);
    }
    private onPlunderRecord(data) {
        EventMgr.emit(Evt_LootPlunderRecord, data);
    }
    private onBuyPlunderTimes(data) {
        PlayerData.LootPlayerData.match_count = data.match_count;
        EventMgr.emit(Evt_BuyPlunderTimes);
        if (PlayerData.LootPlayerData.paid_refresh_count > 0 && data.match_count > 0 && !PlayerData.LootPlayerData.is_use_item) {
            PlayerData.LootPlayerData.paid_refresh_count--;
        }
    }
}