import { Node } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { GuildAuditItem } from "./GuildAuditItem";



export class GuildAuditPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildAuditPanel";
    private list: AutoScroller;
    private noneListCont:Node;
    protected onLoad(): void {
        this.list = this.find("list", AutoScroller);
        this.list.SetHandle(this.updateItem.bind(this));
        this.noneListCont = this.find("noneListCont");
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    public flush(): void{
       this.updateShow();
    }
    
    protected onShow(): void {
        
    }

    protected onHide(...args: any[]): void {
        
    }
    private updateShow():void{
        let datas:any [] = [];
        this.list.UpdateDatas(datas);
        this.noneListCont.active = datas.length < 1;
    }
    protected updateItem(item: Node, data: any) {
        let auditItem = item.getComponent(GuildAuditItem);
        if (!auditItem) auditItem = item.addComponent(GuildAuditItem);
        auditItem.SetData(data);
    }
}