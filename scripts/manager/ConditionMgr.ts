import { BuildingType } from "../module/home/HomeStruct";
import PlayerData, { PlayerDataMap, SPlayerDataHomeland } from "../module/roleModule/PlayerData";
import { GetGameData } from "../net/MsgProxy";
import { CfgMgr, ConditionType, ItemSubType, StdGuide, StdHomeLand, ThingSubType, ThingType } from "./CfgMgr";

/**
 * 检测条件
 * @param conditionId 
 * @param value 
 * @returns 
 */
export function CheckCondition(conditionId: number, value: any) {
    if (conditionId == undefined || value == undefined) return undefined;
    switch (conditionId) {
        case ConditionType.Home_1: // 101家园基地等级
            var buildings = PlayerData.GetBuildingByType(BuildingType.ji_di, 101);
            var building = buildings ? buildings[0] : undefined;
            if (!building || building.level < value) return `生命树等级不足Lv${value}!`;
            break;
        case ConditionType.Home_2: // 201家园基地等级
            var buildings = PlayerData.GetBuildingByType(BuildingType.ji_di, 201);
            var building = buildings ? buildings[0] : undefined;
            if (!building || building.level < value) return `家园2等级不足Lv${value}!`;
            break;
        case ConditionType.Home_3: // 301家园基地等级
            var buildings = PlayerData.GetBuildingByType(BuildingType.ji_di, 301);
            var building = buildings ? buildings[0] : undefined;
            if (!building || building.level < value) return `家园3等级不足Lv${value}!`;
            break;
        case ConditionType.PlayerPower: // 玩家战力
            let power: number = PlayerData.roleInfo.battle_power;
            if (power < value) return `玩家战力不足${value}!`;
            break;
        case ConditionType.Task: // 完成任务id为X的任务
            break;
        case ConditionType.Guide: // 完成指引id为X的新手指引
            let state = GetGameData(PlayerDataMap.Guide);
            let std: StdGuide = CfgMgr.Get("guide")[value];
            let times = state[value] || 0;
            if (times < std.Times) return "引导尚未完成";
            break;
        case ConditionType.Role: // 拥有指定id为x的英雄角色
            if (!PlayerData.GetPlayerByType(value).length) {
                return "未拥有" + CfgMgr.GetRole()[value].Name;
            }
            break;
        case ConditionType.Wood: // 木材数量大于等于x
            if (PlayerData.roleInfo.resources.wood < value) return "木材不足" + value;
            break;
        case ConditionType.Rock: // 石头数量大于等于x
            if (PlayerData.roleInfo.resources.rock < value) return "石材不足" + value;
            break;
        case ConditionType.Seed: // 种子数量大于等于x
            if (PlayerData.roleInfo.resources.seed < value) return "种子不足" + value;
            break;
        case ConditionType.Water: // 纯水数量大于等于x
            if (PlayerData.roleInfo.resources.water < value) return "水不足" + value;
            break;
        case ConditionType.FishStart: // 钓鱼大赛活动开启
            break;
        case ConditionType.FishOnIce: // 玩家在冰封湖泊钓到大鱼
            break;
        case ConditionType.FishClose: // 钓鱼大赛活动关闭
            break;
        case ConditionType.Home101_WoodLevel: // 家园1采木场建筑等级
            if (PlayerData.GetBuildingLv(101, BuildingType.cai_mu) < value) return "采木场等级不足" + value;
            break;
        case ConditionType.Home101_RockLevel: // 家园1采矿场建筑等级
            if (PlayerData.GetBuildingLv(101, BuildingType.cai_kuang) < value) return "采矿场等级不足" + value;
            break;
        case ConditionType.Home101_WaterLevel: // 家园1采水场建筑等级
            if (PlayerData.GetBuildingLv(101, BuildingType.cai_shui) < value) return "采水场等级不足" + value;
            break;
        case ConditionType.Home101_SeedLevel: // 家园1采能场建筑等级
            if (PlayerData.GetBuildingLv(101, BuildingType.hua_fang) < value) return "花房等级不足" + value;
            break;
        case ConditionType.Home101_HeChengLevel: // 家园1合成工坊建筑等级
            if (PlayerData.GetBuildingLv(101, BuildingType.he_cheng) < value) return "合成工坊等级不足" + value;
            break;
        case ConditionType.Home101_FanyuLevel: // 家园1繁育巢建筑等级
            if (PlayerData.GetBuildingLv(101, BuildingType.fan_yu) < value) return "繁育巢等级不足" + value;
            break;
        case ConditionType.Home101_ProductLevel: // 家园1生产工坊建筑等级
            if (PlayerData.GetBuildingLv(101, BuildingType.sheng_chan) < value) return "生产工坊等级不足" + value;
            break;
        case ConditionType.Home101_Tower1Level: // 家园1防御塔1建筑等级
            if (PlayerData.GetBuildingLv(101, BuildingType.fang_yu_ta, 0) < value) return "防御塔1等级不足" + value;
            break;
        case ConditionType.Home101_Tower2Level: // 家园1防御塔2建筑等级
            if (PlayerData.GetBuildingLv(101, BuildingType.fang_yu_ta, 1) < value) return "防御塔2等级不足" + value;
            break;
        case ConditionType.Home101_BingLevel: // 家园1兵营建筑等级
            if (PlayerData.GetBuildingLv(101, BuildingType.bing_ying) < value) return "兵营等级不足" + value;
            break;
        case ConditionType.Home101_DoorLevel: // 家园1城墙大门建筑等级
            if (PlayerData.GetBuildingLv(101, BuildingType.cheng_qiang) < value) return "城墙大门等级不足" + value;
            break;

        case ConditionType.Home201_WoodLevel: // 家园2采木场建筑等级
            if (PlayerData.GetBuildingLv(201, BuildingType.cai_mu) < value) return "采木场等级不足" + value;
            break;
        case ConditionType.Home201_RockLevel: // 家园2采矿场建筑等级
            if (PlayerData.GetBuildingLv(201, BuildingType.cai_kuang) < value) return "采矿场等级不足" + value;
            break;
        case ConditionType.Home201_WaterLevel: // 家园2采水场建筑等级
            if (PlayerData.GetBuildingLv(201, BuildingType.cai_shui) < value) return "采水场等级不足" + value;
            break;
        case ConditionType.Home201_SeedLevel: // 家园2采能场建筑等级
            if (PlayerData.GetBuildingLv(201, BuildingType.hua_fang) < value) return "花房等级不足" + value;
            break;
        case ConditionType.Home201_HeChengLevel: // 家园2合成工坊建筑等级
            if (PlayerData.GetBuildingLv(201, BuildingType.he_cheng) < value) return "合成工坊等级不足" + value;
            break;
        case ConditionType.Home201_FanyuLevel: // 家园2繁育巢建筑等级
            if (PlayerData.GetBuildingLv(201, BuildingType.fan_yu) < value) return "繁育巢等级不足" + value;
            break;
        case ConditionType.Home201_ProductLevel: // 家园2生产工坊建筑等级
            if (PlayerData.GetBuildingLv(201, BuildingType.sheng_chan) < value) return "生产工坊等级不足" + value;
            break;
        case ConditionType.Home201_Tower1Level: // 家园2防御塔1建筑等级
            if (PlayerData.GetBuildingLv(201, BuildingType.fang_yu_ta, 0) < value) return "防御塔1等级不足" + value;
            break;
        case ConditionType.Home201_Tower2Level: // 家园2防御塔2建筑等级
            if (PlayerData.GetBuildingLv(201, BuildingType.fang_yu_ta, 1) < value) return "防御塔2等级不足" + value;
            break;
        case ConditionType.Home201_BingLevel: // 家园2兵营建筑等级
            if (PlayerData.GetBuildingLv(201, BuildingType.bing_ying) < value) return "兵营等级不足" + value;
            break;
        case ConditionType.Home201_DoorLevel: // 家园2城墙大门建筑等级
            if (PlayerData.GetBuildingLv(201, BuildingType.cheng_qiang) < value) return "城墙大门等级不足" + value;
            break;

        case ConditionType.Home301_WoodLevel: // 家园3采木场建筑等级
            if (PlayerData.GetBuildingLv(301, BuildingType.cai_mu) < value) return "采木场等级不足" + value;
            break;
        case ConditionType.Home301_RockLevel: // 家园3采矿场建筑等级
            if (PlayerData.GetBuildingLv(301, BuildingType.cai_kuang) < value) return "采矿场等级不足" + value;
            break;
        case ConditionType.Home301_WaterLevel: // 家园3采水场建筑等级
            if (PlayerData.GetBuildingLv(301, BuildingType.cai_shui) < value) return "采水场等级不足" + value;
            break;
        case ConditionType.Home301_SeedLevel: // 家园3采能场建筑等级
            if (PlayerData.GetBuildingLv(301, BuildingType.hua_fang) < value) return "花房等级不足" + value;
            break;
        case ConditionType.Home301_HeChengLevel: // 家园3合成工坊建筑等级
            if (PlayerData.GetBuildingLv(301, BuildingType.he_cheng) < value) return "合成工坊等级不足" + value;
            break;
        case ConditionType.Home301_FanyuLevel: // 家园3繁育巢建筑等级
            if (PlayerData.GetBuildingLv(301, BuildingType.fan_yu) < value) return "繁育巢等级不足" + value;
            break;
        case ConditionType.Home301_ProductLevel: // 家园3生产工坊建筑等级
            if (PlayerData.GetBuildingLv(301, BuildingType.sheng_chan) < value) return "生产工坊等级不足" + value;
            break;
        case ConditionType.Home301_Tower1Level: // 家园3防御塔1建筑等级
            if (PlayerData.GetBuildingLv(301, BuildingType.fang_yu_ta, 0) < value) return "防御塔1等级不足" + value;
            break;
        case ConditionType.Home301_Tower2Level: // 家园3防御塔2建筑等级
            if (PlayerData.GetBuildingLv(301, BuildingType.fang_yu_ta, 1) < value) return "防御塔2等级不足" + value;
            break;
        case ConditionType.Home301_BingLevel: // 家园3兵营建筑等级
            if (PlayerData.GetBuildingLv(301, BuildingType.bing_ying) < value) return "兵营等级不足" + value;
            break;
        case ConditionType.Home301_DoorLevel: // 家园3城墙大门建筑等级
            if (PlayerData.GetBuildingLv(301, BuildingType.cheng_qiang) < value) return "城墙大门等级不足" + value;
            break;
        //红点==============================================================================
        case ConditionType.RedPoint_PerMail: // 个人有新邮件
            var isNew = `条件不满足`;
            PlayerData.mails.forEach((mail) => {
                if (mail.sender_player_id || mail.sender_player_id.length >= 2) {//个人
                    if (!mail.is_read) {
                        isNew = undefined;
                    }
                }
            })
            if (isNew) return isNew
            break;
        case ConditionType.RedPoint_PerMailReward: // 个人有可领取邮件
            var isNew = `条件不满足`;
            PlayerData.mails.forEach((mail) => {
                if (mail.sender_player_id || mail.sender_player_id.length >= 2) {//个人
                    if (!mail.is_attachment_claimed) {
                        isNew = undefined;
                    }
                }
            })
            if (isNew) return isNew
            break;
        case ConditionType.RedPoint_SysMail: // 系统有新邮件
            var isNew = `条件不满足`;
            PlayerData.mails.forEach((mail) => {
                if (!mail.sender_player_id || mail.sender_player_id.length < 2) {//系统
                    if (!mail.is_read) {
                        isNew = undefined;
                    }
                }
            })
            if (isNew) return isNew
            break;
        case ConditionType.RedPoint_SysMailReward: // 系统有可领取邮件
            var isNew = `条件不满足`;
            PlayerData.mails.forEach((mail) => {
                if (!mail.sender_player_id || mail.sender_player_id.length < 2) {//系统
                    if (!mail.is_attachment_claimed) {
                        isNew = undefined;
                    }
                }
            })
            if (isNew) return isNew
            break;
        case ConditionType.RedPoint_Bag:
            if (!PlayerData.CheckRoleChip() && !PlayerData.CheckBagBox()) {
                return `条件不满足`
            }
            break;
        case ConditionType.RedPoint_BagPiece: // 背包有可合成的英雄碎片
            if (!PlayerData.CheckRoleChip()) {
                return `条件不满足`
            }
            break;
        case ConditionType.RedPoint_BagBox: // 背包有可点击使用的宝箱道具
            if (!PlayerData.CheckBagBox()) {
                return `条件不满足`
            }
            break;
        case ConditionType.RedPoint_Fish: // 本次登录钓鱼活动开启
            if (!PlayerData.CheckFishEnterRead()) {
                return `条件不满足`
            }
            break;
        case ConditionType.RedPoint_FishShopCanBuy: // 背包中鱼票可购买钓鱼商店的任意道具
            if (!PlayerData.CheckFishShopIsCanBuy()) {
                return `条件不满足`
            }
            break;
        case ConditionType.RedPoint_FishShopCanSell: // 钓鱼商店中有可出售的鱼
            if (!PlayerData.CheckFishShopIsSell()) {
                return `条件不满足`
            }
            break;
        case ConditionType.RedPoint_FishShopBtn: // 钓鱼商店入口
            if (!PlayerData.CheckFishShopIsSell() && !PlayerData.CheckFishShopIsCanBuy()) {
                return `条件不满足`
            }
            break;
        case ConditionType.RedPoint_Role: // 足够的资源被动技能升级
            if (!PlayerData.CheckRoleEnterRed()) {
                return `条件不满足`
            }
            
            break;
        case ConditionType.RedPoint_HomeUnLock: // 多家园达到可解锁条件时
            if (!checkHomeUnlock()) return "无家园可解锁";
            break;
        case ConditionType.RedPoint_OutdoorTime: // 探险有免费次数时/有足够的道具进入
            if(!PlayerData.CheckPveRed()) return `条件不满足`;
            break;
        case ConditionType.RedPoint_LootTime: // 掠夺有免费次数时/有足够的道具进入
            if(!PlayerData.CheckLoop()) return `条件不满足`;
            break;
        case ConditionType.RedPoint_CollectTime: // 采集时长有可补充次数时（包括看广告领取
            return `条件不满足`
            break;
        case ConditionType.RedPoint_CanCompound: // 合成工坊道具足够合成时
            if (!checkCompound()) return `条件不满足`
            break;
        default:
            return `条件不满足`
            break;
    }
    return undefined;
}

function checkHomeUnlock() {
    let homeDataList:SPlayerDataHomeland[] = PlayerData.homelands;
    let homeList: StdHomeLand[] = CfgMgr.Get("homeland_init");
    if(!homeDataList || homeDataList.length < 1) return false;
    if(homeList.length == homeDataList.length) return false;
    let checkHome:StdHomeLand;
    for (let stdHome of homeList) {
        checkHome = stdHome;
        for (let homeData of homeDataList) {
            if(stdHome.HomeId == homeData.id){
                checkHome = null;
                break;
            }
        }
        if(checkHome) break;
    }
    if(!checkHome) return false;
    for (let i = 0; i < checkHome.ConditionId.length; i++) {
        if (CheckCondition(checkHome.ConditionId[i], checkHome.ConditionLv[i])) return false;
    }

    for (let i = 0; i < checkHome.ItemsId.length; i++) {
        let id = checkHome.ItemsId[i];
        let stdItem = CfgMgr.Getitem(id);
        if (!stdItem) continue;
        let has = PlayerData.GetItemCount(id);
        if (has < checkHome.ItemCost[i]) return false;
    }
    return true;
}


function checkCompound() {
    let cfg = CfgMgr.GetCompound();
    let compoundCount = PlayerData.roleInfo.resource_exchange_uses || 0;
    //@ts-ignore
    let maxCount = Math.max(...Object.keys(cfg));
    let info = cfg[compoundCount + 1 > maxCount ? maxCount : compoundCount + 1];

    if (info.WoodNum <= PlayerData.roleInfo.resources.wood &&
        info.RockNum <= PlayerData.roleInfo.resources.rock &&
        info.SeedNum <= PlayerData.roleInfo.resources.seed &&
        info.WaterNum <= PlayerData.roleInfo.resources.water) {
        return true;
    }
    return false;
}
