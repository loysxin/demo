import { Component, Label, Node } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import { FishingShopItem } from "./FishingShopItem";
import { EventMgr, Evt_FishShopDataUpdate } from "../../manager/EventMgr";
import PlayerData, {SFishingShopGetContentRet, SFishingShopItem } from "../roleModule/PlayerData";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { DateUtils } from "../../utils/DateUtils";
import { FishingShopBuyPanel } from "./FishingShopBuyPanel";
import { MsgPanel } from "../common/MsgPanel";
import { ConditionType, OneOffRedPointId } from "../../manager/CfgMgr";

export class FishingShopPage extends Component {
    private timeLab:Label;
    private shopList:AutoScroller;
    protected $loadSub:Promise<any>;
    protected complete:Function;
    protected hasLoad = false;
    protected onLoad(): void {
        this.timeLab = this.node.getChildByPath("timeCont/timeLab").getComponent(Label);
        this.shopList = this.node.getChildByName("shopList").getComponent(AutoScroller);
        this.shopList.SetHandle(this.updateShopItem.bind(this));
        this.shopList.node.on('select', this.onShopSelect, this);
        this.hasLoad = true;
        this.complete?.();   
        EventMgr.on(Evt_FishShopDataUpdate, this.onShopUpdate, this);
    }

    protected get loadSub() {
        if (this.$loadSub) return this.$loadSub;
        let thisObj = this;
        this.$loadSub = new Promise((resolve, reject) => {
            thisObj.complete = resolve;
        });
    }
    
    async onShow():Promise<void>{
        if (!this.hasLoad) await this.loadSub;
        this.node.active = true;
        PlayerData.SetOneOffRedPoint(OneOffRedPointId.OffRedPoint_FishShopBuy);
        this.initShop();
    }
    onHide():void{
        this.node.active = false;
    }
    private initShop():void{
        Session.Send({type: MsgTypeSend.FishingShopGetContent, data:{}});
            
        //this.updateCont();
    }
    private sendTime:number = 2;
    protected update(dt: number): void {
        if(PlayerData.fishShop){
            this.sendTime = 2;
            let residueTime:number = Math.max(Math.floor(PlayerData.fishShop.refresh_time - PlayerData.GetServerTime()), 0);
            if(residueTime > 86400){
                this.timeLab.string = "刷新时间：" + DateUtils.FormatTime(residueTime, "%{d}天%{hh}:%{mm}:%{ss}");
            }else{
                this.timeLab.string = "刷新时间：" + DateUtils.FormatTime(residueTime, "%{hh}:%{mm}:%{ss}");
                if(residueTime <= 0){
                    this.sendTime = 0;
                    PlayerData.fishShop = null;
                    this.updateCont();
                }
            }   
        }else{
            if(this.sendTime <= 0){
                this.sendTime = 2;
                this.initShop();
            }else{
                this.sendTime -= dt;
            }
        }
        
    }
    private onShopUpdate():void{
       
        this.updateCont();
    }
    private updateCont():void{
        let shopDatas:SFishingShopItem[] = [];
        if(PlayerData.fishShop){
            if(PlayerData.fishShop.shop_items){
                for (let index = 0; index < PlayerData.fishShop.shop_items.length; index++) {
                    shopDatas[index] = PlayerData.fishShop.shop_items[index];
                }
            }
            
        }
        this.shopList.UpdateDatas(shopDatas);
    }
    protected updateShopItem(item: Node, data: SFishingShopItem) {
        let shopItem = item.getComponent(FishingShopItem);
        if (!shopItem) shopItem = item.addComponent(FishingShopItem);
        shopItem.SetData(data);
    }
    private onShopSelect(index: number, item: Node):void{
        
        let xzShopData:SFishingShopItem = PlayerData.fishShop.shop_items[index];
        if(xzShopData.available_amount < 1){
            MsgPanel.Show("商品购买次数已满");
            return;
        }
        FishingShopBuyPanel.Show(xzShopData);
    }
}