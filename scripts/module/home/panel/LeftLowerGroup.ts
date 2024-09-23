import { Button, Component, Label, Node, RichText } from "cc";
import { AutoScroller } from "../../../utils/AutoScroller";
import { CfgMgr, StdMerge, StdMessag } from "../../../manager/CfgMgr";
import PlayerData, { SChannelMsgData, SPlayerDataTask, STaskState } from "../../roleModule/PlayerData";
import { MsgTypeRet, MsgTypeSend } from "../../../MsgType";
import { Session } from "../../../net/Session";
import { TaskPanel } from "../../task/TaskPanel";
import { EventMgr, Evt_ChannelMsgUpdate, Evt_TaskChange, Goto } from "../../../manager/EventMgr";
import { PANEL_TYPE } from "../../../manager/UIGuide";

export class LeftLowerGroup extends Component {
    private taskBg1: Node;//任务未完成底图
    private taskBg2: Node;//任务已完成底图
    private taskBtn: Button;//任务按钮
    private taskIcon: Button;//任务红点
    private taskRedNum: Label;//任务红点数
    private taskLab: Label;//任务文本
    private taskCancel: Node;//任务已完成勾

    private msgCont: Node;
    private aloneMsgCont: Node;
    private aloneMsgBtn: Button;
    private msgTitleLab: Label;
    private msgLab: Label;
    private allMsgCont: Node;
    private msgList: AutoScroller;
    private msgArrowBtn: Button;
    private msgIsStretch: boolean = false;
    private isInit: boolean = false;
    protected onLoad(): void {
        this.taskBtn = this.node.getChildByName("taskCont").getComponent(Button);
        this.taskBg1 = this.node.getChildByPath("taskCont/bg1");
        this.taskBg2 = this.node.getChildByPath("taskCont/bg2");
        this.taskIcon = this.node.getChildByPath("taskCont/icon").getComponent(Button);
        this.taskRedNum = this.node.getChildByPath("taskCont/redPoint/num").getComponent(Label);
        this.taskLab = this.node.getChildByPath("taskCont/lab").getComponent(Label);
        this.taskCancel = this.node.getChildByPath("taskCont/cancel");

        this.msgCont = this.node.getChildByPath("sysMsgCont");
        this.aloneMsgCont = this.node.getChildByPath("sysMsgCont/aloneMsgCont");
        this.aloneMsgBtn = this.node.getChildByPath("sysMsgCont/aloneMsgCont").getComponent(Button);
        this.msgTitleLab = this.node.getChildByPath("sysMsgCont/aloneMsgCont/titleLab").getComponent(Label);
        this.msgLab = this.node.getChildByPath("sysMsgCont/aloneMsgCont/msgLab").getComponent(Label);
        this.allMsgCont = this.node.getChildByPath("sysMsgCont/allMsgCont");
        this.msgList = this.node.getChildByPath("sysMsgCont/allMsgCont/msgList").getComponent(AutoScroller);
        this.msgArrowBtn = this.node.getChildByPath("sysMsgCont/allMsgCont/arrowBtn").getComponent(Button);
        this.msgList.SetHandle(this.updateMsgItem.bind(this));

        this.taskBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.msgArrowBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.aloneMsgBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.taskIcon.node.on(Button.EventType.CLICK, this.onBtnClick, this);

        EventMgr.on(Evt_TaskChange, this.onUpdateTask, this);
        EventMgr.on(Evt_ChannelMsgUpdate, this.onUpdateMsg, this);
        this.isInit = true;
        this.UpdateShow();
    }
    protected onEnable(): void {
        this.UpdateShow();
    }
    private onBtnClick(btn: Button): void {
        switch (btn) {
            case this.taskBtn:
                this.checkTask();
                break;
            case this.msgArrowBtn:
                this.msgIsStretch = false;
                this.updateMsgSate();
                break;
            case this.aloneMsgBtn:
                this.msgIsStretch = true;
                this.updateMsgSate();
                break;
            case this.taskIcon:
                Goto(PANEL_TYPE.TaskPanel);
                break;
        }
    }
    private onUpdateTask(): void {
        let stdMainTask = CfgMgr.getActiveTask();
        console.log(stdMainTask);
        if (!stdMainTask) {
            this.taskBtn.node.active = false;
            return;
        }
        this.taskBtn.node.active = true;
        let data: SPlayerDataTask = null
        if (PlayerData.roleInfo.tasks[stdMainTask.TaskId]) {
            data = PlayerData.roleInfo.tasks[stdMainTask.TaskId]
        } else {
            data = {
                id: stdMainTask.TaskId,
                v: 0,
                s: 1,
                lrt: 0,
            }
        }
        let stdTask = CfgMgr.GetTaskById(data.id);
        if (data.s != STaskState.Finsh && data.v >= stdTask.CompletionNum) {
            this.taskLab.string = `${stdTask.Description}(${data.v}/${stdTask.CompletionNum})`;
            this.taskBg1.active = false;
            this.taskBg2.active = true;
            this.taskCancel.active = true;
        } else {
            this.taskLab.string = `${stdTask.Description}(${data.v}/${stdTask.CompletionNum})`;
            this.taskBg1.active = true;
            this.taskBg2.active = false;
            this.taskCancel.active = false;
        }

    }
    private checkTask(): void {
        let stdMainTask = CfgMgr.getActiveTask();
        if (!stdMainTask) return;
        let data: SPlayerDataTask;
        if (PlayerData.roleInfo.tasks[stdMainTask.TaskId]) {
            data = PlayerData.roleInfo.tasks[stdMainTask.TaskId];
        } else {
            data = {
                id: stdMainTask.TaskId,
                v: 0,
                s: 1,
                lrt: 0,
            }
        }
        let stdTask = CfgMgr.GetTaskById(data.id);
        if (data.v >= stdTask.CompletionNum) {
            let info = {
                type: MsgTypeSend.CompleteTask,
                data: {
                    task_id: stdMainTask.TaskId
                }
            }
            Session.Send(info, MsgTypeRet.CompleteTaskRet);
        } else {
            // TaskPanel.Show();

            Goto(PANEL_TYPE.TaskPanel);
        }
    }
    private onUpdateMsg(): void {
        this.updateMsgSate();
    }
    private updateMsgSate(): void {
        let msgList: SChannelMsgData[] = PlayerData.GetChannelMsgList().concat().reverse();
        if (msgList.length) {
            this.msgCont.active = true;
            if (this.msgIsStretch) {
                this.allMsgCont.active = true;
                this.aloneMsgCont.active = false;
                this.msgList.UpdateDatas(msgList);
                this.msgList.ScrollToLast();
            } else {
                this.allMsgCont.active = false;
                this.aloneMsgCont.active = true;
                this.msgTitleLab.string = msgList[msgList.length - 1].title;
                this.msgLab.string = msgList[msgList.length - 1].cont;
            }
        } else {
            this.msgCont.active = false;
        }
    }
    private updateMsgItem(item: Node, data: SChannelMsgData) {
        let titleLab: Label = item.getChildByName("titleLab").getComponent(Label);
        let msgLab: RichText = item.getChildByName("msgLab").getComponent(RichText);
        titleLab.string = data.title;
        msgLab.string = data.cont;

    }
    public UpdateShow(): void {
        if (!this.isInit) return;
        this.onUpdateTask();
        this.updateMsgSate();
    }
}