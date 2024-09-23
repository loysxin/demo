import { Button, Label, Slider, Node, UITransform } from "cc";
import { Panel } from "../../GameRoot";
import { AwardItem } from "../common/AwardItem";
import { ConsumeItem, ConsumeNumFormatType } from "../common/ConsumeItem";
import PlayerData, { SFishingShopItem, SThing } from "../roleModule/PlayerData";
import { ItemUtil } from "../../utils/ItemUtils";
import { CfgMgr, ThingType } from "../../manager/CfgMgr";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";

export class FishingShopBuyPanel extends Panel {
    protected prefab: string = "prefabs/panel/fishing/FishingShopBuyPanel";
    private awardItem:AwardItem;
    private buyNumLab:Label;
    private rainbowItem:ConsumeItem;
    private yuPiaoItem:ConsumeItem;
    private leftBtn:Button;
    private slider:Slider;
    private sliderBar:Node;
    private rightBtn:Button;
    private maxBtn:Button;
    private chBuyBtn:Button;
    private ypBuyBtn:Button;
    private chBtnItem:ConsumeItem;
    private ypBtnItem:ConsumeItem;
    private curNum:number;
    private maxNum:number;
    private shopData:SFishingShopItem;
    protected onLoad(): void {
        this.awardItem = this.find("AwardItem").addComponent(AwardItem);
        this.rainbowItem = this.find("priceCont/rainbowItem").addComponent(ConsumeItem);
        this.yuPiaoItem = this.find("priceCont/yuPiaoItem").addComponent(ConsumeItem);
        this.buyNumLab = this.find("buyNumLab").getComponent(Label);
        this.leftBtn = this.find("sliderCont/leftBtn", Button);
        this.slider = this.find("sliderCont/slider", Slider);
        this.sliderBar = this.find("sliderCont/slider/sliderBar");
        this.rightBtn = this.find("sliderCont/rightBtn", Button);
        this.maxBtn = this.find("sliderCont/maxBtn", Button);
        this.chBuyBtn = this.find("chBuyBtn").getComponent(Button);
        this.ypBuyBtn = this.find("ypBuyBtn").getComponent(Button);
        this.chBtnItem = this.find("chBuyBtn/ConsumeItem").addComponent(ConsumeItem);
        this.ypBtnItem = this.find("ypBuyBtn/ConsumeItem").addComponent(ConsumeItem);
        this.CloseBy("mask");
        this.CloseBy("closeBtn");
        this.chBuyBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.ypBuyBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.maxBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.leftBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.rightBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.CloseBy("mask");
        this.slider.node.on('slide', this.onSlide, this);
    }
    public async flush(data:SFishingShopItem): Promise<void> {
        this.shopData = data;
        this.curNum = 1;
        this.maxNum = this.shopData.available_amount;
        this.initShopItem();
        this.changeSlidePro(2);
    }
    
    protected onShow(): void {
        
    }

    protected onHide(...args: any[]): void {

    }

    private onBtnClick(btn:Button):void{
        switch (btn) {
            case this.leftBtn:
                this.changeSlidePro(0);
                break;
            case this.rightBtn:
                this.changeSlidePro(1);
                break;
            case this.maxBtn:
                this.changeSlidePro(3, this.maxNum);
                break;
            case this.chBuyBtn:
                if(!ItemUtil.CheckThingConsumes([ThingType.ThingTypeCurrency], [0], [this.shopData.currency_price * this.curNum], true)){
                    return;
                }
                this.sendBuy(1);
                break;
            case this.ypBuyBtn:
                if(!ItemUtil.CheckThingConsumes([ThingType.ThingTypeItem], [CfgMgr.GetFishCommon.ScoreItemId], [this.shopData.fish_score_price * this.curNum], true)){
                    return;
                }
                this.sendBuy(0);
            break;
        }
        
    }
    private sendBuy(type:number):void{
        let data = {
            type: MsgTypeSend.FishingShopBuyItem,
            data: {
                buy_id: this.shopData.id,
                buy_count:this.curNum,
                buy_type: type,
            }
        }
        Session.Send(data);
        this.Hide();
    }
    private onSlide(event: Slider) {
        let tempNum:number = Math.ceil(event.progress * this.maxNum);
        if(tempNum > this.maxNum) tempNum = this.maxNum;
        this.curNum = Math.max(tempNum, 1);
        this.changeSlidePro(2);
    }

    private changeSlidePro(type:number, param:number = 0):void{
        if(type == 0){
            if(this.curNum > 1){
                this.curNum--;
            }else{
                return;
            }
        }else if(type == 1){
            if(this.curNum < this.maxNum){
                this.curNum++;
            }else{
                return;
            }
        }else if(type == 3){
            this.curNum = this.maxNum;
        }
        this.slider.progress = this.curNum / this.maxNum;
        this.updateConsumeItem();
    }

    private initShopItem():void{
        this.awardItem.FormatCountCb((num:number)=>{
            return`数量：${num}`;
        });
        this.awardItem.SetData({itemData:this.shopData.item});
        let thing:SThing;
        thing = ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, this.shopData.currency_price);
        this.rainbowItem.SetData(thing);

        thing = ItemUtil.CreateThing(ThingType.ThingTypeItem, CfgMgr.GetFishCommon.ScoreItemId, this.shopData.fish_score_price);
        this.yuPiaoItem.SetData(thing);
        
    }

    private updateConsumeItem():void{
        let barTrans = this.sliderBar.getComponent(UITransform);
        let sliderTrans = this.slider.getComponent(UITransform);
        barTrans.setContentSize(this.slider.progress * sliderTrans.width, barTrans.height);
        this.buyNumLab.string = this.curNum.toString();
        let thing:SThing;
        thing = ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, this.shopData.currency_price * this.curNum);
        this.chBtnItem.numFormatType = ConsumeNumFormatType.ContrastHave;
        this.chBtnItem.SetData(thing);

        thing = ItemUtil.CreateThing(ThingType.ThingTypeItem, CfgMgr.GetFishCommon.ScoreItemId, this.shopData.fish_score_price * this.curNum);
        this.ypBtnItem.numFormatType = ConsumeNumFormatType.ContrastHave;
        this.ypBtnItem.SetData(thing);
    }
}