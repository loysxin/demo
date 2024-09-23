import { Component, Label, Node} from "cc";
import { FishingRankSettlementRecordInfo} from "../roleModule/PlayerData";
import { FishingRankLogItem } from "./FishingRankLogItem";
import { formatNumber } from "../../utils/Utils";
import { CfgMgr } from "../../manager/CfgMgr";
export class FishingPoolLogItem extends Component {
    private moneyLab: Label;
    private phaseLab: Label;
    private superRankItem: FishingRankLogItem;
    private noneRankItem: FishingRankLogItem;
    private luckyRankItem: FishingRankLogItem;
    
    protected isInit = false;
    private data:FishingRankSettlementRecordInfo;
    protected onLoad(): void {
        this.moneyLab = this.node.getChildByPath("topCont/moneyLab").getComponent(Label);
        this.phaseLab = this.node.getChildByPath("topCont/phaseLab").getComponent(Label);
        this.superRankItem = this.node.getChildByName("superRankItem").addComponent(FishingRankLogItem);
        this.noneRankItem = this.node.getChildByName("noneRankItem").addComponent(FishingRankLogItem);
        this.luckyRankItem = this.node.getChildByName("luckyRankItem").addComponent(FishingRankLogItem);
        this.isInit = true;
        this.updateShow();
    }

    
   SetData(data:FishingRankSettlementRecordInfo) {
        this.data = data;
        this.updateShow();
        
    }
    private updateShow():void{
        if(!this.isInit || !this.data) return;
        this.moneyLab.string = formatNumber(CfgMgr.GetFishConvertValue(CfgMgr.GetFishCommon.CostItemID, this.data.pool), 2);
        this.phaseLab.string = `第${this.data.rank_round}期`;
        this.superRankItem.SetData(this.data.cost_rank, 1);
        this.noneRankItem.SetData(this.data.lose_cost_rank, 2);
        this.luckyRankItem.SetData(this.data.round_count_rank, 3);
    }
    
}