import { Button, Label, Node, ProgressBar } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { GuildAuditItem } from "./GuildAuditItem";
import { ConsumeItem } from "../common/ConsumeItem";
import { GuildPrivilegeItem } from "./GuildPrivilegeItem";
import { GuildDonateItem } from "./GuildDonateItem";
import { EventMgr, Evt_GuildChange } from "../../manager/EventMgr";
import PlayerData from "../roleModule/PlayerData";



export class GuildDonatePanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildDonatePanel";
    private timeLab:Label;
    private lvLab:Label;
    private expBar:ProgressBar;
    private privilegeList: AutoScroller;
    private donateItem:ConsumeItem;
    private donatePersonNumLab:Label;
    private donateNumBtn:Button;
    private list:AutoScroller;
    private donateNumLab:Label;
    protected onLoad(): void {
        this.timeLab = this.find("timeLab", Label);
        this.lvLab = this.find("lvLab", Label);
        this.expBar = this.find("expBar", ProgressBar);
        this.privilegeList = this.find("privilegeList", AutoScroller);
        this.privilegeList.SetHandle(this.updatePrivilegeItem.bind(this));
        this.donateItem = this.find("donateItem").addComponent(ConsumeItem);
        this.donatePersonNumLab = this.find("donatePersonNumLab").getComponent(Label);
        this.donateNumBtn = this.find("donateNumBtn", Button);
        this.list = this.find("list", AutoScroller);
        this.list.SetHandle(this.updateItem.bind(this));
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    public flush(): void{
       this.updateShow();
    }
    
    protected onShow(): void {
        EventMgr.on(Evt_GuildChange, this.onGuildChange, this);
    }

    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_GuildChange, this.onGuildChange, this);
    }
    private onGuildChange():void{
        if(!this.node.activeInHierarchy) return;
        if(!PlayerData.MyGuild){
            this.Hide();
        }
    }
    private updateShow():void{
        let datas:any [] = [];
        this.list.UpdateDatas(datas);
    }
    protected updatePrivilegeItem(item: Node, data: any) {
        let privilegeItem = item.getComponent(GuildPrivilegeItem);
        if (!privilegeItem) privilegeItem = item.addComponent(GuildPrivilegeItem);
        privilegeItem.SetData(data);
    }
    protected updateItem(item: Node, data: any) {
        let donateItem = item.getComponent(GuildDonateItem);
        if (!donateItem) donateItem = item.addComponent(GuildDonateItem);
        donateItem.SetData(data);
    }
    
}