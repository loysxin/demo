import { Button, Label, Node, RichText, Slider, Toggle, UITransform} from "cc";
import { Panel } from "../../GameRoot";
import { ShopLuckyPage } from "./ShopLuckyPage";
import { ShopDayPage } from "./ShopDayPage";
import { EventMgr, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import { ConsumeItem } from "../common/ConsumeItem";
import { ItemUtil } from "../../utils/ItemUtils";
import { CfgMgr, ShopGroupId, ShopType, StdItem, StdShopCommodity, StdShopGroup, ThingType } from "../../manager/CfgMgr";
import PlayerData, { SShopItem, SThing } from "../roleModule/PlayerData";
import { formatNumber } from "../../utils/Utils";
import { BeforeGameUtils } from "../../utils/BeforeGameUtils";
import { AutoScroller } from "../../utils/AutoScroller";
import { ShopTabBtnItem } from "./ShopTabBtnItem";
import { ShopBasePage } from "./ShopPageBase";
import { ShopWeekPage } from "./ShopWeekPage";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { AwardItem } from "../common/AwardItem";
import { SetNodeGray } from "../common/BaseUI";
import { MsgPanel } from "../common/MsgPanel";
import { ItemTips } from "../common/ItemTips";

export class ShopBuyPanel extends Panel {
    protected prefab: string = "prefabs/panel/shop/ShopBuyPanel";
    private itemDesc:RichText;
    private awardItem:AwardItem;
    private awardBtn:Button;
    private priceConsumeItem:ConsumeItem;
    private numLab:Label;
    private leftBtn:Button;
    private slider:Slider;
    private sliderBar:Node;
    private rightBtn:Button;
    private maxBtn:Button;
    private buyBtn:Button;
    private buyConsumeItem:ConsumeItem;
    private curNum:number;
    private maxNum:number;
    private shopId:number;
    private std:StdShopCommodity;
    private shopData:SShopItem;
    private stdItem:StdItem;
    private item:SThing;
    protected onLoad() {
        this.itemDesc = this.find("itemDesc", RichText);
        this.awardItem = this.find("AwardItem").addComponent(AwardItem);
        this.awardBtn = this.find("AwardItem", Button);
        this.priceConsumeItem = this.find("priceConsumeItem").addComponent(ConsumeItem);
        this.numLab = this.find("numLab", Label);
        this.leftBtn = this.find("sliderCont/leftBtn", Button);
        this.slider = this.find("sliderCont/slider", Slider);
        this.sliderBar = this.find("sliderCont/slider/sliderBar");
        this.rightBtn = this.find("sliderCont/rightBtn", Button);
        this.maxBtn = this.find("sliderCont/maxBtn", Button);
        this.buyBtn = this.find("buyBtn", Button);
        this.buyConsumeItem = this.find("buyBtn/buyConsumeItem").addComponent(ConsumeItem);
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
        this.awardBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.slider.node.on('slide', this.onSlide, this);
        this.leftBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.rightBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.maxBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.buyBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
    }
    protected onShow(): void {
        
    }
    protected onHide(...args: any[]): void {
        
    }
    
    public flush(shopId:number, shopData:SShopItem): void {
        this.shopId = shopId;
        this.shopData = shopData;
        this.std = CfgMgr.GetCommShopItem(this.shopData.id);
        this.item = ItemUtil.CreateThing(this.std.Goodstype[0], this.std.GoodsID[0], this.std.GoodsNum[0]);
        this.stdItem = CfgMgr.Getitem(this.item.item.id);
        this.itemDesc.string = this.stdItem.Remark;
        this.awardItem.SetData({itemData:this.item});
        this.maxNum = shopData.count;//Math.floor(ItemUtil.GetHaveThingNum(this.std.CostType[0], this.std.CostID[0]) / this.std.CostNumber[0]);
        this.curNum = this.maxNum > 0 ? 1 : 0;
        let priceItem = ItemUtil.CreateThing(this.std.CostType[0], this.std.CostID[0], this.std.CostNumber[0]);
        this.priceConsumeItem.SetData(priceItem);
        this.changeSlidePro(3);
    }
    onBtnClick(btn: Button) {
        switch (btn) {
            case this.leftBtn:
                this.changeSlidePro(0);
                break;
            case this.rightBtn:
                this.changeSlidePro(1);
                break;
            case this.maxBtn:
                this.changeSlidePro(2);
                break;
            case this.buyBtn:
                if(this.std.LimitBuyTime > 0 && (this.shopData.expiration_time - PlayerData.GetServerTime() < 1)){
                    MsgPanel.Show("商品已超出时间，无法继续购买");
                    return;
                }
                Session.Send({type: MsgTypeSend.ShopBuyItem, data:{shop_index_id:this.shopId, buy_id:this.std.Id, buy_count:this.curNum}});
                this.Hide();
                break;
            case this.awardBtn:
                ItemTips.Show(this.item);
                break;
        }
    }
    private onSlide(event: Slider) {
        let tempNum:number = Math.ceil(event.progress * this.maxNum);
        if(tempNum > this.maxNum) tempNum = this.maxNum;
        this.curNum = Math.max(tempNum, this.maxNum > 0 ? 1 : 0);
        this.changeSlidePro(3);
    }
    private changeSlidePro(type:number):void{
        if(type == 0){
            if(this.curNum > 1){
                this.curNum --;
            }
        }else if(type == 1){
            if(this.curNum < this.maxNum){
                this.curNum ++;
            }
        }else if(type == 2){
            if(this.curNum != this.maxNum){
                this.curNum = this.maxNum;
            }
        }
        this.slider.progress = this.maxNum < 1 ? 0 : this.curNum / this.maxNum;
        this.updateItemCount();
    }
    private updateItemCount():void{
        let barTrans = this.sliderBar.getComponent(UITransform);
        let sliderTrans = this.slider.getComponent(UITransform);
        barTrans.setContentSize(this.slider.progress * sliderTrans.width, barTrans.height);
        this.numLab.string = this.curNum.toString();
        let num:number = this.curNum * this.std.CostNumber[0];
        let item = ItemUtil.CreateThing(this.std.CostType[0], this.std.CostID[0], num);
        this.buyConsumeItem.SetData(item);
        let isCanBuy:boolean = this.curNum > 0 && ItemUtil.CheckThingConsumes(this.std.CostType, this.std.CostID, [num]);
        SetNodeGray(this.buyBtn.node, !isCanBuy, true);
    }
}