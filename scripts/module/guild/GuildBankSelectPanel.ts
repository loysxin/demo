import { Button, Label, Node, RichText, Sprite } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { GuildBankItem } from "./GuildBankItem";
import { CfgMgr, StdGuildBank } from "../../manager/CfgMgr";
import PlayerData, { SGuildDepositTotal, SThing } from "../roleModule/PlayerData";
import { GuildSavingsPanel } from "./GuildSavingsPanel";
import { EventMgr, Evt_GuildChange } from "../../manager/EventMgr";
import { ConsumeItem } from "../common/ConsumeItem";
import { ItemUtil } from "../../utils/ItemUtils";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";

export class GuildBankSelectPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildBankSelectPanel";
    private curInterestNumLab:Label;
    private helpBtn:Button;
    private totalItem:ConsumeItem;
    private list:AutoScroller;
    private backBtn:Button;
    private okBtn:Button;
    private datas:StdGuildBank[];
    private curSelectIndex:number;
    private curSelectStd:StdGuildBank;
    private curSelectTotlaData:SGuildDepositTotal;
    private total:{[key:string]:SGuildDepositTotal};
    protected onLoad(): void {
        this.curInterestNumLab = this.find("curInterestNumLab", Label);
        this.totalItem = this.find("totalItem").addComponent(ConsumeItem);
        this.helpBtn = this.find("helpBtn", Button);
        this.list = this.find("list", AutoScroller);
        this.list.SetHandle(this.updateBankItem.bind(this));
        this.list.node.on('select', this.onBankSelect, this);
        this.backBtn = this.find("backBtn", Button);
        this.okBtn = this.find("okBtn", Button);
        this.helpBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.backBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.okBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    public flush(map:{[key:string]:SGuildDepositTotal}): void{
        this.total = map;
        this.datas = CfgMgr.GetGuildSavingsList(PlayerData.MyGuild.level);
        this.list.UpdateDatas(this.datas);
        this.list.SelectFirst();
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
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.helpBtn:
                Session.Send({ type: MsgTypeSend.GuildBankGetDonateDeposits, 
                    data: {
                        guild_id: PlayerData.MyGuild.guild_id,
                        donate_id: this.curSelectStd.DonateId.toString(),
                    } 
                });
                break;
            case this.backBtn:
                this.Hide();
                break;
            case this.okBtn:

                GuildSavingsPanel.Show(this.curSelectStd, this.curSelectTotlaData);
                break;
        }
    }
    private updateSelect():void{
        let costType:number = this.curSelectStd.CostType[0];
        this.curSelectTotlaData = this.total[costType];
        if(!this.curSelectTotlaData){
            this.curSelectTotlaData = {
                _id:"",
                guild_id:"",
                cost_type:costType,
                total_amount:0,
                total_record:0,
            }
        }
        this.curInterestNumLab.string = `${this.curSelectTotlaData.total_record}人`;
        let itemData:SThing = ItemUtil.CreateThing(costType,0, this.curSelectTotlaData.total_amount);
        this.totalItem.SetData(itemData);
    }
    private updateBankItem(item: Node, data: StdGuildBank, index:number):void{
        let bankItem:GuildBankItem = item.getComponent(GuildBankItem) || item.addComponent(GuildBankItem);
        bankItem.SetData(data);
    }
    private onBankSelect(index: number, item: Node):void{
        this.resetSelect();
        if(item){
            let select:Node = item.getChildByName("select");
            if(select){
                select.active = true;
            }else{
                return;
            } 
        }
        this.curSelectIndex = index;
        this.curSelectStd = this.datas[this.curSelectIndex];
        this.updateSelect();
    }
    private resetSelect():void{
        let children:Node[] = this.list.node.getChildByPath("view/content").children;
        for (let i = 0; i < children.length; i++) {
            let node:Node = children[i];
            node.getChildByName("select").active = false;
        }
    }
    
}