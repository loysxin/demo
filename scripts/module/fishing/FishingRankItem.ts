import { Component, Label, Sprite } from "cc";
import { ConsumeItem } from "../common/ConsumeItem";
import PlayerData, { SFishingRankPlayerInfoData, SSimpleData } from "../roleModule/PlayerData";
import { ItemUtil } from "../../utils/ItemUtils";
import { CfgMgr, ThingType } from "../../manager/CfgMgr";
import { HeadItem } from "../common/HeadItem";

export class FishingRankItem extends Component {
    private head:HeadItem;
    private nameLab: Label;
    private rankLab: Label;
    private consumeItem: ConsumeItem;
    private data:SFishingRankPlayerInfoData;
    private rankType:number;
    private isInit:boolean = false;
    protected onLoad(): void {
        this.head = this.node.getChildByPath("HeadItem").addComponent(HeadItem);
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
        if(this.data.rank > 0){
            this.rankLab.string = this.data.rank.toString();
        }else{
            this.rankLab.string = "未上榜";
        }
        if(this.rankType == 1 || this.rankType == 2){
            this.consumeItem.SetData(ItemUtil.CreateThing(ThingType.ThingTypeItem, CfgMgr.GetFishCommon.CostItemID, this.data.score));
        }else{

        }
        let data:SSimpleData = {
            player_id:PlayerData.roleInfo.player_id,
            name:PlayerData.roleInfo.name,
            weChatNum:PlayerData.roleInfo.weChatNum,
            qqNum:PlayerData.roleInfo.qqNum,
        };
        this.head.SetData(data);
        
    }
}