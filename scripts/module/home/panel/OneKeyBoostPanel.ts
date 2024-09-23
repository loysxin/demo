import { Button, Label, Node, ProgressBar} from "cc";
import { Panel } from "../../../GameRoot";
import { AutoScroller } from "../../../utils/AutoScroller";
import PlayerData, { BoostType, SPlayerDataItem } from "../../roleModule/PlayerData";
import { CfgMgr, ItemType, StdItem } from "../../../manager/CfgMgr";
import { AwardItem } from "../../common/AwardItem";
import { DateUtils } from "../../../utils/DateUtils";
import { Tips } from "../../login/Tips";
import { MsgTypeSend } from "../../../MsgType";
import { Session } from "../../../net/Session";
import { MsgPanel } from "../../common/MsgPanel";

export class OneKeyBoostPanel extends Panel {
    protected prefab:string = "prefabs/home/OneKeyBoostPanel";
    private titleLab:Label;
    private timePro:ProgressBar;
    private timeProLab:Label;
    private consumeList:AutoScroller;
    private userBtn:Button;
    private itemDatas:SPlayerDataItem[];
    private endTime:number;
    private startTime:number;
    private boostType:BoostType;
    private typeId:number;
    private boostTypeInfo:{titleName:string, noneTips:string};
    protected onLoad() {
        this.titleLab = this.find("panelCont/titleLab", Label);
        this.timePro = this.find("panelCont/timePro", ProgressBar);
        this.timeProLab = this.find("panelCont/timeProLab", Label);
        this.consumeList = this.find("panelCont/consumeList", AutoScroller);
        this.userBtn = this.find("panelCont/userBtn", Button);
        this.CloseBy("mask");
        this.CloseBy("panelCont/closeBtn");

        this.consumeList.SetHandle(this.updateItem.bind(this));
        this.userBtn.node.on(Button.EventType.CLICK, this.onUserClick, this);
    }
    /**
     * 
     * @param boostType 加速类型
     * @param startTime 开始时间戳
     * @param endTime 结束时间戳
     */
    public flush(boostType:BoostType, typeId:number, boostTypeInfo:{titleName:string, noneTips:string}, startTime:number, endTime:number) {
        this.typeId = typeId;
        this.boostType = boostType;
        this.endTime = endTime;
        this.startTime = startTime;
        this.boostTypeInfo = boostTypeInfo;
        this.titleLab.string = this.boostTypeInfo.titleName;
        this.updateItemData();
    }

    protected onShow(): void {
        
    }
    protected onHide(...args: any[]): void {
        
    }

    onUserClick(btn: Button) {
        let residueTime:number = this.endTime - PlayerData.GetServerTime();
        let stdItem:StdItem;
        let itemData:SPlayerDataItem;
        let full:boolean = false;
        for (let index = 0; index < this.itemDatas.length; index++) {
            itemData = this.itemDatas[index];
            if(itemData.count < 1) continue;
            stdItem = CfgMgr.Getitem(itemData.id);
            let newUserNum = Math.max(Math.ceil(residueTime / stdItem.ItemEffect1), 1);
            if (newUserNum < itemData.count){
                full = true;
                break;
            }
        }
        
        if(full){
            Tips.Show("当前选择道具会导致时间溢出浪费，请问是否继续", () => {
                this.toBoost();
            });
        }else{
            this.toBoost();   
        }
    }
    private toBoost():void{
        let residueTime:number = this.endTime - PlayerData.GetServerTime();
        if(residueTime < 1){
            MsgPanel.Show(this.boostTypeInfo.noneTips);
            this.Hide();
            return;
        }
        let data = {
            type: MsgTypeSend.BoostRequest,
            data: {
                boost_type: this.boostType,
                id:this.typeId,
                items: this.itemDatas,
            }
        }
        Session.Send(data);
        this.Hide();
    }
    
    private updateItemData():void{
        let residueTime:number = this.endTime - PlayerData.GetServerTime();
        let stdItem:StdItem;
        let itemData:SPlayerDataItem;
        let newItemData:SPlayerDataItem;
        let itemDatas = PlayerData.GetItemTypeDatas(ItemType.speed);
        itemDatas.sort((a:SPlayerDataItem, b:SPlayerDataItem)=>{
            let stdItemA = CfgMgr.Getitem(a.id);
            let stdItemB = CfgMgr.Getitem(b.id);
            return stdItemA.ItemEffect1 - stdItemB.ItemEffect1;
        })
        this.itemDatas = [];
        let curTime:number;
        for (let index = 0; index < itemDatas.length; index++) {
            itemData = itemDatas[index];
            stdItem = CfgMgr.Getitem(itemData.id);
            let newUserNum = Math.max(Math.ceil(residueTime / stdItem.ItemEffect1), 1);
            curTime = stdItem.ItemEffect1 * newUserNum;
            newItemData = {id:itemData.id, count:newUserNum};
            this.itemDatas.push(newItemData);
            if(curTime >= residueTime){
                break;
            }
        }
        this.consumeList.UpdateDatas(this.itemDatas);
        
    }
    private updateItem(item: Node, data:SPlayerDataItem) {
        let awardItem = item.getComponent(AwardItem);
        if (!awardItem) awardItem = item.addComponent(AwardItem);
        awardItem.SetData({itemData:data});
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
    }
}
