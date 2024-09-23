import { Component, EventTouch, Input, Label, Node, Sprite, SpriteFrame, Toggle, Vec3, input, path } from "cc";
import PlayerData, { SPlayerDataItem, SThing } from "../roleModule/PlayerData";
import { CardQuality, CfgMgr, ItemType, ResourceName, ResourceType, StdItem, ThingItemId, ThingType } from "../../manager/CfgMgr";
import { ResMgr, folder_head_card, folder_icon, folder_item } from "../../manager/ResMgr";
import { ToFixed, countDown2, formatK, formatNumber } from "../../utils/Utils";
import { SaveGameData } from "../../net/MsgProxy";
import { ItemTips } from "../common/ItemTips";
import { TradeHeroPanel } from "../trade/TradeHeroPanel";

export class BagItem extends Component {
    private bg: Sprite;
    private maskBg: Sprite;
    private icon: Sprite;
    private mask: Sprite;
    private num: Label;
    private quality: Sprite
    private newIcon: Node;
    private itemName: Label;
    private select: Node;
    private redPoint: Node;
    private data: SPlayerDataItem | SThing;

    private showSelect: boolean = true;
    private isShowTips: boolean = false;
    private showRedPoint: boolean = false;
    private isShowRoleLock: boolean = false;
    private time_lock:number;
    protected onLoad(): void {
        this.bg = this.node.getChildByName("bg").getComponent(Sprite);
        this.maskBg = this.node.getChildByName("maskbg").getComponent(Sprite);
        this.icon = this.node.getChildByName("icon").getComponent(Sprite);
        this.mask = this.node.getChildByName("mask").getComponent(Sprite);
        this.num = this.node.getChildByName("num").getComponent(Label);
        this.quality = this.node.getChildByName("quality").getComponent(Sprite);
        this.newIcon = this.node.getChildByName("isNew");
        this.itemName = this.node.getChildByName("name").getComponent(Label);
        this.redPoint = this.node.getChildByName("redPoint");
        this.redPoint.active = false;
        this.select = this.node.getChildByName("select");
        this.node.on(Input.EventType.TOUCH_END, this.onClick, this);
        this.hasLoad = true;
        this.complete?.();
    }

    protected complete: Function;
    protected hasLoad = false;
    protected $loadSub: Promise<any>;
    protected get loadSub() {
        if (this.$loadSub) return this.$loadSub;
        let thisObj = this;
        this.$loadSub = new Promise((resolve, reject) => {
            thisObj.complete = resolve;
        });
        return this.$loadSub;
    }

    /**
     * 刷新道具数据
     * @param data 
     */
    async SetData(data: SPlayerDataItem | SThing) {
        if (!this.hasLoad) await this.loadSub;
        this.data = data;
        if (data['id'] != undefined) {
            this.setItem(<unknown>data as SPlayerDataItem);
        } else {
            this.setThing(<unknown>data as SThing);
        }
    }
    protected async setItem(data: SPlayerDataItem) {
        let std: StdItem = CfgMgr.Getitem(data.id);
        this.newIcon.active = data.isNew == true;
        data.isNew = false;
        this.node.getComponent(Toggle).enabled = this.showSelect;
        this.node.name = std.Items + "";

        this.icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_item, std.Icon, "spriteFrame"), SpriteFrame);
        if (std.Itemtpye == ItemType.shard) {
            this.quality.node.active = true;
            this.quality.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[std.ItemEffect2], "spriteFrame"), SpriteFrame);
            this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[std.ItemEffect2] + "_bag_bg", "spriteFrame"), SpriteFrame);

            this.maskBg.node.active = true;
            this.maskBg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[std.ItemEffect2] + "_bag_mask_bg", "spriteFrame"), SpriteFrame);
            this.mask.node.active = true;
            this.mask.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[std.ItemEffect2] + "_bag_mask", "spriteFrame"), SpriteFrame);
        } else {
            this.maskBg.node.active = false;
            this.quality.node.active = false;
            this.mask.node.active = false;
            if (std.Quality) {
                this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[std.Quality] + "_bag_bg", "spriteFrame"), SpriteFrame);
            } else {
                this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality/defineBg/spriteFrame"), SpriteFrame);
            }
        }
        if (ThingItemId[data.id]) {
            if(data.id == ThingItemId.ItemId_1 || data.id == ThingItemId.ItemId_2 || data.id == ThingItemId.ItemId_3){
                this.num.string = ToFixed(data.count, 2);
            }else{
                this.num.string = formatNumber(data.count, 2);
            }
        } else {
            this.num.string = formatNumber(data.count);
        }
        let isHaveRedPoint: boolean = false;
        if (this.showRedPoint) {
            if (std.Type == ThingType.ThingTypeItem) {
                if (std.Itemtpye == ItemType.shard) {
                    isHaveRedPoint = data.count >= std.ItemEffect3;
                } else if (std.Itemtpye == ItemType.box) {
                    isHaveRedPoint = true;
                }
            }
        }
        this.redPoint.active = isHaveRedPoint;
        this.itemName.string = std.ItemName;
    }
    protected async setThing(thing: SThing) {
        this.newIcon.active = false;
        // this.select.active = this.showSelect;
        this.node.getComponent(Toggle).enabled = this.showSelect;
        this.maskBg.node.active = false;
        this.quality.node.active = false;
        this.mask.node.active = false;
        this.icon.node.scale = new Vec3(1, 1, 1);
        switch (thing.type) {
            case ThingType.ThingTypeItem:
                this.setItem({ id: thing.item.id, count: thing.item.count });
                break;
            case ThingType.ThingTypeCurrency:
                this.itemName.string = "彩虹体";           
                let currency1std: StdItem = CfgMgr.Getitem(ThingItemId.ItemId_1);
                switch (thing.currency.type) {
                    case 0://彩虹体
                        this.num.string = ToFixed(thing.currency.value, 2);
                        currency1std = CfgMgr.Getitem(ThingItemId.ItemId_1);                   
                        break;
                    case 2://金币
                        this.num.string = ToFixed(thing.currency.value, 2);
                        currency1std = CfgMgr.Getitem(ThingItemId.ItemId_2);
                        break;
                    case 3://原石
                        this.num.string = ToFixed(thing.currency.value, 4);
                        currency1std = CfgMgr.Getitem(ThingItemId.ItemId_3);
                        break;
                }
                this.icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_item, currency1std.Icon, "spriteFrame"), SpriteFrame);
                this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[currency1std.Quality] + "_bag_bg", "spriteFrame"), SpriteFrame);
                this.node.name = ThingType[thing.type];
                break;
            case ThingType.ThingTypeGold:
                this.itemName.string = "金币";
                let currency2std: StdItem = CfgMgr.Getitem(ThingItemId.ItemId_2);
                switch (thing.currency.type) {
                    case 0://彩虹体
                        this.num.string = ToFixed(thing.currency.value, 2);
                        currency2std = CfgMgr.Getitem(ThingItemId.ItemId_1);
                        break;
                    case 2://金币
                        this.num.string = ToFixed(thing.currency.value, 2);
                        currency2std = CfgMgr.Getitem(ThingItemId.ItemId_2);
                        break;
                    case 3://原石
                        this.num.string = ToFixed(thing.currency.value, 4);
                        currency2std = CfgMgr.Getitem(ThingItemId.ItemId_3);
                        break;
                }    
                this.icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_item, currency2std.Icon, "spriteFrame"), SpriteFrame);
                this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[currency2std.Quality] + "_bag_bg", "spriteFrame"), SpriteFrame);
                this.node.name = ThingType[thing.type];
                break;
            case ThingType.ThingTypeEquipment:
                this.num.string = "";
                this.itemName.string = "武器";
                this.icon.node.active = false;
                this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality/defineBg/spriteFrame"), SpriteFrame);
                this.node.name = ThingType[thing.type];
                break;
            case ThingType.ThingTypeRole:
                // this.node.getComponent(Toggle).enabled = true;
                let std = CfgMgr.GetRole()[thing.role.type];
                this.num.string = thing['count'] || "1";
                this.itemName.string = std.Name;
                this.quality.node.active = true;
                this.icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_head_card, std.Icon, "spriteFrame"), SpriteFrame);
                this.icon.node.scale = new Vec3(0.8, 0.8, 0.8);
                if (thing.role.quality) {
                    this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[thing.role.quality] + "_bag_bg", "spriteFrame"), SpriteFrame);
                    this.quality.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[thing.role.quality], "spriteFrame"), SpriteFrame);
                } else {
                    this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality/defineBg/spriteFrame"), SpriteFrame);
                }
                this.node.name = "role_" + thing.role.type;
                let role_lock = this.node.getChildByName("role_lock");
                let node = this.node.getChildByPath("role_lock/lbl_time");
                if(role_lock && node){
                    role_lock.active = false;
                }
                let time = thing.role.trade_cd - PlayerData.GetServerTime();
                if(this.isShowRoleLock && thing.role.trade_cd > 0 && time > 0){
                    let lbl_time:Label;
                    if(role_lock && node){
                        role_lock.active = true;
                        lbl_time = node.getComponent(Label);
                        let show_time = countDown2(thing.role.trade_cd);
                        if( show_time.d > 0){
                            lbl_time.string = show_time.d + "天";
                        }else{
                            lbl_time.string = show_time.h + ":" + show_time.m + ":" + show_time.s;
                        }
                        if(this.time_lock){
                            clearInterval(this.time_lock)
                        }
                        let seconds = thing.role.trade_cd - PlayerData.GetServerTime();
                        this.time_lock = setInterval(() => {
                            if (seconds > 0) {
                                seconds -= 1;
                                let time = countDown2(thing.role.trade_cd);
                                if(time.d > 0){
                                    lbl_time.string = time.d + "天";
                                }else{
                                    lbl_time.string = time.h + ":" + time.m + ":" + time.s;
                                }
                            } else {
                                role_lock.active = false;
                                clearInterval(this.time_lock);
                            }
                        }, 1000)
                    }
                }

                break;
            case ThingType.ThingTypeResource:
                if (thing.resource.rock) {
                    this.setItem({ id: ThingItemId.ItemId_7, count: thing.resource.rock });
                } else if (thing.resource.seed) {
                    this.setItem({ id: ThingItemId.ItemId_9, count: thing.resource.seed });
                } else if (thing.resource.water) {
                    this.setItem({ id: ThingItemId.ItemId_8, count: thing.resource.water });
                } else if (thing.resource.wood) {
                    this.setItem({ id: ThingItemId.ItemId_6, count: thing.resource.wood });
                }
                break;
            case ThingType.ThingTypeGemstone:
                this.itemName.string = "辉耀石";
                let currency3std: StdItem = CfgMgr.Getitem(ThingItemId.ItemId_3);
                switch (thing.currency.type) {
                    case 0://彩虹体
                        this.num.string = ToFixed(thing.currency.value, 2);
                        currency3std = CfgMgr.Getitem(ThingItemId.ItemId_1);
                        break;
                    case 2://金币
                        this.num.string = ToFixed(thing.currency.value, 2);
                        currency3std = CfgMgr.Getitem(ThingItemId.ItemId_2);
                        break;
                    case 3://原石
                        this.num.string = ToFixed(thing.currency.value, 4);
                        currency3std = CfgMgr.Getitem(ThingItemId.ItemId_3);
                        break;
                }
                
                this.icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_item, currency3std.Icon, "spriteFrame"), SpriteFrame);
                this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[currency3std.Quality] + "_bag_bg", "spriteFrame"), SpriteFrame);
                this.node.name = ThingType[thing.type];
                break;
        }
    }

    /**是否展示道具数量 true展示，false不展示 */
    async setIsShowNum(isshow: boolean) {
        if (!this.hasLoad) await this.loadSub;
        this.num.node.active = isshow;
    }

    /**是否展示道具选中状态 true展示，false不展示 */
    async setIsShowSelect(isshow: boolean) {
        this.showSelect = isshow;
        this.node.getComponent(Toggle).enabled = this.showSelect;
    }

    /**是否展示道具tips true展示，false不展示 */
    async setIsShowTips(isshow: boolean) {
        this.isShowTips = isshow;
    }
    setIsShowRedPoint(val: boolean) {
        this.showRedPoint = val;
    }

    /**是否展示角色倒计时 */
    setIsRoleLockShow(isshow: boolean){
        this.isShowRoleLock = isshow;
    }


    private onClick(e: EventTouch) {
        if (this.isShowTips) {
            if((this.data as SThing).role){
                TradeHeroPanel.Show((this.data as SThing).role)
            }else{
                ItemTips.Show(this.data)
            }
        }
    }
}