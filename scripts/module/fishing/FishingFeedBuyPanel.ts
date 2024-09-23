import { Node, Button, Label, Sprite, sp, Slider, UITransform, path, SpriteFrame } from "cc";
import { Panel } from "../../GameRoot";
import { CfgMgr, ThingType } from "../../manager/CfgMgr";
import { ConsumeItem } from "../common/ConsumeItem";
import PlayerData from "../roleModule/PlayerData";
import { MsgPanel } from "../common/MsgPanel";
import { ItemUtil } from "../../utils/ItemUtils";
import { Session } from "../../net/Session";
import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { folder_item, ResMgr } from "../../manager/ResMgr";
import { ToFixed, formatNumber } from "../../utils/Utils";
import { Evt_Currency_Updtae } from "../../manager/EventMgr";

export class FishingFeedBuyPanel extends Panel {
    protected prefab: string = "prefabs/panel/fishing/FishingFeedBuyPanel";
    private itemIcon:Sprite;
    private numLab:Label;
    private leftBtn:Button;
    private slider:Slider;
    private sliderBar:Node;
    private rightBtn:Button;
    private maxBtn:Button;
    private consumeItem:ConsumeItem;
    private btn:Button;
    private curNum:number;
    private maxNum:number;
    private convertNum:number;//兑换数
    private step:number;//拖动调步长
    private rote:number;//彩钻兑换鱼饲料比例
    private btnDatas:{name:string, value:number}[] = [
        {name:"+100", value:100},
        {name:"+500", value:500},
        {name:"+1000", value:1000},
        {name:"+10000", value:10000},
    ];
    protected onLoad(): void {
        this.itemIcon = this.find("itemIcon").getComponent(Sprite);
        this.numLab = this.find("numLab", Label);
        this.leftBtn = this.find("sliderCont/leftBtn", Button);
        this.slider = this.find("sliderCont/slider", Slider);
        this.sliderBar = this.find("sliderCont/slider/sliderBar");
        this.rightBtn = this.find("sliderCont/rightBtn", Button);
        this.maxBtn = this.find("sliderCont/maxBtn", Button);
        let btnCont = this.find("btnCont");
        let consume = this.find("consumeItem");
        this.consumeItem = consume.addComponent(ConsumeItem);
        this.btn = this.find("btn", Button);
        
        let btnNode:Node;
        let btnLab:Label;
        let btnData:{name:string, value:number};
        for (let i = 0; i < btnCont.children.length; i++) {
            btnData = this.btnDatas[i];
            btnNode = btnCont.children[i];
            btnLab = btnNode.getChildByName("Label").getComponent(Label);
            btnLab.string = btnData.name;
            btnNode.on(Button.EventType.CLICK, this.onClick.bind(this, i));
        }
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.maxBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.leftBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.rightBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.CloseBy("mask");
        this.slider.node.on('slide', this.onSlide, this);
        
        
        this.step = CfgMgr.GetFishConvertNum(CfgMgr.GetFishCommon.CostItemID);
        this.rote = CfgMgr.GetFishCommon.ConvertPrice / this.step;
        let url = path.join(folder_item, `lingshi01`, "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            this.itemIcon.spriteFrame = res;
        });
        Session.on(Evt_Currency_Updtae, this.onCurrencyChange, this);
    }
    public flush(...args: any[]): void {
        let tempNum:number = Math.floor(PlayerData.roleInfo.currency / this.rote);
        if(tempNum > 0){
            let offset:number = tempNum % this.step;
            this.maxNum = tempNum - offset;
            this.curNum = this.step;
        }else{
            this.maxNum = 0;
        }
        this.curNum = this.step;
        
        this.changeSlidePro(2);
    }

    protected onShow(): void {
    }

    protected onHide(...args: any[]): void {
    }
    private onCurrencyChange():void{
        this.flush();
    }
    private changeSlidePro(type:number, param:number = 0):void{
        if(type == 0){
            if(this.curNum > this.step * 2){
                this.curNum = this.curNum - this.step;
            }else{
                return;
            }
        }else if(type == 1){
            if(this.curNum < this.maxNum){
                this.curNum = this.curNum + this.step;
                if(this.curNum > this.maxNum) this.curNum = this.maxNum;
            }else{
                return;
            }
        }else if(type == 3){
            if(this.curNum >= this.maxNum){
                MsgPanel.Show("已是最大兑换数")
                return;
            }else{
                let tempNum:number = this.curNum + param;
                if(tempNum > this.maxNum){
                    tempNum = this.maxNum;
                }
                this.curNum = tempNum;
            }
        }
        this.slider.progress = this.curNum / this.maxNum;
        this.updateItemCount();
    }
    private updateItemCount():void{
        let barTrans = this.sliderBar.getComponent(UITransform);
        let sliderTrans = this.slider.getComponent(UITransform);
        barTrans.setContentSize(this.slider.progress * sliderTrans.width, barTrans.height);
        this.numLab.string = this.curNum.toString();
        let item = ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, this.curNum);
        this.consumeItem.FormatCountCb((num:number)=>{
            return`${formatNumber(this.curNum * this.rote, 2)}/${ToFixed(PlayerData.roleInfo.currency, 2)}`;
        });
        this.consumeItem.SetData(item);
        
    }
    private onSlide(event: Slider) {
        let tempNum:number = Math.ceil(event.progress * this.maxNum);
        let tempNum2:number = tempNum % this.step;
        if(tempNum2 > 0){
            tempNum = tempNum - tempNum2;
        }
        
        if(tempNum > this.maxNum) tempNum = this.maxNum;
        this.curNum = Math.max(tempNum, this.step);
        this.changeSlidePro(2);
    }
    private onClick(index:number):void{
        let btnData = this.btnDatas[index];
        this.changeSlidePro(3, btnData.value);
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
            case this.btn:
                if(this.maxNum < 1){
                    MsgPanel.Show("兑换数量不足，兑换失败")
                    return;
                }
                Session.Send({type: MsgTypeSend.FishingConvertItem, data:{count:this.curNum * this.rote}});
                break;
        }
        
    }
    
    
}