import { Button, Label, Node, RichText } from "cc";
import { Panel } from "../../GameRoot";
import { ConsumeItem } from "../common/ConsumeItem";
import PlayerData, { SFishingRankQueryRet } from "../roleModule/PlayerData";
import { EventMgr, Evt_FishRankUpdate } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { ItemUtil } from "../../utils/ItemUtils";
import { CfgMgr, ThingType } from "../../manager/CfgMgr";
import { DateUtils } from "../../utils/DateUtils";
import { FishingRankPanel } from "./FishingRankPanel";
import { formatNumber } from "../../utils/Utils";

export class FishingLuckyPoolPanel extends Panel {
    protected prefab: string = "prefabs/panel/fishing/FishingLuckyPoolPanel";
    private poolNumLab:Label;

    private superTipsLab:RichText;
    private superRankBtn:Button;
    private superRankAwardItem:ConsumeItem;
    private superRankCondNumLab:Label;
    private superRankCondLab:Label;
    private superMyRankLab:Label;

    private noneRodTipsLab:RichText;
    private noneRodRankBtn:Button;
    private noneRodRankAwardItem:ConsumeItem;
    private noneRodRankCondNumLab:Label;
    private noneRodRankCondLab:Label;
    private noneRodMyRankLab:Label;

    private luckyTipsLab:RichText;
    private luckyRankAwardItem:ConsumeItem;
    private luckyRankCondNumLab:Label;
    private luckyRankCondLab:Label;
    private luckyHaveJoin:Node;
    private luckyNoneJoin:Node;

    private timeLab:Label;
    private data:SFishingRankQueryRet;
    protected onLoad(): void {
        this.poolNumLab = this.find("poolNumLab").getComponent(Label);

        this.superTipsLab = this.find("superItem/tipsLab").getComponent(RichText);
        this.superRankBtn = this.find("superItem/rankBtn").getComponent(Button);
        this.superRankAwardItem = this.find("superItem/rankAwardItem").addComponent(ConsumeItem);
        this.superRankCondNumLab = this.find("superItem/rankCondCont/numLab").getComponent(Label);
        this.superRankCondLab = this.find("superItem/rankCondLab").getComponent(Label);
        this.superMyRankLab = this.find("superItem/myRankLab").getComponent(Label);

        this.noneRodTipsLab = this.find("noneRodItem/tipsLab").getComponent(RichText);
        this.noneRodRankBtn = this.find("noneRodItem/rankBtn").getComponent(Button);
        this.noneRodRankAwardItem = this.find("noneRodItem/rankAwardItem").addComponent(ConsumeItem);
        this.noneRodRankCondNumLab = this.find("noneRodItem/rankCondCont/numLab").getComponent(Label);
        this.noneRodRankCondLab = this.find("noneRodItem/rankCondLab").getComponent(Label);
        this.noneRodMyRankLab = this.find("noneRodItem/myRankLab").getComponent(Label);

        this.luckyTipsLab = this.find("luckyItem/tipsLab").getComponent(RichText);
        this.luckyRankAwardItem = this.find("luckyItem/rankAwardItem").addComponent(ConsumeItem);
        this.luckyRankCondNumLab = this.find("luckyItem/rankCondCont/numLab").getComponent(Label);
        this.luckyRankCondLab = this.find("luckyItem/rankCondLab").getComponent(Label);
        this.luckyHaveJoin = this.find("luckyItem/haveJoin");
        this.luckyNoneJoin = this.find("luckyItem/noneJoin");

        this.timeLab = this.find("timeCont/timeLab").getComponent(Label);
        this.CloseBy("mask");
        this.CloseBy("closeBtn");
        this.superRankBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.noneRodRankBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        EventMgr.on(Evt_FishRankUpdate, this.onRankUpdate, this);
       
    }
    public async flush(...args: any[]): Promise<void> {
        Session.Send({type: MsgTypeSend.FishingRankQuery, data:{}});
    }
    
    protected onShow(): void {
        
    }

    protected onHide(...args: any[]): void {
        
    }
    protected update(dt: number): void {
        if(this.data){
            let residueTime:number = Math.max(Math.floor(this.data.refresh_time - PlayerData.GetServerTime()), 0);
            if(residueTime > 86400){
                this.timeLab.string = "刷新时间：" + DateUtils.FormatTime(residueTime, "%{d}天%{hh}:%{mm}:%{ss}");
            }else{
                this.timeLab.string = "刷新时间：" + DateUtils.FormatTime(residueTime, "%{hh}:%{mm}:%{ss}");
            }
            
        }
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.superRankBtn:
                FishingRankPanel.Show(this.data, 1);
                break;
            case this.noneRodRankBtn:
                FishingRankPanel.Show(this.data, 2);
                break;
        }
    }
    private onRankUpdate(data:SFishingRankQueryRet):void{
        this.data = data;
        this.updateShow();
    }
    private updateShow():void{
        if(this.data){
            
            let cfg:number[] = CfgMgr.GetFishCommon.RankDistribute;
            let rankCondList:number[] = CfgMgr.GetFishCommon.RankScoreUpdateLimit;
            let set:number = CfgMgr.GetFishConvertNum(CfgMgr.GetFishCommon.CostItemID);
            this.poolNumLab.string = formatNumber(this.data.rank_reward_pool/set , 2);
            this.superTipsLab.string = `<outline outlineColor=#FFFFFF width=3>排名前${cfg[0]*100}%<color=#ff0000>（共${this.data.cost_rank.rank_size}）</color>名的玩家可获得奖励</outline>`;
            this.superRankAwardItem.SetData(ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, this.data.cost_rank.reward_pool/set));
            this.superRankCondNumLab.string = rankCondList[0].toString();
            this.superRankCondLab.string = `${this.data.cost_rank.rank_size}名`;
            if(this.data.cost_rank.self_ranking > 0){
                this.superMyRankLab.string = this.data.cost_rank.self_ranking.toString();
            }else{
                this.superMyRankLab.string = "未上榜";
            }

            this.noneRodTipsLab.string = `<outline outlineColor=#FFFFFF width=3>排名前${cfg[1]*100}%<color=#ff0000>（共${this.data.lose_cost_rank.rank_size}）</color>名的玩家可获得奖励</outline>`;
            this.noneRodRankAwardItem.SetData(ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, this.data.lose_cost_rank.reward_pool/set));
            this.noneRodRankCondNumLab.string = rankCondList[1].toString();
            this.noneRodRankCondLab.string = `${this.data.lose_cost_rank.rank_size}名`;
            if(this.data.lose_cost_rank.self_ranking > 0){
                this.noneRodMyRankLab.string = this.data.lose_cost_rank.self_ranking.toString();
            }else{
                this.noneRodMyRankLab.string = "未上榜";
            }

            this.luckyTipsLab.string = `<outline outlineColor=#FFFFFF width=3>每日参加钓鱼大赛满<color=#ff0000>（${CfgMgr.GetFishCommon.LuckRankLimitCount}）</color>次</outline>`;
            this.luckyRankAwardItem.SetData(ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, this.data.round_count_rank.reward_pool/set));
            this.luckyRankCondNumLab.string = rankCondList[2].toString();
            
            this.luckyRankCondLab.string = `<${cfg[2]}`;
            if(this.data.round_count_rank.self_ranking > 0){
                this.luckyHaveJoin.active = true;
                this.luckyNoneJoin.active = false;
            }else{
                this.luckyHaveJoin.active = false;
                this.luckyNoneJoin.active = true;
            }
        }
        
    }
}