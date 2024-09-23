import { Component, Label, Node, sp } from "cc";
import { SRankData, SRankType } from "../roleModule/PlayerData";
export class RankTopItem extends Component {
    private bodyModel:sp.Skeleton;
    private nameLab: Label;
    private rankLab: Label;
    private fightIcon: Node;
    private valueLab: Label;
    private data:SRankData;
    private isInit:boolean = false;
    private rankType:SRankType;
    protected onLoad(): void {
        this.bodyModel = this.node.getChildByName("bodyModel").getComponent(sp.Skeleton);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.rankLab = this.node.getChildByName("rankLab").getComponent(Label);
        this.fightIcon = this.node.getChildByPath("valueCont/icon");
        this.valueLab = this.node.getChildByPath("valueCont/numLab").getComponent(Label);
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
        this.rankLab.string = this.data.rank.toString();
        this.fightIcon.active = false;
        if(this.rankType == 1){
            this.fightIcon.active = true;
            this.valueLab.string = this.data.battle_power + "";
        }else if(this.rankType == 2){ 
            this.valueLab.string = "Lv." + this.data.level + "";
        }else{
            this.valueLab.string = this.data.progress + ""
        }
    }
}