import { Color, Component, Label, Sprite } from "cc";
import { FishingSubRankSettlementRecordInfo } from "../roleModule/PlayerData";
import { ConsumeItem } from "../common/ConsumeItem";
import { CfgMgr, ThingType } from "../../manager/CfgMgr";
import { ItemUtil } from "../../utils/ItemUtils";

export class FishingRankLogItem extends Component {
    private headIcon:Sprite;
    private nameLab:Label;
    private rsNumLab:Label;
    private numberOneAward:ConsumeItem;
    private poolAward:ConsumeItem;
    private myRankLab:Label;
    private myAward:ConsumeItem;
    private isInit:boolean = false;
    private data:FishingSubRankSettlementRecordInfo;
    private rankType:number;
    protected onLoad(): void {
        this.headIcon = this.node.getChildByPath("headCont/Mask/icon").getComponent(Sprite);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.numberOneAward = this.node.getChildByPath("numberOneAward").addComponent(ConsumeItem);
        this.poolAward = this.node.getChildByPath("poolAward").addComponent(ConsumeItem);
        this.myAward = this.node.getChildByPath("myAward").addComponent(ConsumeItem);
        this.myRankLab = this.node.getChildByPath("myRankLab").getComponent(Label);
        this.rsNumLab = this.node.getChildByName("rsNumLab").getComponent(Label);
        this.isInit = true;
        this.updateShow();
        
    }

    SetData(data:FishingSubRankSettlementRecordInfo, rankType:number) {
        this.data = data;
        this.rankType = rankType;
        this.updateShow();
        
    }

    private updateShow() {
        if(!this.isInit || !this.data) return;
        this.nameLab.string = this.data.top_player_name;
        if(this.data.self_rank > 0){
            this.myRankLab.color = new Color().fromHEX("#69949D");
            this.myRankLab.string = `第${this.data.self_rank}名`;
        }else{
            this.myRankLab.string = `未上榜`;
            this.myRankLab.color = new Color().fromHEX("#686868");
        }
        this.rsNumLab.string = this.data.reward_player_count.toString();
        let num = CfgMgr.GetFishConvertValue(CfgMgr.GetFishCommon.CostItemID, this.data.pool);
        this.poolAward.SetData(ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, num));
        this.numberOneAward.SetData(ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, this.data.top_player_reward));
        num = this.data.self_reward > 0 ? this.data.self_reward : 0;
        this.myAward.SetData(ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, num));
    }
}