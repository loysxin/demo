import { Button, EventTouch, Input, Label, Layout, Node, Prefab, SH, ScrollView, Slider, Toggle, UIOpacity, UITransform, Vec3, instantiate, v3 } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { STaskType, SGetAgentInfo, SGetIncomes, SIncomesInfo, SPlayerDataItem, SPlayerDataTask, STaskState, STaskShowType, SThing } from "../roleModule/PlayerData";
import { FriendHelpItem } from "./FriendHelpItem";
import { CfgMgr, StdCommonType, StdRole } from "../../manager/CfgMgr";
import { Session } from "../../net/Session";
import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_GetIncommons, Evt_SetAssistRole, Evt_TaskChange } from "../../manager/EventMgr";
import { GameSet } from "../GameSet";
import { Convert, ToFixed } from "../../utils/Utils";
import { AutoScroller } from "../../utils/AutoScroller";
import { BagItem } from "../bag/BagItem";
import { Tips } from "../login/Tips";

export class FriendHelpPanel extends Panel {
    protected prefab: string = "prefabs/panel/friend/FriendHelpPanel";

    private assistNode: Node;
    private Layout: Node;
    private item: Node;
    private left: Node;
    private right: Node;
    private page_lbl: Label;
    private navBtns: Node[];
    private page1: Node;
    private Slider: Slider;
    private itemNode: Node;
    private item0: Node;
    private help_num: Label;
    private rewardBtn: Node;
    private reward_num: Label;
    
    private fanyuNode: Node;
    private reward_items:Node;
    protected scroller: ScrollView;
    private progress:Node;
    
    private maxPage: number = 1
    private curPage: number = 1;
    private pageSize: number = 2;
    private page: number
    private datas = [];
    private canGetId = [];
    private assistIncom: number = 0;
    private is_show = false;
    private info: SGetAgentInfo;




    protected onLoad(): void {
        this.CloseBy("mask");
        this.CloseBy("frame/closeBtn");
        this.rewardBtn = this.find("frame/assistNode/banner/rewardBtn");
        this.reward_num = this.node.getChildByPath("frame/assistNode/banner/rewardBtn/reward_num").getComponent(Label);
        this.assistNode = this.find("frame/assistNode");
        this.Layout = this.find("frame/assistNode/Layout");
        this.item = this.find("frame/assistNode/Layout/FriendHelpItem");
        this.left = this.node.getChildByPath("frame/assistNode/pageBg/left");
        this.right = this.node.getChildByPath("frame/assistNode/pageBg/right");
        this.page_lbl = this.node.getChildByPath("frame/assistNode/pageBg/page_lbl").getComponent(Label);
        this.help_num = this.node.getChildByPath("frame/fanyuNode/banner/lblNode/help_num").getComponent(Label);
        this.page1 = this.node.getChildByPath("frame/fanyuNode/ScrollView/view/content/page1")
        this.Slider = this.find("frame/fanyuNode/ScrollView/view/content/page1/Slider",Slider)
        this.progress = this.node.getChildByPath("frame/fanyuNode/ScrollView/view/content/page1/Slider/progress")
        

        this.fanyuNode = this.find("frame/fanyuNode");
        this.itemNode = this.node.getChildByPath("frame/fanyuNode/ScrollView/view/content/page1/itemNode");
        this.item0 = this.node.getChildByPath("frame/fanyuNode/ScrollView/view/content/page1/itemNode/item0");
        this.reward_items = this.node.getChildByPath("frame/fanyuNode/reward_items");
        this.reward_items.on(Input.EventType.TOUCH_END,this.onScroller, this);  
        
        this.navBtns = this.find("frame/nav").children.concat();
        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }
        this.left.on(Input.EventType.TOUCH_END, () => {
            if (this.curPage > 1) {
                this.curPage--;
                this.steItemData();
            }
        })

        this.right.on(Input.EventType.TOUCH_END, () => {
            this.curPage++;
            if (this.curPage <= this.maxPage) {
                this.steItemData();
            } else {
                this.curPage--;
            }
        })

        this.rewardBtn.on(Input.EventType.TOUCH_END, this.getReward, this)
        EventMgr.on(Evt_SetAssistRole, this.updateItem, this);
        // Session.on(MsgTypeRet.UnlockAssistRoleSlotRet, this.unlockPos, this);
        Session.on(MsgTypeRet.SetAssistRoleUsageFeeRet, this.SetAssistRoleUsageFee, this);
        EventMgr.on(Evt_TaskChange, this.updateFanyuPage, this);
        Session.on(MsgTypeRet.CollectAssistIncomeRet, this.updateAssistIncom, this);
        EventMgr.on(Evt_GetIncommons, this.flush, this)
    }

    protected onShow(): void {
    }

    async flush(info: SGetAgentInfo) {
        this.info = info;
        this.seRoletAssistData();
        this.setFanyuAssistData();
        this.updateAssistLabelCoun();
        this.SetPage(0);
    }

    
    private seRoletAssistData(){
        let info = this.info;
        let assistHelpData = []
        let cfg = CfgMgr.GetCommon(StdCommonType.Friend);
        let lock = cfg.FieldUnlock
        for (let i = 0; i < lock.length; i++) {
            let data = { islock: false, lockCost: 0, all_unlock_coun: 0, assistInfo: null, role: null };
            data.all_unlock_coun = i;
            //解锁
            if (info && info.assist_roles_slots && i < info.assist_roles_slots) {
                for (let index = 0; index < info.assist_roles_slots; index++) {
                    //有解锁的数量          
                    data.islock = true;
                    if (info.assist_roles && info.assist_roles[index] && i == info.assist_roles[index].slot) {
                        //已解锁有角色
                        data.assistInfo = info.assist_roles[index];
                        data.role = info.role_data_list[index];
                        break;
                    } else {
                        //已解锁未有角色
                        data.role = null;
                        data.assistInfo = {
                            role_id: "",
                            player_id: "",
                            slot: i,
                            usage_fee: 0,
                            battle_power: 0,
                            daily_assist_count: 0,
                            daily_income: 0,
                        }
                    }
                }
            } else {
                //未解锁
                data.islock = false;
                data.lockCost = lock[i];
                data.role = null;
                data.assistInfo = {
                    role_id: "",
                    player_id: "",
                    slot: i,
                    usage_fee: 0,
                    battle_power: 0,
                    daily_assist_count: 0,
                    daily_income: 0,
                }
            }
            assistHelpData.push(data);
        }
        if(!this.datas[0]){
            this.datas.push(assistHelpData);
        }else{
            this.datas[0] = assistHelpData;
        }
    }

    private setFanyuAssistData(){
        let info = this.info;
        let fanyuHelpData = []
        let task_data = PlayerData.roleInfo.tasks;
        for (const key in task_data) {
            if (Object.prototype.hasOwnProperty.call(task_data, key)) {
                const element = task_data[key];
                let stdTask = CfgMgr.GetTaskById(element.id);
                if (stdTask && stdTask.Show == STaskShowType.friend) {
                    if (stdTask.TaskType == STaskType.fanyuHelp) {
                        fanyuHelpData.push(element);
                        if (element.v >= stdTask.CompletionNum && element.s == STaskState.unFinsh) {
                            this.canGetId.push(element.id)
                        }
                    }
                }
            }
        }
        if(!this.datas[1]){
            this.datas.push(fanyuHelpData);
        }else{
            this.datas[1] = fanyuHelpData;
        }
    }

    async SetPage(page: number) {
        if (!this.$hasLoad) await this.initSub;
        if (!this.navBtns[page]) return;
        this.page = undefined;
        this.navBtns[page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[page].getComponent(Toggle));
    }

    private onPage(toggle: Toggle) {
        let page = this.navBtns.indexOf(toggle.node);
        if (page < 0 || page == this.page) return;
        this.page = page;
        this.assistNode.active = false;
        this.fanyuNode.active = false;
        switch (this.page) {
            case 0:
                this.assistNode.active = true;
                let maxCount = this.datas[0].length;
                this.maxPage = Math.ceil(maxCount / this.pageSize)
                this.page_lbl.string = this.curPage + "/" + (this.maxPage == 0 ? 1 : this.maxPage);
                this.steItemData();
                break;
            case 1:
                this.reward_items.active = this.is_show;
                let SpacingX = 240
                let data = this.datas[1];
                this.fanyuNode.active = true;
                this.page1.getComponent(UITransform).width = data.length * SpacingX;
                this.Slider.node.getComponent(UITransform).width = data.length * SpacingX;
                this.help_num.string = data[0].v + ""
                this.itemNode.removeAllChildren();
                let count = data.length;
                let unlock_num = 0;
                for (let index = 0; index < count; index++) {
                    let box = instantiate(this.item0);
                    box.position = new Vec3(SpacingX * (index + 1) - 20, -80, 0);
                    let cfg = CfgMgr.GetTaskById(data[index].id);
                    let CompletionNum = box.getChildByName("CompletionNum").getComponent(Label);
                    CompletionNum.string = "已协作" + cfg.CompletionNum + "次";

                    let item_unlock = box.getChildByName("unlock");
                    let item_get = box.getChildByName("get");
                    item_unlock.active = cfg.CompletionNum > data[index].v;
                    if(cfg.CompletionNum <= data[index].v){
                        unlock_num++;
                    }
                    item_get.active = data[index].s == STaskState.Finsh
                    this.itemNode.addChild(box);
                }
                // let size = this.Slider.getComponent(UITransform).contentSize;
                this.progress.getComponent(UITransform).setContentSize(unlock_num * SpacingX, 28);
                for (let index = 0; index < this.itemNode.children.length; index++) {
                    const element = this.itemNode.children[index];
                    element.off(Input.EventType.TOUCH_END)
                    element.on(Input.EventType.TOUCH_END, this.onItem, this);   
                }
                break;
            default:
                break;
        }
    }

    //---------------------------角色助战相关-------------------------------------
    private getReward() {
        if(this.assistIncom){
            let info = {
                type: MsgTypeSend.CollectAssistIncomeRequest,
                data: { amount: this.assistIncom }
            }
            Session.Send(info);
        }else{
            Tips.Show("暂无奖励领取")
        }
    }

    private steItemData() {
        this.page_lbl.string = this.curPage + "/" + (this.maxPage == 0 ? 1 : this.maxPage);
        let data = [];
        let i = this.curPage * this.pageSize;
        for (let index = 0; index < this.pageSize; index++) {
            const element = this.datas[0][--i]
            if (element) {
                data.unshift(element)
            }
        }
        if (data.length > 0) {
            this.Layout.removeAllChildren();
            for (let index = 0; index < data.length; index++) {
                let node = instantiate(this.item)
                let item_node = node.getComponent(FriendHelpItem);
                if (!item_node) item_node = node.addComponent(FriendHelpItem);
                item_node.setData(data[index], this.info);
                this.Layout.addChild(node);
            }
        }
    }

    //助战或者取消助战后刷新数据
    private updateItem(data: { fee: number, role_id: string, slot: number }) {
        if(!this.datas || !this.datas[0]) return;
        let pos = (data.slot % 2 == 0) ? 0 : 1
        for (let index = 0; index < this.datas[0].length; index++) {
            const element = this.datas[0][index];
            if (index == data.slot && element) {
                element.assistInfo.usage_fee = data.fee;
                element.assistInfo.slot = data.slot;
                if (data.role_id) {
                    element.role = PlayerData.GetRoleById(data.role_id);
                } else {
                    element.role = null;
                }
                let node = this.Layout.children[pos];
                let item_node = node.getComponent(FriendHelpItem);
                if (!item_node) item_node = node.addComponent(FriendHelpItem);
                item_node.setData(element, this.info);
            }
        }
    }

    // //解锁刷新数据
    // private unlockPos(data: { new_slot_count: number }) {
    //     //解锁数量比位置少一
    //     let pos = (data.new_slot_count % 2 == 0) ? 1 : 0
    //     let slot = data.new_slot_count - 1;
    //     for (let index = 0; index < this.datas[0].length; index++) {
    //         const element = this.datas[0][index];
    //         if (element && element.assistInfo.slot == slot) {
    //             element.islock = true;

    //             let node = this.Layout.children[pos];
    //             let item_node = node.getComponent(FriendHelpItem);
    //             if (!item_node) item_node = node.addComponent(FriendHelpItem);
    //             item_node.setData(element);
    //         }
    //     }
    // }

    /**设置助战费用后刷新数据 */
    private SetAssistRoleUsageFee(data:{role_id:string, usage_fee:number}) {
        for (let index = 0; index < this.datas[0].length; index++) {
            const element = this.datas[0][index];
            if (element && element.assistInfo && element.assistInfo.role_id == data.role_id) {
                element.assistInfo.usage_fee = data.usage_fee;
                break;
            }
        }
    }
    //---------------------------------
    //-----------------------------繁育相关--------------------------- /
    private onItem(event:EventTouch){
        let node = event.currentTarget;
        let index = node.getSiblingIndex();  
        if(node.getChildByName("unlock").active){
            let p = node.position;
            let [x, y] = Convert(p.x, p.y, node.parent, this.fanyuNode);
            this.reward_items.active = true
            this.reward_items.setPosition(x, y + node.getComponent(UITransform).height / 2);
            

            let datas = CfgMgr.getTaskRewardThings(this.datas[1][index].id);
            let itemLayout = this.reward_items.getChildByPath(`Node/ScrollView`).getComponent(AutoScroller);
            itemLayout.SetHandle(this.UpdateBagItem.bind(this));
            itemLayout.UpdateDatas(datas);
        }else{
            if(this.datas[1][index].s == STaskState.unFinsh){
                let info = {
                    type: MsgTypeSend.CompleteTask,
                    data: {
                        task_id: this.datas[1][index].id
                    }
                }
                Session.Send(info, MsgTypeRet.CompleteTaskRet);
            }else{
                Tips.Show("已领取")
            }
        }
    }

    private UpdateBagItem(item: Node, data: SThing) {
        let bagItem = item.getComponent(BagItem);
        if (!bagItem) bagItem = item.addComponent(BagItem);
        bagItem.SetData(data);
        bagItem.setIsShowSelect(false);
        bagItem.setIsShowTips(true);
        item.getComponent(Toggle).enabled = false;
        // item.getChildByName(`name`).active = false;
    }

    private onScroller(){
        this.reward_items.active = false;
    }

    private updateFanyuPage(){
        this.setFanyuAssistData();
        this.SetPage(1);
    }

    private updateAssistLabelCoun(){
        if (this.info && this.info.total_assist_income){
            this.assistIncom = this.info.total_assist_income;
        }else{
            this.assistIncom = 0;
        }
        let shownum = ToFixed(this.assistIncom, 2);
        this.reward_num.string = shownum;
    }

    private updateAssistIncom(){   
        this.assistIncom = 0;
        let shownum = ToFixed(this.assistIncom, 2);
        this.reward_num.string = shownum;
    }

    protected onHide(...args: any[]): void {
        this.datas = [];
        this.canGetId = [];
        EventMgr.off(Evt_TaskChange, this.updateFanyuPage, this);
        for (let index = 0; index < this.Layout.children.length; index++) {
            const element = this.Layout.children[index];
            let item_node = element.getComponent(FriendHelpItem);
            item_node.clearTime();
        }
    }
}