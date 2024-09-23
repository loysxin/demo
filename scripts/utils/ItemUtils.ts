import { path } from "cc";
import { CardQuality, CfgMgr, FuncValueType, FuncValueTypeName, ItemQuality, ItemType, ResourceName, ResourceType, StdItem, ThingItemId, ThingType } from "../manager/CfgMgr";
import { MsgPanel } from "../module/common/MsgPanel";
import PlayerData, { SThing, SThingRes, SThingResource } from "../module/roleModule/PlayerData";
import { folder_head_card, folder_icon, folder_item } from "../manager/ResMgr";
import { CanSet } from "../module/home/HomeStruct";
import { BeforeGameUtils } from "./BeforeGameUtils";

export class ItemUtil {
    static resTypeInfo: { [key: string]: number } = BeforeGameUtils.toHashMapObj(
        ResourceType.wood, ThingItemId.ItemId_6,
        ResourceType.rock, ThingItemId.ItemId_7,
        ResourceType.water, ThingItemId.ItemId_8,
        ResourceType.seed, ThingItemId.ItemId_9
    );
    private static typesFuncInfo: { [key: string]: number } = BeforeGameUtils.toHashMapObj(
        FuncValueType.strength, ThingItemId.ItemId_16
    );
    static moneyInfo: { [key: string]: number } = BeforeGameUtils.toHashMapObj(
        ThingType.ThingTypeCurrency, ThingItemId.ItemId_1,
        ThingType.ThingTypeGold, ThingItemId.ItemId_2,
        ThingType.ThingTypeGemstone, ThingItemId.ItemId_3,
    );
    /**
     * 通过配置转换SThing列表结构
     * @param itemTypeList 事物类型列表
     * @param itemIdList 事物id列表
     * @param itemNumList 事物数量列表
     */
    static GetSThingList(itemTypeList: number[], itemIdList: number[], itemNumList?: number[]): SThing[] {
        let list: SThing[] = [];
        let itemType: number;
        let itemId: number;
        let itemNum: number;
        let data: SThing;
        let stdItem: StdItem;
        for (let index = 0; index < itemTypeList.length; index++) {
            itemType = itemTypeList[index];
            itemId = itemIdList[index];
            itemNum = itemNumList ? itemNumList[index] : 0;
            data = {};
            data.resData = { name: "", count: itemNum, iconUrl: "", iconBgUrl: "" };
            if (this.moneyInfo[itemType]) {
                data.type = ThingType.ThingTypeItem;
                data.item = { id: this.moneyInfo[itemType], count: itemNum };
                this.changeResData(data.item.id, data.resData);
            } else {
                data.type = itemType;
                switch (itemType) {
                    case ThingType.ThingTypeItem:
                        data.item = { id: itemId, count: itemNum };
                        this.changeResData(data.item.id, data.resData);
                        break;
                    case ThingType.ThingTypeEquipment:
                        data.resData.count = 1;
                        data.resData.name = "武器";
                        data.resData.iconUrl = path.join(folder_item, "wuQi", "spriteFrame");
                        data.resData.iconBgUrl = path.join(folder_icon, "quality", "defineBg", "spriteFrame");
                        break;
                    case ThingType.ThingTypeRole:
                        let std = CfgMgr.GetRole()[itemId];
                        data.resData.count = 1;
                        data.resData.name = std.Name;
                        data.resData.iconUrl = path.join(folder_head_card, std.Icon, "spriteFrame");
                        if (itemNum) {
                            data.resData.iconBgUrl = path.join(folder_icon, "quality", CardQuality[itemNum] + "_bag_bg", "spriteFrame");
                        } else {
                            data.resData.iconBgUrl = path.join(folder_icon, "quality/defineBg/spriteFrame");
                        }
                        break;
                    case ThingType.ThingTypeResource:
                        data.type = ThingType.ThingTypeItem;
                        data.item = { id: this.resTypeInfo[itemId], count: itemNum };
                        this.changeResData(data.item.id, data.resData);
                        break;
                    case ThingType.ThingTypesFuncValue:
                        data.type = ThingType.ThingTypeItem;
                        data.item = { id: this.typesFuncInfo[itemId], count: itemNum };
                        this.changeResData(data.item.id, data.resData);
                        break;

                }
            }

            list.push(data);
        }
        return list;
    }
    private static changeResData(itemId: number, resData: SThingRes): void {
        let stdItem = CfgMgr.Getitem(itemId);
        if (stdItem) {
            resData.name = stdItem.ItemName;
            resData.iconUrl = path.join(folder_item, stdItem.Icon, "spriteFrame");
            if (stdItem.Itemtpye == ItemType.shard) {
                resData.iconBgUrl = path.join(folder_icon, "quality", CardQuality[stdItem.ItemEffect2] + "_bag_bg", "spriteFrame");
                resData.roleMaskBg = path.join(folder_icon, "quality", CardQuality[stdItem.ItemEffect2] + "_bag_mask_bg", "spriteFrame");
                resData.roleMask = path.join(folder_icon, "quality", CardQuality[stdItem.ItemEffect2] + "_bag_mask", "spriteFrame");
                resData.qual = stdItem.ItemEffect2;
            } else {
                resData.iconBgUrl = path.join(folder_icon, "quality", ItemQuality[stdItem.Quality] + "_bag_bg", "spriteFrame");
                resData.qual = stdItem.Quality;
            }
        }
    }
    /**
     * 检测事物消耗是否满足
     * @param itemTypeList 事物类型列表
     * @param itemIdList 事物id列表
     * @param itemNumList 事物数量列表
     * @param isShowTips 事物不足时是否飘字
     * @param isShowGetWay 事物不足时是否显示获取途径
     * @param tipsStr 事物不足提示内容
     */
    static CheckThingConsumes(itemTypeList: number[], itemIdList: number[], itemNumList: number[], isShowTips: boolean = false, isShowGetWay: boolean = false, tipsStr: string = ""): boolean {
        let itemType: number;
        let itemId: number;
        let itemNum: number;
        let haveNum: number;
        let itemName: string;
        for (let index = 0; index < itemTypeList.length; index++) {
            itemType = itemTypeList[index];
            itemId = itemIdList[index];
            itemNum = itemNumList[index];
            haveNum = 0;
            itemName = "";
            switch (itemType) {
                case ThingType.ThingTypeItem:
                case ThingType.ThingTypeCurrency:
                case ThingType.ThingTypeGold:
                case ThingType.ThingTypeResource:
                case ThingType.ThingTypeGemstone:
                    if (itemId < 1) {
                        itemId = this.moneyInfo[itemType];
                    } else if (itemType == ThingType.ThingTypeResource) {
                        itemId = this.resTypeInfo[itemId];
                    }
                    let stdItem: StdItem = CfgMgr.Getitem(itemId);
                    itemName = stdItem ? stdItem.ItemName : itemId.toString();
                    switch (itemId) {
                        case ThingItemId.ItemId_1:
                            haveNum = PlayerData.roleInfo.currency;
                            break;
                        case ThingItemId.ItemId_2:
                            haveNum = PlayerData.roleInfo.currency2;
                            break;
                        case ThingItemId.ItemId_3:
                            haveNum = PlayerData.roleInfo.currency3;
                            break;
                        case ThingItemId.ItemId_6:
                            haveNum = PlayerData.resources.wood;
                            break;
                        case ThingItemId.ItemId_7:
                            haveNum = PlayerData.resources.rock;
                            break;
                        case ThingItemId.ItemId_8:
                            haveNum = PlayerData.resources.water;
                            break;
                        case ThingItemId.ItemId_9:
                            haveNum = PlayerData.resources.seed;
                            break;
                        case ThingItemId.ItemId_16:
                            if (PlayerData.fishData && PlayerData.fishData.player) {
                                haveNum = PlayerData.fishData.player.fatigue;
                            }
                            break;
                        default:
                            haveNum = PlayerData.GetItemCount(itemId);
                            break;
                    }
                    break;
                case ThingType.ThingTypeEquipment:
                    itemName = "装备";
                    break;
                case ThingType.ThingTypeRole:
                    break;
            }
            if (haveNum < itemNum) {
                if (isShowTips) MsgPanel.Show(tipsStr != "" ? tipsStr : `所需${itemName}数量不足${itemNum}个`);
                if (isShowGetWay) {
                    //TODO 打开获取途径
                }
                return false;
            }
        }
        return true;
    }
    /**
     * 获取拥有事物数量
     * @param itemType 
     * @param itemId 
     * @returns 
     */
    static GetHaveThingNum(itemType: number, itemId: number = 0): number {
        let haveNum: number = 0;
        switch (itemType) {
            case ThingType.ThingTypeItem:
            case ThingType.ThingTypeCurrency:
            case ThingType.ThingTypeGold:
            case ThingType.ThingTypeResource:
            case ThingType.ThingTypeGemstone:
                if (itemId < 1) {
                    itemId = this.moneyInfo[itemType];
                } else if (itemType == ThingType.ThingTypeResource) {
                    itemId = this.resTypeInfo[itemType];
                }
                switch (itemId) {
                    case ThingItemId.ItemId_1:
                        haveNum = PlayerData.roleInfo.currency;
                        break;
                    case ThingItemId.ItemId_2:
                        haveNum = PlayerData.roleInfo.currency2;
                        break;
                    case ThingItemId.ItemId_3:
                        haveNum = PlayerData.roleInfo.currency3;
                        break;
                    case ThingItemId.ItemId_6:
                        haveNum = PlayerData.resources.wood;
                        break;
                    case ThingItemId.ItemId_7:
                        haveNum = PlayerData.resources.rock;
                        break;
                    case ThingItemId.ItemId_8:
                        haveNum = PlayerData.resources.water;
                        break;
                    case ThingItemId.ItemId_9:
                        haveNum = PlayerData.resources.seed;
                        break;
                    case ThingItemId.ItemId_16:
                        if (PlayerData.fishData && PlayerData.fishData.player) {
                            haveNum = PlayerData.fishData.player.fatigue;
                        }
                        break;
                    default:
                        haveNum = PlayerData.GetItemCount(itemId);
                        break;
                }
                break;
        }
        return haveNum;
    }

    /**
     * 创建单一事物结构体
     * @param itemType 
     * @param itemNum 
     * @param itemId 
     * @returns 
     */
    static CreateThing(itemType: number, itemId: number = 0, itemNum: number = 0): SThing {
        let thingList: SThing[] = this.GetSThingList([itemType], [itemId], [itemNum]);
        return thingList && thingList.length ? thingList[0] : null;
    }
    /**
     * 单一事物结构检测是否拥有足够数量
     * @param itemType 
     * @param itemNum 
     * @param itemId 
     * @returns 
     */
    static CheckItemIsHave(itemType: number, itemNum: number, itemId: number = 0): boolean {
        return this.CheckThingConsumes([itemType], [itemId], [itemNum]);
    }

    /**
     * 合并数量
     * @param thing 
     * @param count 
     */
    static MergeThings(thing: SThing, count: number) {
        switch (thing.type) {
            case ThingType.ThingTypeItem:
                thing.item.count += count;
                break;
            case ThingType.ThingTypeCurrency:
                thing.currency.value += count;
                break;
            case ThingType.ThingTypeGold:
                thing.currency.value += count;
                break;
            case ThingType.ThingTypeEquipment:
                thing['count'] = (thing['count'] || 1) + count;
                break;
            case ThingType.ThingTypeRole:
                thing['count'] = (thing['count'] || 1) + count;
                break;
            case ThingType.ThingTypeResource:
                if (thing.resource.rock) {
                    thing.resource.rock += count;
                } else if (thing.resource.seed) {
                    thing.resource.seed += count;
                } else if (thing.resource.water) {
                    thing.resource.water += count;
                } else if (thing.resource.wood) {
                    thing.resource.wood += count;
                }
                break;
            case ThingType.ThingTypeGemstone:
                thing.currency.value += count;
                break;
        }
    }
}