import { Attr, CfgMgr, ConditionType, FishRoundState, GuildPostType, ItemSubType, ItemType, MessagId, OneOffRedPointId, ResourceType, ShopGroupId, ShopType, StdActiveSkill, StdAdvister, StdAttr, StdCommonType, StdEquityList, StdFishCommon, StdFishShop, StdGuildBank, StdGuildEquity, StdGuildEvent, StdGuildRole, StdGuildType, StdItem, StdMerge, StdMessag, StdPassiveLevel, StdProduction, StdRole, StdRoleLevel, StdShopGroup, StdShopowner, StdSysId, StdSystemOpen, ThingItemId, ThingType } from "../../manager/CfgMgr";
import { maxx, ReplaceStr } from "../../utils/Utils";
import { ConditionSub, FormatCondition, GetAttrValue, GetFightAttrValue } from "../common/BaseUI";
import { BuildingType, SPlayerDataFusionStone } from "../home/HomeStruct";
import { DateUtils } from "../../utils/DateUtils";
import { EventMgr, Evt_AdvisterUpdate, Evt_ChannelMsgUpdate, Evt_Item_Change, Evt_LoginRedPointUpdate, Evt_Role_Del } from "../../manager/EventMgr";
import { BeforeGameUtils } from "../../utils/BeforeGameUtils";
import { game, js } from "cc";
import LocalStorage from "../../utils/LocalStorage";
import { ItemUtil } from "../../utils/ItemUtils";
import { CheckCondition } from "../../manager/ConditionMgr";

class PlayerData {
    constructor() {
        this.init();
    }

    init() {

    }
    public static isHideUI: boolean = false;//是否隐藏ui中
    public static serverTime: number = 0;
    private static server_offset: number = 0;
    private static _serverDate: Date = new Date();

    static RunHomeId: number;

    /**
     * 循环刷新的map
     */
    static CycleTimeMap: { [duration: number]: number } = {};

    public static SyncServerTime(time: number) {
        if (!this.serverTime) {
            // 暂时以天为循环
            PlayerData.CycleTimeMap[24 * 3600] = DateUtils.GetTodaySecond();
        }

        this.serverTime = time;
        const localTimestamp = Date.now() / 1000;
        this.server_offset = this.serverTime - localTimestamp;
        // LocalStorage.SetNumber('timeDifference', this.server_offset);
    }

    /**
     * 获取服务器时间
     * @returns 
     */
    public static GetServerTime() {
        // 获取保存的时间偏差
        // const timeDifference = LocalStorage.GetNumber('timeDifference') || 0;
        // 计算当前服务器时间
        const serverTime = Date.now() / 1000 + this.server_offset;
        return serverTime;
    }
    public static GetServerDate(): Date {
        this._serverDate.setTime(this.GetServerTime() * 1000);
        return this._serverDate;
    }

    /**
     * 初始玩家数据
     * @param playerInfo 
     */
    public static SetPlayerInfo(playerInfo: SPlayerData) {
        playerInfo.item_productions = playerInfo.item_productions || [];
        playerInfo.soldiers = playerInfo.soldiers || [];
        playerInfo.soldier_productions = playerInfo.soldier_productions || [];
        playerInfo.roles = playerInfo.roles || [];
        playerInfo.defense_lineup = playerInfo.defense_lineup || [];
        playerInfo.attack_lineup = playerInfo.attack_lineup || [];
        playerInfo.config_data = playerInfo.config_data || {};
        playerInfo.tasks = playerInfo.tasks || {};
        playerInfo.items = playerInfo.items || [];
        /*  if (!this.playerInfo) {
             this.playerInfo = playerInfo;
             
         }  */
        this.playerInfo = playerInfo;

        if (!this.GetItem(1)) playerInfo.items.push({ id: ThingItemId.ItemId_1, count: 0 });
        if (!this.GetItem(2)) playerInfo.items.push({ id: ThingItemId.ItemId_2, count: 0 });
        if (!this.GetItem(3)) playerInfo.items.push({ id: ThingItemId.ItemId_3, count: 0 });
        if (!this.GetItem(6)) playerInfo.items.push({ id: ThingItemId.ItemId_6, count: 0 });
        if (!this.GetItem(7)) playerInfo.items.push({ id: ThingItemId.ItemId_7, count: 0 });
        if (!this.GetItem(8)) playerInfo.items.push({ id: ThingItemId.ItemId_8, count: 0 });
        if (!this.GetItem(9)) playerInfo.items.push({ id: ThingItemId.ItemId_9, count: 0 });

        for (let role of playerInfo.roles) {
            role.battle_power = CountPower(role.type, role.level, role);
        }
        this.UpdateSpecialItems();

    }

    /**
     * 更新特殊道具
     */
    static UpdateSpecialItems(eimt: boolean = true) {
        let items = PlayerData.items;
        let info = this.playerInfo;
        for (let i = 0; i < PlayerData.items.length; i++) {
            let item = PlayerData.items[i];
            switch (item.id) {
                case ThingItemId.ItemId_1:
                    if (item.count != info.currency) {
                        item.count = Math.max(0, info.currency);
                        if (eimt) EventMgr.emit(Evt_Item_Change);
                    }
                    break;
                case ThingItemId.ItemId_2:
                    if (item.count != info.currency2) {
                        item.count = Math.max(0, info.currency2);
                        if (eimt) EventMgr.emit(Evt_Item_Change);
                    }
                    break;
                case ThingItemId.ItemId_3:
                    if (item.count != info.currency3) {
                        item.count = Math.max(0, info.currency3);
                        if (eimt) EventMgr.emit(Evt_Item_Change);
                    }
                    break;

                case ThingItemId.ItemId_6:
                    if (item.count != info.resources.wood) {
                        item.count = Math.max(0, info.resources.wood);
                        if (eimt) EventMgr.emit(Evt_Item_Change);
                    }
                    break;
                case ThingItemId.ItemId_7:
                    if (item.count != info.resources.rock) {
                        item.count = Math.max(0, info.resources.rock);
                        if (eimt) EventMgr.emit(Evt_Item_Change);
                    }
                    break;
                case ThingItemId.ItemId_8:
                    if (item.count != info.resources.water) {
                        item.count = Math.max(0, info.resources.water);
                        if (eimt) EventMgr.emit(Evt_Item_Change);
                    }
                    break;
                case ThingItemId.ItemId_9:
                    if (item.count != info.resources.seed) {
                        item.count = Math.max(0, info.resources.seed);
                        if (eimt) EventMgr.emit(Evt_Item_Change);
                    }
                    break;
            }
        }
    }

    // 角色信息
    private static playerInfo: SPlayerData;
    public static get roleInfo() { return this.playerInfo; }
    // 资源数据
    public static get resources() { return this.playerInfo.resources; }
    // 道具列表
    public static get items() { return this.playerInfo.items; }

    public static get pveData() { return this.playerInfo.pve_data; }
    /**playerIdKey */
    public static get playerIdKey() { return `PlayerId_${this.roleInfo.player_id}`; }
    /**
     * 根据道具类型获取道具列表
     * @param itemType 
     * @returns 
     */
    static GetitemByType(itemType: number) {
        let items = [];
        for (let item of this.playerInfo.items) {
            let std = CfgMgr.Getitem(item.id);
            if (std && std.Itemtpye == itemType) {
                items.push(item);
            }
        }
        return items;
    }
    /**
     * 根据页签获取道具列表
     * @param subType 
     * @returns 
     */
    static GetitemBySubType(subType: number) {
        let items: SPlayerDataItem[] = [];
        for (let item of this.playerInfo.items) {
            if (item.count > 0) {
                let std = CfgMgr.Getitem(item.id);
                if (std && std.SubType == subType) {
                    items.push(item);
                }
            }
        }
        return items;
    }

    /**交易所根据页签获取资源 */
    static GetResBySubType(subType: number) {
        let datas: SThing[] = [];
        if (subType == 0) {
            //道具
            for (let item of this.playerInfo.items) {
                let std = CfgMgr.Getitem(item.id);
                if (std && (std.SubType == ItemSubType.cost || std.SubType == ItemSubType.shard || std.Items == 3)) {
                    let data: SThing = {
                        type: ThingType.ThingTypeItem,
                        item: { id: item.id, count: item.count }
                    }
                    datas.push(data)
                }
            }
        } else if (subType == 1) {
            //角色
            let roleData = this.roleInfo.roles;
            roleData.forEach((data) => {
                let stateList:number[] = PlayerData.GetRoleStateList(data)
                if (stateList.length == 0 && !data.is_assisting && !data.is_in_main_building) {
                    let role_data: SThing = {
                        type: ThingType.ThingTypeRole,
                        role: data,
                    }
                    datas.push(role_data)
                }
            })
        } else if (subType == 2) {
            //资源
            let data1: SThing = {
                type: ThingType.ThingTypeResource,
                resource: { wood: this.roleInfo.resources.wood }
            }
            datas.push(data1)

            let data2: SThing = {
                type: ThingType.ThingTypeResource,
                resource: { water: this.roleInfo.resources.water }
            }
            datas.push(data2)

            let data3: SThing = {
                type: ThingType.ThingTypeResource,
                resource: { seed: this.roleInfo.resources.seed }
            }
            datas.push(data3)

            let data4: SThing = {
                type: ThingType.ThingTypeResource,
                resource: { rock: this.roleInfo.resources.rock }
            }
            datas.push(data4)

        } else if (subType == 3) {
            //装备
        }
        return datas;
    }

    /**交易所订单数据排除空数据 */
    static getOrderListData(data:SOrderData[]){
        let datas:SOrderData[] = []
        if(data){
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                if (element && element.player_id) {
                    datas.push(element)
                } 
            }
        }
        return datas;
    }

    // 角色列表
    public static GetRoles() {
        return this.playerInfo.roles.concat();
    }
    public static GetRoleNum() {
        return this.playerInfo.roles.length;
    }

    /**
     * 获取角色
     * @param type
     * @returns 
     */
    public static GetPlayerByType(type: number) {
        let result = [];
        for (let role of this.playerInfo.roles) {
            if (role.type == type) result.push(role);
        }
        return result;
    }

    /**
     * 获取玩家总战力
     * @returns 
     */
    public static GetPlayerPower(): number {
        let totalPower: number = 0;
        for (let role of this.playerInfo.roles) {
            if (!role.battle_power) {
                role.battle_power = CountPower(role.type, role.level, role);
            }
            totalPower += role.battle_power;
        }
        return totalPower;
    }
    /**
     * 增加角色
     * @param data 
     * @returns 
     */
    static AddRole(data: SPlayerDataRole) {
        data.battle_power = CountPower(data.type, data.level, data);
        for (let i = 0; i < this.playerInfo.roles.length; i++) {
            let role = this.playerInfo.roles[i];
            if (role.id == data.id) {
                this.playerInfo.roles[i] = data;
                return;
            }
        }
        this.playerInfo.roles.push(data);
    }
    /**
     * 删除角色
     * @param id 
     * @returns 
     */
    static DelRole(id: string) {
        for (let i = 0; i < this.playerInfo.roles.length; i++) {
            let role = this.playerInfo.roles[i];
            if (role.id == id) {
                this.playerInfo.roles.splice(i, 1);
                EventMgr.emit(Evt_Role_Del, role, i);
                return;
            }
        }
    }
    // 出战英雄列表
    public static get attackRoles() { return this.roleInfo.attack_lineup || []; }
    //主建筑配置
    public static get homelands() { return this.roleInfo.homelands; }
    public static get nowhomeLand() { return this.GetHomeLand(this.RunHomeId); }
    /**获取指定家园 */
    public static GetHomeLand(homeId: number) {
        if (!this.roleInfo) return undefined;
        for (let homeland of this.roleInfo.homelands) {
            if (homeland.id == homeId) return homeland;
        }
        return undefined;
    }

    /**
     * 获取道具id
     * @param id 
     * @returns 
     */
    static GetItem(id: number) {
        let items = this.roleInfo.items;
        for (let item of items) {
            if (item.id == id) {
                return item;
            }
        }
    }
    /**
     * 获取道具数量
     * @param id 
     * @returns 
     */
    static GetItemCount(id: number) {
        let item = this.GetItem(id);
        if (!item) return 0;
        return item.count;
    }
    /**
     * 根据物品类型获取物品列表数据
     * @param type 
     * @returns 
     */
    static GetItemTypeDatas(type: ItemType): SPlayerDataItem[] {
        let stdItem: StdItem;
        let items = this.roleInfo.items;
        let newItems: SPlayerDataItem[] = [];
        for (let item of items) {
            stdItem = CfgMgr.Getitem(item.id);
            if (stdItem && stdItem.Type == ThingType.ThingTypeItem && stdItem.Itemtpye == type) {
                newItems.push(item);
            }
        }
        return newItems;
    }

    /**获取建筑状态 */
    static GetBuilding(buildingId: number, homeId?: number) {
        if (homeId != undefined) {
            let homeLand = this.GetHomeLand(homeId);
            if (!homeLand) return undefined;
            for (let building of homeLand.buildings) {
                if (building.id == buildingId) {
                    this.flushWorkers(building.id, building);
                    building.state = this.GetBuildingState(building.id);
                    return building;
                }
            }
        } else if (this.roleInfo) {
            for (let homeland of this.roleInfo.homelands) {
                for (let building of homeland.buildings) {
                    if (building.id == buildingId) {
                        this.flushWorkers(building.id, building);
                        building.state = this.GetBuildingState(building.id);
                        return building;
                    }
                }
            }
        }
        return undefined;
    }
    static GetBuildings(homeId?: number) {
        if (homeId == undefined) homeId = this.RunHomeId;
        let homeLand = this.GetHomeLand(homeId);
        if (!homeLand) return undefined;
        let bulidings: { [id: number]: SPlayerDataBuilding } = {};
        for (let building of homeLand.buildings) {
            this.flushWorkers(building.id, building);
            building.state = this.GetBuildingState(building.id);
            bulidings[building.id] = building;
        }
        return bulidings;
    }
    static GetBuildingByType(buildType: number, homeId: number) {
        let buildings: SPlayerDataBuilding[] = [];
        let homeLand = this.GetHomeLand(homeId);
        if (!homeLand) return undefined;
        for (let building of homeLand.buildings) {
            if (CfgMgr.GetBuildingUnLock(building.id).BuildingType == buildType) {
                this.flushWorkers(building.id, building);
                building.state = this.GetBuildingState(building.id);
                buildings.push(building);
            }
        }
        return buildings;
    }

    /**
     * 获取指定建筑的工人列表
     * @param buildingId 
     * @returns 
     */
    private static flushWorkers(buildingId: number, building: SPlayerDataBuilding) {
        if (!this.roleInfo) return [];
        if (!building.workerIdArr) building.workerIdArr = [];
        building.workerIdArr.length = 0;
        let works: SPlayerDataRole[] = building.workerIdArr;
        let roles = this.roleInfo.roles;
        if (buildingId && CfgMgr.GetBuildingUnLock(buildingId).BuildingType == BuildingType.cheng_qiang) {
            // let ls = this.roleInfo.defense_lineup || [];
            // for (let defense of ls) {
            //     if (defense) {
            //         for (let role of roles) {
            //             if (role.id == defense.role_id) {
            //城墙走防御列表
            //works.push(role);
            //             }
            //         }
            //     }
            // }
        } else if (buildingId) {
            for (let role of roles) {
                if (role.building_id == buildingId || (role.is_in_main_building && role.main_building_id == buildingId)) {
                    works.push(role);
                }
            }
        }
        return works;
    }

    static GetWorkerNum(buildingId: number) {
        if (!this.roleInfo || !buildingId) return 0;
        let num = 0;
        let roles = this.playerInfo.roles;
        for (let role of roles) {
            if (role.building_id == buildingId) {
                num++;
            }
        }
        return num;
    }

    /**
     * 检测角色是否空闲
     * @param role 
     * @returns 
     */
    static CheckRoleFree(role: SPlayerDataRole) {
        if (role.building_id) return false;
        for (let battle of this.roleInfo.defense_lineup) {
            if (battle && battle.role_id == role.id) return false;
        }
        for (let battle of this.roleInfo.attack_lineup) {
            if (battle && battle.role_id == role.id) return false;
        }
    }
    /**获取角色状态列表 */
    static GetRoleStateList(role: SPlayerDataRole): number[] {
        let typeList: number[] = [RoleStateType.State_Work, RoleStateType.State_Attack, RoleStateType.State_Defend, RoleStateType.State_Assist];
        let stateList: number[] = [];
        for (let index = 0; index < typeList.length; index++) {
            let state = this.GetRoleState(role, typeList[index]);
            if (state > RoleStateType.State_None) {
                stateList.push(state);
            }
        }
        return stateList;
    }
    static GetRoleState(roleId: SPlayerDataRole, stateType: RoleStateType): number {
        if (stateType == RoleStateType.State_Work) {
            for (let home of this.roleInfo.homelands) {
                for (let build of home.buildings) {
                    if (build.workerIdArr && build.workerIdArr.length) {
                        for (let role of build.workerIdArr) {
                            if (role.id == roleId.id) return stateType;
                        }
                    }
                }
            }
        } else if (stateType == RoleStateType.State_Attack) {
            for (let role of this.attackRoles) {
                if (role && roleId.id == role.role_id) return stateType;
            }
        } else if (stateType == RoleStateType.State_Defend) {
            for (let role of this.roleInfo.defense_lineup) {
                if (roleId.id == role.role_id) return stateType;
            }
        }else if (stateType == RoleStateType.State_Assist) {
                if (roleId.is_assisting) return stateType;
        }
        return RoleStateType.State_None;
    }
    /**是否拥有该建筑 */
    public static checkBuilding(buildingId: number) {
        let buildDefaine = CfgMgr.GetBuildingUnLock(buildingId);
        let homeLand = this.GetHomeLand(buildDefaine.HomeId);
        for (let building of homeLand.buildings) {
            if (building.id == buildingId) return true;
        }
        return false;
    }
    /**
     * 获取建筑状态
     * @param building 
     */
    private static GetBuildingState(buildingId: number) {
        let buildDefaine = CfgMgr.GetBuildingUnLock(buildingId);
        let homeLand = this.GetHomeLand(buildDefaine.HomeId);
        for (let building of homeLand.buildings) {
            if (building.id == buildingId) {
                if (building.is_upgrading) {
                    return BuildingState.Building;
                } else if (building.upgrade_time > (new Date()).getTime() / 1000 || building.level == 0) {
                    return BuildingState.CanUnLock;
                } else {
                    return BuildingState.Complete;
                }
            }
        }
        return BuildingState.Lock;
    }

    /**解锁建筑 */
    public static UnLockBuilding(buildingId: number, upgrade_time: number) {
        let buildDefaine = CfgMgr.GetBuildingUnLock(buildingId);
        let homeLand = this.GetHomeLand(buildDefaine.HomeId);
        for (let building of homeLand.buildings) {
            if (building.id == buildingId) {
                building.is_upgrading = true;
                building.level = 0;
                building.upgrade_time = upgrade_time;
                this.flushWorkers(building.id, building);
                building.state = BuildingState.Building;
                return building;
            }
        }
        let buliding: SPlayerDataBuilding = {
            id: buildingId,
            level: 0,
            is_upgrading: true,
            upgrade_time: upgrade_time,
            state: BuildingState.Building
        };
        homeLand.buildings.push(buliding);
        return buliding;
    }

    /**建筑升级 */
    public static UpGradeBuilding(buildingId: number, UpgradeCompleteTime: number, level?: number) {
        let buildDefaine = CfgMgr.GetBuildingUnLock(buildingId);
        let homeLand = this.GetHomeLand(buildDefaine.HomeId);
        for (let building of homeLand.buildings) {
            if (building.id == buildingId) {
                if (level != undefined) building.level = level;
                building.is_upgrading = UpgradeCompleteTime > PlayerData.GetServerTime();
                building.upgrade_time = UpgradeCompleteTime;
                if (CfgMgr.GetBuildingUnLock(buildingId).BuildingSubType == 1 && level != undefined) {
                    homeLand.level = level;
                }
                if (level != undefined) building.level = level;
                building.state = this.GetBuildingState(buildingId);
                // Logger.log('建筑信息更新-------', building);
                return building;
            }
        }
    }

    /**
     * 获取建筑等级
     * @param buildingId 
     * @returns 
     */
    public static GetBuildingLevel(buildingId: number) {
        let buildDefaine = CfgMgr.GetBuildingUnLock(buildingId);
        let homeLand = this.GetHomeLand(buildDefaine.HomeId);
        for (let building of homeLand.buildings) {
            if (building.id == buildingId) return building.level;
        }
        return 0;
    }

    /**
     * 获取建筑等级
     * @param homeId 
     * @param type 
     * @returns 
     */
    public static GetBuildingLv(homeId: number, type: number, index: number = 0) {
        let stdDef = CfgMgr.GetBuildingDefine(homeId, type)[index];
        let homeLand = this.GetHomeLand(homeId);
        for (let building of homeLand.buildings) {
            if (building.id == stdDef.BuildingId) return building.level;
        }
        return 0;
    }

    /**
     * 添加建筑角色
     * @param info 
     * @returns 
     */
    public static AddBuildRoles(info: any) {
        for (let index = 0; index < this.roleInfo.roles.length; index++) {
            let role = this.roleInfo.roles[index];
            if (role.id == info.role_id) {
                //主建筑的特殊处理
                if(info.building_id != 1){
                    role.building_id = info.building_id;
                    role.is_in_building = true;
                    role.battle_power = CountPower(role.type, role.level, role);
                    return role.building_id;
                }else{
                    role.main_building_id = 1;
                    role.is_in_main_building = true;
                    return role.main_building_id;
                }
            }
        }
    }

    /**
     * 移除建筑角色
     * @param info 
     * @returns 
     */
    public static RemoveBuildRoles(info) {
        for (let index = 0; index < this.roleInfo.roles.length; index++) {
            let role = this.roleInfo.roles[index];
            if (role.id == info.role_id) {
                if(info.building_id == 1){
                    role.main_building_id = 0;
                    role.is_in_main_building = false
                    return role.main_building_id;
                }else{
                    role.building_id = 0;
                    role.is_in_building = false;
                    return role.building_id;
                }
            }
        }
    }

    /**更新当前合成次数 */
    public static updateCompoundCount(count: number) {
        this.roleInfo.resource_exchange_uses = count;
    }

    public static GetRoleByPid(roleId: string): SPlayerDataRole {
        for (let index = 0; index < this.roleInfo.roles.length; index++) {
            let role = this.roleInfo.roles[index];
            if (role.id == roleId) {
                if (!role.battle_power) role.battle_power = CountPower(role.type, role.level);
                return role;
            }
        }
        return null;
    }

    /**
     * 获取指定角色
     * @param id 
     * @returns 
     */
    static GetRoleById(id: string) {
        for (let role of this.roleInfo.roles) {
            if (role.id == id) {
                if (!role.battle_power) role.battle_power = CountPower(role.type, role.level);
                return role;
            }
        }
    }

    /**通过type lv quality 获取角色*/
    static GetRoleByTypeAndLvAndQuality(type: number, lv: number, quality: number) {
        for (let role of this.roleInfo.roles) {
            if (role.type == type && role.level == lv && role.quality == quality) {
                return role;
            }
        }
        return null;
    }

    /**
     * 判断生产条件是否符合
     * @param homeId 
     * @param conditionId 
     * @param conditionValue 
     * @returns 
     */
    static CheckCondition(homeId: number, conditionId: number[], conditionValue: number[]) {
        for (let i = 0; i < conditionId.length; i++) {
            let id = conditionId[i];
            switch (id) {
                case 1:
                    let objs = this.GetBuildingByType(BuildingType.ji_di, homeId);
                    for (let obj of objs) {
                        if (obj.level < conditionValue[i]) return false;
                    }
            }
        }
        return true;
    }

    /**
     * 更新生产
     * @param data 
     * @returns 
     */
    static UpdateItemProduction(data: SPlayerDataItemProduction) {
        let ls = this.roleInfo.item_productions;
        let isCheck: boolean = false;
        for (let i = 0; i < ls.length; i++) {
            let obj = ls[i];
            if (obj.id == data.id) {
                ls[i] = data;
                isCheck = true;
                break;
            }
        }
        if (!isCheck) ls.push(data);


    }

    /**
     * 获取指定id的生产状态
     * @param id 
     * @returns 
     */
    static GetProductionState(id: number) {
        let ls = this.roleInfo.item_productions;
        for (let obj of ls) {
            if (obj.id == id) return obj;
        }
    }
    /**获取指定建筑的生产列表 */
    static GetProductionIds(buildingId?: number, finsish: boolean = true) {
        let ids: number[] = [];
        let ls = this.roleInfo.item_productions;
        for (let obj of ls) {
            if (buildingId == undefined || buildingId == CfgMgr.GetProduction(obj.id).BuildingId) {
                if (!finsish || this.GetServerTime() >= obj.finish_time) ids.push(obj.id);
            }
        }
        return ids;
    }
    /**
     * 生产完成
     * @param index 
     * @returns 
     */
    static FinishItemProduction(id: number[]) {
        for (let index = 0; index < id.length; index++) {
            const element = id[index];
            for (let i = 0; i < this.roleInfo.item_productions.length; i++) {
                if (this.roleInfo.item_productions[i].id == element) {
                    this.roleInfo.item_productions.splice(i, 1);
                    break;
                }
            }
        }
    }
    static IndexOfProduction(id: number) {
        let ls = this.roleInfo.item_productions;
        for (let i = 0; i < ls.length; i++) {
            if (ls[i].id == id) return i;
        }
        return -1;
    }

    /**当前的战斗状态 */
    static fightState: FightState = 0;

    /**
     * 获取兵种库存
     * @param soliderId 
     * @returns 
     */
    static GetSoldier(soliderId: number) {
        for (let obj of this.roleInfo.soldiers) {
            if (obj.id == soliderId) {
                return obj;
            }
        }
    }

    /**
     * 获取招募
     * @param soliderId 
     * @param buildingId 
     * @returns 
     */
    static GetSoldierProduction(soliderId: number, buildingId: number) {
        for (let obj of this.roleInfo.soldier_productions) {
            if (obj.building_id == buildingId && obj.id == soliderId) {
                return obj;
            }
        }
    }
    
    /**
     * 新增招募
     * @param data 
     */
    static AddSoldierProduction(data: SPlayerDataSoldierProduction) {
        let isCheck: boolean = false;
        for (let obj of this.roleInfo.soldier_productions) {
            if (obj.building_id == data.building_id && obj.id == data.id) {
                obj.count = data.count;
                obj.start_time = data.start_time;
                isCheck = true;
                break;
            }
        }
        if (!isCheck) this.roleInfo.soldier_productions.push(data);


    }

    /**
     * 更新兵营招募进度
     * @param data 
     */
    static UpdateSoldier(data: PushStruct) {
        for (let i = 0; i < this.roleInfo.soldier_productions.length; i++) {
            let production = this.roleInfo.soldier_productions[i];
            if (production.id == data.soldier_id && production.building_id == data.building_id) {
                let add = maxx(0, data.count);
                production.count -= data.count;
                let lv = this.GetBuildingLevel(data.building_id);
                let [num, time, cost] = CfgMgr.GetSoldierProductionByType(data.building_id, lv, data.soldier_id);
                // Logger.log("UpdateSoldier", production.start_time, time * add, production.start_time + (num * add));
                production.start_time += (time * add);
                if (production.count <= 0) this.roleInfo.soldier_productions.splice(i, 1);
                break;
            }
        }
        for (let soldier of this.roleInfo.soldiers) {
            if (soldier.id == data.soldier_id) {
                soldier.add = data.total_count - soldier.count;
                soldier.count = data.total_count;
                return;
            }
        }
        this.roleInfo.soldiers.push({
            id: data.soldier_id,
            count: data.total_count,
            building_id: data.building_id,
            add: data.total_count
        })
    }
    /**
     * 更新兵营招募时间
     * @param data 
     */
    static UpdateSoldierProdTime(id: number, time: number) {
        for (let i = 0; i < this.roleInfo.soldier_productions.length; i++) {
            let production = this.roleInfo.soldier_productions[i];
            if (production.id == id) {
                production.start_time = time;
                break;
            }
        }
    }

    static AllocateSolider(data) {
        for (let i = 0; i < data.length; i++) {
            let role = this.GetRoleByPid(data[i].role_id);
            let ship = CfgMgr.GetRoleAttr(role.type, role.level, Attr.LeaderShip);

        }
    }

    static updataPveData(pve_data) {
        if (pve_data.progress || pve_data.progress == 0)
            this.playerInfo.pve_data = pve_data;
    }

    static updateSoldiers(data) {
        if (data)
            this.playerInfo.soldiers = data;
    }


    /**当前页邮件列表 */
    static mails: SPlayerMailData[] = [];
    static mailmap: { [id: string]: SPlayerMailData } = {};

    static resetMail() {
        this.mails = []
        this.mailmap = {}
    }

    static getMailReward(data: SThing[]): SThing[] {
        let datas: SThing[] = []
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            if (element.resource) {
                let thing: SThing = { type: ThingType.ThingTypeResource, resource: {} }
                if (element.resource.rock) {
                    thing = { type: ThingType.ThingTypeResource, resource: {} }
                    thing.resource.rock = element.resource.rock;
                    datas.push(thing)
                }
                if (element.resource.wood) {
                    thing = { type: ThingType.ThingTypeResource, resource: {} }
                    thing.resource.wood = element.resource.wood;
                    datas.push(thing)
                }
                if (element.resource.water) {
                    thing = { type: ThingType.ThingTypeResource, resource: {} }
                    thing.resource.water = element.resource.water;
                    datas.push(thing)
                }
                if (element.resource.seed) {
                    thing = { type: ThingType.ThingTypeResource, resource: {} }
                    thing.resource.seed = element.resource.seed;
                    datas.push(thing)
                }
            }
            if (!element.resource) {
                datas.push(element);
            }

        }

        return datas;
    }

    /**钓鱼数据 */
    static fishData: SFishingStateData;
    static fishItems: SFishingItem[];
    static fishShop: SFishingShopGetContentRet;
    /**
     * 获取是否热门湖泊
     * @param id 
     * @returns 
     */
    static GetHotLake(id: number): boolean {
        let feedNum: number = 0;
        let maxId: number = 0;
        if (this.fishData && this.fishData.lakes && this.fishData.lakes.length) {
            for (let lakeData of this.fishData.lakes) {
                if (feedNum == 0) {
                    if (lakeData.cost > 0) {
                        feedNum = lakeData.cost;
                        maxId = lakeData.lake_id;
                    }
                } else {
                    if (lakeData.cost > feedNum) {
                        feedNum = lakeData.cost;
                        maxId = lakeData.lake_id;
                    }
                }
            }
        }
        return maxId == id;
    }
    /**
     * 获取湖泊数据
     * @param id 
     * @returns 
     */
    static GetLakeData(id: number): SFishingLakeData {
        if (this.fishData && this.fishData.lakes && this.fishData.lakes.length) {
            for (const lakeData of this.fishData.lakes) {
                if (id == lakeData.lake_id) return lakeData;
            }
        }
        return null;
    }
    /**获取钓鱼当前最新回合数 */
    static get CurFishRoundInfo(): SFishingRoundInfo {
        if (this.fishData && this.fishData.round_info) {
            return this.fishData.round_info;
        }
        return null;
    }
    /**获取当前回合状态 */
    static get GetFishRoundState(): number {
        if (!this.CurFishRoundInfo) return FishRoundState.No;//没有回合
        if (this.CurFishRoundInfo.end_time < this.GetServerTime()) return FishRoundState.No;//回合超时
        if (!this.CurFishRoundInfo.is_open) return FishRoundState.NoStart;//回合未开始
        //已结算
        if (this.CurFishRoundInfo.is_settlement) {
            //已经选择湖并且已投入鱼饵
            if (this.fishData.settlement && this.fishData.player.lake_id > 0 && this.fishData.player.round_cost > 0) {
                return FishRoundState.Settle;//结算时刻 
            }
            return FishRoundState.NoFishing;//本回合未参与垂钓
        }
        //垂钓时刻
        if (this.CurFishRoundInfo.is_frozen) {
            //已经选择湖并且已投入鱼饵
            if (this.fishData.player.lake_id > 0 && this.fishData.player.round_cost > 0) {
                return FishRoundState.LiftRod;//提杆时刻
            }
            return FishRoundState.NoFishing;//本回合未参与垂钓
        }
        if (this.fishData.player.lake_id > 0) {
            return FishRoundState.Select;//已选湖泊
        } else {
            return FishRoundState.NoSelect;//未选湖泊
        }
    }
    /**自己选的湖泊是否被冰封了 */
    static get FishMyLakeIsIced(): boolean {
        if (this.CurFishRoundInfo) {
            if (this.fishData.player.lake_id > 0) {
                let lakeData = this.GetLakeData(this.fishData.player.lake_id);
                if (lakeData && lakeData.is_frozen) return true;
            }
        }
        return false;
    }
    /**冰封湖泊id */
    static get FishIcedLakeIds(): number[] {
        let newList:number[] = [];
        if (this.CurFishRoundInfo) {
            if (this.fishData && this.fishData.lakes && this.fishData.lakes.length) {
                for (const lakeData of this.fishData.lakes) {
                    if (lakeData.is_frozen){
                        newList.push(lakeData.lake_id);
                    }
                }
            }
        }
        return newList;
    }

    /**获取当前鱼竿类型*/
    static get FishRodType(): number {
        if (this.fishData) {
            let num: number = this.fishData.player.round_cost;
            let typeList: number[] = CfgMgr.GetFishCommon.CostSelectType;
            for (let index = typeList.length - 1; index > -1; index--) {
                let value = typeList[index];
                if (num > value) return index;
            }
        }

        return 0;
    }
    static FishItemAdd(list: SFishingItem[]): void {
        if (this.fishItems) {
            this.fishItems = this.fishItems.concat(list);
        }
    }
    static FishItemRemove(list: SFishingItem[]): void {
        if (this.fishItems) {
            let fishItem: SFishingItem;
            for (let index = 0; index < list.length; index++) {
                fishItem = list[index];
                let findIndex: number = this.fishItems.findIndex(item => item.id == fishItem.id);
                if (findIndex > -1) {
                    this.fishItems.splice(findIndex, 1);
                }
            }
        }
    }
    /**掠夺信息 */
    static LootSeasonInfo: SCurrentSeasonInfo = {
        season_id: 0,//玩家ID
        status: ``,//赛季状态
        is_settled: false,//
        currency: 0,//当前
        wood: 0,//木头
        water: 0,//水
        rock: 0,//石头
        seed: 0,//种子
        start_time: 0,//开始时间
        end_time: 0,//结束时间
        score: 0,//分数
        rank: 0,//排行
    };
    static LootPlayerData: SMatchPlayerData = {
        player_id: ``,//玩家ID
        match_count: 0,//匹配次数
        paid_refresh_count: 0,//刷新次数
        remaining_defense_count: 0,//防守次数
        match_duration: [],//匹配次数
        match_cd_end_time: 0,//匹配cd剩余时间
        has_shield: false,//是否有盾
        shield_end_time: 0,//盾结束时间
        score: 0,//分数
        defense_end_time: 0,//分数
        is_use_item: false,//是否使用道具
    };
    static LootMatchList = []

    static TipsList: TipsType[] = []

    static GetLootAwardThings(data, rewardNum = 1) {
        let datas: SThing[] = []
        let thing: SThing = { type: ThingType.ThingTypeResource, resource: {} }
        if (data.rock) {
            thing = { type: ThingType.ThingTypeResource, resource: {} }
            thing.resource.rock = data.rock * rewardNum;
            datas.push(thing)
        }
        if (data.wood) {
            thing = { type: ThingType.ThingTypeResource, resource: {} }
            thing.resource.wood = data.wood * rewardNum;
            datas.push(thing)
        }
        if (data.water) {
            thing = { type: ThingType.ThingTypeResource, resource: {} }
            thing.resource.water = data.water * rewardNum;
            datas.push(thing)
        }
        if (data.seed) {
            thing = { type: ThingType.ThingTypeResource, resource: {} }
            thing.resource.seed = data.seed * rewardNum;
            datas.push(thing)
        }
        if (data.currency) {
            thing = { type: ThingType.ThingTypeCurrency, currency: { type: 0, value: 0 } }
            thing.currency = {
                type: 0,
                value: data.currency * rewardNum
            };
            datas.push(thing)
        }
        return datas;
    }

    /**获取任务奖励 */
    static GetLootBaseAwardThing(data): SThing {
        let thing: SThing = {
            type: data.RewardType
        };
        switch (thing.type) {
            case ThingType.ThingTypeItem:
                thing.item = { id: data.RewardID, count: data.RewardNumber };
                break;
            case ThingType.ThingTypeCurrency:
                thing.currency = { type: 0, value: data.RewardNumber };
                break;
            case ThingType.ThingTypeGold:
                thing.gold = { value: data.RewardNumber };
                break;
            case ThingType.ThingTypeEquipment:
                break;
            case ThingType.ThingTypeRole:
                thing.role = {
                    id: null, type: data.RewardNumber, quality: 1, level: null,
                    experience: null, soldier_num: null, active_skills: null, passive_skills: null,
                    is_in_building: null, building_id: null, battle_power: null, skills: null, is_assisting: false,
                    is_in_attack_lineup: false, is_in_defense_lineup: false, trade_cd: 0 
                };
                break;
            case ThingType.ThingTypeResource:
                switch (data.RewardID) {
                    case ResourceType.rock:
                        thing.resource = { rock: data.RewardNumber };
                        break;
                    case ResourceType.seed:
                        thing.resource = { seed: data.RewardNumber };
                        break;
                    case ResourceType.water:
                        thing.resource = { water: data.RewardNumber };
                        break;
                    case ResourceType.wood:
                        thing.resource = { wood: data.RewardNumber };
                        break;
                }
                break;
        }
        return thing
    }

    //商城组信息（包含商城页签）
    public static ShopGroupInfo: { [key: string]: StdShopGroup[] } = BeforeGameUtils.toHashMapObj(
        //基础商店
        ShopGroupId.BaseShop, [
        { ShopGroupId: ShopGroupId.BaseShop, ShopType: ShopType.LuckyShop, ShopName: "抽奖商城" },
        { ShopGroupId: ShopGroupId.BaseShop, ShopType: ShopType.DayShop, ShopName: "每日商城" },
        { ShopGroupId: ShopGroupId.BaseShop, ShopType: ShopType.WeekShop, ShopName: "每周商城" },
    ],

    );
    private static shopMap: { [key: string]: SShopIndexContent };
    /**
     * 设置商店数据
     * @param datas 
     */
    static SetShopData(datas: SShopIndexContent[]): void {
        if (!this.shopMap) this.shopMap = js.createMap();
        for (const shopData of datas) {
            this.shopMap[shopData.shop_index_id] = shopData;
        }

    }
    /**
     * 获取商店数据
     * @param shopId 商店id
     * @returns 
     */
    static GetShopData(shopId: number): SShopIndexContent {
        return this.shopMap ? this.shopMap[shopId] : null;
    }
    /**
     * 获取通用商品数据
     * @param shopId 
     * @param shopItemId 
     * @returns 
     */
    static GetCommShopData(shopId: number): SShopContent {
        let shopData = this.GetShopData(shopId);
        return shopData ? shopData.shop : null;
    }
    /**
     * 获取抽奖商店数据
     * @param shopId 商店id
     * @returns 
     */
    static GetShopLuckyData(shopId: number): SLuckyContent {
        let shopData = this.GetShopData(shopId);
        return shopData?.lucky;
    }
    static noticeDatas: NoticeData[] = [];
    /**
     * 设置公告数据
     * @param list 
     * @returns 返回是否有更新
     */
    static SetNoticeDatas(list: NoticeData[]): boolean {
        this.noticeDatas = [];
        let newData: NoticeData;
        let newKeyVal: string = "";
       
        let oldKeyVal: string = LocalStorage.GetPlayerData(PlayerData.playerIdKey, "NoticeCheckCode");
        for (let index = 0; index < list.length; index++) {
            newData = list[index];
            newKeyVal += newData.id.toString();
            if (index < list.length - 1) {
                newKeyVal += "_";
            }
            this.noticeDatas[index] = newData;
        }
        if (newKeyVal != "" && oldKeyVal != newKeyVal) {
            LocalStorage.SetPlayerData(PlayerData.playerIdKey, "NoticeCheckCode", newKeyVal);
            return true;
        }
        return false;
    }
    /**
     * 获取公告数据
     * @returns 
     */
    static GetNoticeDatas(): NoticeData[] {
        return this.noticeDatas;
    }
    /**钓鱼入口红点 */
    static CheckFishEnterRead(): boolean {
        if (this.CheckFishIsOpen()) return true;
        if (this.CheckFishShopIsSell()) return true;
        if (this.CheckFishShopIsCanBuy()) return true;
        return false;
    }
    private static fishOpenTimeCfg: { startHour: number, startMinute: number, endHour: number, endMinute: number }[];
    private static fishTempDate: Date = new Date();
    /**
     * 检测钓鱼活动是否开启
     */
    static CheckFishIsOpen(): boolean {
        let data:SOneOffRedPoint = this.GetOneOffRedPoint(OneOffRedPointId.OffRedPoint_FishOpen);
        if(data.isCheck) return data.redPointVal;
        if (!this.fishOpenTimeCfg) {
            this.fishOpenTimeCfg = [];
            let std: StdFishCommon = CfgMgr.GetFishCommon;
            for (let index = 0; index < std.Opentime.length; index++) {
                let openTiem: string = std.Opentime[index];
                let timearr = openTiem.replace(" ", ":").replace(/\:/g, "-").split("-");
                this.fishOpenTimeCfg[index] = {
                    startHour: Number(timearr[0]),
                    startMinute: Number(timearr[1]),
                    endHour: Number(timearr[2]),
                    endMinute: Number(timearr[3]),
                };
                console.log(timearr);
            }
        }
        let isRedPoint = false;
        for (let index = 0; index < this.fishOpenTimeCfg.length; index++) {
            let timeData: { startHour: number, startMinute: number, endHour: number, endMinute: number } = this.fishOpenTimeCfg[index];
            let startS: number = DateUtils.WeeHoursTime() + (timeData.startHour * 60 + timeData.startMinute) * 60;
            let endS: number = DateUtils.WeeHoursTime() + (timeData.endHour * 60 + timeData.endMinute) * 60;
            let serverTime: number = this.GetServerTime();
            if (serverTime >= startS && serverTime < endS) {
                isRedPoint = true;
                break;
            }
        }
        
        data.isCheck = true;
        data.redPointVal = isRedPoint;
        return isRedPoint;
    }
    /**
     * 检测鱼商店是否可出售鱼
     */
    static CheckFishShopIsSell(): boolean {
        if(!this.fishItems) return false;
        let data:SOneOffRedPoint = this.GetOneOffRedPoint(OneOffRedPointId.OffRedPoint_FishSell);
        if(data.isCheck) return data.redPointVal;
        data.redPointVal = PlayerData.fishItems && PlayerData.fishItems.length > 0;
        data.isCheck = true;
        return data.redPointVal;
    }
    /**
     * 检测钓鱼商店是否有可购买的商品
     * @returns 
     */
    static CheckFishShopIsCanBuy(): boolean {
        if (!this.fishShop) return false;
        let data:SOneOffRedPoint = this.GetOneOffRedPoint(OneOffRedPointId.OffRedPoint_FishShopBuy);
        if(data.isCheck) return data.redPointVal;
        let isRedPoint:boolean = false;
        if (this.fishShop.refresh_time < this.GetServerTime()){
            isRedPoint = false;
        }else{
            if (this.fishShop.shop_items) {
                let shopData: SFishingShopItem;
                let stdShop: StdFishShop;
                let needNum: number;
                for (let index = 0; index < this.fishShop.shop_items.length; index++) {
                    shopData = this.fishShop.shop_items[index];
                    if (shopData.available_amount < 1) continue;
                    stdShop = CfgMgr.GetFishShopItem(shopData.id);
                    if (stdShop) {
                        needNum = stdShop.FishScorePrice;
                        if (ItemUtil.CheckItemIsHave(ThingType.ThingTypeItem, needNum, CfgMgr.GetFishCommon.ScoreItemId)) {
                            isRedPoint = true;
                            break;
                        }
                        needNum = stdShop.CurrencyPrice;
                        if (ItemUtil.CheckItemIsHave(ThingType.ThingTypeCurrency, needNum, 0)) {
                            isRedPoint = true;
                            break;
                        }
    
                    }
                }
            }
        } 
        data.isCheck = true;
        data.redPointVal = isRedPoint;
        return isRedPoint;
    }
    /**
     * 检测角色入口红点
     */
    static CheckRoleEnterRed(): boolean {
        return this.CheckRoleIsCanUp() || this.CheckRolePassiveSkillIsCanUp();
    }
    /**
     * 检测是否有角色可升级 roleId不为空时检测指定角色 否则检测全部
     */
    static CheckRoleIsCanUp(roleId?: string): boolean {
        let maxLv: number;
        let curLv: number;
        let nextLv: StdRoleLevel;
        let items: SPlayerDataItem[] = PlayerData.GetItemTypeDatas(ItemType.exp);
        let totlaExp: number = items.reduce((count, item) => {
            let stdItem: StdItem = CfgMgr.Getitem(item.id);
            return count + stdItem.ItemEffect1 * item.count;
        }, 0);

        let checkRole = (role: SPlayerDataRole) => {
            if (!role) return false;
            maxLv = CfgMgr.GetRoleMaxLevel(role.type);
            curLv = role.level;
            if (curLv >= maxLv) return false;
            nextLv = CfgMgr.GetRoleExpMaxLevel(role.type, curLv, role.experience + totlaExp);
            if (nextLv) {
                if (nextLv.ConditionId && nextLv.ConditionId) {
                    let condData: ConditionSub = FormatCondition(nextLv.ConditionId[0], nextLv.ConditionLv[0]);
                    if (condData.fail) {
                        return false;
                    }
                }
                if (nextLv.Level > curLv) return true;
                //突破
                if (nextLv.BreakItem && nextLv.BreakItem.length > 0) {
                    let myMoney = PlayerData.roleInfo.currency;
                    if (myMoney < nextLv.Cost) {
                        return false;
                    }
                    for (let index = 0; index < nextLv.BreakItem.length; index++) {
                        let itemId = nextLv.BreakItem[index];
                        let itemNum = nextLv.BreakCost[index];
                        let have: number = PlayerData.GetItemCount(itemId);
                        if (have < itemNum) return false;
                    }
                    return true;
                }
            }
            return false;
        }
        if (roleId != undefined) {
            return checkRole(this.GetRoleById(roleId));
        } else {
            for (let index = 0; index < this.roleInfo.roles.length; index++) {
                if (checkRole(this.roleInfo.roles[index])) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * 检测是否有角色被动技能升级 roleId不为空时检测指定角色 否则检测全部
     */
    static CheckRolePassiveSkillIsCanUp(roleId?: string): boolean {
        let data:SOneOffRedPoint = this.GetOneOffRedPoint(OneOffRedPointId.OffRedPoint_RolePassiveSkill);
        if(data.isCheck) return data.redPointVal;
        let skillDataList: SPlayerDataSkill[];
        let nextStd: StdPassiveLevel;
        let curStd: StdPassiveLevel;
        let isRedPoint:boolean = false;
        let checkRole = (role: SPlayerDataRole) => {
            if (!role) return false;
            skillDataList = role.passive_skills;
            if (!skillDataList || skillDataList.length < 1) return false;
            for (let skillData of skillDataList) {
                curStd = CfgMgr.GetPassiveSkill(skillData.skill_id, skillData.level);
                nextStd = CfgMgr.GetPassiveSkill(skillData.skill_id, skillData.level + 1);
                if (nextStd && curStd) {
                    if (ItemUtil.CheckThingConsumes(curStd.RewardType, curStd.RewardID, curStd.RewardNumber, false)) {
                        return true;
                    }
                }
            }
            return false;
        }
        if (roleId != undefined) {
            isRedPoint = checkRole(this.GetRoleById(roleId));
        } else {
            for (let index = 0; index < this.roleInfo.roles.length; index++) {
                if (checkRole(this.roleInfo.roles[index])) {
                    isRedPoint = true;
                    break;
                }
            }
        }
        data.isCheck = true;
        data.redPointVal = isRedPoint;
        return isRedPoint;
    }

    /**生产工坊是否可生产,有id时检测单个，没有id时检测所有 */
    static CheckProductionRed(item_id?: number): boolean {
        //可生产的道具

        let building_id;
        let homeLand = this.GetHomeLand(this.RunHomeId);
        if (!homeLand) return undefined;
        for (let building of homeLand.buildings) {
            if (CfgMgr.GetBuildingUnLock(building.id).BuildingType == BuildingType.sheng_chan) {
                building_id = building.id;
                break;
            }
        }

        if (!building_id) return;
        let max_count = Number.MAX_SAFE_INTEGER;
        let stdlst: StdProduction[] = [];
        let cfg = CfgMgr.GetProductions(building_id);
        for (let std of cfg) {
            let homeId = CfgMgr.Get("homeland_building")[std.BuildingId].HomeId;
            if (PlayerData.CheckCondition(homeId, std.ConditionID, std.ConditionValue)) {
                if (item_id) {
                    if (std.ItemID == item_id) {
                        stdlst.push(std);
                        break;
                    }
                } else {
                    stdlst.push(std);
                }
            }
        }

        if (stdlst) {
            for (let index = 0; index < stdlst.length; index++) {
                const element = stdlst[index];
                let ids = element.CostItemID;
                let num = element.Num;
                let costList
                let nums
                if (typeof ids == "number") {
                    costList = [ids];
                    nums = [num]
                } else {
                    costList = ids;
                    nums = num
                }
                for (let i = 0; i < costList.length; i++) {
                    if (costList[i]) {
                        let has = PlayerData.GetItemCount(costList[i]);
                        let count = Math.floor(has / nums[i])
                        //能合成的最大数量
                        max_count = (count > max_count) ? max_count : count
                    }
                }
            }
        }
        return max_count > 0;
    }
    /**
     * 检测角色合成碎片
     * @returns 
     */
    static CheckRoleChip(): boolean {
        let datas = PlayerData.GetitemBySubType(ItemSubType.shard);
        for (let item of datas) {
            let std = CfgMgr.Getitem(item.id);
            if (std.Type == ThingType.ThingTypeItem && std.Itemtpye == ItemType.shard) {
                if (item.count >= std.ItemEffect3) return true;
            }
        }
        return false;
    }
    /**
     * 检测角色合成碎片
     * @param itemId 
     * @returns 
     */
    static CheckBagBox(): boolean {
        let datas = PlayerData.GetitemBySubType(ItemSubType.cost);
        for (let item of datas) {
            let std = CfgMgr.Getitem(item.id);
            if (std.Type == ThingType.ThingTypeItem && std.Itemtpye == ItemType.box) {
                return true;
            }
        }
        return false;
    }
    /**
     * 检测pve挑战次数
     * @returns 
     */
    static CheckPveRed(): boolean {
        if (!this.GetSysIsOpen(StdSysId.Sys_9)) return false;
        if (!this.pveData) return false;
        if (this.pveData.times > 0) return true;
        if (this.pveData.paid_refresh_times > 0) {
            let pveConfig = CfgMgr.GetCommon(StdCommonType.PVE);
            if (ItemUtil.CheckThingConsumes([pveConfig.ConsumeItemType], [pveConfig.ConsumeItem], [pveConfig.ConsumeNumber])) {
                return true;
            }
        }

        return false;
    }
    /**
     * 检测掠夺红点
     * @returns 
     */
    static CheckLoop(): boolean {
        if (!this.GetSysIsOpen(StdSysId.Sys_7)) return false;
        if (!this.LootPlayerData) return false;
        if (this.LootPlayerData.match_count > 0) return true;
        if (this.LootPlayerData.paid_refresh_count > 0) {
            if (this.LootSeasonInfo) {
                let seasonData = CfgMgr.getPVPById(this.LootSeasonInfo.season_id);
                let haveNum = PlayerData.GetItemCount(seasonData.ConsumeItem);
                if (haveNum > seasonData.ConsumeNumber) return true;
            }

        }
        return false;
    }
    /**频道消息列表 */
    private static channelMsg: SChannelMsgData[] = [];
    /**重置频道消息 */
    static ResetChannelMsg(): void {
        this.channelMsg = [];
        EventMgr.emit(Evt_ChannelMsgUpdate);
    }
    private static advisterCount: { [key: number]: SAdvister } = js.createMap();
    /**设置广告数据*/
    static SetAdvisterData(data: { [key: number]: number }): void {
        this.advisterCount = js.createMap();
        for (let key in data) {
            let id: number = Number(key);
            let val: number = Number(data[key]);
            let std: StdAdvister = CfgMgr.GetAdvister(id);
            this.advisterCount[id] = { id: id, count: Math.max(std.Max_numb - val, 0), cdEndTime:0};
        }
    }
    /**更新广告次数 */
    static UpdateAdvisterData(id: number, newCount: number): void {
        let advisterData: SAdvister = this.advisterCount[id];
        let std: StdAdvister = CfgMgr.GetAdvister(id);
        if (std) {
            let count: number = 0;
            if (!advisterData) {
                advisterData = {id:id, count:std.Max_numb, cdEndTime:0};
            } else {
                advisterData.count = Math.max(std.Max_numb - newCount, 0);
            }
            this.advisterCount[id] = advisterData;
        }
    }
    /**
     * 获取广告数据
     * @param id 
     * @returns 
     */
    static GetAdvisterData(id: number): SAdvister {
        let std: StdAdvister = CfgMgr.GetAdvister(id);
        if(!std) return;
        let advisterData: SAdvister = this.advisterCount[id];
        if (!advisterData) {
            advisterData = { id: std.Ad_ID, count: std.Max_numb, cdEndTime:0};
            this.advisterCount[id] = advisterData;
        }
        return advisterData;
    }
    /**设置广告cd */
    static SetAdvisterCd(id:number):void{
        let adData:SAdvister = this.GetAdvisterData(id);
        let std: StdAdvister = CfgMgr.GetAdvister(id);
        adData.cdEndTime = game.totalTime + std.Ad_CD * 1000;
    }
    /**增加频道消息 */
    static AddChannelMsg(id: number, ...arg: any[]): void {
        let msg: StdMessag = CfgMgr.GetMessag(id);
        if (msg) {
            let formatCont = ReplaceStr(msg.Content, ...arg);
            let msdData: SChannelMsgData = {
                title: "系统",
                cont: formatCont,
            }
            this.channelMsg.unshift(msdData);
            EventMgr.emit(Evt_ChannelMsgUpdate);
        }

    }
    /**增加频道消息 */
    static AddServerChannelMsg(data: { type: number, content: string }): void {
        let msdData: SChannelMsgData = {
            title: "系统",
            cont: data.content,
        }
        this.channelMsg.unshift(msdData);
        EventMgr.emit(Evt_ChannelMsgUpdate);

    }
    /**获取频道消息列表 */
    static GetChannelMsgList(): SChannelMsgData[] {
        return this.channelMsg;
    }
    /**检测是否有加速道具 */
    static CheckAddTimeItem(): boolean {
        let itemDatas = this.GetItemTypeDatas(ItemType.speed);
        return itemDatas && itemDatas.length > 0;
    }
    /**
     * 检测系统是否开启
     * @param id 
     * @returns 
     */
    static GetSysIsOpen(id: number): boolean {
        let stdSysOpen: StdSystemOpen = CfgMgr.GetSysOpenCfg(id);
        if (stdSysOpen) {
            for (let n = 1; ; n++) {
                let types = stdSysOpen['ConditionId' + n];
                let values = stdSysOpen['ConditionValue' + n];
                if (types == undefined || values == undefined) break;
                for (let i = 0; i < types.length; i++) {
                    let type = types[i];
                    let value = values[i];
                    if (CheckCondition(type, value)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    //一次性检测的红点id
    private static oneOffRedPointCondIds:number[] = [
        OneOffRedPointId.OffRedPoint_FishOpen,
        OneOffRedPointId.OffRedPoint_FishShopBuy,
        OneOffRedPointId.OffRedPoint_FishSell,
        OneOffRedPointId.OffRedPoint_RolePassiveSkill,
    ];
    //一次性红点记录
    private static oneOffRedPoint:{[key:string]:SOneOffRedPoint};
    /**
     * 重置一次性红点
     */
    public static ResetOneOffRedPoint():void{
        if(!this.oneOffRedPoint){
            this.oneOffRedPoint = js.createMap();
        }
        let id:number;
        let data:SOneOffRedPoint;
        for (let index = 0; index < this.oneOffRedPointCondIds.length; index++) {
            id = this.oneOffRedPointCondIds[index];
            data = this.oneOffRedPoint[id];
            if(!data){
                data = {id:id, isCheck:false, redPointVal:false};
            }else{
                data.isCheck = false;
                data.redPointVal = false;
            }
            this.oneOffRedPoint[id] = data;
        }
    }
    //设置一次性点击红点点击
    public static SetOneOffRedPoint(id:number, redPointValue:boolean = false):void{
        let data:SOneOffRedPoint = this.oneOffRedPoint[id];
        if(data && data.isCheck){
            data.redPointVal = redPointValue;
            EventMgr.emit(Evt_LoginRedPointUpdate, id);
        }
    }
    /**获取一次性红点数据 */
    public static GetOneOffRedPoint(id:number):SOneOffRedPoint{
        return this.oneOffRedPoint[id];
    }
    
    static MyGuild:SGuild = null;//我的公会数据
    static ResetMyGuildData():void{
        this.MyGuild = null;
        
    }
    //获取我的公会权限
    static GetMyGuildLimit():StdGuildRole{
        if(!this.MyGuild) return null;
        let memberData:SGuildMember = this.MyGuild.members[this.roleInfo.player_id];
        if(!memberData) return null;
        return CfgMgr.GetGuildRole(memberData.role);
    }
    /**获取我是否有审核权限 */
    static GetMyGuildApply():boolean{
        let stdRole:StdGuildRole = this.GetMyGuildLimit();
        if(!stdRole) return false;
        return stdRole && stdRole.PermissionApplication > 0;
    }
    /**获取我是否有修改行会信息权限 */
    static GetMyGuildChange():boolean{
        let stdRole:StdGuildRole = this.GetMyGuildLimit();
        if(!stdRole) return false;
        if(stdRole.PermissioneName > 0) return true;
        if(stdRole.PermissionLogo > 0) return true;
        if(stdRole.PermissionJoin > 0) return true;
        if(stdRole.PermissionEditAnnouncement > 0) return true;

        return false;
        
    }
    /**获取公会成员是否满足莫一项公会职位*/
    static GetGuildMeetPost(playerId:string, postId:number):boolean{
        if(!this.MyGuild) return false;
        let memberData:SGuildMember = this.MyGuild.members[playerId];
        if(!memberData) return false;
        return memberData.role == postId;
    }
    /**获取公会职位人数 */
    static GetGuildPostNum(id:number):number{
        if(!this.MyGuild) return 0;
        let num:number = 0;
        let memberData:SGuildMember;
        for (let key in this.MyGuild.members) {
            memberData = this.MyGuild.members[key];
            if (memberData.role == id) {
                num ++;
            }
        }
        return num;
    }
    
    /**获取公会是否已申请过*/
    static GetGuildIsHaveApply(guildId:string, list:SGuildApplication[]):boolean{
        let applyData:SGuildApplication;
        let applyTime:number = CfgMgr.GetGuildComm().ApplicationsExpirationTime;
        for (let index = 0; index < list.length; index++) {
            applyData = list[index];
            if(applyData.guild_id == guildId && this.GetServerTime() < applyData.time + applyTime) return true;
        }
        return false;
    }
    /**获取公会事件内容*/
    static GetGuildEventCont(guildEventData:SGuildEvent):string{
        let stdGuildEvent:StdGuildEvent = CfgMgr.GetGuildEvent(guildEventData.event_type);
        let result = stdGuildEvent.Content;
        if(stdGuildEvent){
            
            if(guildEventData.event_args){
                for (let index = 0; index < guildEventData.event_args.length; index++) {
                    result = this.GetGuildEventStr(result,stdGuildEvent.ID, index, guildEventData.event_args[index]);
                }
            }
            
        }
        return result;
    }
    private static GetGuildEventStr(cont:string, eventId:number, index:number, val:any):string{
        let key:string = `{${index}}`;
        let newVal:any;
        switch(eventId){
            case GuildEventType.EventType_4:
                if(index == 1){
                    let stdGuildRole:StdGuildRole = CfgMgr.GetGuildRole(Number(val));
                    if(stdGuildRole){
                        newVal = stdGuildRole.Name;
                    }
                }
            break;
        }
        return cont.replace(key, newVal || val);
    }
    /**根据公会类型获取公会权益列表 */
    static GetGuildPostPrivilegeList(guildType:number, guildPost:GuildPostType):StdGuildEquity[]{
        let list:StdGuildEquity[] = [];
        let stdGuildType:StdGuildType = CfgMgr.GetGuildType(guildType);
        let idList = stdGuildType[`Equity_list${guildPost}`];
        if(!idList) return list;
        let stdEquity:StdGuildEquity;
        for (let i = 0; i < idList.length; i++) {
            stdEquity = CfgMgr.GetGuildEquity(idList[i]);
            if(stdEquity){
                list.push(stdEquity);
            }  
        }
        return list;
    }

    /**获取我的公会权益列表 */
    static GetMyGuildPrivilegeList():StdGuildEquity[]{
        if(!this.MyGuild) return [];
        let myPost:StdGuildRole = this.GetMyGuildLimit();
        if(!myPost) return [];
        return this.GetGuildPostPrivilegeList(this.MyGuild.type, myPost.ID);
    }

    /**根据传入id获取我的公会权益 没有此权益则返回null */
    static GetMyGuildPrivilegeById(id:number):StdGuildEquity{
        let list:StdGuildEquity[] = this.GetMyGuildPrivilegeList();
        for (let std of list) {
            if(std.ID == id) return std;
        }
        return null;
    }

    /**根据传入id获取我的公会权益值 没有则返回0*/
    static GetMyGuildPrivilegeByIdToValue(id:number):number{
        let myStd:StdGuildRole = PlayerData.GetMyGuildLimit();
        if(!myStd) return 0;
        let std:StdGuildEquity = this.GetMyGuildPrivilegeById(id);
        if(!std) return 0;
        for (let index = 0; index < std.GuildRole.length; index++) {
            if(myStd.ID == std.GuildRole[index]){
                return std.RewardType[index];
            }
            
        }
        return 0;
    }
    /**权益卡数据 */
    static rightsData:SBenefit = null;


    /**是否激活权益 */
    static GetIsActivateRights(){  
        return Object.keys(PlayerData.rightsData.all_equities).length > 0;
    }
    
    /**获取可繁育主卡数据 */
    static getFanyuMainRole() {
        let stds: StdMerge[] = CfgMgr.Get("role_quality");
        let roles = [];
        for (let std of stds) {
            for (let role of this.playerInfo.roles) {
                let isdefense = false;
                if (this.playerInfo.defense_lineup) {
                    for (let defense of this.playerInfo.defense_lineup) {
                        if (defense.role_id == role.id) {
                            isdefense = true;
                            break;
                        }
                    }
                }
                let isattack = false;
                if (this.playerInfo.attack_lineup) {
                    for (let defense of this.playerInfo.attack_lineup) {
                        if (defense && defense.role_id == role.id) {
                            isattack = true;
                            break;
                        }
                    }
                }
                if (!isattack && !isdefense && role.type == std.Roleid && role.quality + 1 === std.RoleQuailty && role.building_id == 0 && !role.is_assisting && role.passive_skills && !role.is_in_main_building) {
                    // console.log("mainCard**********",role.id,role.building_id);
                    roles.push(role);
                }
            }
        }
        let curRoles = [];
        curRoles = roles.filter((item, index) => roles.indexOf(item) === index);
        curRoles.sort((a: SPlayerDataRole, b: SPlayerDataRole) => {
            if (a.passive_skills.length == b.passive_skills.length) {
                return b.battle_power - a.battle_power;
            } else {
                return b.passive_skills.length - a.passive_skills.length;
            }
        })
        return curRoles;
    }
    /**获取可繁育副卡数据 */
    static getFanyuOrtherRole(mainRole, std) {
        let roles = [];
        for (let role of this.playerInfo.roles) {
            let isdefense = false;
            if (this.playerInfo.defense_lineup) {
                for (let defense of this.playerInfo.defense_lineup) {
                    if (defense.role_id == role.id) {
                        isdefense = true;
                        break;
                    }
                }
            }
            let isattack = false;
            if (this.playerInfo.attack_lineup) {
                for (let defense of this.playerInfo.attack_lineup) {
                    if (defense && defense.role_id == role.id) {
                        isattack = true;
                        break;
                    }
                }
            }
            if (!isattack && !isdefense && std.OtherRoleid.indexOf(role.type) != -1 && mainRole.quality === role.quality && role.building_id == 0 && !role.is_assisting && role.passive_skills && !role.is_in_main_building) {
                roles.push(role);
            }
        }
        let curRoles = [];
        curRoles = roles.filter((item, index) => roles.indexOf(item) === index);
        curRoles.sort((a: SPlayerDataRole, b: SPlayerDataRole) => {
            if (a.passive_skills.length == b.passive_skills.length) {
                return b.battle_power - a.battle_power;
            } else {
                return b.passive_skills.length - a.passive_skills.length;
            }
        })
        return curRoles;
    }
}
export default PlayerData;


/**配置数据枚举 */
export enum PlayerDataMap {
    PrevHomeId = 1,//上一次登录的家园id
    BattleSpeed,//战斗速度
    BattleAuto,//自动战斗
    Guide,//指引
    PveChapter,//Pve章节
}

/**角色状态类型 */
export enum RoleStateType {
    State_None = 0,
    /**工作中 */
    State_Work = 1,
    /**上阵中 */
    State_Attack = 2,
    /**防守中*/
    State_Defend = 3,
    /**助战中 */
    State_Assist = 4,
}

/////////////////////////////////////////////////////////////////////////////
// 数据结构
/////////////////////////////////////////////////////////////////////////////

/**战斗状态 */
export enum FightState {
    None,
    Home,
    PvP,
    PvE,
    Replay,
}

/**
 * 计算战力
 * @param roleType 
 * @param level 
 * @returns 
 */
export function CountPower(roleType: number, level: number, role?: SPlayerDataRole) {
    // console.log("CountPower*******************************", roleType, level);
    if (role && role.battle_power) return role.battle_power
    let power = 0;
    let std = CfgMgr.GetRole()[roleType];
    for (let type of std.Attr) {
        power = power + CfgMgr.GetAttr()[type].Power * GetAttrValue(type, std);
    }
    for (let type of std.AttrFight) {
        power = power + CfgMgr.GetFightAttr()[type].Power * GetFightAttrValue(type, std);
    }
    let stdlv = CfgMgr.GetRoleLevel(roleType, level);
    if (stdlv) {
        for (let type of stdlv.Attr) {
            power = power + CfgMgr.GetAttr()[type].Power * GetAttrValue(type, stdlv);
        }
        for (let type of stdlv.AttrFight) {
            power = power + CfgMgr.GetFightAttr()[type].Power * GetFightAttrValue(type, stdlv);
        }
    }
    return Math.floor(power);
}
/**
 * 角色计算战力（纯卡计算/计算角色本身）
 * @param roleType 角色类型 
 * @param roleQual 角色品质
 * @param roleLv 角色等级
 * @param role 角色数据
 * @returns 
 */
export function RoleCardPower(roleType: number, roleQual:number = 1, roleLv: number = 1, role: SPlayerDataRole = null) {
    let val:number = 0;
    let countPower = (attrList: number[], valList: number[], group:{[key:string]:StdAttr}) => {
        let count:number = 0;
        let attrType:number;
        let attrVal:number;
        for (let i = 0; i < attrList.length; i++) {
            attrType = attrList[i];
            attrVal = valList && i < valList.length ? valList[i] : 0;
            count += group[attrType].Power * attrVal;
        }
        return count;
    }
    let attrGroup:{[key:string]:StdAttr} = CfgMgr.GetAttr();
    let fightAttrGroup:{[key:string]:StdAttr} = CfgMgr.GetFightAttr();
    //角色等级属性
    let stdlv = CfgMgr.GetRoleLevel(roleType, roleLv);
    if (stdlv) {
        if(stdlv.Attr && stdlv.Attr.length){
            val += countPower(stdlv.Attr, stdlv.AttrValue, attrGroup);
        }
        if(stdlv.AttrFight && stdlv.AttrFight.length){
            val += countPower(stdlv.AttrFight, stdlv.AttrFightValue, fightAttrGroup);
        }
    }
    //计算主动技能
    let countMainSkill = (skillId:number, skillLv:number) => {
        //主动技能属性计算
        let stdMainSkill = CfgMgr.GetActiveSkill(skillId, skillLv);
        if(stdMainSkill){
            if(stdMainSkill.Attr && stdMainSkill.Attr.length){
                val += countPower(stdMainSkill.Attr, stdMainSkill.AttrValue, attrGroup);
            }
            if(stdMainSkill.AttrFight && stdMainSkill.AttrFight.length){
                val += countPower(stdMainSkill.AttrFight, stdMainSkill.AttrFightValue, fightAttrGroup);
            }
            
        }
    }
    //计算被动技能
    let countPassiveSkill = (skillId:number, skillLv:number) => {
        let passiveSkill = CfgMgr.GetPassiveSkill(skillId, skillLv);
            if(passiveSkill){
                if(passiveSkill.Attr && passiveSkill.Attr.length){
                    val += countPower(passiveSkill.Attr, passiveSkill.AttrValue, attrGroup);
                }
                if(passiveSkill.AttrFight && passiveSkill.AttrFight.length){
                    val += countPower(passiveSkill.AttrFight, passiveSkill.AttrFightValue, fightAttrGroup);
                }
            }
    }
    //角色类型属性
    let stdRole = CfgMgr.GetRole()[roleType];
    if (stdRole) {
        if(stdRole.Attr && stdRole.Attr.length){
            val += countPower(stdRole.Attr, stdRole.AttrValue, attrGroup);
        }
        if(stdRole.AttrFight && stdRole.AttrFight.length){
            val += countPower(stdRole.AttrFight, stdRole.AttrFightValue, fightAttrGroup);
        }
        
        if(role){
            let skillLvIndex:number;
            let skillData:SPlayerDataSkill;
            for (skillLvIndex = 0; skillLvIndex < role.active_skills.length; skillLvIndex++) {
                skillData = role.active_skills[skillLvIndex];
                countMainSkill(skillData.skill_id, skillData.level);
            }
            for (skillLvIndex = 0; skillLvIndex < role.passive_skills.length; skillLvIndex++) {
                skillData = role.passive_skills[skillLvIndex];
                countPassiveSkill(skillData.skill_id, skillData.level);
            }
        }else{
            let skillId:number;
            for (let n = 1; ; n++) {
                skillId = stdRole["Skill" + n];
                if(skillId == undefined) break;
                countMainSkill(skillId, 1);
            }
            let passiveSkillIds:number[] = [];
            //被动技能初始天赋1
            if(stdRole.PassiveGife){
                passiveSkillIds.push(stdRole.PassiveGife);
            }
            //被动技能职业天赋1
            if(stdRole.PassiveJob){
                passiveSkillIds.push(stdRole.PassiveJob);
            }
            for (let passiveSkillId of passiveSkillIds) {
                countPassiveSkill(passiveSkillId, 1);
            }
        }
    }
    //角色品质属性
    let stdQuality = CfgMgr.GetRoleQuality(roleType, roleQual);
    if (stdQuality) {
        if(stdQuality.Attr && stdQuality.Attr.length){
            val += countPower(stdQuality.Attr, stdQuality.AttrValue, attrGroup);
        }
        if(stdQuality.AttrFight && stdQuality.AttrFight.length){
            val += countPower(stdQuality.AttrFight, stdQuality.AttrFightValue, fightAttrGroup);
        }
    }
    
    return Math.floor(val);
}
/**
 * 计算战力
 * @param BuildingId 
 * @param level 
 * @returns 
 */
export function CountBuildPower(BuildingId: number, level: number) {
    let power = 0;
    let std = CfgMgr.GetBuildingLv(BuildingId, level);
    for (let type of std.Attr) {
        power = power + CfgMgr.GetAttr()[type].Power * GetAttrValue(type, std);
    }
    for (let type of std.AttrFight) {
        power = power + CfgMgr.GetFightAttr()[type].Power * GetFightAttrValue(type, std);
    }
    return power;
}



/**建筑状态 */
export enum BuildingState {
    Lock,      // 未解锁
    CanUnLock, // 可以解锁
    Building,  // 建造中
    Complete   // 正常状态
}

/**资源 */
export type SPlayerDataResources = {
    wood: number;
    water: number;
    seed: number;
    rock: number;
}

/**道具 */
export type SPlayerDataItem = {
    id: number;
    count: number;
    isNew?: boolean;
    sort?: number;
}

/**角色数据 */
export type SPlayerDataRole = {
    id: string;
    type: number;
    level: number;
    experience: number;
    soldier_num: number;
    active_skills: SPlayerDataSkill[];
    passive_skills: SPlayerDataSkill[];
    is_in_building: boolean;
    building_id: number;
    battle_power: number;
    quality: number;
    skills: number[];
    is_assisting: boolean;
    is_in_attack_lineup: boolean;
    is_in_defense_lineup: boolean;
    trade_cd:number;
    is_in_main_building?: boolean;
    main_building_id?: number;
    sort?: number;
}


/**技能定义 */
export type SPlayerDataSkill = {
    skill_id: number;
    level: number;
}

/**建筑数据 */
export type SPlayerDataBuilding = {
    id: number;
    level: number;
    is_upgrading: boolean;
    upgrade_time: number;

    workerIdArr?: SPlayerDataRole[];
    state?: BuildingState;
}

/**家园数据 */
export type SPlayerDataHomeland = {
    id: number;
    level: number;
    buildings: SPlayerDataBuilding[];
    total_wood_collect_duration: number;
    total_water_collect_duration: number;
    total_rock_collect_duration: number;
    total_seed_collect_duration: number;
}

/**角色数据 */
export type SPlayerData = {
    resource_exchange_uses: number;
    player_id: string;
    wechat_id: string;
    name: string;
    weChatNum:string;
    qqNum:string;
    currency: number;
    currency2: number;
    currency3: number;
    icon_url: string;
    avatar_url: string;
    resources: SPlayerDataResources;
    tasks: { [key: string]: SPlayerDataTask };
    daily_tasks: null;
    items: SPlayerDataItem[];
    item_productions: SPlayerDataItemProduction[];//生产工坊
    soldiers: SPlayerDataSoldier[];//兵种库存
    soldier_productions: SPlayerDataSoldierProduction[];//兵种生产列表
    pve_data: SPlayerDataPve;
    roles: SPlayerDataRole[];
    homelands: SPlayerDataHomeland[];
    attack_lineup: SBattleRole[];
    battle_power: number;
    defense_lineup: SBattleRole[];
    config_data: { [key: number]: number };
    fusion_stone_data:SPlayerDataFusionStone;//熔铸石采集数据
}

/**生产道具 */
export type SPlayerDataItemProduction = {
    id: number;          //道具id
    item_id: number;     //道具id
    finish_time: number; //完成时间
    count: number;       //数量
}

/**兵种库存 */
export type SPlayerDataSoldier = {
    id: number;
    count: number;
    building_id: number;
    add?: number;
}

/**生产中的兵种 */
export type SPlayerDataSoldierProduction = {
    id: number;
    count: number;
    building_id: number;
    start_time: number;
    soldier_id: number;//招募兵种id
}

/**兵种生产推送 */
type PushStruct = {
    building_id: number;
    soldier_id: number;
    count: number;       //当前批次正在生产的数量
    total_count: number; //当前兵种总库存量
    start_time: number;
}

export type SBattleRole = {
    role_id: string;
    soldiers: SBattleSoldier[]
}

export type SBattleSoldier = {
    id: number;
    count: number;
}

export type SPlayerDataPve = {
    progress: number;
    times: number;//剩余次数
    paid_refresh_times: number; //剩余购买次数
}
/**通用加速*/
export enum BoostType {
    BoostTypeUnknown = 0,//无
    BoostTypeBuildingUpgrade,//建筑升级加速
    BoostTypeSoldierProduce,//兵营生产加速
    BoostTypeItemProduction,//生产工坊
}
/**
 * 通用加速返回数据
 */
export type SBoostStruct = {
    boost_type: BoostType;//加速类型
    id: number;//对应类型id BoostTypeBuildingUpgrade返回建筑id BoostTypeSoldierProduce生产id BoostTypeItemProduction 生产id
    changed_time: number;//改变时间单位秒
}
/**
 * 通用加速返回数据
 */
export enum SortType {
    /**单价从高到低*/
    priceUp,
    /**单价从低到高 */
    priceDown,
    /**总价从高到低 */
    totalUp,
    /**总价从低到高 */
    totalDown,
    /**数量从高到低 */
    countUp,
    /**数量从低到高 */
    countDown
}

//交易所相关数据
/**请求交易所列表返回数据 */
export type SOonViewData = {
    code: number,
    query_type: number,
    query_args: SQueryArgs,
    page_index: number,
    page_size: number,
    page_last_index: number,
    order_list: [],
    order_state_list: [],
    total_count: number,
}
/**单个订单数据 */
export type SOrderData = {
    /**订单号 */
    order_id: number,
    view_id: string,
    from_order_id: number,
    /**买单或者卖单 */
    order_type: string,
    /**单价 */
    unit_value: number,
    /**数量 */
    unit_count: number,
    nonce: number,
    /**单主ID */
    player_id: string,
    /**单主昵称 */
    player_name: string,
    /**开单时间 */
    open_time: number,
    /**结束时间 */
    close_time: number,
    /**道具 */
    things: SOrderThings,
}
export type SOrderThings = {
    data: SOrderThing[];
}
/**订单物品信息 */
export type SOrderThing = {
    item?: SPlayerDataItem,
    role?: SPlayerDataRole,
    resource?: SPlayerDataResources,
    type: number
}
/**查询返回数据类型 */
export type SSerchData = {
    code: number,
    order_list: [],
    order_state_list: []
}
/**查询返回数据类型 */
export type SQueryArgs = {
    player_id?: String,
    thing_type?: number,
    sort_type?: number,
    item_selection?: number[],
    role_selection?: number[],
    selection_time_lock?: number,
    reverse?: boolean,
    init?:number,
}
/**订单类型 */
export enum SOrderType {
    SELL, //出售商品订单
    BUY, //购买商品订单
}
/**检索订单类型 */
export enum SQueryType {
    /**全部类型 */
    Global = 0,
    /**玩家ID */
    PlayerID = 1,
    /**道具 */
    ItemType = 2,
    /**订单类型 */
    ThingType = 3,
    /**角色 */
    RoleType = 4,
}
/**订单排序枚举 */
export enum SQuerySortType {
    /**创建时间 */
    OpenTime = 0,
    /**单价 */
    UnitPrice = 1,
    /**总价 */
    TotalPrice = 2,
    /**数量 */
    UnitCount = 3,
}

/**原石数量 */
export type SThingGemstone = {
    value: number;
}

/**彩虹体数量 */
export type SThingCurrency = {
    value: number;
    type: number;
}

/**金币数量 */
export type SThingGold = {
    value: number;
}

/**资源数据 */
export type SThingResource = {
    wood?: number;
    water?: number;
    rock?: number;
    seed?: number;
}

/**道具数据 */
export type SThingItem = {
    id: number;
    count: number;
}

/**事物定义 */
export type SThing = {
    type?: ThingType;
    currency?: SThingCurrency;
    gold?: SThingGold;
    resource?: SThingResource;
    item?: SThingItem;
    role?: SPlayerDataRole;
    resData?: SThingRes;
    gemstone?: SThingGemstone;
    sort?: number;//只用来排序
}
/**事物定义资源类 */
export type SThingRes = {
    name: string;//事物资源名称
    count: number;//事物资源数量
    iconUrl: string;//事物资源icon路径
    iconBgUrl: string;//事物资源icon背景||品质路径
    roleMaskBg?: string;//角色碎片背景
    roleMask?: string;//角色碎片背景
    qual?: number,//品质
}
/**事物列表 */
export type SThings = {
    data: SThing[];
}

/**邮件数据 */
export type SPlayerMailData = {
    _id: string;                    // MongoDB ObjectID for the mail document.
    player_id: string;              // The ID of the player to whom this mail belongs.
    sender_player_id: string;
    sender_player_name: string;
    time: number;                   // Timestamp when the mail was sent or received.
    is_read: boolean;               // Whether the mail has been read.
    is_deleted: boolean;            // Whether the mail has been marked as deleted.
    is_attachment_claimed: boolean; // Whether the mail has attachments that can be obtained.
    title: string;                  // The title of the mail.
    content: string;                // The content of the mail.
    attachments: SThings;           // List of attachments included with the mail.

    lock_time?:number;//是否有倒计时
    is_last?: boolean;//是否最后一个
}
/**邮件数据 */
export type SMailPlayerData = {
    name: string,
    icon_url: string,
    avatar_url: string,
    homeland_id: number,
    player_id: string
}
//--------------------------好友----------------------
/**好友数据 */
export type SGetAgentInfo = {
    upline_id: string,
    total_income: number,
    daily_income: number,
    assist_roles_slots: number,
    total_assist_income: number,
    assist_roles: SRoleAssistData[],
    role_data_list: SPlayerDataRole[],
}

export type SRoleAssistData = {
    role_id: string,
    player_id: string,
    slot: number,
    usage_fee: number,
    battle_power: number,
    daily_assist_count: number,
    daily_income: number,
}

/**收益数据 */
export type SIncomesInfo = {
    player_id: string,
    name: string,
    icon_url: string,
    amount: number,
}

/**好友收益 */
export type SGetIncomes = {
    total_downlines: number,
    total_unclaimed: number,
    incomes: SIncomesInfo[],
}

/**上线好友数据 */
export type SUplineInfo = {
    player_id: string,
    name: string,
    icon_url: string,
    level: number,
    battle_power: number,
    last_offline_time: number,
    is_online: boolean,
}

/**上线好友 */
export type SGetUplineInfo = {
    has_upline: boolean,
    upline: SUplineInfo,
}

/**下线好友数据 */
export type SDownlineInfo = {
    player_id: string,
    name: string,
    icon_url: string,
    avatar_url: string,
    level: number,
    total_output: number,
    daily_output: number,
    role?: SPlayerDataRole,
    is_upline: boolean,
    daily_activity: number,
}

/**下线好友 */
export type SGetDownlines = {
    total_count: number,
    downlines: SDownlineInfo[],
    page: number,
    page_size: number,
    sort_type: number,
    search_player_id: string,
    include_role: boolean,
}

/**好友列表排序枚举 */
export enum SFriendSortType {
    /**本日收益从高到低*/
    SortDailyOutputDesc = 1,
    /**本日收益从低到高 */
    SortDailyOutputAsc,
    /**累计收益从高到低 */
    SortTotalOutputDesc,
    /**累计本日收益从低到高 */
    SortTotalOutputAsc,
    /**绑定时间从早到晚 */
    SortBindTimeDesc,
    /**绑定时间从晚到早 */
    SortBindTimeAsc,
    /**活跃度 */
    SortDailyActivityDesc
}

/**好友联系方式数据 */
export type SGetContactInfo = {
    player_id: string,
    name: string,
    wechat_id: string,
    qq_id: string,
}

/**好友收益记录信息 */
export type SIncomeRecordInfo = {
    player_id: string,
    name: string,
    amount: number,
    timestamp: number,
}

/** 收益记录返回数据*/
export type SIncomeRecords = {
    income_records: SIncomeRecordInfo[],
    total: number;
}

/** 角色助战返回数据*/
export type SAssistRoleInfo = {
    player_id: string,
    player_name: string,
    usage_fee: number,
    role_id: string,
    type: number,
    level: number,
    quality: number,
    battle_power: number,
    daily_assist_count: number,
}




/**任务数据类型 */
export type SPlayerDataTask = {
    id: number,
    /**数值 */
    v: number,
    /**状态 */
    s: number,
    /**最后刷新时间 */
    lrt: number,
}

/**任务状态 */
export enum STaskState {
    unFinsh = 1,
    Finsh,
}

/**任务类型 */
export enum STaskShowType {
    /**每日 */
    dayliy = 1,
    /**每周 */
    week,
    /**成就 */
    archive,
    /**好友 */
    friend,
    /**每日登录 */
    dayliyLogin
}

/**好友的任务类型 */
export enum STaskType {
    /**每日任务 */
    dayTask = 1,
    /**每周任务 */
    weekTask,
    /**成就任务 */
    achieveTask,
    /**每日登录 */
    dayliyLogin,
    /**邀请任务 */
    invite,
    /**每日活跃*/
    dayActive,
    /**每周活跃 */
    weekActive,
    /**好友助战协助 */
    assistHelp = 8,
    /**好友繁育协助 */
    fanyuHelp = 9,

}
//钓鱼场次数据
export type SFishingSessionInfo = {
    start_time: number,//开始时间
    end_time: number,//结束时间
    is_open: boolean,//是否开启
}
//钓鱼湖泊数据
export type SFishingLakeData = {
    lake_id: number,//湖泊id
    cost: number,//已投饲料
    is_frozen: number,// 是否冰冻
    player_count: number,//当前湖泊玩家数
}
// 玩家钓鱼数据
export type SFishingPlayerStateData = {
    fatigue: number,// 疲劳
    fatigue_max: number// 疲劳上限
    lake_id: number,// 当前已投入的湖泊
    is_hit: number,// 有没有提杆
    is_miss: boolean,//是否空杆
    round_cost: number,// 当前回合已投入湖泊价值
    daily_cost: number,// 今日投入湖泊价值
}
// 最近的回合信息(包括当前回合和下一回合)
export type SFishingRoundInfo = {
    start_time: number,//开始时间
    frozen_time: number,//冰封时间
    rod_time: number, //提干时间
    settlement_time: number,//结算时间
    end_time: number,//结束时间
    is_open: boolean,//是否开启
    is_frozen: boolean,//是冰封
    is_settlement: boolean,//是否已结算
    round: number,//当前回合数
    kill_type:number,//击杀模式
}
/**钓鱼状态 */
export type SFishingStateData = {
    round: number,//当前回合数
    player: SFishingPlayerStateData//玩家数据
    lakes: SFishingLakeData[],//湖泊数据列表
    session_info: SFishingSessionInfo,//当前场次信息
    round_info: SFishingRoundInfo,//当前回合信息
    settlement: SFishingSettlementData;//结算数据
    rank_reward_pool: number;//排行榜奖励池
}

/**钓到的鱼*/
export type SFishingItem = {
    id: number,// 商品ID
    fish_id: number,//鱼id
    weight: number,// 重量
}

// 钓鱼结果奖励信息
export type SFishingSettlementData = {
    cost_get: number,//归还鱼料
    cost_lose: number,//损失鱼料
    fatigue_get: number,//归还体力
    fatigue_lose: number,//体力损失
    fish_items: SFishingItem[],//钓到的鱼
    is_miss: boolean,//是否空杆了
    fish_score_get: number,//获得鱼票数
    round: number,//回合数
}
// 玩家回合记录
export type SFishingLogItemData = {
    _id: number,//记录id
    round: number,// 回合
    player_id: number,//玩家id
    start_time: number,//开始时间
    end_time: number,//结束时间
    cost: number,//钓鱼总投入
    cost_get: number,// 投入回收
    cost_lose: number,// 此回合的损失
    fatigue_cost: number,// 疲劳花费
    fatigue_get: number,// 疲劳回复
    lake_id: number,// 湖泊
    frozen_lake_id: number,//冰冻的湖泊
    frozen_lake_ids: number[],//冰冻的湖泊列表
    fish_item: SFishingItem[],// 获得的鱼
    fish_score_get: number,// 获得的积分
}
/**钓鱼冰封日志数据 */
export type SFishingFrozenLogData = {
    round: number;//回合数
    lake_id: number;//冰封湖泊id
    lake_ids:number[];//冰冻湖泊id
}
/**钓鱼回合湖泊记录 */
export type SFishingRoundLakeRecordData = {
    lake_id: number,                     // 湖泊ID
    is_frozen: boolean,                 // 是否冰冻
    cost: number,                           // 总投入
    players: number[]// 玩家记录
}
export type SFishingRoundSettlementRecordData = {
    pool: number,                     // 结算池
    pool_fee: number,                 // 结算池费用
    rank_pool: number,                // 排行榜奖励部分
    frozen_win_pool: number,          // 冰冻胜利奖励
    not_frozen_win_pool: number,      // 非冰冻胜利奖励
    total_cost: number,               // 总投入
    total_player: number,             // 总玩家
    non_frozen_win_player: number,    // 非冰冻胜利玩家
    non_frozen_fail_player: number,   // 非冰冻失败玩家
    frozen_win_player: number,        // 冰冻胜利玩家
    frozen_fail_player: number,       // 冰冻失败玩家
}
/**钓鱼回合记录 */
export type SFishingRoundRecordData = {
    _id: number,
    round: number,// 回合
    start_time: number,
    end_time: number,
    lake: SFishingRoundLakeRecordData[]// 湖泊
    lake_with_players: SFishingRoundLakeRecordData[] // 湖泊
    settlement: SFishingRoundSettlementRecordData[]               // 结算
}
/**历史排行榜数据 */
export type FishingSubRankSettlementRecordInfo = {
    pool: number, // 当前奖池总奖励
    player_count: number,// 玩家总数
    reward_player_count: number,// 获奖玩家数
    top_player_name: string, // 榜首玩家名
    top_player_id: string,// 榜首玩家ID
    top_player_reward: number,//榜首奖励
    self_rank: number,// 自己的排名
    self_score: number,// 自己的分数
    self_reward: number,// 自己的奖励
}
/**钓鱼赛季榜单记录 */
export type FishingRankSettlementRecordInfo = {
    rank_round: number, // 排行榜期数
    pool: number,                         // 结算池
    cost_rank: FishingSubRankSettlementRecordInfo,// 高手榜
    lose_cost_rank: FishingSubRankSettlementRecordInfo,// 空杆榜
    round_count_rank: FishingSubRankSettlementRecordInfo,//幸运榜
}
//钓鱼日志数据
export type SFishingLogData = {
    code: number,
    query_type: number,
    page_index: number,
    page_size: number,//一页长度
    page_last_index: number,//最后页的下标
    total_count: number,//日志总数
    player_records: SFishingLogItemData[];//日志列表
    round_records: SFishingRoundRecordData[];//回合记录列表
    frozen_lake_record: SFishingFrozenLogData[];//冰封日志列表
    rank_settlement_record: FishingRankSettlementRecordInfo[];//幸运奖池记录
}
/**商品数据 */
export type SFishingShopItem = {
    id: number,               // 商品ID
    available_amount: number, // 商品可用数量
    fish_score_price: number, // 钓鱼积分价格
    currency_price: number, // 彩虹币价格
    item: SPlayerDataItem,// 商品
}
/**钓鱼商品数据返回 */
export type SFishingShopGetContentRet = {
    code: number,
    refresh_time: number, // 下次刷新时间
    fish_score: number,   // 购买后的钓鱼积分
    new_item: SPlayerDataItem;//获得商品
    shop_items: SFishingShopItem[],//商品信息

}
// 出售鱼类商品
export type SFishingSellFishItem = {
    item_id_list: number[], // 出售的鱼类商品ID
}
/**出售鱼类商品返回 */
export type SFishingSellFishItemRet = {
    code: number,
}
export type SFishingRankPlayerInfoData = {
    player_id: string,
    name: string,
    score: number,
    rank?: number,
}
/**钓鱼排行榜数据 */
export type SFishingRankInfoData = {
    reward_pool: number,       // 奖励池
    rank_size: number,         // 排行榜总人数
    estimated_rewards: number, //  预估奖励
    self_ranking: number,      // 个人排名
    top_rank_players: SFishingRankPlayerInfoData[],//排行榜前几名
}

/**钓鱼排行榜数据 */
export type SFishingRankQueryRet = {
    code: number,
    rank_round: number,// 排行榜期数
    rank_reward_pool: number, // 排行榜奖励池
    refresh_time: number,//排行榜结算时间
    cost_rank: SFishingRankInfoData,      // 投入排行榜
    lose_cost_rank: SFishingRankInfoData, // 输掉投入排行榜
    round_count_rank: SFishingRankInfoData,    // 回合次数排行榜
}

// 掠夺玩家信息
export type SMatchPlayerData = {
    player_id: string,//玩家ID
    match_count: number,//匹配次数
    paid_refresh_count: number,//刷新次数
    remaining_defense_count: number,//防守次数
    match_duration: SFishingItem[],//匹配次数
    match_cd_end_time: number,//匹配cd剩余时间
    has_shield: boolean,//是否有盾
    shield_end_time: number,//盾结束时间
    score: number,//分数
    defense_end_time: number,//分数
    is_use_item,//是否使用道具
}
// 掠夺玩家信息
export type SCurrentSeasonInfo = {
    season_id: number,//玩家ID
    status: string,//赛季状态
    is_settled: boolean,//
    currency: number,//当前
    wood: number,//木头
    water: number,//水
    rock: number,//石头
    seed: number,//种子
    start_time: number,//开始时间
    end_time: number,//结束时间
    score: number,//分数
    rank: number,//排行
}
// 掠夺记录玩家信息
export type SOpponentInfo = {
    player_id: number,//玩家ID
    name: string,//名字
    icon_url: string,//头像
    battle_power: number,//战力
}
// 掠夺记录战斗信息
export type SPlunderRecord = {
    plunder_data: SBattlePlunderData,//战斗数据
    score: number,//分数
    has_revenged: boolean,//是否复仇
}
// 掠夺记录战斗信息
export type SBattlePlunderData = {
    battle_id: string,//战斗ID
    attacker_player_id: string,//攻击方ID
    defender_player_id: string,//防守方ID
    attacker_battle_data: SBattleData,//攻击方战斗数据
    defender_battle_data: SBattleData,
    process: any,//战斗过程
    result: any,//战斗结果
    create_time: number,//创建时间
    start_time: number,//开始时间
    status: string,
    revenge_battle_id: string,
    is_revenge: boolean,
    version: string,
}
export type SBattleData = {
    attack_lineup: SBattleRole[],
    buildings: SPlayerDataBuilding[],
    currency: number,
    defense_lineup: SPlayerDataBuilding[],
    homeland_id: number,
    homeland_level: number,
    player_icon_url: string,
    player_id: string,
    player_name: string,
    rock: number,
    roles: SPlayerDataRole[];
    seed: number,
    water: number,
    wood: number,
}
export type SPlunderRecordData = {
    has_revenged: boolean,
    plunder_data: SBattlePlunderData,
    score: number,
}
//掠夺记录信息
export type SQueryPlunderRecordData = {
    opponent_info_list: SOpponentInfo[],
    plunder_record_data: SPlunderRecordData[],
    total_count: number,
}
//商品数结构
export type SShopItem = {
    id: number,// 商品ID
    sell_things: SThings,// 商品
    price_things: SThings,// 价格
    original_things: SThings,// 原价
    count: number,// 可购买次数
    count_max: number,// 最大购买次数
    order: number,// 显示排序
    expiration_time: number,// 过期时间
    rand_index: number,//商品原始下标
    isAdItem?: boolean;//是否广告商品
}
//抽奖商店数据结构
export type SLuckyContent = {
    lucky_id: number,// 抽奖ID
    name: string,// 奖池名称
    freex1_count: number,// 单抽免费次数
    freex1_refresh_update: number,// 单抽免费刷新时间
    freex10_count: number,//十抽免费次数
    freex10_refresh_update: number,// 十抽免费刷新时间
    frequency: number, //剩余抽奖次数
    frequency_max: number,//最大抽奖次数
    frequency_next_update: number,//抽奖次数刷新时间
    ad_count: number,// 广告次数
    ad_count_max: number,//最大广告次数
    ad_refresh_update: number,//广告次数刷新时间
    pricex1_things: SThings,// 单抽价格
    pricex10_things: SThings,// 十抽价格
    convert_price_things: SThings,//兑换物品价格
    banner: string,// 抽奖banner (客户端显示)
    lucky_items: SThings,// 奖励预览
    get_number: number,//必中剩余次数
}
//抽奖商店数据结构
export type SShopContent = {
    shop_id: number,// 商店ID
    name: string,// 商店名称
    refresh_time: number,// 下次刷新时间
    open_time: number,// 开启时间
    expiration_time: number,// 过期时间
    manual_price: SThings,// 手动刷新价格
    manual_count: number,// 手动刷新剩余次数
    shop_items: SShopItem[],// 商品列表
    ad_shop_items: SShopItem[],//广告商品信息
}
//商店数据
export type SShopIndexContent = {
    shop_index_id: number,//商店索引ID
    type_id: number,//商店类型ID
    shop?: SShopContent,// 普通商店
    lucky?: SLuckyContent,// 抽奖商店
}
//商店数据
export type TipsType = {
    type: string,
    content: string,
    icon: string,
    speed: number
}
/**
 * 公告数据
 */
export type NoticeData = {
    appId: string,//应用id
    categoryId: string, //公告分类
    content: string, //内容（富文本）
    coverImage: string,// 封面图
    displayDuration: number,// 显示时长，单位：小时
    id: number,
    isPinned: boolean,//是否置顶 
    pushDelay: number,// 
    pushFrequency: number,//推送频率，单选
    pushTimeType: number,//推送时间类型，单选
    scheduledTime: string,//定时推送时间，精确到分钟
    state: number,//上下架状态，1上架
    summary: string, //简介
    title: string,//标题
    updatedAt: string,//最近修改时间
    updateAtUnix: number,//公告创建时间
}
/**
 * 玩家本地数据
 */
export type PlayerLocalData = {
    NoticeCheckCode?: string,//公告校验码
}
/**
 * 系统频道数据
 */
export type SChannelMsgData = {
    title: string,//消息标题
    cont: string,//消息内容
}

/**玩法说明对应枚举 */
export enum Tips2ID {
    /** 家园抢夺*/
    HomeLooting = 1,
    /**好友系统 */
    Friend,
    /**探险 */
    Pve,
    /**家园建筑-主基地 */
    HomeJiDi,
    /**家园建筑-兵营 */
    HomeBingYing,
    /**交易所 */
    Trade,
    /**繁育巢 */
    Fanyu,
    /**采集 */
    Collect,
    /**角色 */
    Role,
}
/**
 * 设置数据
 */
export type SSettingData = {
    bgmIsOpen: boolean,//背景音乐是否开启
    soundIsOpen: boolean,//生效是否开启
}

export type SAdvister = {
    id: number,//广告id
    count: number,//剩余可看广告次数
    cdEndTime:number,//冷却时间

}
/**一次性记录条件数据 */
export type SOneOffRedPoint = {
    id: number,//检测功能id
    isCheck: boolean,//是否检查过数据
    redPointVal: boolean,//是否有红点
}
/**玩法说明对应枚举 */
export enum SRankType {
    /**战力排行榜*/
    Fight = 1,
    /**等级排行榜*/
    Level,
    /**关卡排行榜*/
    CustomsPass,
}
/**
 * 排行数据
 */
export type SRankData = {
    player_id: string,//玩家id
    name: string, //名字
    icon_url: string, //头像
    battle_power: number,// 战力
    progress: number, //关卡
    level: number,//等级
    platform_id?: string,// 平台id
    rank?:number, 
}
/**公会成员信息 */
export type SGuildMember = {
	player_id:string,//成员id
    name:string,//成员名称
    level:number,//等级
    battle_power:number,//战力
	role:number,// 成员类型, 见配置表
    message:string,//留言
	join_time:number,//加入事件
}
/**公会公告 */
export type SGuildAnnouncement = {
    content:string,//公告内容
}
// 公会申请审批条件
export type SGuildJoinCriteria = {
    need_applications:number,//是否需要审核
	min_home_level:number,// 最低家园等级
}
/**公会数据 */
export type SGuild = {
    guild_id:string//公会id
    type: number, //公会类型
    name: string,// 公会名称
    level: number,//等级等级
    exp: number, //公会经验
    logo: string, //logoId
    announcement: SGuildAnnouncement,// 公会公告
    join_criteria:SGuildJoinCriteria, //加入公会条件
    leader_info:SGuildMember,//会长信息
    member_count:number,//成员数量
    name_changed:number,//已改名次数
    members:{[key:string]:SGuildMember},//成员列表
}
/**公会事件数据 */
export type SGuildEvent = {
	guild_id:string,    // 公会ID
	player_id:string,   // 事件发起者
	event_type:number,//事件类型
	event_args:string[],// 事件参数
	time:number,// 事件发生时间
}
export enum ApplicationStatus {
    pending = "pending",  // 待审核
    approved = "approved", // 已通过
    rejected = "rejected", // 已拒绝
}
/**公会事件类型定义 */
export enum GuildEventType{
    EventType_1 = 1,//创建公会
    EventType_2,//成员加入公会
    EventType_3,//成员离开公会
    EventType_4,//职位变更
    EventType_5,//公会升级
    EventType_6,//捐献记录
    EventType_7,//	踢出公会
}
/**公会申请数据 */
export type SGuildApplication = {
	_id:string,//
	guild_id:string,//公会id
    player_id:string,//申请者id
    name:string,//申请者名称
    level:number,//申请者等级
    battle_power:number,//申请者战力
	time:number,//申请时间
	message:string,//申请者心情留言
}

/**公会银行储蓄数据 */
export type SDeposit = {
    id:string,//储蓄id
	guild_id:string,    // 公会ID
	user_id:string,   //玩家id
	donate_id:string,//储蓄配置id
	cost_type:number,//储蓄货币类型
    amount:number,//储蓄货币数量
    duration_days:number,//储蓄天数
    interest_total:number,//当前利息
    status:string,//储蓄状态 active 激活 withdrawn已提取
    expiration_time:number,//储蓄到期时间
    deposit_time:number,//储蓄开始时间
    withdraw_time:number,//取款时间
	guild_name:number,//公会名称
    user_name,//用户名称
}

/**公会银行数据 */
export type SGuildDepositTotal = {
    _id:string,//储蓄id
	guild_id:string,    // 公会Id
	cost_type:number,//储蓄货币类型
    total_amount:number,//储蓄货币总额
    total_record:number,//储蓄此类货币人数
}

/**权益卡数据 */
export type SBenefit = {
	benefit_card:SPlayerBenefitCard,
	all_equities:{[key:number]:boolean},
	
}

/**权益卡 */
export type SPlayerBenefitCard = {
	cards:{[key:number]:number},
	claimed_today:boolean,
}
/**查看玩家数据 */
export type SPlayerViewInfo = {
    player_id:string,//玩家id
    name?:string,//玩家名称
    icon_url?:string,//玩家头像
    avatar_url?:string,//玩家头像框
    level?:number,//玩家等级
    battle_power?:number,//玩家战力
    is_online?:number,//是否在线 0不在 1 在
    guild_message?:string,//公会心情留言
    _weChatNumber?:string,//微信号
    _qqNumber?:string,//QQ号
}

