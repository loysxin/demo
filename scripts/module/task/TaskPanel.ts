import { Label, Node, Toggle, Widget, Vec3} from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { EventMgr, Evt_Hide_Scene, Evt_NextDay, Evt_Show_Scene, Evt_TaskChange, Evt_TaskShowBoxTips } from "../../manager/EventMgr";
import { ActiveTaskCont } from "./ActiveTaskCont";
import { MainTaskCont } from "./MainTaskCont";
import PlayerData, { SPlayerDataTask, STaskState, STaskType, SThing } from "../roleModule/PlayerData";
import { CfgMgr, StdTask } from "../../manager/CfgMgr";
import { TaskItem } from "./TaskItem";
import { DateUtils } from "../../utils/DateUtils";
import { TaskActiveBoxTipsCont } from "./TaskActiveBoxTipsCont";
import { ItemUtil } from "../../utils/ItemUtils";
import { ClickTipsPanel } from "../common/ClickTipsPanel";
enum TaskTabType {
    Page_Daily,//每日任务
    Page_Week,//每周任务
    Page_Achieve,//成就任务
};
export class TaskPanel extends Panel {
    protected prefab: string = "prefabs/task/TaskPanel";
    private navBtns:Node[];
    private activeTaskCont:ActiveTaskCont;
    private mainTaskCont:MainTaskCont;
    private taskList: AutoScroller;
    private noneListCont:Node;
    private timeCont:Node;
    private timeLab: Label;
    private activeBoxTips:TaskActiveBoxTipsCont;
    private page:number;
    private listWidget:Widget;
    private listViewWidget:Widget;
    private dayActiveTaskList:SPlayerDataTask[];//每日活跃任务
    private weekActiveTaskList:SPlayerDataTask[];//每周活跃任务
    private dayTaskList:SPlayerDataTask[];//每日任务
    private weekTaskList:SPlayerDataTask[];//每周任务
    private achieveTaskList:SPlayerDataTask[];//成就任务
    private curMainTask:SPlayerDataTask;//当前主线任务
    private dayCurAcNum:number = 0;
    private dayMaxAcNum:number = 0;
    private weekCurAcNum:number = 0;
    private weekMaxAcNum:number = 0;
    protected onLoad() {
        this.navBtns = this.find("navBar/view/content").children.concat();
        this.activeTaskCont = this.find("activeTaskCont").addComponent(ActiveTaskCont);
        this.mainTaskCont = this.find("mainTaskCont").addComponent(MainTaskCont);
        this.taskList = this.find("taskList", AutoScroller);
        this.listWidget = this.taskList.node.getComponent(Widget);
        this.listViewWidget = this.taskList.node.getChildByPath("view").getComponent(Widget);
        this.noneListCont = this.find("noneListCont");
        this.timeCont = this.find("timeCont");
        this.timeLab = this.find("timeCont/timeLab").getComponent(Label);
        this.activeBoxTips = this.find("activeBoxTips").addComponent(TaskActiveBoxTipsCont);
        this.taskList.SetHandle(this.updateTaskItem.bind(this));
        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }
        this.CloseBy("closeBtn");
    }

    protected update(dt: number): void {
        if(this.page == TaskTabType.Page_Achieve){
            this.timeCont.active = false;
        }else{
            this.timeCont.active = true;
            if(this.page == TaskTabType.Page_Daily){
                this.timeLab.string = `下次刷新:${DateUtils.getTimeToNextDay()}`;
            }else if(this.page == TaskTabType.Page_Week){
                this.timeLab.string = `下次刷新:${DateUtils.getTimeToNextWeek()}`;
            }
        }
    }
    protected onShow(): void {
        EventMgr.on(Evt_TaskChange, this.onUpdateTask, this);
        EventMgr.on(Evt_NextDay, this.onUpdateTask, this);
        EventMgr.on(Evt_TaskShowBoxTips, this.onShowBoxTips, this);
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
    }

    async SetPage(page: number) {
        if (!this.$hasLoad) await this.initSub;
        if (!this.navBtns[page]) return;
        this.page = undefined;
        this.navBtns[page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[page].getComponent(Toggle));
    }
    public flush(page?: TaskTabType): void{
        this.SetPage(page || TaskTabType.Page_Daily);
    }
    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_TaskChange, this.onUpdateTask, this);
        EventMgr.off(Evt_NextDay, this.onUpdateTask, this);
        EventMgr.off(Evt_TaskShowBoxTips, this.onShowBoxTips, this);
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
        
    }

    private onPage(t: Toggle):void{
        if (!t.isChecked) return;
        let page = this.navBtns.indexOf(t.node);
        if (page < 0 || page == this.page) return;
        this.page = page;
        this.updateTaskList(true);
    }
    private onUpdateTask():void{
        this.updateTaskList();
    }
    private updateTaskList(isToHead:boolean = false):void{
        let datas:SPlayerDataTask[];
        let listTop:number = 550;
        this.activeTaskCont.node.active = false;
        this.mainTaskCont.node.active = false;
        switch (this.page) {
            case TaskTabType.Page_Daily: // 每日任务
                this.filtrDayTask();
                this.activeTaskCont.node.active = true;
                this.activeTaskCont.SetData(1, this.dayActiveTaskList, this.dayCurAcNum, this.dayMaxAcNum);
                datas = this.dayTaskList;
                break;
            case TaskTabType.Page_Week: // 每周任务
                this.filtrWeekTask();
                this.activeTaskCont.node.active = true;
                this.activeTaskCont.SetData(2, this.weekActiveTaskList, this.weekCurAcNum, this.weekMaxAcNum);
                datas = this.weekTaskList;
                break;
            case TaskTabType.Page_Achieve: // 成就任务
                this.filtrAchieveTask();
                listTop = 620;
                this.mainTaskCont.node.active = true;
                this.mainTaskCont.SetData(this.curMainTask);
                datas = this.achieveTaskList;
                break;
        }
        
        this.listWidget.top = listTop;
        this.listWidget.updateAlignment();
        this.listViewWidget.updateAlignment();
        switch (this.page) {
            case TaskTabType.Page_Daily: // 每日任务
                datas = this.dayTaskList;
                break;
            case TaskTabType.Page_Week: // 每周任务
                datas = this.weekTaskList;
                break;
            case TaskTabType.Page_Achieve: // 成就任务
                datas = this.achieveTaskList;
                break;
        }
        this.noneListCont.active = datas.length <= 0; 
        this.taskList.UpdateDatas(datas);
        if(isToHead) this.taskList.ScrollToHead();
    }
    //筛选每日任务 每日活跃度
    private filtrDayTask():void{
        let taskData:SPlayerDataTask;
        let stdTask:StdTask;
        this.dayActiveTaskList = [];
        this.dayTaskList = [];
        let dayTaskGet = [];
        this.dayCurAcNum = 0;
        this.dayMaxAcNum = 0;
        for (let key in PlayerData.roleInfo.tasks) {
            taskData = PlayerData.roleInfo.tasks[key];
            stdTask = CfgMgr.GetTaskById(taskData.id);
            if (stdTask) {
                if(stdTask.TaskType == STaskType.dayTask){
                    if(taskData.v >= stdTask.CompletionNum){
                        if(taskData.s == STaskState.unFinsh){
                            dayTaskGet.push(taskData);
                        }else if(taskData.s == STaskState.Finsh){
                            this.dayCurAcNum += stdTask.ActiveTaskValue | 0;
                        }
                    }else{
                        this.dayTaskList.push(taskData);
                    }
                    
                }else if(stdTask.TaskType == STaskType.dayActive){
                    this.dayMaxAcNum = stdTask.CompletionNum;
                    this.dayActiveTaskList.push(taskData);
                }
            }
        }
        this.dayTaskList = dayTaskGet.concat(this.dayTaskList);
    }
    //筛选每周任务 每周活跃度
    private filtrWeekTask():void{
        let taskData:SPlayerDataTask;
        let stdTask:StdTask;
        this.weekActiveTaskList = [];
        this.weekTaskList = [];
        let weekTaskGet = [];
        this.weekCurAcNum = 0;
        this.weekMaxAcNum = 0;
        for (let key in PlayerData.roleInfo.tasks) {
            taskData = PlayerData.roleInfo.tasks[key];
            stdTask = CfgMgr.GetTaskById(taskData.id);
            if (stdTask) {
                if(stdTask.TaskType == STaskType.weekTask){
                    if(taskData.v >= stdTask.CompletionNum){
                        if(taskData.s == STaskState.unFinsh){
                            weekTaskGet.push(taskData);
                        }else if(taskData.s == STaskState.Finsh){
                            this.weekCurAcNum += stdTask.WeekActiveTaskValue | 0;
                        }
                    }else{
                        this.weekTaskList.push(taskData);
                    }
                    
                }else if(stdTask.TaskType == STaskType.weekActive){
                    this.weekMaxAcNum = stdTask.CompletionNum;
                    this.weekActiveTaskList.push(taskData);
                }
            }
        }
        this.weekTaskList = weekTaskGet.concat(this.weekTaskList);
    }
    //筛选成就任务 主线任务
    private filtrAchieveTask():void{
        let taskData:SPlayerDataTask;
        let stdTask:StdTask;
        this.achieveTaskList = [];
        let mainTaskList = [];
        let achieveTaskGet = [];
        let groupMap:object = {};
        this.curMainTask = null;
        for (let key in PlayerData.roleInfo.tasks) {
            taskData = PlayerData.roleInfo.tasks[key];
            stdTask = CfgMgr.GetTaskById(taskData.id);
            if (stdTask) {
                if(stdTask.ShowTask > 0){
                    mainTaskList.push(taskData);
                    if(taskData.s == STaskState.unFinsh && !this.curMainTask){
                        this.curMainTask = taskData;
                    }
                }else if(stdTask.TaskType == STaskType.achieveTask){
                    let isPush:boolean = true;
                    //同组只显示一个
                    if(stdTask.TasksGroup > 0){
                        if(taskData.s == STaskState.unFinsh){
                            if(!groupMap[stdTask.TasksGroup]){
                                groupMap[stdTask.TasksGroup] = stdTask.TasksGroup;
                                if(taskData.v >= stdTask.CompletionNum){
                                    achieveTaskGet.push(taskData);
                                }else{
                                    this.achieveTaskList.push(taskData);
                                }
                               
                            }
                            
                        }
                    }else{
                        if(taskData.s == STaskState.unFinsh){
                            achieveTaskGet.push(taskData);
                        }else{
                            this.achieveTaskList.push(taskData);
                        }
                        
                    }
                    
                }
            }
        }
        if(!this.curMainTask) this.curMainTask = mainTaskList[mainTaskList.length - 1];
        this.achieveTaskList = achieveTaskGet.concat(this.achieveTaskList);
    }
    private updateTaskItem(item: Node, data: SPlayerDataTask):void{
        let taskItem = item.getComponent(TaskItem);
        if (!taskItem) taskItem = item.addComponent(TaskItem);
        taskItem.SetData(data);
    }
    private onShowBoxTips(std:StdTask, showPos:Vec3, clickTarget:Node):void{
        let list:SThing[] = ItemUtil.GetSThingList(std.RewardType, std.RewardID, std.RewardNumber);
        this.activeBoxTips.SetData(list);
        ClickTipsPanel.Show(this.activeBoxTips.node, this.node, clickTarget, showPos, 0);
                
    }
}
