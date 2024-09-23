import { Component, Label, sp } from "cc";
import { ConsumeItem } from "../common/ConsumeItem";
import { SFishingRankPlayerInfoData } from "../roleModule/PlayerData";
import { ItemUtil } from "../../utils/ItemUtils";
import { CfgMgr, ThingType } from "../../manager/CfgMgr";

export class FishingRankTopItem extends Component {
    private bodyModel:sp.Skeleton;
    private nameLab: Label;
    private rankLab: Label;
    private consumeItem: ConsumeItem;
    private data:SFishingRankPlayerInfoData;
    private isInit:boolean = false;
    private rankType:number;
    protected onLoad(): void {
        this.bodyModel = this.node.getChildByName("bodyModel").getComponent(sp.Skeleton);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.rankLab = this.node.getChildByName("rankLab").getComponent(Label);
        this.consumeItem = this.node.getChildByName("ConsumeItem").addComponent(ConsumeItem);
        this.isInit = true;
        this.initShow();
    }

    SetData(data:SFishingRankPlayerInfoData, rankType:number) {
        this.data = data;
        this.rankType = rankType;
        this.initShow();
    }
    private initShow():void{
        if(!this.isInit || !this.data) return;
        this.nameLab.string = this.data.name;
        this.rankLab.string = this.data.rank.toString();
        if(this.rankType == 1 || this.rankType == 2){
            this.consumeItem.SetData(ItemUtil.CreateThing(ThingType.ThingTypeItem, CfgMgr.GetFishCommon.CostItemID, this.data.score));
        }else{
            
        }
    }
}