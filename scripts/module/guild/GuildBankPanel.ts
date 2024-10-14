import { Button, Color, Label, Node, path, RichText, Sprite, SpriteFrame } from "cc";
import { Panel } from "../../GameRoot";
import { CfgMgr, GuildPostType, StdGuildBank, StdGuildRole } from "../../manager/CfgMgr";
import PlayerData, { SDeposit, SGuildDepositTotal, SThing } from "../roleModule/PlayerData";
import { formatNumber } from "../../utils/Utils";
import { ResMgr } from "../../manager/ResMgr";
import { ConsumeItem } from "../common/ConsumeItem";
import { EventMgr, Evt_GuildChange } from "../../manager/EventMgr";
import { Item } from "../../editor/Item";
import { ItemUtil } from "../../utils/ItemUtils";
import { DateUtils } from "../../utils/DateUtils";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";

export class GuildBankPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildBankPanel";
    private postCont:Node;
    private addCont:Node;
    private totalInterestLab:RichText;
    private curInterestNumLab:Label;
    private helpBtn:Button;
    private principalItem:ConsumeItem;
    private totalItem:ConsumeItem;
    private interestLab:Label;
    private nextInterestTitleLab:Label;
    private timeLab:Label;
    private dayInterestlItem:ConsumeItem;
    private stdGuildBank:StdGuildBank;
    private info:SDeposit;
    private totals:SGuildDepositTotal;
    protected onLoad(): void {
        this.totalItem = this.find("totalItem").addComponent(ConsumeItem);
        this.postCont = this.find("postCont");
        this.addCont = this.find("postCont/addCont");
        this.nextInterestTitleLab = this.find("postCont/topCont/nextInterestTitleLab", Label);
        this.totalInterestLab = this.find("postCont/totalInterestLab", RichText);
        this.curInterestNumLab = this.find("curInterestNumLab", Label);
        this.helpBtn = this.find("helpBtn", Button);
        this.principalItem = this.find("principalItem").addComponent(ConsumeItem);
        this.interestLab = this.find("interestLab", Label);
        this.timeLab = this.find("timeLab", Label);
        this.dayInterestlItem = this.find("dayInterestlItem").addComponent(ConsumeItem);
        this.helpBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    protected update(dt: number): void {
        if(this.info){
            let residueTime:number = Math.max(Math.floor(this.info.expiration_time - PlayerData.GetServerTime()), 0);
            if(residueTime > 86400){
                this.timeLab.string = DateUtils.FormatTime(residueTime, "%{d}天%{hh}:%{mm}:%{ss}");
            }else{
                this.timeLab.string = DateUtils.FormatTime(residueTime, "%{hh}:%{mm}:%{ss}");
            }
            if(residueTime <= 0){
                this.Hide();
            }
        }
    }
    public flush(info:SDeposit, total:SGuildDepositTotal): void{
        this.info = info;
        this.totals = total;
        if(!this.totals){
            this.totals = {
                _id:"",
                guild_id:"",
                cost_type:this.info.cost_type,
                total_amount:0,
                total_record:0,
            }
        }
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
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.helpBtn:
                Session.Send({ type: MsgTypeSend.GuildBankGetDonateDeposits, 
                    data: {
                        guild_id: PlayerData.MyGuild.guild_id,
                        donate_id: this.stdGuildBank.DonateId.toString(),
                    } 
                });
                break;
        }
    }
    private updateShow():void{
        this.stdGuildBank = CfgMgr.GetGuildSavings(Number(this.info.donate_id));
        
        this.curInterestNumLab.string = `${this.totals.total_record}人`;
        let itemData:SThing = ItemUtil.CreateThing(this.totals.cost_type,0, this.totals.total_amount);
        this.totalItem.SetData(itemData);

        itemData = ItemUtil.CreateThing(this.info.cost_type,0, this.info.amount);
        this.principalItem.SetData(itemData);
        this.postCont.active = false;
        let totalAddRate:number[] = CfgMgr.GetGuildSavingsTotalRate(this.stdGuildBank.DonateId, this.totals.total_amount);
        let nextTotalAddRate:number[] = CfgMgr.GetGuildSavingsTotalRate(this.stdGuildBank.DonateId, this.totals.total_amount, true);
        if(this.stdGuildBank.TotalRebateRole && this.stdGuildBank.TotalRebateRole.length > 0){
            let myPost:StdGuildRole = PlayerData.GetMyGuildLimit();
            if(myPost && this.stdGuildBank.TotalRebateRole.indexOf(myPost.ID) > -1){
                this.postCont.active = true;
                let stdGuildRoleList:StdGuildRole[] = CfgMgr.GetGuildRoleList();
                let stdGuildRole:StdGuildRole;
                let titleLba:Label;
                let valueLab:Label;
                let nextValue:Label;
                let postNode:Node;
                let addRate:number;
                for (let index = 0; index < stdGuildRoleList.length; index++) {
                    stdGuildRole = stdGuildRoleList[index];
                    postNode = this.addCont.getChildByName(`post_${stdGuildRole.ID}`);
                    if(postNode){
                        if(this.stdGuildBank.TotalRebateRole.indexOf(stdGuildRole.ID) > -1){
                            postNode.active = true;
                            titleLba = postNode.getChildByName("titleLab").getComponent(Label);
                            valueLab = postNode.getChildByName("valueLab").getComponent(Label);
                            nextValue = postNode.getChildByName("nextValueLab").getComponent(Label);
                            titleLba.string = stdGuildRole.Name;
                            addRate = CfgMgr.GetGuildSavingsRate(this.stdGuildBank.DonateId, PlayerData.MyGuild.type, stdGuildRole.ID);
                            valueLab.string = `${formatNumber(addRate + totalAddRate[1],2)}%`;
                            if(nextTotalAddRate){
                                nextValue.string = `${formatNumber(addRate + nextTotalAddRate[1],2)}%`;
                            }else{
                                nextValue.string = `--%`;
                            }
                        }else{
                            postNode.active = false;
                        }
                    }
                    
                }
            }
        }
        let myRate:number = CfgMgr.GetGuildSavingsRate(this.stdGuildBank.DonateId, PlayerData.MyGuild.type, PlayerData.GetMyGuildLimit().ID);
        myRate += totalAddRate[1];
        this.interestLab.string = `${formatNumber(myRate,2)}%`;

        let dayVal:number = this.info.amount * myRate / 100;
        itemData = ItemUtil.CreateThing(this.info.cost_type, 0, dayVal);
        this.dayInterestlItem.SetData(itemData);

        if(!nextTotalAddRate){
            this.nextInterestTitleLab.color = new Color().fromHEX("#FF4931");
            this.nextInterestTitleLab.string = "已达最大值";
            this.totalInterestLab.string = `总额达到 <color=#FF4931>--</color> 开启下一阶段利息`;
        }else{
            this.nextInterestTitleLab.color = new Color().fromHEX("#8DFE3B");
            this.nextInterestTitleLab.string = "下一阶段利息";
            this.totalInterestLab.string = `总额达到 <color=#FF4931>${totalAddRate[0]}</color> 开启下一阶段利息`;
        }
        
    }
    
}