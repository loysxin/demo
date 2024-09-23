import { MsgTypeRet } from "../../MsgType";
import { Item } from "../../editor/Item";
import { CfgMgr } from "../../manager/CfgMgr";
import { EventMgr, Evt_Compose, Evt_GetReward, Evt_Item_Change } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { ItemUtil } from "../../utils/ItemUtils";
import { RewardTips } from "../common/RewardTips";
import { ShowHeroPanel } from "../common/ShowHeroPanel";
import { CardType } from "../home/panel/Card";
import { HomeUI } from "../home/panel/HomeUI";
import PlayerData, { SPlayerDataRole, SThing } from "../roleModule/PlayerData";

export class BagModule {
    constructor() {
        Session.on(MsgTypeRet.ItemChangePush, this.onItemChange, this);
        Session.on(MsgTypeRet.SynthesizeRoleRet, this.onMergeItem, this);
        Session.on(MsgTypeRet.OpenBoxRet, this.getOpenBoxReward, this);
        Session.on(MsgTypeRet.UseItemRet, this.useItemRet, this);
    }

    protected itemChangeOff = false;
    onItemChange(data: { change_count: number, count: number, id: number }) {
        for (let i = 0; i < PlayerData.items.length; i++) {
            let item = PlayerData.items[i];
            if (item.id == data.id) {
                let old = item.count;
                if (data.count <= 0) {
                    PlayerData.items.splice(i, 1);
                } else {
                    item.count = data.count;
                }
                EventMgr.emit(Evt_Item_Change);
                return;
            }
        }
        HomeUI.Flush();
        PlayerData.items.push({ id: data.id, count: data.count, isNew: true });
        EventMgr.emit(Evt_Item_Change);
    }

    onMergeItem(data: { role: SPlayerDataRole }) {
        ShowHeroPanel.Show(data.role)
        PlayerData.AddRole(data.role);
        EventMgr.emit(Evt_Compose, data);
    }

    getOpenBoxReward(data: { reward_thing_type: number[], reward_thing_id: number[], reward_thing_count: number[], item_id: number }) {
        if (data) {
            let reward_data: SThing[] = [];
            let maps = {};
            let count = data.reward_thing_count.length
            for (let index = 0; index < count; index++) {
                let awardList: SThing;
                let type = data.reward_thing_type[index];
                let id = data.reward_thing_id[index];
                if (maps[type + "_" + id]) {
                    ItemUtil.MergeThings(maps[type + "_" + id], data.reward_thing_count[index] || 0);
                    continue;
                } else if (type == 5) {
                    let cfg = CfgMgr.GetRewardRoleById(id);
                    awardList = ItemUtil.CreateThing(type, cfg.RoleType, data.reward_thing_count[index]);
                    awardList.role = {
                        id: "",
                        type: cfg.RoleType,
                        level: cfg.RoleLevel,
                        experience: 0,
                        soldier_num: 0,
                        active_skills: [],
                        passive_skills: [],
                        is_in_building: false,
                        building_id: 0,
                        battle_power: 0,
                        quality: cfg.RoleQuality,
                        skills: [],
                        is_assisting: true,
                        is_in_attack_lineup: false,
                        is_in_defense_lineup: false,
                        trade_cd: 0,
                    }
                } else {
                    awardList = ItemUtil.CreateThing(type, id, data.reward_thing_count[index]);
                }
                maps[type + "_" + id] = awardList;
                reward_data.push(awardList)
            }
            //获取宝箱特效
            let spinetype: number = 1;
            if (data.item_id) {
                spinetype = CfgMgr.Getitem(data.item_id).SpecialDisplay;
            }
            RewardTips.Show(reward_data, true, null, spinetype)
            EventMgr.emit(Evt_GetReward, data);
        }
    }

    useItemRet(data) {
        console.log("useItemRet", data);
        let cfg = CfgMgr.Getitem(data.item_id)
        if(cfg.Items == 37 || cfg.Items == 38 || cfg.Items == 39 || cfg.Items == 40){
            if(PlayerData.LootPlayerData.shield_end_time < PlayerData.GetServerTime() + cfg.ItemEffect1){
                PlayerData.LootPlayerData.shield_end_time = PlayerData.GetServerTime() + cfg.ItemEffect1;
            }
        }
    }
}