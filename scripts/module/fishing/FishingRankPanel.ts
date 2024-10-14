import { Label, Node, Toggle } from "cc";
import { Panel } from "../../GameRoot";
import { FishingIcedLogPage } from "./FishingIcedLogPage";
import { FishingLogPage } from "./FishingLogPage";
import { FishingPoolLogPage } from "./FishingPoolLogPage";
import PlayerData, { SFishingRankPlayerInfoData, SFishingRankQueryRet } from "../roleModule/PlayerData";
import { DateUtils } from "../../utils/DateUtils";
import { FishingRankTopItem } from "./FishingRankTopItem";
import { AutoScroller } from "../../utils/AutoScroller";
import { FishingRankItem } from "./FishingRankItem";
import { EventMgr, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";

export class FishingRankPanel extends Panel {
    protected prefab: string = "prefabs/panel/fishing/FishingRankPanel";
    private titleImg_1:Node;
    private titleImg_2:Node;
    private noneListCont:Node;
    private top3Item:FishingRankTopItem[] = [];
    private rankList:AutoScroller;
    private myRankItem:FishingRankItem;
    private timeLab:Label;
    private rankType:number;//1高手榜 2空杆榜
    private data:SFishingRankQueryRet;
    protected onLoad(): void {
        this.titleImg_1 = this.find("titleCont/titleImg_1");
        this.titleImg_2 = this.find("titleCont/titleImg_2");
        
        this.top3Item.push(this.find("top3Cont/rank1").addComponent(FishingRankTopItem));
        this.top3Item.push(this.find("top3Cont/rank2").addComponent(FishingRankTopItem));
        this.top3Item.push(this.find("top3Cont/rank3").addComponent(FishingRankTopItem));
        this.noneListCont = this.find("noneListCont");
        this.rankList = this.find("rankList").getComponent(AutoScroller);
        this.rankList.SetHandle(this.updateRankItem.bind(this));
        this.myRankItem = this.find("myRankItem").addComponent(FishingRankItem);
        this.timeLab = this.find("timeCont/timeLab").getComponent(Label);
        this.CloseBy("backBtn");
    }
    public async flush(data:SFishingRankQueryRet, type:number): Promise<void> {
        this.data = data;
        this.rankType = type;
        this.titleImg_1.active = this.titleImg_2.active = false;
        this[`titleImg_${this.rankType}`].active = true;
        this.updateShow();
    }
    
    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
    }

    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }
    private updateShow():void{
        let top3List:SFishingRankPlayerInfoData[] = [
            {
                player_id:null,
                name:"虚位以待",
                score:0,
                rank:1,
            },
            {
                player_id:null,
                name:"虚位以待",
                score:0,
                rank:2,
            },
            {
                player_id:null,
                name:"虚位以待",
                score:0,
                rank:3,
            },
        ];
        let rankList:SFishingRankPlayerInfoData[] = [];
        let playerList;
        if(this.rankType == 1){
            playerList = this.data.cost_rank.top_rank_players || [];
            rankList = playerList.concat();
        }else if(this.rankType == 2){
            playerList = this.data.lose_cost_rank.top_rank_players || [];
            rankList = playerList.concat();
        }
        let myRankData:SFishingRankPlayerInfoData = {
            player_id:PlayerData.roleInfo.player_id,
            name:PlayerData.roleInfo.name,
            score:0,
            rank:0,
        };
        let otherRankList:SFishingRankPlayerInfoData[] = [];
        for (let index = 0; index < rankList.length; index++) {
            let rankData:SFishingRankPlayerInfoData = rankList[index];
            rankData.rank = index + 1;
            if(rankData.player_id == PlayerData.roleInfo.player_id){
                myRankData = rankData;
            }
            if(index < top3List.length){
                top3List[index] = rankData;
            }else{
                otherRankList.push(rankData);
            }
        }
        this.updateTop3Cont(top3List);
        this.updateOtherCont(otherRankList);
        this.updateMyRankCont(myRankData);
    }
    private updateTop3Cont(topRankList:SFishingRankPlayerInfoData[]):void{
        for (let index = 0; index < this.top3Item.length; index++) {
            let rankItem = this.top3Item[index];
            rankItem.SetData(topRankList[index], this.rankType);
        }
    }
    private updateOtherCont(otherRankList:SFishingRankPlayerInfoData[]):void{
        this.rankList.UpdateDatas(otherRankList);
        this.noneListCont.active = otherRankList.length < 1;
    }
    private updateMyRankCont(rankData:SFishingRankPlayerInfoData):void{
        this.myRankItem.SetData(rankData, this.rankType);
    }
    protected updateRankItem(item: Node, data: SFishingRankPlayerInfoData) {
        let rankItem = item.getComponent(FishingRankItem);
        if (!rankItem) rankItem = item.addComponent(FishingRankItem);
        rankItem.SetData(data, this.rankType);
    }
    protected update(dt: number): void {
        if(this.data){
            if(!this.timeLab) return;
            let residueTime:number = Math.max(Math.floor(this.data.refresh_time - PlayerData.GetServerTime()), 0);
            if(residueTime > 86400){
                this.timeLab.string = "刷新时间：" + DateUtils.FormatTime(residueTime, "%{d}天%{hh}:%{mm}:%{ss}");
            }else{
                this.timeLab.string = "刷新时间：" + DateUtils.FormatTime(residueTime, "%{hh}:%{mm}:%{ss}");
            }
            
        }
    }
   
}