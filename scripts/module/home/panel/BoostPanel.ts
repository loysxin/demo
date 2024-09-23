import { Button, Color, Label, Node, ProgressBar, Slider, Sprite, UITransform, color } from "cc";
import { Panel } from "../../../GameRoot";
import { AutoScroller } from "../../../utils/AutoScroller";
import PlayerData, { BoostType, SPlayerDataItem } from "../../roleModule/PlayerData";
import { CfgMgr, ItemType, StdItem } from "../../../manager/CfgMgr";
import { AwardItem } from "../../common/AwardItem";
import { DateUtils } from "../../../utils/DateUtils";
import { Tips } from "../../login/Tips";
import { MsgTypeRet, MsgTypeSend } from "../../../MsgType";
import { Session } from "../../../net/Session";
import { BeforeGameUtils } from "../../../utils/BeforeGameUtils";
import { OneKeyBoostPanel } from "./OneKeyBoostPanel";
import { formatK } from "../../../utils/Utils";
import { MsgPanel } from "../../common/MsgPanel";
import { Evt_Currency_Updtae as Evt_Currency_Update } from "../../../manager/EventMgr";

export class BoostPanel extends Panel {
    protected prefab:string = "prefabs/home/BoostPanel";
    private titleLab:Label;
    private timePro:ProgressBar;
    private timeProLab:Label;
    private consumeList:AutoScroller;
    private leftBtn:Button;
    private slider:Slider;
    private sliderBar:Node;
    private rightBtn:Button;
    private numLab:Label;
    private timeLab:Label;
    private userBtn:Button;
    private addTimeBtn:Button;
    private oneKeyUserBtn:Button;
    private countLab:Label;
    private itemDatas:{itemData:SPlayerDataItem, select:boolean}[];
    private curSelectIndex:number;
    private curSelectItem:Node;
    private maxUserNum:number;
    private curUserNum:number;
    private selcetStdItem:StdItem;
    private endTime:number;
    private startTime:number;
    private boostType:BoostType;
    private typeId:number;
    private updateTime:number = 0;
    private boostTypeInfo:{[key: string]: {titleName:string, noneTips:string}} = BeforeGameUtils.toHashMapObj(
        BoostType.BoostTypeBuildingUpgrade, {titleName:"建筑升级加速", noneTips:"建筑升级已完成无需使用加速道具"},
        BoostType.BoostTypeSoldierProduce, {titleName:"兵营招募加速", noneTips:"兵营招募已完成无需使用加速道具"},
        BoostType.BoostTypeItemProduction, {titleName:"工坊生产加速", noneTips:"工坊生产已完成无需使用加速道具"},
    );
    protected onLoad() {
        this.titleLab = this.find("panelCont/titleLab", Label);
        this.timePro = this.find("panelCont/timePro", ProgressBar);
        this.timeProLab = this.find("panelCont/timeProLab", Label);
        this.consumeList = this.find("panelCont/consumeList", AutoScroller);
        this.leftBtn = this.find("panelCont/sliderCont/leftBtn", Button);
        this.slider = this.find("panelCont/sliderCont/slider", Slider);
        this.sliderBar = this.find("panelCont/sliderCont/slider/sliderBar");
        this.rightBtn = this.find("panelCont/sliderCont/rightBtn", Button);
        this.numLab = this.find("panelCont/sliderCont/numLab", Label);
        this.timeLab = this.find("panelCont/sliderCont/timeLab", Label);
        this.userBtn = this.find("panelCont/userBtn", Button);
        this.addTimeBtn = this.find("panelCont/addTimeBtn", Button);
        this.countLab = this.find("panelCont/addTimeBtn/consumeCont/countLab", Label);
        this.oneKeyUserBtn = this.find("panelCont/oneKeyUserBtn", Button);
        this.CloseBy("mask");
        this.CloseBy("panelCont/closeBtn");

        this.consumeList.SetHandle(this.updateItem.bind(this));
        this.consumeList.node.on('select', this.onSelect, this);

        this.slider.node.on('slide', this.onSlide, this);

        this.leftBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.rightBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.userBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.addTimeBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.oneKeyUserBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);

        Session.on(Evt_Currency_Update, this.onCurrencyChange, this);
    }
    /**
     * 
     * @param boostType 加速类型
     * @param startTime 开始时间戳
     * @param endTime 结束时间戳
     */
    public flush(buildId:number, boostType:BoostType, startTime:number, endTime:number) {
        this.typeId = buildId;
        this.boostType = boostType;
        this.endTime = endTime;
        this.startTime = startTime;
        this.titleLab.string = this.boostTypeInfo[this.boostType].titleName;
        this.updateTime = 0;
        this.updateItemData();
        this.updateAddTimeBtn();
    }

    protected onShow(): void {
        let arr = [10, 8, 6, 4, 2];
        let target = 18;
        let result = this.findSum(target, arr, 0);
        console.log("------>测试查找数" + result);
    }

    protected onHide(...args: any[]): void {
        
    }

    private findSum(target:number, arr:number[], index:number):number[]{
        if (target == 0) return [];
        let len:number = arr.length;
        if (index >= len || target < 0)return null;
        let result = this.findSum(target - arr[index], arr, index + 1);
        if (result != null){
            result.push(arr[index]);
            return result;
        } 
        return this.findSum(target, arr, index + 1);
    }
    
    private onCurrencyChange():void{
        this.updateAddTimeBtn();
    }
    onBtnClick(btn: Button) {
        let residueTime:number;
        switch (btn) {
            case this.leftBtn:
                this.changeSlidePro(0);
                break;
            case this.rightBtn:
                this.changeSlidePro(1);
                break;
            case this.userBtn:
                residueTime = this.endTime - PlayerData.GetServerTime();
                let newUserNum = Math.max(Math.ceil(residueTime / this.selcetStdItem.ItemEffect1), 1);
                let itemData = null;
                if(this.curSelectIndex > -1 && this.curSelectIndex < this.itemDatas.length){
                    itemData = this.itemDatas[this.curSelectIndex].itemData;
                }
                if(itemData){
                    let items = [{id:itemData.id, count:this.curUserNum}];
                    if(this.curUserNum > newUserNum){
                        Tips.Show("当前选择道具会导致时间溢出浪费，请问是否继续", () => {
                            this.toBoost(items);
                        });
                    }else{
                        this.toBoost(items);   
                    }
                }else{
                    MsgPanel.Show("没有可加速的道具");
                }
                break;
            case this.addTimeBtn:
                let costNum:number = CfgMgr.GetBoostConsumeCost(this.boostType);
                residueTime = Math.max(this.endTime - PlayerData.GetServerTime(), 0);
                let needCostNum:number = Math.ceil(costNum * residueTime);
                let haveCostNum:number = PlayerData.roleInfo.currency;
                if(haveCostNum < needCostNum){
                    MsgPanel.Show(`当前加速费用不足`)
                    this.updateAddTimeBtn();
                    return;
                }
                this.toBoost();  
                break;
            case this.oneKeyUserBtn:
                this.Hide();
                residueTime = Math.max(this.endTime - PlayerData.GetServerTime(), 0);
                if(residueTime < 1){
                    MsgPanel.Show(this.boostTypeInfo[this.boostType].noneTips);
                    return;
                }
                if(!PlayerData.CheckAddTimeItem()){
                    MsgPanel.Show(CfgMgr.GetText("tips_1"));
                    return;
                }
                OneKeyBoostPanel.Show(this.boostType, this.typeId, this.boostTypeInfo[this.boostType], this.startTime, this.endTime);
                break;
        }
    }
    private toBoost(items = []):void{
        let residueTime:number = this.endTime - PlayerData.GetServerTime();
        if(residueTime < 1){
            MsgPanel.Show(this.boostTypeInfo[this.boostType].noneTips);
            this.Hide();
            return;
        }
        let data = {
            type: MsgTypeSend.BoostRequest,
            data: {
                boost_type: this.boostType,
                id:this.typeId,
                items: items,
            }
        }
        Session.Send(data);
        this.Hide();
    }
    private changeSlidePro(type:number):void{
        if(type == 0){
            if(this.curUserNum > 1){
                this.curUserNum --;
            }else{
                return;
            }
        }else if(type == 1){
            if(this.curUserNum < this.maxUserNum){
                this.curUserNum ++;
            }else{
                return;
            }
        }
        this.slider.progress = this.maxUserNum < 1 ? 0 : this.curUserNum / this.maxUserNum;
        this.updateItemCount();
    }

    private onSlide(event: Slider) {
        let tempNum:number = Math.ceil(event.progress * this.maxUserNum);
        if(tempNum > this.maxUserNum) tempNum = this.maxUserNum;
        this.curUserNum = Math.max(tempNum, this.maxUserNum > 0 ? 1 : 0);
        this.changeSlidePro(2);
    }

    private updateItemData():void{
        this.curSelectIndex = -1;
        this.curSelectItem = null;
        let itemDatas = PlayerData.GetItemTypeDatas(ItemType.speed);
        this.itemDatas = [];
        for (const itemData of itemDatas) {
            let newData:SPlayerDataItem = {
                id:itemData.id,
                count:itemData.count,
            };
            this.itemDatas.push({itemData:newData, select:false});
        }
        this.consumeList.UpdateDatas(this.itemDatas);
        let colorStr:string = "#FFFFFF";
        this.userBtn.interactable = true;
        this.oneKeyUserBtn.interactable = true;
        this.leftBtn.interactable = true;
        this.rightBtn.interactable = true;
        if(this.itemDatas.length > 0){
            this.consumeList.SelectFirst(0);
        }else{
            this.userBtn.interactable = false;
            this.oneKeyUserBtn.interactable = false;
            this.leftBtn.interactable = false;
            this.rightBtn.interactable = false;
            colorStr = '#7C7C7C';
            this.timeLab.string = "0";
            this.numLab.string = "0";
            this.slider.progress = 0;
            let barTrans = this.sliderBar.getComponent(UITransform);
            barTrans.setContentSize(0, barTrans.height);
        }
        let color = new Color().fromHEX(colorStr);
        this.userBtn.getComponent(Sprite).color = color;
        this.oneKeyUserBtn.getComponent(Sprite).color = color;
        this.leftBtn.getComponent(Sprite).color = color;
        this.rightBtn.getComponent(Sprite).color = color;
    }

    private updateAddTimeBtn():void{
        let costNum:number = CfgMgr.GetBoostConsumeCost(this.boostType);
        let residueTime:number = Math.max(this.endTime - PlayerData.GetServerTime(), 0);
        let needCostNum:number = Math.ceil(costNum * residueTime);
        let haveCostNumL:number = PlayerData.roleInfo.currency;
        let colorStr:string = "#FFFFFF";
        this.addTimeBtn.interactable = true;
        if(haveCostNumL < needCostNum){
            colorStr = '#7C7C7C';
            this.addTimeBtn.interactable = false;
        }
        this.addTimeBtn.getComponent(Sprite).color = new Color().fromHEX(colorStr);
        this.countLab.string = formatK(needCostNum);
    }

    private updateItem(item: Node, data:{itemData:SPlayerDataItem, select:boolean}) {
        let awardItem = item.getComponent(AwardItem);
        if (!awardItem) awardItem = item.addComponent(AwardItem);
        let select:Node = item.getChildByName("select");
        select.active = data.select;
        awardItem.SetData(data);
    }

    private async onSelect(index: number, item: Node) {
        if (!this.$hasLoad) await this.initSub;
        if(this.curSelectIndex == index) return;
        let itemData:{itemData:SPlayerDataItem, select:boolean};
        if(this.curSelectItem){
            let awardItem = this.curSelectItem.getComponent(AwardItem);
            let preSelect = this.curSelectItem.getChildByName("select");
            itemData = this.itemDatas[this.curSelectIndex];
            itemData.itemData.count = PlayerData.GetItemCount(itemData.itemData.id);
            awardItem.SetData(itemData);
            preSelect.active = itemData.select = false;    
        }
        let select:Node = item.getChildByName("select");
        itemData = this.itemDatas[index];
        select.active = itemData.select = true;
        this.curSelectIndex = index;
        this.curSelectItem = item;
        let residueTime:number = this.endTime - PlayerData.GetServerTime();
        this.selcetStdItem = CfgMgr.Getitem(itemData.itemData.id);
        this.maxUserNum = Math.max(Math.ceil(residueTime / this.selcetStdItem.ItemEffect1), 1);
        if(this.maxUserNum > itemData.itemData.count) this.maxUserNum = itemData.itemData.count;
        this.curUserNum = this.maxUserNum;
        this.changeSlidePro(2);
    }
    
    private updateItemCount():void{
        if(this.itemDatas.length < 1){
            this.updateAddTimeBtn();
            return;
        }
        let selectData = this.itemDatas[this.curSelectIndex].itemData;
        selectData.count = PlayerData.GetItemCount(selectData.id);
        if(selectData.count > this.curUserNum)selectData.count-=this.curUserNum;
        let awardItem = this.curSelectItem.getComponent(AwardItem);
        awardItem.SetData(this.itemDatas[this.curSelectIndex]);
        this.numLab.string = this.curUserNum.toString();
        let tempTime = this.curUserNum * this.selcetStdItem.ItemEffect1;
        let residueTime:number = this.endTime - PlayerData.GetServerTime();
        let newUserNum = Math.max(Math.ceil(residueTime / this.selcetStdItem.ItemEffect1), 1);
        let colorStr:string = "#235B7B";
        if(this.curUserNum > newUserNum){
            colorStr = '#BF1600';
        }
        this.timeLab.color = new Color().fromHEX(colorStr);
        this.timeLab.string = DateUtils.FormatTime(tempTime);
        let barTrans = this.sliderBar.getComponent(UITransform);
        let sliderTrans = this.slider.getComponent(UITransform);
        barTrans.setContentSize(this.slider.progress * sliderTrans.width, barTrans.height);
    }
    
    protected update(dt: number): void {
        let totalTime:number = this.endTime - this.startTime;
        let residueTime:number = this.endTime - PlayerData.GetServerTime();
        if(residueTime > 0){
            this.timePro.progress = residueTime / totalTime;
            this.timeProLab.string = DateUtils.FormatTime(residueTime);
        }else{
            this.timePro.progress = 0;
        }
        if(this.updateTime <= 0){
            this.updateTime = 10;
            this.updateAddTimeBtn();
        }else{
            this.updateTime -= dt;
        }
    }
}
