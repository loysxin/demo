import { Button, Color, Component, Label, Node } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import { Goto } from "../../manager/EventMgr";
import { SPlayerDataTask, STaskState, SThing } from "../roleModule/PlayerData";
import { AwardItem } from "../common/AwardItem";
import { CfgMgr, StdTask } from "../../manager/CfgMgr";
import { ItemUtil } from "../../utils/ItemUtils";
import { Session } from "../../net/Session";
import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { ItemTips } from "../common/ItemTips";
import { TaskPanel } from "./TaskPanel";

export class MainTaskCont extends Component {
    private nameLab:Label;
    private proLab:Label;
    private goBtn:Button;
    private getBtn:Button;
    private finsh:Node;
    private awardList:AutoScroller;
    private isInit: boolean;
    private data:SPlayerDataTask;
    private std:StdTask;
    private awList:SThing[]
    protected onLoad(): void {
        this.nameLab = this.node.getChildByPath("titleCont/nameLab").getComponent(Label);
        this.proLab = this.node.getChildByPath("titleCont/proLab").getComponent(Label);
        this.awardList = this.node.getChildByName("awardList").getComponent(AutoScroller);
        this.goBtn = this.node.getChildByName("goBtn").getComponent(Button);
        this.getBtn = this.node.getChildByName("getBtn").addComponent(Button);
        this.finsh = this.node.getChildByName("finsh");
        this.awardList.SetHandle(this.updateAwardItem.bind(this));
        this.awardList.node.on('select', this.onSelect, this);
        this.goBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.getBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.isInit = true;
        this.updateShow();
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.goBtn:
                Goto(this.std.Win, ...this.std.Param);
                TaskPanel.Hide();
                break;
            case this.getBtn:
                Session.Send({type:MsgTypeSend.CompleteTask, data:{task_id: this.std.TaskId}}, MsgTypeRet.CompleteTaskRet);
                break;
        }
    }
    private updateAwardItem(item: Node, data: SThing) {
        let awardItem = item.getComponent(AwardItem);
        if (!awardItem) awardItem = item.addComponent(AwardItem);
        awardItem.SetData({ itemData: data });
    }
    protected async onSelect(index: number, item: Node) {
        let selectData = this.awList[index];
        if(selectData){
            ItemTips.Show(selectData);
        }
    }
    SetData(data:SPlayerDataTask) {
        this.data = data;
        this.updateShow();
    }

    private updateShow():void{
        if(!this.isInit || !this.data) return;
        this.goBtn.node.active = false;
        this.getBtn.node.active = false;
        this.finsh.active = false;
        
        this.std = CfgMgr.GetTaskById(this.data.id);
        this.nameLab.string = this.std.Description;
        this.proLab.string = `（${this.data.v}/${this.std.CompletionNum}）`;
        let colorStr:string = "#356DC0";
        if(this.data.v >= this.std.CompletionNum){
            colorStr = "#1D8E32";
            this.getBtn.node.active = true;
            if(this.data.s == STaskState.Finsh){
                this.finsh.active = true;
            }else{
                this.getBtn.node.active = true;
            }
        }else{
            this.goBtn.node.active = true;
        }
        
        this.proLab.color = new Color().fromHEX(colorStr);
        this.awList = ItemUtil.GetSThingList(this.std.RewardType, this.std.RewardID, this.std.RewardNumber);
        this.awardList.UpdateDatas(this.awList);
        
    }
}