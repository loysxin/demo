import { Button, Component, EditBox, EventTouch, Input, Label, Node, ProgressBar, RichText, ScrollView, Sprite, SpriteFrame, Toggle, UITransform, instantiate, path, sp, tween } from "cc";
import { Panel } from "../../GameRoot";
import { CfgMgr, ResourceType, StdCommonType, StdTask, ThingType } from "../../manager/CfgMgr";
import { RewardTips } from "../common/RewardTips";
import PlayerData, { STaskType, SPlayerData, SPlayerDataItem, SPlayerDataTask, STaskState, STaskShowType, SThing } from "../roleModule/PlayerData";
import { BagItem } from "../bag/BagItem";
import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { Tips } from "../login/Tips";
import { EventMgr, Evt_TaskChange } from "../../manager/EventMgr";

export class SignPanel extends Panel {
    protected prefab: string = "prefabs/task/SignPanel";

    private layout:Node;
    private day7:Node;
    private signBtn:Button;
    private label:Label;
    private Layout:Node;
    private item:Node;
   

    private taskData:SPlayerDataTask[]
    private reward_data:SThing[][] = []
    private select_index:number = 1;
    private day:number[] = [];
    private is_first = false;
    private first_select_index = 0;
    private send_index = null;




    protected onLoad() {
        this.CloseBy("mark");
        this.layout = this.find("layout");
        this.day7 = this.find("day7");
        this.Layout = this.find("day7/Layout");
        this.item = this.find("day7/Layout/item");
        this.label = this.find("label",Label);
        this.signBtn = this.find("signBtn",Button);
        this.signBtn.node.on("click",this.onGetReward, this);
        this.day7.on(Input.EventType.TOUCH_START, this.check,this);
    }

  

    protected onShow(): void {
        EventMgr.on(Evt_TaskChange, this.flush, this);
    }

    public flush(index?: number): void {
        let task_all_data = PlayerData.roleInfo.tasks;
        let task_Data:SPlayerDataTask[] = [];
        this.day = [];
        this.is_first = false;
        let sign_day = 0;
        for (const key in task_all_data) {
            if (Object.prototype.hasOwnProperty.call(task_all_data, key)) {
                const element = task_all_data[key];
                let stdTask = CfgMgr.GetTaskById(element.id);
                if (stdTask && stdTask.TaskType == STaskType.dayliyLogin) {
                    sign_day = element.v;
                    task_Data.push(element);
                }
            }
        }

        if(sign_day == 0){
            sign_day = 1;
        }
        let loop_num = Math.ceil(sign_day / 7);
        this.taskData = [];
        this.reward_data = [];
        for (let index = 1; index <= 7; index++) {
            let day = index + 7 * (loop_num - 1)
            this.day.push(day)
            let id =  500100 + day;
          for (const iterator of task_Data) {
            if(iterator.id == id){
                let data:SThing[] = CfgMgr.getTaskRewardThings(id)
                this.reward_data.push(data);
                this.taskData.push(iterator);
            }
          }
        }
       
        if(this.taskData.length == 0) return;
        for (let index = 0; index < this.layout.children.length; index++) {
            const node = this.layout.children[index];
            node.off(Input.EventType.TOUCH_END,this.check,this);
            node.on(Input.EventType.TOUCH_END,this.check,this);
            node.getChildByName("label").getComponent(Label).string = "第" + this.day[index] + "天";
            if(node){
                if(this.taskData[index].s == STaskState.Finsh){
                    node.getChildByName("sign").active = true;
                    node.getChildByName("sign_mask").active = true;
                }else{
                    if(!this.is_first){
                        this.is_first = true;
                        this.first_select_index = index;
                    }
                    node.getChildByName("sign").active = false;
                    node.getChildByName("sign_mask").active = false;
                }
                let item = node.children[0];
                let bagItem = item.getComponent(BagItem);
                if(!bagItem) bagItem = item.addComponent(BagItem);
                bagItem.SetData(this.reward_data[index][0])
                bagItem.setIsShowSelect(false);
                bagItem.setIsShowTips(true);
            }
        }

        this.Layout.removeAllChildren();
        for (let index = 0; index < this.reward_data[6].length; index++) {
            const element = this.reward_data[6][index];
            let item = instantiate(this.item);  
            item.getChildByName("sign").active = this.taskData[6].s == STaskState.Finsh;
            let bagItem = item.getComponent(BagItem);
            if(!bagItem) bagItem = item.addComponent(BagItem);
            bagItem.SetData(element)
            bagItem.setIsShowSelect(false);
            bagItem.setIsShowTips(true);
            this.Layout.addChild(item);
        }
        this.day7.getChildByName("sign_mask").active = this.taskData[6].s == STaskState.Finsh;
        this.day7.getChildByName("label").getComponent(Label).string = "第" + this.day[6] + "天";

        if(!this.is_first){
            this.first_select_index = 6;
        }
        this.setSelectData(this.first_select_index);
    }

    private check(even: EventTouch){
        let node = even.currentTarget;
        let index = 0;
        switch (node.name) {
            case "day1":
                index = 0;
                break;
            case "day2":
                index = 1;
                break;
            case "day3":
                index = 2;
                break;
            case "day4":
                index = 3;
                break;
            case "day5":
                index = 4;
                break;
            case "day6":
                index = 5;
                break;
            case "day7":
                index = 6;
                break;
            default:
                break;
        }
       
        this.setSelectData(index);
    }

    private setSelectData(index){
        for (let i = 0; i < this.layout.children.length; i++) {
            this.layout.children[i].getChildByName("select").active = false;  
        }       
        this.day7.getChildByName("select").active = index == 6;  

        this.select_index = index;
        if(index < 6){
            this.layout.children[index].getChildByName("select").active = true;
        }
        let stdTask = CfgMgr.GetTaskById(this.taskData[index].id);
        if(this.taskData[index].v >= stdTask.CompletionNum ){
            if(this.taskData[index].s == STaskState.unFinsh){
                this.signBtn.node.active = true;
                this.label.node.active = false;
                this.signBtn.node.getChildByName("Label").getComponent(Label).string = "签到领奖"
            }else{
                this.signBtn.node.active = false;
                this.label.node.active = true;
                this.label.string = "已领取"
            }
        }else{
            this.signBtn.node.active = false;
            this.label.node.active = true;
            let day = this.taskData[index].id - 500100;
            this.label.string = "登录" + day + "天可领取"
        }
    }

    

    

    private onGetReward(even: EventTouch) {
        // console.log(even)
        // let index = even.currentTarget.getSiblingIndex();
        // console.log(index)
    //     //一键领取
    //     for (let index = 0; index < this.taskData.length; index++) {
    //         const element = this.taskData[index];
    //         let stdTask = CfgMgr.GetTaskById(this.taskData[index].id);
    //         if(this.taskData[index].v >= stdTask.CompletionNum && this.taskData[index].s == STaskState.unFinsh){
    //             let info = {
    //                 type: MsgTypeSend.CompleteTask,
    //                 data: {
    //                     task_id: this.taskData[index].id
    //                 }
    //             }
    //             Session.Send(info, MsgTypeRet.CompleteTaskRet);
    //         }
    //    }

    
        this.send_index = this.select_index
        let info = {
            type: MsgTypeSend.CompleteTask,
            data: {
                task_id: this.taskData[this.send_index].id
            }
        }
        Session.Send(info, MsgTypeRet.CompleteTaskRet);
        
    }

   

    protected onHide(...args: any[]): void {
        this.is_first = false;
        this.first_select_index = 0;
        this.send_index = null;
        EventMgr.off(Evt_TaskChange, this.flush, this);
    }


}
