import { Component, Label, Node } from "cc";
import PlayerData, { SFishingRankPlayerInfoData, SPlayerViewInfo, SRankData, SRankType } from "../roleModule/PlayerData";
import { ItemUtil } from "../../utils/ItemUtils";
import { CfgMgr, ThingType } from "../../manager/CfgMgr";
import { HeadItem } from "../common/HeadItem";
import { battle_1_config } from "../../battle/config/battle_1_config";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";

export class RankItem extends Component {
    private head:HeadItem;
    private nameLab: Label;
    private rankLab: Label;
    private fightbg: Node;
    private fightIcon: Node;
    private valueLab: Label;
    private data:SRankData;
    private rankType:SRankType;
    private isInit:boolean = false;
    protected onLoad(): void {
        this.head = this.node.getChildByPath("HeadItem").addComponent(HeadItem);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.rankLab = this.node.getChildByName("rankLab").getComponent(Label);
        this.fightbg = this.node.getChildByPath("valueCont/bg");
        this.fightIcon = this.node.getChildByPath("valueCont/icon");
        this.valueLab =  this.node.getChildByPath("valueCont/numLab").getComponent(Label);
        this.isInit = true;
        this.initShow();
    }

    SetData(data:SRankData, rankType:SRankType) {
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
        this.fightbg.active = false;
        this.fightIcon.active = false;
        if(this.rankType == 1){
            this.fightbg.active = true;
            this.fightIcon.active = true;
            this.valueLab.string = this.data.battle_power + "";
        }else if(this.rankType == 2){
            this.valueLab.string = "Lv." + this.data.level;
        }else{
            this.valueLab.string = this.data.progress + ""
        }
        let data:SPlayerViewInfo = {
            player_id:this.data.player_id,
            level:this.data.level,
            battle_power:this.data.battle_power,
        };
        this.head.SetData(data);
        
    }
}