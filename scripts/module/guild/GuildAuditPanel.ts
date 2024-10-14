import { Node } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { GuildAuditItem } from "./GuildAuditItem";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import PlayerData, { SGuildApplication } from "../roleModule/PlayerData";
import { EventMgr, Evt_GuildAuditResult, Evt_GuildAuditUpdate, Evt_GuildChange } from "../../manager/EventMgr";



export class GuildAuditPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildAuditPanel";
    private list: AutoScroller;
    private noneListCont:Node;
    private datas:SGuildApplication[] = [];
    protected onLoad(): void {
        this.list = this.find("list", AutoScroller);
        this.list.SetHandle(this.updateItem.bind(this));
        this.noneListCont = this.find("noneListCont");
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    public flush(): void{
      
    }
    
    protected onShow(): void {
        this.datas = [];
        Session.Send({ type: MsgTypeSend.GuildGetApplications, data: {guild_id:PlayerData.MyGuild.guild_id} });
        EventMgr.on(Evt_GuildAuditUpdate, this.onUpdateApply, this);
        EventMgr.on(Evt_GuildAuditResult, this.onApplyResult, this);
        EventMgr.on(Evt_GuildChange, this.onGuildChange, this);
    }

    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_GuildAuditUpdate, this.onUpdateApply, this);
        EventMgr.off(Evt_GuildAuditResult, this.onApplyResult, this);
        EventMgr.off(Evt_GuildChange, this.onGuildChange, this);
    }
    private onGuildChange():void{
        if(!this.node.activeInHierarchy) return;
        if(!PlayerData.MyGuild){
            this.Hide();
        }
    }
    private onUpdateApply(list:SGuildApplication[]):void{
        if(!this.node.activeInHierarchy) return;
        this.datas = list || [];
        this.updateShow();
    }
    private onApplyResult(is_permit:boolean, applications_ids:string[], failed_applications_ids:string[], playerIdList?:string[]):void{
        if(!this.node.activeInHierarchy) return;
        this.removeApplyData(applications_ids, "_id");
        this.removeApplyData(failed_applications_ids, "_id");
        this.removeApplyData(playerIdList, "player_id");
        this.updateShow();
    }
    private removeApplyData(list:string[], key:string):void{
        let applyData:SGuildApplication;
        if(list && list.length > 0){
            for (let index = 0; index < list.length; index++) {
                for (let i = 0; i < this.datas.length; i++) {
                    applyData = this.datas[index];
                    if(applyData[key] == list[index]){
                        this.datas.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }
    private updateShow():void{
        this.list.UpdateDatas(this.datas);
        this.noneListCont.active = this.datas.length < 1;
    }
    protected updateItem(item: Node, data: SGuildApplication) {
        let auditItem = item.getComponent(GuildAuditItem);
        if (!auditItem) auditItem = item.addComponent(GuildAuditItem);
        auditItem.SetData(data);
    }
}