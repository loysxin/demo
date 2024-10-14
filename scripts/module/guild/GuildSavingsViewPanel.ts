import {Label, Node} from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { SDeposit} from "../roleModule/PlayerData";
import { EventMgr, Evt_GuildChange } from "../../manager/EventMgr";
import { AutoScroller } from "../../utils/AutoScroller";
import { GuildSavingsViewItem } from "./GuildSavingsViewItem";

export class GuildSavingsViewPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildSavingsViewPanel";
    private numLab:Label;
    private list:AutoScroller;
    private noneListCont:Node;
    private datas:SDeposit[];
    protected onLoad(): void {
        this.numLab = this.find("numLab", Label);
        this.list = this.find("list", AutoScroller);
        this.list.SetHandle(this.updateItem.bind(this));
        this.noneListCont = this.find("noneListCont");
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    public flush(datas:SDeposit[]): void{
        this.datas = datas || [];
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
        let len:number = this.datas.length;
        this.numLab.string = len.toString();
        this.noneListCont.active = len < 1;
        this.list.UpdateDatas(this.datas);
    }

    private updateItem(item:Node, data:SDeposit):void{
        let savingsViewItem:GuildSavingsViewItem = item.getComponent(GuildSavingsViewItem) || item.addComponent(GuildSavingsViewItem);
        savingsViewItem.SetData(data); 
    }
    
}