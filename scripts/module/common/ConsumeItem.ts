import { Color, Component, Label, Sprite, SpriteFrame, _decorator, path } from "cc";
import Logger from "../../utils/Logger";
import { CfgMgr, StdItem, ThingItemId, ThingType } from "../../manager/CfgMgr";
import { ResMgr, folder_item } from "../../manager/ResMgr";
import PlayerData, { SPlayerDataItem, SThing } from "../roleModule/PlayerData";
import { EventMgr, Evt_Currency_Updtae, Evt_Item_Change, Evt_Res_Update } from "../../manager/EventMgr";
import { ItemUtil } from "../../utils/ItemUtils";
import { formatNumber } from "../../utils/Utils";
const { ccclass, property, disallowMultiple, requireComponent } = _decorator;
/**
 * 格式化消耗类型数字  
 */
export enum ConsumeNumFormatType{
    Comm,//普通格式化
    ContrastHave,//对比拥有的，不足出红色，否则出绿色
    Have,//只显示拥有的
}
export class ConsumeItem extends Component {
    private icon: Sprite;
    private numLab: Label;
    private itemNum:number;
    private iconUrl:string;
    private itemId:number;
    private itemName:string;
    private numLabInitCol:Color;
    private thingType:ThingType;
    private data:SPlayerDataItem | number[] | SThing;
    protected $loadSub: Promise<any>;
    protected complete: Function;
    public numFormatType:ConsumeNumFormatType = ConsumeNumFormatType.Comm;
    protected hasLoad = false;
    private _formatCountCb:(num:number) => string = null;
    protected onLoad(): void {
        this.icon = this.node.getChildByName("icon").getComponent(Sprite);
        this.numLab = this.node.getChildByName("numLab").getComponent(Label);
        this.numLabInitCol = this.numLab.color.clone();
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
        this.formatCount();
        
    }
    private onResUpdate():void{
        if(!this.isCanUpdate) return;
        this.setCountCol();
        this.formatCount();
    }
    private onCurrencyUpdate():void{
        if(!this.isCanUpdate) return;
        this.setCountCol();
        this.formatCount();
    }
    private get isCanUpdate():boolean{
        if(!this.node.activeInHierarchy || this.numFormatType == ConsumeNumFormatType.Comm || !this.data) return false;
        return true;
    }
    private setCountCol():void{
        if(this.numLab){
            
            if(this.numFormatType == ConsumeNumFormatType.ContrastHave && !ItemUtil.CheckItemIsHave(this.thingType, this.itemNum, this.itemId)){
                this.numLab.color = new Color().fromHEX("#BF1600");
            }else{
                this.numLab.color = this.numLabInitCol;
            }
        }
    }
    /**
     * 设置消耗物品数据
     * @param data number index 0 物品id index 1 物品数量, SPlayerDataItem道具数据结构
     */
    async SetData(data:SPlayerDataItem | number[] | SThing) {
        if (!this.hasLoad) await this.loadSub;
        this.data = data;
        if(this.data instanceof Array){
            if(this.data.length != 2){
                Logger.error(`AwardItem.SetData非法数据！`)
                return;
            }
            this.setItem({id:this.data[0], count: this.data[1]});
        }else if(this.data['id'] != undefined) {
            this.setItem(this.data as SPlayerDataItem);
        }else {
            this.setThing(this.data as SThing);
        }
        this.setCountCol();
        this.formatCount();
        if (this.icon) this.icon.spriteFrame = await ResMgr.LoadResAbSub(this.iconUrl, SpriteFrame);
    }

    private setItem(data: SPlayerDataItem) {
        this.thingType = ThingType.ThingTypeItem;
        this.itemId = data.id;
        this.itemNum = data.count;
        this.itemNum = this.getItemNum();
        this.iconUrl = null;
        this.itemName = "";
        let stdItem = CfgMgr.Getitem(data.id);
        if (!stdItem){
            Logger.error(`AwardItem.SetData找不到物品id${data.id}`);
            return;
        }
        this.itemName = stdItem.ItemName;
        this.iconUrl = path.join(folder_item, stdItem.Icon, "spriteFrame");
    }
    private setThing(thing: SThing) {
        this.thingType = thing.type;
        this.iconUrl = null;
        this.itemName = "";
        this.itemId = 0;
        if(thing.type == ThingType.ThingTypeItem){
            this.setItem({ id: thing.item.id, count: thing.item.count });
        }else{
            this.itemNum = thing.resData.count;
            this.itemName = thing.resData.name;
            this.iconUrl = thing.resData.iconUrl;
        }
        
    }
    /**
     * 格式化数量回调
     */
    FormatCountCb(cb:(num:number) => string){
        this._formatCountCb = cb;
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
        this.itemNum = this.getItemNum();
        this.numLab.string = `${ThingItemId[this.itemId] ? formatNumber(this.itemNum, 2) : this.itemNum}`;
    }
    private getItemNum():number{
        if(this.numFormatType == ConsumeNumFormatType.Comm){
            return this.itemNum;
        }else if(this.numFormatType == ConsumeNumFormatType.ContrastHave){
            return this.itemNum;
        }else if(this.numFormatType == ConsumeNumFormatType.Have){
            return PlayerData.GetItemCount(this.itemId);
        }
        return this.itemNum;
        
    }
}