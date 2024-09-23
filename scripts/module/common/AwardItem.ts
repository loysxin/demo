import { Color, Component, Input, Label, Node, Sprite, SpriteFrame, Toggle, path } from "cc";
import Logger from "../../utils/Logger";
import { CardQuality, CfgMgr, ItemQuality, ItemType, StdItem, ThingItemId, ThingType } from "../../manager/CfgMgr";
import { ResMgr, folder_head_card, folder_icon, folder_item } from "../../manager/ResMgr";
import { SPlayerDataItem, SThing } from "../roleModule/PlayerData";
import { EventMgr, Evt_Currency_Updtae, Evt_Item_Change, Evt_Res_Update } from "../../manager/EventMgr";
import { ItemUtil } from "../../utils/ItemUtils";
import { formatNumber } from "../../utils/Utils";
import { ItemTips } from "./ItemTips";

export class AwardItem extends Component {
    private qualBg: Sprite;
    private roleMaskBg: Sprite;
    private icon: Sprite;
    private roleMask: Sprite;
    private numLab: Label;
    private nameLab: Label;
    private effectValBg:Node;
    private effectValLab: Label;
    private select: Node;
    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;
    private _data:{itemData: SPlayerDataItem | number[] | SThing, select?: boolean};
    private itemId:number;
    private itemNum:number;
    private qualBgUrl:string;
    private roleMaskBgUrl:string;
    private iconUrl:string;
    private roleMaskUrl:string;
    private itemName:string;
    private effectType:number;
    private showEffect:number;
    private effectVal:number;
    private isCheckHave:boolean = false;
    private numLabInitCol:Color;
    private thingType:ThingType;
    private _formatNameCb:(name:string) => string = null;
    private _formatCountCb:(num:number) => string = null;
    private _formatEffectCb:(effectType:number, effectVal:number) => string = null;
    protected onLoad(): void {
        this.qualBg = this.node.getChildByName("qualBg")?.getComponent(Sprite);
        this.roleMaskBg = this.node.getChildByName("roleMaskBg")?.getComponent(Sprite);
        this.icon = this.node.getChildByName("icon")?.getComponent(Sprite);
        this.roleMask = this.node.getChildByName("roleMask")?.getComponent(Sprite);
        this.numLab = this.node.getChildByName("numLab")?.getComponent(Label);
        this.nameLab = this.node.getChildByName("nameLab")?.getComponent(Label);
        this.effectValBg = this.node.getChildByName("effectValBg");
        this.effectValLab = this.node.getChildByName("effectValLab")?.getComponent(Label);
        this.select = this.node.getChildByName("select");
        if(this.select) this.select.active = false;
        if(this.numLab) this.numLabInitCol = this.numLab.color.clone();
        EventMgr.on(Evt_Item_Change, this.onItemChange, this);
        EventMgr.on(Evt_Res_Update, this.onResUpdate, this);
        EventMgr.on(Evt_Currency_Updtae, this.onCurrencyUpdate, this);
        this.hasLoad = true;
        this.complete?.();
    }

    protected get loadSub() {
        if (this.$loadSub) return this.$loadSub;
        let thisObj = this;
        this.$loadSub = new Promise((resolve, reject) => {
            thisObj.complete = resolve;
        });
    }
    private onItemChange():void{
        if(!this.isCanUpdate) return;
        this.setCountCol();
        
    }
    private onResUpdate():void{
        this.setCountCol();
    }
    private onCurrencyUpdate():void{
        this.setCountCol();
    }
    private get isCanUpdate():boolean{
        if(!this.isCheckHave || !this._data) return false;
        return true;
    }
    private setCountCol():void{
        if(this.numLab){
            if(this.isCheckHave && !ItemUtil.CheckItemIsHave(this.thingType, this.itemNum, this.itemId)){
                this.numLab.color = new Color().fromHEX("#BF1600");
            }else{
                this.numLab.color = this.numLabInitCol;
            }
        }
    }
    /**
     * 设置消耗物品数据
     * @param data number index 0 物品id index 1 物品数量, SPlayerDataItem道具数据结构
     * @param isCheckHave 是否检测拥有
     */
    async SetData(data:{itemData: SPlayerDataItem | number[] | SThing, select?: boolean }, isCheckHave:boolean = false) {
        if (!this.hasLoad) await this.loadSub;
        this._data = data;
        this.isCheckHave = isCheckHave;
        if(this._data.itemData instanceof Array){
            if(this._data.itemData.length != 2){
                Logger.error(`AwardItem.SetData非法数据！`)
                return;
            }
            this.setItem({id:this._data.itemData[0], count: this._data.itemData[1]});
        }else if(data.itemData['id'] != undefined) {
            this.setItem(this._data.itemData as SPlayerDataItem);
        }else {
            this.setThing(this._data.itemData as SThing);
        }
        this.setCountCol();
        this.formatName();
        this.formatCount();
        this.formatEffectVal();
        if (this.qualBg && this.qualBgUrl) this.qualBg.spriteFrame = await ResMgr.LoadResAbSub(this.qualBgUrl, SpriteFrame);
        if (this.icon) this.icon.spriteFrame = await ResMgr.LoadResAbSub(this.iconUrl, SpriteFrame);
        if(this.roleMaskBg){
            if(this.roleMaskBgUrl){
                this.roleMaskBg.node.active = true;
                this.roleMaskBg.spriteFrame = await ResMgr.LoadResAbSub(this.roleMaskBgUrl, SpriteFrame);
            }else{
                this.roleMaskBg.node.active = false;
            }
        }
        if(this.roleMask){
            if(this.roleMaskUrl){
                this.roleMask.node.active = true;
                this.roleMask.spriteFrame = await ResMgr.LoadResAbSub(this.roleMaskUrl, SpriteFrame);
            }else{
                this.roleMask.node.active = false;
            }
        }
    }
    private setItem(data: SPlayerDataItem) {
        let stdItem = CfgMgr.Getitem(data.id);
        if (!stdItem){
            Logger.error(`AwardItem.SetData找不到物品id${data.id}`);
            return;
        }
        
        this.thingType = ThingType.ThingTypeItem;
        this.itemId = data.id;
        this.itemNum = data.count;
        this.iconUrl = null;
        this.qualBgUrl = null;
        this.roleMaskBgUrl = null;
        this.roleMaskUrl = null;
        this.itemName = "";
        this.effectType = -1;
        this.effectVal = -1;
        this.showEffect = stdItem.NameType;
        let valStr:string = "";
        this.effectType = stdItem.Itemtpye;
        this.effectVal = stdItem.ItemEffect1;
        this.itemName = stdItem.ItemName;
        this.iconUrl = path.join(folder_item, stdItem.Icon, "spriteFrame");
        if (stdItem.Itemtpye == ItemType.shard) {
            this.qualBgUrl = path.join(folder_icon, "quality", CardQuality[stdItem.ItemEffect2] + "_bag_bg", "spriteFrame");
            this.roleMaskBgUrl = path.join(folder_icon, "quality", CardQuality[stdItem.ItemEffect2] + "_bag_mask_bg", "spriteFrame");
            this.roleMaskUrl = path.join(folder_icon, "quality", CardQuality[stdItem.ItemEffect2] + "_bag_mask", "spriteFrame");
        }else{
            this.qualBgUrl = path.join(folder_icon, "quality", ItemQuality[stdItem.Quality] + "_bag_bg", "spriteFrame");
            
        } 
        
    }
    protected async setThing(thing: SThing) {
        this.thingType = thing.type;
        this.itemId = 0;
        this.iconUrl = null;
        this.qualBgUrl = null;
        this.roleMaskBgUrl = null;
        this.roleMaskUrl = null;
        this.itemName = "";
        this.effectType = -1;
        this.effectVal = -1;
        this.showEffect = 0;
        if(thing.type == ThingType.ThingTypeItem){
            this.setItem({ id: thing.item.id, count: thing.item.count });
        }else{
            this.itemNum = thing.resData.count;
            this.itemName = thing.resData.name;
            this.iconUrl = thing.resData.iconUrl;
            this.qualBgUrl = thing.resData.iconBgUrl;
            this.roleMaskBgUrl = thing.resData.roleMaskBg;
            this.roleMaskUrl = thing.resData.roleMask;
        }
        
    }
    /**
     * 格式化奖励名称
     */
    private formatName():void{
        if (!this.nameLab) return;
        if(this._formatNameCb != null){
            this.nameLab.string = this._formatNameCb(this.itemName);
            return;
        }
        this.nameLab.string = `${this.itemName}`;
    }
    /**
     * 格式化奖励数量
     */
    private formatCount():void{
        if (!this.numLab) return;
        if(this._formatCountCb != null){
            this.numLab.string = this._formatCountCb(this.itemNum);
            return;
        }
        this.numLab.string = `${ThingItemId[this.itemId] ? formatNumber(this.itemNum, 2) : this.itemNum}`;
    }
    /**
     * 格式化道具效果
     */
    private formatEffectVal():void{
        if (!this.effectValLab) return;
        if (this.showEffect > 0 || this.effectType < 0 || this.effectVal < 0){
            if(this.effectValBg) this.effectValBg.active = false;
            if(this.effectValLab) this.effectValLab.node.active = false;
            return;
        }
        if(this.effectValBg) this.effectValBg.active = true;
        if(this.effectValLab) this.effectValLab.node.active = true;
        if(this._formatEffectCb != null){
            this.effectValLab.string = this._formatEffectCb(this.effectType, this.effectVal);
            return;
        }
        let valStr:string = "";
        switch (this.effectType) {
            case ItemType.exp:
                valStr = `经验值${this.effectVal}`;
                break;
            case ItemType.speed:
                valStr = `${this.effectVal / 60}分钟`;
                break;
        } 
        if(valStr == "")this.effectValBg.active = this.effectValLab.node.active = false;
        this.effectValLab.string = valStr;
    }
    /**
     * 格式化名称回调
     */
    FormatNameCb(cb:(name:string) => string){
        this._formatNameCb = cb;
    }
    /**
     * 格式化数量回调
     */
    FormatCountCb(cb:(num:number) => string){
        this._formatCountCb = cb;
    }
    /**
     * 格式化道具效果回调
     */
    FormatEffectCb(cb:(effectType:number, effectVal:number) => string){
        this._formatEffectCb = cb;
    }

    get itemData():SPlayerDataItem | number[] | SThing{
        return this._data.itemData;
    }
    get thingTypeData():ThingType{
        return this.thingType;
    }
}