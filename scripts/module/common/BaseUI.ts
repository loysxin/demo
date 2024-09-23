import { Button, Color, Label, Material, Node, Sprite, SpriteFrame, Toggle, Tween, UIRenderer, Vec3, Widget, builtinResMgr, director, js, path, sp, tween, utils } from "cc";
import { ResMgr, folder_attr, folder_head_card, folder_head_round, folder_icon, folder_item } from "../../manager/ResMgr";
import { Attr, AttrFight, CardQuality, CfgMgr, ConditionType, EntityAttrLike, ResourceName, ResourceType, StdCommonType, StdDefineBuilding, StdItem, StdPassiveLevel, StdSoldierProduction, ThingItemId, ThingType } from "../../manager/CfgMgr";
import PlayerData, { SPlayerDataItem, SPlayerDataRole, SPlayerDataSkill, SThing } from "../roleModule/PlayerData";
import { BuildingType } from "../home/HomeStruct";
import { BagItem } from "../bag/BagItem";
import { BigNumber, DeepCopy, MapChildren, ReplaceStr, ToFixed, formatK, formatNumber, numTween } from "../../utils/Utils";
import { CheckCondition } from "../../manager/ConditionMgr";
import { GameSet } from "../GameSet";
import { EventMgr, Evt_Map_Moving } from "../../manager/EventMgr";

/**用于显示用的数据 */
export type AttrSub = {
    icon: string;
    name: string;
    value: any;
    next: any;
    per: string;      //数值后缀
    quality?: string;
    id?: number;
}

/**
 * 获取指定属性
 * @param type 
 * @param std 
 * @returns 
 */
export function GetValue(type: string, std: { AttrFight: number[], AttrFightValue: number[], Attr: number[], AttrValue: number[] }) {
    if (Attr[type] != undefined) {
        let index = std.Attr.indexOf(Attr[type]);
        if (index != -1) return std.AttrValue[index];
    } else if (AttrFight[type] != undefined) {
        let index = std.AttrFight.indexOf(AttrFight[type]);
        if (index != -1) return std.AttrFightValue[index];
    }
    return 0;
}
/**
 * 获取基础属性值
 * @param type 
 * @param std 
 * @returns 
 */
export function GetAttrValue(type: number, std: { Attr: number[], AttrValue: number[] }) {
    if (!std) return 0;
    let index = std.Attr.indexOf(type);
    if (index != -1) return std.AttrValue[index];
    return 0;
}
/**
 * 获取战斗属性值
 * @param type 
 * @param std 
 * @returns 
 */
export function GetFightAttrValue(type: number, std: { AttrFight: number[], AttrFightValue: number[] }) {
    let index = std.AttrFight.indexOf(type);
    if (index != -1) return std.AttrFightValue[index];
    return 0;
}

/**
 * 更新属性item
 * @param item 
 * @param data 
 */
export async function UpdateAttrItem(item: Node, data: AttrSub, index: number, isToPo: boolean) {
    let icon = item.getChildByName("icon")?.getComponent(Sprite);
    let name = item.getChildByName("name")?.getComponent(Label);
    let now = item.getChildByName("nowValue")?.getComponent(Label);
    let to = item.getChildByName("to");
    let next = item.getChildByName("nextValue")?.getComponent(Label);
    if (icon) {
        console.log(data.icon)
        if (data.icon && !data.icon.includes(folder_attr)) {
            icon.getComponent(Sprite).color = Color.WHITE;
        }
        if (data.icon) {
            icon.node.active = true;
            icon.spriteFrame = await ResMgr.LoadResAbSub(data.icon, SpriteFrame);
        } else {
            icon.node.active = false;
        }


    }
    if (name) name.string = data.name;
    if (isToPo && now) {
        numTween(now, 50, parseInt(data.value), 0.02, data.per)
    }
    if (now) now.string = data.value + data.per;
    if (next) {
        if (data.next) {
            if (to) to.active = true;
            next.node.active = true;
            next.string = data.next + data.per;
        } else {
            if (to) to.active = false;
            next.node.active = false;
        }
    } else {
        if (to) to.active = false;
    }
}

/**
 * 更新条件
 * @param item 
 * @param data 
 */
export async function UpdateConditionItem(item: Node, data: ConditionSub) {
    let icon = item.getChildByName("icon").getComponent(Sprite);
    let value = item.getChildByName("value").getComponent(Label);
    if (data.icon) {
        icon.node.active = true;
        icon.spriteFrame = await ResMgr.LoadResAbSub(data.icon, SpriteFrame);
    } else {
        icon.node.active = false;
    }
    value.string = data.name;
    if (!data.fail) {
        item.getChildByName("yes").getComponent(Toggle).isChecked = true;
    } else {
        item.getChildByName("no").getComponent(Toggle).isChecked = true;
    }
}

/**
 * 更新建筑属性
 * @param item 
 * @param data 
 */
export async function UpdateBuildingAttr(item: Node, data: AttrSub) {
    let icon = item.getChildByName("icon").getComponent(Sprite);
    let name = item.getChildByName("name").getComponent(Label);
    let value = item.getChildByName("value").getComponent(Label);
    if (data.icon) {
        icon.node.active = true;
        icon.spriteFrame = await ResMgr.LoadResAbSub(data.icon, SpriteFrame);
        icon.node.setScale(0.7, 0.7, 1);
        if (!data.icon.includes(`/attr/`)) {
            icon.color = Color.WHITE;
            icon.node.setScale(0.5, 0.5, 1);
        }
    } else {
        icon.node.active = false;
    }
    name.string = data.name;
    value.string = data.value + data.per;
}

/**
 * 获取奖励
 * @param rewardType 
 * @param rewardId 
 * @param value 
 * @returns 
 */
export function FormatReward(rewardType: number, rewardId: number, value: number) {
    let obj: AttrSub;
    let std = CfgMgr.Getitem(rewardId);
    switch (rewardType) {
        case ThingType.ThingTypeItem:
            obj = {
                icon: path.join(folder_item, std.Icon, "spriteFrame"),
                name: std.ItemName,
                value: value,
                next: undefined,
                per: "",
                quality: std.Quality ? CardQuality[std.Quality] : undefined,
                id: rewardId,
            }
            break;
        case ThingType.ThingTypeCurrency:
            std = CfgMgr.Getitem(1);
            obj = {
                icon: path.join(folder_icon, "caizuan/spriteFrame"),
                name: "彩虹体",
                value: value,
                next: undefined,
                per: "",
                id: 1,
                quality: std.Quality ? CardQuality[std.Quality] : undefined,
            }
            break;
        case ThingType.ThingTypeGold:
            obj = {
                icon: "sheets/common/通用货币/spriteFrame",
                name: "金币",
                value: value,
                next: undefined,
                per: "",
                id: 2,
                quality: std.Quality ? CardQuality[std.Quality] : undefined,
            }
            break;
        case ThingType.ThingTypeEquipment:
            obj = {
                icon: "sheets/icons/atk/spriteFrame",
                name: "装备",
                value: value,
                next: undefined,
                per: "",
                id: rewardId,
            }
            break;
        case ThingType.ThingTypeRole:
            let stdRole = CfgMgr.GetRole()[rewardId];
            obj = {
                icon: path.join(folder_head_round, stdRole.Icon, "spriteFrame"),
                name: stdRole.Name,
                value: value,
                next: undefined,
                per: "",
                id: rewardId,
            }
            break;
        case ThingType.ThingTypeResource:
            let id = 0;
            if (rewardId == ResourceType.wood) {
                id = 6;
            } else if (rewardId == ResourceType.rock) {
                id = 7;
            } else if (rewardId == ResourceType.water) {
                id = 8;
            } else {
                id = 9;
            }
            std = CfgMgr.Getitem(id);
            obj = {
                icon: path.join(folder_icon, ResourceType[rewardId], "spriteFrame"),
                name: ResourceName[rewardId],
                value: value,
                next: undefined,
                per: "",
                id: id,
                quality: std.Quality ? CardQuality[std.Quality] : undefined,
            }
            break;
    }
    return obj;
}

/**
 * 格式化奖励配置
 * @param std 
 * @returns 
 */
export function FormatRewards(std: { RewardType: number[], RewardID: number[], RewardNumber: number[] }) {
    let results: AttrSub[] = [];
    for (let i = 0; i < std.RewardType.length; i++) {
        results.push(FormatReward(std.RewardType[i], std.RewardID[i], std.RewardNumber[i]));
    }
    return results;
}

/**
 * 格式化属性
 * @param id 
 * @param isFight 
 * @returns 
 */
export function FormatAttr(id: number, isFight: boolean = true) {
    let stdAttr = CfgMgr.GetFightAttr();
    if (!isFight) stdAttr = CfgMgr.GetAttr();
    let std = stdAttr[id];
    let data: AttrSub = { icon: "", name: "", value: 0, next: 0, per: "", id: id };
    if (std) {
        // if (std.Icon) data.icon = path.join(folder_icon, std.Icon, "spriteFrame");
        if (std.Icon && std.Icon.length) {
            let url = path.join(folder_attr, std.Name, "spriteFrame");
            if (ResMgr.HasResource(url)) {
                data.icon = url;
            }
        } else {
            data.icon = null;
        }

        data.name = std.Signal;
        if (std.Per) {
            data.per = "%";
        } else {
            data.per = "";
        }
    }
    return data;
}

/**
 * 计算角色战斗属性
 * @param role 
 * @param isAll 是否计算角色全部属性没值补0
 */
export function FormatRoleFightAttr(role: SPlayerDataRole, isAll: boolean = false) {
    let typeIndexMap: { [key: string]: number } = js.createMap();
    let newList: AttrSub[] = [];
    let typeIndex: number;
    let attrSub: AttrSub;
    let type: number;
    let val: number;
    let forAttr = (attrList: number[], valList: number[]) => {
        for (let i = 0; i < attrList.length; i++) {
            type = attrList[i];
            //策划让屏蔽掉战斗力这个属性
            if (type == 3) {
                break;
            }
            val = valList && i < valList.length ? valList[i] : 0;
            typeIndex = typeIndexMap[type];
            if (typeIndex == null) {
                attrSub = FormatAttr(type, true);
                attrSub.value = val;
                typeIndex = newList.length;
                typeIndexMap[type] = typeIndex;
                newList[typeIndex] = attrSub;
            } else {
                attrSub = newList[typeIndex];
                attrSub.value += val;
            }
        }
    }
    //角色等级属性
    let stdlv = CfgMgr.GetRoleLevel(role.type, role.level);
    if (stdlv && stdlv.AttrFight.length) {
        forAttr(stdlv.AttrFight, stdlv.AttrFightValue);
    }
    //角色类型属性
    let stdRole = CfgMgr.GetRole()[role.type];
    if (stdRole && stdRole.AttrFight.length) {
        forAttr(stdRole.AttrFight, stdRole.AttrFightValue);
    }
    //角色品质属性
    let stdQuality = CfgMgr.GetRoleQuality(role.type, role.quality);
    if (stdQuality && stdQuality.AttrFight.length) {
        forAttr(stdQuality.AttrFight, stdQuality.AttrFightValue);
    }
    //角色被动技能属性
    if (role.passive_skills && role.passive_skills.length) {
        let skillData: SPlayerDataSkill;
        let stdSkillP: StdPassiveLevel
        for (let index = 0; index < role.passive_skills.length; index++) {
            skillData = role.passive_skills[index];
            stdSkillP = CfgMgr.GetPassiveSkill(skillData.skill_id, skillData.level);
            if (stdSkillP && stdSkillP.AttrFight.length) {
                forAttr(stdSkillP.AttrFight, stdSkillP.AttrFightValue);
            }
        }
    }
    //全部属性模板
    if (isAll) {
        let allAttr: number[] = CfgMgr.GetCommon(StdCommonType.RoleAtttr).AttrFight;
        let allType: number[] = [];
        let allVal: number[] = [];
        for (let i = 0; i < allAttr.length; i++) {
            type = allAttr[i];
            if (!typeIndexMap[type]) {
                allType.push(type);
                allVal.push(0);
            }
        }
        if (allType.length) {
            forAttr(allType, allVal);
        }
    }
    return newList;
}

/**
 * 计算角色采集属性
 * @param role 
 */
export function FormatRoleAttr(role: SPlayerDataRole, isAll: boolean = false) {
    let typeIndexMap: { [key: string]: number } = js.createMap();
    let newList: AttrSub[] = [];
    let typeIndex: number;
    let attrSub: AttrSub;
    let type: number;
    let val: number;
    let forAttr = (attrList: number[], valList: number[]) => {
        for (let i = 0; i < attrList.length; i++) {
            type = attrList[i];
            val = valList && i < valList.length ? valList[i] : 0;
            typeIndex = typeIndexMap[type];
            if (typeIndex == null) {
                attrSub = FormatAttr(type, false);
                attrSub.value = val;
                typeIndex = newList.length;
                typeIndexMap[type] = typeIndex;
                newList[typeIndex] = attrSub;
            } else {
                attrSub = newList[typeIndex];
                attrSub.value += val;
            }
        }
    }
    //角色等级属性
    let stdlv = CfgMgr.GetRoleLevel(role.type, role.level);
    if (stdlv && stdlv.Attr.length) {
        forAttr(stdlv.Attr, stdlv.AttrValue);
    }
    //角色类型属性
    let stdRole = CfgMgr.GetRole()[role.type];
    if (stdRole && stdRole.Attr.length) {
        forAttr(stdRole.Attr, stdRole.AttrValue);
    }
    //角色品质属性
    let stdQuality = CfgMgr.GetRoleQuality(role.type, role.quality);
    if (stdQuality && stdQuality.Attr.length) {
        forAttr(stdQuality.Attr, stdQuality.AttrValue);
    }
    //角色被动技能属性
    if (role.passive_skills && role.passive_skills.length) {
        let skillData: SPlayerDataSkill;
        let stdSkillP: StdPassiveLevel
        for (let index = 0; index < role.passive_skills.length; index++) {
            skillData = role.passive_skills[index];
            stdSkillP = CfgMgr.GetPassiveSkill(skillData.skill_id, skillData.level);
            if (stdSkillP && stdSkillP.Attr.length) {
                forAttr(stdSkillP.Attr, stdSkillP.AttrValue);
            }
        }
    }
    //全部属性模板
    if (isAll) {
        let allAttr: number[] = CfgMgr.GetCommon(StdCommonType.RoleAtttr).Attr;
        let allType: number[] = [];
        let allVal: number[] = [];
        for (let i = 0; i < allAttr.length; i++) {
            type = allAttr[i];
            if (!typeIndexMap[type]) {
                allType.push(type);
                allVal.push(0);
            }
        }
        if (allType.length) {
            forAttr(allType, allVal);
        }
    }
    //带兵属性下标
    let soldierAttrIndex: number = typeIndexMap[Attr.LeaderShip];
    if (soldierAttrIndex > -1) {
        let soldierAttr: AttrSub = newList[soldierAttrIndex];
        soldierAttr.value += role.soldier_num;
    }
    return newList;
}
/**
 * 计算角色战斗属性（纯卡计算）
 * @param roleType 角色类型 
 * @param roleLv 角色等级
 * @param roleQual 角色品质
 * @param isAll 是否计算角色全部属性没值补0
 */
export function FormatCardRoleFightAttr(roleType: number, roleQual: number = 1, roleLv: number = 1, isAll: boolean = false) {
    let typeIndexMap: { [key: string]: number } = js.createMap();
    let newList: AttrSub[] = [];
    let typeIndex: number;
    let attrSub: AttrSub;
    let type: number;
    let val: number;
    let forAttr = (attrList: number[], valList: number[]) => {
        for (let i = 0; i < attrList.length; i++) {
            type = attrList[i];
            //策划让屏蔽掉战斗力这个属性
            if (type == 3) {
                break;
            }
            val = valList && i < valList.length ? valList[i] : 0;
            typeIndex = typeIndexMap[type];
            if (typeIndex == null) {
                attrSub = FormatAttr(type, true);
                attrSub.value = val;
                typeIndex = newList.length;
                typeIndexMap[type] = typeIndex;
                newList[typeIndex] = attrSub;
            } else {
                attrSub = newList[typeIndex];
                attrSub.value += val;
            }
        }
    }
    //角色等级属性
    let stdlv = CfgMgr.GetRoleLevel(roleType, roleLv);
    if (stdlv && stdlv.AttrFight.length) {
        forAttr(stdlv.AttrFight, stdlv.AttrFightValue);
    }
    //角色类型属性
    let stdRole = CfgMgr.GetRole()[roleType];
    if (stdRole && stdRole.AttrFight.length) {
        forAttr(stdRole.AttrFight, stdRole.AttrFightValue);
    }
    //角色品质属性
    let stdQuality = CfgMgr.GetRoleQuality(roleType, roleQual);
    if (stdQuality && stdQuality.AttrFight.length) {
        forAttr(stdQuality.AttrFight, stdQuality.AttrFightValue);
    }
    //全部属性模板
    if (isAll) {
        let allAttr: number[] = CfgMgr.GetCommon(StdCommonType.RoleAtttr).AttrFight;
        let allType: number[] = [];
        let allVal: number[] = [];
        for (let i = 0; i < allAttr.length; i++) {
            type = allAttr[i];
            if (!typeIndexMap[type]) {
                allType.push(type);
                allVal.push(0);
            }
        }
        if (allType.length) {
            forAttr(allType, allVal);
        }
    }
    return newList;
}

/**
 * 角色采集属性（纯卡计算）
 * @param roleType 
 * @param roleLv 
 * @param roleQual 
 * @param isAll 
 * @returns 
 */
export function FormatCardRoleAttr(roleType: number, roleQual: number = 1, roleLv: number = 1, isAll: boolean = false) {
    let typeIndexMap: { [key: string]: number } = js.createMap();
    let newList: AttrSub[] = [];
    let typeIndex: number;
    let attrSub: AttrSub;
    let type: number;
    let val: number;
    let forAttr = (attrList: number[], valList: number[]) => {
        for (let i = 0; i < attrList.length; i++) {
            type = attrList[i];
            val = valList && i < valList.length ? valList[i] : 0;
            typeIndex = typeIndexMap[type];
            if (typeIndex == null) {
                attrSub = FormatAttr(type, false);
                attrSub.value = val;
                typeIndex = newList.length;
                typeIndexMap[type] = typeIndex;
                newList[typeIndex] = attrSub;
            } else {
                attrSub = newList[typeIndex];
                attrSub.value += val;
            }
        }
    }
    //角色等级属性
    let stdlv = CfgMgr.GetRoleLevel(roleType, roleLv);
    if (stdlv && stdlv.Attr.length) {
        forAttr(stdlv.Attr, stdlv.AttrValue);
    }
    //角色类型属性
    let stdRole = CfgMgr.GetRole()[roleType];
    if (stdRole && stdRole.Attr.length) {
        forAttr(stdRole.Attr, stdRole.AttrValue);
    }
    //角色品质属性
    let stdQuality = CfgMgr.GetRoleQuality(roleType, roleQual);
    if (stdQuality && stdQuality.Attr.length) {
        forAttr(stdQuality.Attr, stdQuality.AttrValue);
    }
    //全部属性模板
    if (isAll) {
        let allAttr: number[] = CfgMgr.GetCommon(StdCommonType.RoleAtttr).Attr;
        let allType: number[] = [];
        let allVal: number[] = [];
        for (let i = 0; i < allAttr.length; i++) {
            type = allAttr[i];
            if (!typeIndexMap[type]) {
                allType.push(type);
                allVal.push(0);
            }
        }
        if (allType.length) {
            forAttr(allType, allVal);
        }
    }
    return newList;
}



export function GetAttrValueByIndex(role: SPlayerDataRole, index: number) {
    let attrValue = 0; // 初始化属性值为0

    // 处理标准等级属性
    let stdlv = CfgMgr.GetRoleLevel(role.type, role.level);
    if (stdlv.Attr) {
        for (let i = 0; i < stdlv.Attr.length; i++) {
            if (stdlv.Attr[i] === index) {
                attrValue += stdlv.AttrValue[i];
            }
        }
    }

    // 处理标准角色属性
    let stdRole = CfgMgr.GetRole()[role.type];
    if (stdRole && stdRole.Attr) {
        for (let i = 0; i < stdRole.Attr.length; i++) {
            if (stdRole.Attr[i] === index) {
                attrValue += stdRole.AttrValue[i];
            }
        }
    }

    // 处理标准品质属性
    let stdQuality = CfgMgr.GetRoleQuality(role.type, role.quality);
    if (stdQuality && stdQuality.Attr) {
        for (let i = 0; i < stdQuality.Attr.length; i++) {
            if (stdQuality.Attr[i] === index) {
                attrValue += stdQuality.AttrValue[i];
            }
        }
    }

    if (index == Attr.LeaderShip && role.soldier_num)
        attrValue += role.soldier_num;

    // 返回累加后的属性值
    return attrValue;
}


/**
 * 生成建筑升级属性变化表
 * @param buildingId 
 * @param vs 
 * @returns 
 */
export function FormatBuildingAttrUp(buildingId: number, lv: number) {
    let stdNow = CfgMgr.GetBuildingLv(buildingId, lv);
    let stdNext = CfgMgr.GetBuildingLv(buildingId, lv + 1);
    return FormatAttrUp(stdNow, stdNext);
}

/**
 * 生成升级属性变化表
 * @param stdNow 
 * @param stdNext 
 * @returns 
 */
export function FormatAttrUp(stdNow: EntityAttrLike, stdNext?: EntityAttrLike) {
    let fightMap: { [id: number]: AttrSub } = {};
    for (let i = 0; i < stdNow.AttrFight.length; i++) {
        let id = stdNow.AttrFight[i];
        let data = FormatAttr(id, true);
        data.value = stdNow.AttrFightValue[i];
        fightMap[id] = data;
    }
    let attrMap: { [id: number]: AttrSub } = {};
    for (let i = 0; i < stdNow.Attr.length; i++) {
        let id = stdNow.Attr[i];
        let data = FormatAttr(id, false);
        data.value = stdNow.AttrValue[i];
        attrMap[id] = data;
    }

    if (stdNext) {
        for (let i = 0; i < stdNext.AttrFight.length; i++) {
            let id = stdNext.AttrFight[i];
            let next = FormatAttr(id, true);
            next.value = stdNext.AttrFightValue[i];
            if (!fightMap[id]) {
                fightMap[id] = next;
                fightMap[id].value = 0;
            } else {
                fightMap[id].next = next.value;
            }
        }
        for (let i = 0; i < stdNext.Attr.length; i++) {
            let id = stdNext.Attr[i];
            let next = FormatAttr(id, true);
            next.value = stdNext.AttrValue[i];
            if (!attrMap[id]) {
                attrMap[id] = next;
                attrMap[id].value = 0;
            } else {
                attrMap[id].next = next.value;
            }
        }
    }
    let datas: AttrSub[] = [];
    for (let k in fightMap) datas.push(fightMap[k]);
    for (let k in attrMap) datas.push(attrMap[k]);
    return datas;
}

/**
 * 生成升级属性变化表
 * @param stdNow 
 * @param stdNext 
 * @returns 
 */
export function FormatAttrUpByRole(stdNow: EntityAttrLike, type: number, stdNext?: EntityAttrLike) {

    let mainData = CfgMgr.GetRole()[type];
    let levelData = CfgMgr.GetRoleLevel(type, 1);
    let fightMap: { [id: number]: AttrSub } = {};
    let value;
    for (let i = 0; i < stdNow.AttrFight.length; i++) {
        let id = stdNow.AttrFight[i];
        let data = FormatAttr(id, true);
        data.value = stdNow.AttrFightValue[i];
        //基础属性
        if (mainData.AttrFight.indexOf(id) != -1) {
            let index = mainData.AttrFight.indexOf(id);
            value = mainData.AttrFightValue[index];
            if (value) {
                data.value += value;
            }
        }
        //等级属性
        if (levelData.AttrFight.indexOf(id) != -1) {
            let index = levelData.AttrFight.indexOf(id);
            value = levelData.AttrFightValue[index];
            if (value) {
                data.value += value;
            }
        }
        fightMap[id] = data;
    }
    let attrMap: { [id: number]: AttrSub } = {};
    for (let i = 0; i < stdNow.Attr.length; i++) {
        let id = stdNow.Attr[i];
        let data = FormatAttr(id, false);
        data.value = stdNow.AttrValue[i];
        //基础属性
        if (mainData.Attr.indexOf(id) != -1) {
            let index = mainData.Attr.indexOf(id);
            value = mainData.AttrValue[index];
            if (value) {
                data.value += value;
            }
        }
        //等级属性
        if (levelData.Attr.indexOf(id) != -1) {
            let index = levelData.Attr.indexOf(id);
            value = levelData.AttrValue[index];
            if (value) {
                data.value += value;
            }
        }
        attrMap[id] = data;
    }

    if (stdNext) {
        for (let i = 0; i < stdNext.AttrFight.length; i++) {
            let id = stdNext.AttrFight[i];
            let next = FormatAttr(id, true);
            next.value = stdNext.AttrFightValue[i] - stdNow.AttrFightValue[i];
            if (!fightMap[id]) {
                fightMap[id] = next;
                fightMap[id].value = 0;
            } else {
                fightMap[id].next = next.value;
            }
        }
        for (let i = 0; i < stdNext.Attr.length; i++) {
            let id = stdNext.Attr[i];
            let next = FormatAttr(id, true);
            next.value = stdNext.AttrValue[i] - stdNow.AttrValue[i];
            if (!attrMap[id]) {
                attrMap[id] = next;
                attrMap[id].value = 0;
            } else {
                attrMap[id].next = next.value;
            }
        }
    }
    let datas: AttrSub[] = [];
    for (let k in fightMap) datas.push(fightMap[k]);
    for (let k in attrMap) datas.push(attrMap[k]);
    return datas;
}

/**分割带兵数量 */
export function SpliceSolderNum(datas) {
    for (let index in datas) {
        const data = datas[index];
        if (data.name == CfgMgr.GetAttr()[Attr.LeaderShip].Signal)
            datas.splice(index, 1);
    }
}
/**获取带兵数量 */
export function GetSolderNum(datas) {
    for (let index in datas) {
        const data = datas[index];
        if (data.name == CfgMgr.GetAttr()[Attr.LeaderShip].Signal)
            return data;
    }
    return null;
}

/**条件数据 */
export type ConditionSub = {
    id?: number;//条件id
    name: string;
    icon: string;
    value1?: number;//条件值1
    value2?: number;//条件值2
    fail?: string;
}

/**
 * 条件
 * @param conditionId 
 * @param value 
 * @param homeId 
 */
export function FormatCondition(conditionId: number, value: number, condStr: string = null): ConditionSub {
    if (!value) return;
    let msg: string;
    let data: ConditionSub = { id: conditionId, icon: "", name: "", value1: value };
    let jidi: StdDefineBuilding;
    switch (conditionId) {
        case ConditionType.Home_1: // 101家园基地等级
            data.icon = folder_icon + "tree2/spriteFrame";
            jidi = CfgMgr.GetBuildingDefine(101, BuildingType.ji_di)[0],
                data.name = jidi.remark + "等级  Lv" + (value || 0);
            msg = CheckCondition(conditionId, value);
            if (msg) data.fail = condStr ? ReplaceStr(condStr, value) : msg;
            return data;
        case ConditionType.Home_2: // 201家园基地等级
            data.icon = folder_icon + "tree2/spriteFrame";
            jidi = CfgMgr.GetBuildingDefine(201, BuildingType.ji_di)[0],
                data.name = jidi.remark + "等级  Lv" + (value || 0);
            msg = CheckCondition(conditionId, value);
            if (msg) data.fail = condStr ? ReplaceStr(condStr, value) : msg;
            return data;
        case ConditionType.Home_3: // 301家园基地等级
            data.icon = folder_icon + "tree2/spriteFrame";
            jidi = CfgMgr.GetBuildingDefine(301, BuildingType.ji_di)[0],
                data.name = jidi.remark + "等级  Lv" + (value || 0);
            msg = CheckCondition(conditionId, value);
            if (msg) data.fail = condStr ? ReplaceStr(condStr, value) : msg;
            return data;
        case ConditionType.PlayerPower: // 玩家战力
            data.name = "玩家战力 " + (value || 0);
            msg = CheckCondition(conditionId, value);
            let show = formatNumber(value);
            if (msg) data.fail = condStr ? ReplaceStr(condStr, show) : msg;
            return data;
    }
}

/**
 * 判断thing条件是否满足
 * @param thingType 
 * @param id 
 * @param num 
 */
export function FormaThingCondition(thingType: number, id: number, num: number = 1) {
    let data: ConditionSub = { id: id, icon: "", name: "", value1: num };
    let has: number;
    switch (thingType) {
        case ThingType.ThingTypeItem:
            let stdItem: StdItem = CfgMgr.Getitem(id);
            has = PlayerData.GetItemCount(id);
            data.name = stdItem.ItemName + "  " + has + "/" + num;
            data.icon = path.join(folder_item, stdItem.Icon, "spriteFrame");
            data.fail = has < num ? data.name + "不足!" : undefined;
            break;
        case ThingType.ThingTypeCurrency:
            data.name = "彩虹体  " + ToFixed(PlayerData.roleInfo.currency, 2) + "/" + BigNumber(num);
            data.icon = path.join(folder_icon, "caizuan/spriteFrame");
            data.fail = PlayerData.roleInfo.currency < num ? "彩虹体不足" : undefined;
            break;
        case ThingType.ThingTypeGold:
            data.name = "金币  " + ToFixed(PlayerData.roleInfo.currency2, 2) + "/" + BigNumber(num);
            data.icon = "sheets/common/通用货币/spriteFrame";
            if (PlayerData.roleInfo.currency2 < num) data.fail = "金币不足!";
            break;
        case ThingType.ThingTypeEquipment:
            data.name = "武器";
            data.icon = "sheets/common/通用货币/spriteFrame";
            break;
        case ThingType.ThingTypeRole:
            let std = CfgMgr.GetRole()[id];
            has = PlayerData.GetPlayerByType(id).length;
            data.name = std.Name + "  " + has + "/" + num;
            data.icon = path.join(folder_head_card, std.Icon, "spriteFrame");
            if (has < num) {
                data.fail = "尚未集齐" + std.Name;
            }
            break;
        case ThingType.ThingTypeResource:
            switch (id) {
                case 1://木头
                    let stdWood = CfgMgr.Getitem(ThingItemId.ItemId_6);
                    data.name = BigNumber(PlayerData.roleInfo.resources.wood, 2) + "/" + BigNumber(num);
                    data.icon = path.join(folder_item, stdWood.Icon, "spriteFrame");
                    if (PlayerData.roleInfo.resources.wood < num) data.fail = "木头不足";
                    break;
                case 2://水
                    let stdWater = CfgMgr.Getitem(ThingItemId.ItemId_8);
                    data.name = BigNumber(PlayerData.roleInfo.resources.water, 2) + "/" + BigNumber(num);
                    data.icon = path.join(folder_item, stdWater.Icon, "spriteFrame");
                    if (PlayerData.roleInfo.resources.water < num) data.fail = "水不足";
                    break;
                case 3://石头
                    let stdRock = CfgMgr.Getitem(ThingItemId.ItemId_7);
                    data.name = BigNumber(PlayerData.roleInfo.resources.rock, 2) + "/" + BigNumber(num);
                    data.icon = path.join(folder_item, stdRock.Icon, "spriteFrame");
                    if (PlayerData.roleInfo.resources.rock < num) data.fail = "石头不足";
                    break;
                case 4://能量/种子"
                    let stdSeed = CfgMgr.Getitem(ThingItemId.ItemId_9);
                    data.name = BigNumber(PlayerData.roleInfo.resources.seed, 2) + "/" + BigNumber(num);
                    data.icon = path.join(folder_item, stdSeed.Icon, "spriteFrame");
                    if (PlayerData.roleInfo.resources.seed < num) data.fail = "种子不足";
                    break;
            }
            break;
        case ThingType.ThingTypeGemstone:
            let stdGem = CfgMgr.Getitem(ThingItemId.ItemId_3);
            data.name = stdGem.ItemName + "  " + ToFixed(PlayerData.roleInfo.currency3, 2) + "/" + BigNumber(num);
            data.icon = path.join(folder_item, stdGem.Icon, "spriteFrame");
            if (PlayerData.roleInfo.currency3 < num) data.fail = stdGem.ItemName + "不足！";
            break;
    }
    return data;
}

/**
 * 格式化兵营升级属性
 * @param stds 
 * @param lv 
 * @returns 
 */
export function FormatSoldierUp(stds: { [level: number]: StdSoldierProduction }, lv: number) {
    let now = stds[lv];
    let next = stds[lv + 1];
    let objMap: { [id: number]: AttrSub } = {};
    let stdDef = CfgMgr.Get("role_type");
    for (let i = 0; i < 1; i++) {
        let type = now.SoldiersType[i];
        let limit = now.SoldiersNum[i];
        objMap[type] = {
            icon: path.join(folder_attr, "SoldierMAX", "spriteFrame"),
            name: "兵种上限",
            value: limit,
            next: 0,
            per: ""
        };
    }
    for (let i = 0; i < 1; i++) {
        if (!next) break;
        let type = next.SoldiersType[i];
        let limit = next.SoldiersNum[i];
        if (objMap[type]) {
            objMap[type].next = limit;
        } else {
            objMap[type] = {
                icon: path.join(folder_attr, "SoldierMAX", "spriteFrame"),
                name: "兵种上限",
                value: limit,
                next: 0,
                per: ""
            }
        }
    }
    if (next && next.NewSoldiers) {
        let type = next.NewSoldiers;
        let name = stdDef[type].Name;
        objMap[type] = {
            icon: path.join(folder_icon, type + "", "spriteFrame"),
            name: "新解锁兵种",
            value: name,
            next: 0,
            per: ""
        }
    }
    let datas: AttrSub[] = [];
    for (let k in objMap) datas.push(objMap[k]);
    return datas;
}
/**
 * 格式化兵营升级属性
 * @param stds 
 * @param lv 
 * @returns 
 */
export function FormatSoldierInfo(stds: { [level: number]: StdSoldierProduction }, lv: number) {
    let now = stds[lv];
    let objMap: { [id: number]: AttrSub } = {};
    let limit = now.SoldiersNum[0];
    let level = `初级`;
    switch (now.ShowType) {
        case 1:
            level = `初级`;
            break;
        case 2:
            level = `中级`;
            break;
        case 3:
            level = `高级`;
            break;
    }
    objMap[0] = {
        icon: path.join(folder_attr, "max_height", "spriteFrame"),
        name: "最高级兵种",
        value: ``,
        next: 0,
        per: level
    };
    objMap[1] = {
        icon: path.join(folder_attr, "SoldierMAX", "spriteFrame"),
        name: "兵种上限",
        value: limit,
        next: 0,
        per: ""
    };
    objMap[2] = {
        icon: path.join(folder_attr, "productivity", "spriteFrame"),
        name: "生产效率",
        value: now.SoldiersTime[0],
        next: 0,
        per: "个/s"
    };
    let datas: AttrSub[] = [];
    for (let k in objMap) datas.push(objMap[k]);
    return datas;
}

/**
 * 更新背包道具item
 * @param item 
 * @param data 
 */
export function UpdateBagItem(item: Node, data: SPlayerDataItem | SThing) {
    let bagItem = item.getComponent(BagItem);
    if (!bagItem) bagItem = item.addComponent(BagItem);
    bagItem.SetData(data);
}

/**
 * 获取建筑icon
 * @param buildingid 
 * @param lv 
 * @returns 
 */
export function GetBuildingIcon(buildingid: number, lv: number) {
    let stdDefine = CfgMgr.GetBuildingUnLock(buildingid);
    let folder = BuildingType[stdDefine.BuildingType];
    let stdLv = CfgMgr.GetBuildingLv(buildingid, lv);
    if (stdLv) {
        return path.join("home/buildings", folder, stdLv.Prefab, "spriteFrame");
    } else {
        return path.join("home/buildings", folder, stdDefine.Prefab, "spriteFrame");
    }
}

function createThing(thing?: SThing) {
    let data: SThing = {
        type: (thing ? thing.type : ThingType.ThingTypeCurrency),
        currency: undefined,
        gold: undefined,
        resource: undefined,
        item: undefined,
        role: undefined
    }
    return data;
}

/**
 * 格式化thing
 * @param thing 
 * @returns 
 */
export function FormatSThing(thing: SThing) {
    let datas: SThing[] = [];
    if (thing.currency && thing.currency.value) {
        let data = createThing(thing);
        data.type = ThingType.ThingTypeCurrency;
        data.currency = thing.currency;
        datas.push(data);
    }
    if (thing.gold && thing.gold.value) {
        let data = createThing(thing);
        data.type = ThingType.ThingTypeGold;
        data.gold = thing.gold;
        datas.push(data);
    }
    if (thing.resource) {
        if (thing.resource.rock) {
            let data = createThing(thing);
            data.type = ThingType.ThingTypeResource;
            data.resource = { rock: thing.resource.rock, seed: 0, water: 0, wood: 0 };
            datas.push(data);
        }

        if (thing.resource.seed) {
            let data = createThing(thing);
            data.type = ThingType.ThingTypeResource;
            data.resource = { rock: 0, seed: thing.resource.seed, water: 0, wood: 0 };
            datas.push(data);
        }

        if (thing.resource.water) {
            let data = createThing(thing);
            data.type = ThingType.ThingTypeResource;
            data.resource = { rock: 0, seed: 0, water: thing.resource.water, wood: 0 };
            datas.push(data);
        }

        if (thing.resource.wood) {
            let data = createThing(thing);
            data.type = ThingType.ThingTypeResource;
            data.resource = { rock: 0, seed: 0, water: 0, wood: thing.resource.wood };
            datas.push(data);
        }
    }
    if (thing.item && thing.item.id && thing.item.count) {
        let data = createThing(thing);
        data.type = ThingType.ThingTypeItem;
        data.item = thing.item;
        datas.push(data);
    }
    if (thing.role) {
        let data = createThing(thing);
        data.type = ThingType.ThingTypeRole;
        data.item = thing.item;
        datas.push(data);
    }
    return datas;
}

/**
 * 格式化事物列表
 * @param things 
 * @returns 
 */
export function FormatSThings(things: SThing[]) {
    let results = [];
    for (let thing of things) {
        let datas = FormatSThing(thing);
        results.push(...datas);
    }
    return results;
}

/**
 * 递归置灰节点
 * @param target 目标节点
 * @param gray 是否置灰 true:置灰 false:正常
 * @param disabled 是否禁止点击事件
 */
export function SetNodeGray(target: Node, gray: boolean = false, disabled: boolean = true) {
    //console.warn("此方法有问题！暂时不要用");
    //return;
    let mat: Material = builtinResMgr.get(gray ? "ui-sprite-gray-material" : "") || null;
    let renderList = target.getComponentsInChildren(UIRenderer);
    let btn: Button;
    for (let rend of renderList) {
        btn = rend.node.getComponent(Button);
        if (btn && disabled) btn.interactable = !gray;
        rend.customMaterial = mat;
    }

}
/**适配背景图刘海 */
export function AdaptBgTop(node: Node): void {
    if (node) {
        let w = node.getComponent(Widget);
        if (w) {
            w.top = -GameSet.StatusBarHeight || 0;
        }
    }

}
/**
 * 合并相同属性组
 * @returns 
 */
export function MergeAttrSub(sources: AttrSub[]): AttrSub[] {
    if (!sources) return [];
    let newList: AttrSub[] = [];
    let newAttr: AttrSub;
    let stdAttr: AttrSub;
    let indexDic: { [key: string]: number } = js.createMap();
    let keyIndex: number;
    for (let index = 0; index < sources.length; index++) {
        stdAttr = sources[index];
        keyIndex = indexDic[stdAttr.id];
        if (keyIndex == null) {
            newAttr = DeepCopy(stdAttr);
            keyIndex = newList.length;
            indexDic[stdAttr.id] = keyIndex;
            newList[keyIndex] = newAttr;
        } else {
            newAttr = newList[keyIndex];
            newAttr.value += stdAttr.value;
        }
    }
    return newList;
}
/**
 * 节点渐进式缩放出现效果
 * @param nodeList 节点列表
 * @param s 初始缩放值
 * @param e 目标缩放值
 * @param t 持续时间
 * @param d 出现延迟时间
 */
export function NodeTrickleOutEffect(nodeList: Node[], t: number = 0.2, d: number = 0.05, s: number = 0, e: number = 1): void {
    let node: Node
    for (let index = 0; index < nodeList.length; index++) {
        node = nodeList[index];
        Tween.stopAllByTarget(node);
        node.setScale(s, s, s);
        tween(node)
            .delay((index + 1) * d)
            .to(t, { scale: new Vec3(e, e, e) })
            .start();
    }
}
