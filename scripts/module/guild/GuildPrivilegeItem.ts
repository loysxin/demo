import { Component, Label } from "cc";
import { StdEquityList, StdGuildEquity } from "../../manager/CfgMgr";

export class GuildPrivilegeItem extends Component {
    private nameLab: Label;
    private valueLab: Label;
    private isInit:boolean = false;
    private data:string;
    protected onLoad(): void {
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.valueLab = this.node.getChildByName("valueLab").getComponent(Label);
        
        this.isInit = true;
        this.updateShow();
    }
    
    SetData(data:string) {
        this.data = data;
        this.updateShow();
    }
    private updateShow():void{
        if(!this.isInit || !this.data) return;
        this.nameLab.string = this.data;
    }
}