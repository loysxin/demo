import { Label, Node, Toggle } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { RankItem } from "./RankItem";
import { RankTopItem } from "./RankTopItem";
import { EventMgr, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import PlayerData, { SRankData, SRankType } from "../roleModule/PlayerData";
import { Http, SendGetRankData } from "../../net/Http";
import { GameSet } from "../GameSet";
import { AdaptBgTop } from "../common/BaseUI";
enum RankTabType {
    Page_RankFight,//战力排行页
    Page_RankLevel,//等级排行页
    Page_RankCustomsPass,//排行关卡页
};
export class RankPanel extends Panel {
    protected prefab: string = "prefabs/panel/rank/RankPanel";
    private noneListCont: Node;
    private top3Item: RankTopItem[] = [];
    private rankList_fight: AutoScroller;
    private rankList_level: AutoScroller;
    private rankList_customs: AutoScroller;
    private rankList: AutoScroller;
    private myRankItem: RankItem;
    private navBtns: Node[];
    private valueCont: Node;
    private page: RankTabType;
    private curRankType: SRankType;

    private myRank: number = 0;
    private rankData: SRankData[];
    protected onLoad(): void {

        this.top3Item.push(this.find("top3Cont/rank1").addComponent(RankTopItem));
        this.top3Item.push(this.find("top3Cont/rank2").addComponent(RankTopItem));
        this.top3Item.push(this.find("top3Cont/rank3").addComponent(RankTopItem));
        this.noneListCont = this.find("noneListCont");
        this.rankList_fight = this.find("rankList_fight").getComponent(AutoScroller);
        this.rankList_fight.SetHandle(this.updateRankItem.bind(this));
        this.rankList_level = this.find("rankList_level").getComponent(AutoScroller);
        this.rankList_level.SetHandle(this.updateRankItem.bind(this));
        this.rankList_customs = this.find("rankList_customs").getComponent(AutoScroller);
        this.rankList_customs.SetHandle(this.updateRankItem.bind(this));
        this.valueCont = this.find("listBg/valueCont");
        this.myRankItem = this.find("myRankItem").addComponent(RankItem);
        this.navBtns = this.find("navBar/view/content").children.concat();
        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }
        this.CloseBy("backBtn");
    }
    public flush(page: RankTabType): void {
        this.page = undefined;
        this.myRank = 0;
        if (page == undefined) {
            page = RankTabType.Page_RankFight;
        }
        this.navBtns[page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[page].getComponent(Toggle));
    }

    protected onShow(): void {
        AdaptBgTop(this.find("titleCont"))
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
    }

    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }

    private onPage(t: Toggle): void {

        if (!t.isChecked) return;
        let page = this.navBtns.indexOf(t.node);
        if (page < 0 || page == this.page) return;
        this.page = page;
        for (let index = 0; index < this.valueCont.children.length; index++) {
            const element = this.valueCont.children[index];
            if (page == index) {
                element.active = true;
            } else {
                element.active = false;
            }
        }
        this.rankList_fight.node.active = false;
        this.rankList_level.node.active = false;
        this.rankList_customs.node.active = false;
        switch (page) {
            case RankTabType.Page_RankFight: //战力
                this.curRankType = SRankType.Fight;
                this.rankList_fight.node.active = true;
                this.rankList = this.rankList_fight;
                break;
            case RankTabType.Page_RankLevel: //等级
                this.curRankType = SRankType.Level;
                this.rankList_level.node.active = true;
                this.rankList = this.rankList_level;
                break;
            case RankTabType.Page_RankCustomsPass: //关卡
                this.curRankType = SRankType.CustomsPass;
                this.rankList_customs.node.active = true;
                this.rankList = this.rankList_customs;
                break;
        }
        this.sendRandData();

    }
    private updateShow(): void {
        let top3List: SRankData[] = [
            {
                player_id: null,
                name: "虚位以待",
                icon_url: "",
                battle_power: 0,
                progress: 0,
                level: 0,
                rank: 1,
            },
            {
                player_id: null,
                name: "虚位以待",
                icon_url: "",
                battle_power: 0,
                progress: 0,
                level: 0,
                rank: 2,
            },
            {
                player_id: null,
                name: "虚位以待",
                icon_url: "",
                battle_power: 0,
                progress: 0,
                level: 0,
                rank: 3,
            },
        ];
        let rankList: SRankData[] = this.rankData;
        let home_all_lv = PlayerData.roleInfo.homelands[0].level
        let myRankData: SRankData = {
            player_id: PlayerData.roleInfo.player_id,
            name: PlayerData.roleInfo.name,
            icon_url: PlayerData.roleInfo.icon_url,
            battle_power: PlayerData.roleInfo.battle_power,
            progress: PlayerData.roleInfo.pve_data.progress,
            level: home_all_lv,
            rank: this.myRank,
        };
        let otherRankList: SRankData[] = [];
        for (let index = 0; index < rankList.length; index++) {
            let rankData: SRankData = rankList[index];
            rankData.rank = index + 1;
            if (rankData.player_id == PlayerData.roleInfo.player_id) {
                myRankData = rankData;
            }
            if (index < top3List.length) {
                top3List[index] = rankData;
            } else {
                otherRankList.push(rankData);
            }
        }
        this.updateTop3Cont(top3List);
        this.updateOtherCont(otherRankList);
        this.updateMyRankCont(myRankData);
    }
    private updateTop3Cont(topRankList: any[]): void {
        for (let index = 0; index < this.top3Item.length; index++) {
            let rankItem = this.top3Item[index];
            rankItem.SetData(topRankList[index], this.curRankType);
        }
    }
    private updateOtherCont(otherRankList: any[]): void {
        this.rankList.UpdateDatas(otherRankList);
        this.noneListCont.active = otherRankList.length < 1;
    }
    private updateMyRankCont(rankData: any): void {
        this.myRankItem.SetData(rankData, this.curRankType);
    }
    protected updateRankItem(item: Node, data: any) {
        let rankItem = item.getComponent(RankItem);
        if (!rankItem) rankItem = item.addComponent(RankItem);
        rankItem.SetData(data, this.curRankType);
    }
    protected update(dt: number): void {

    }

    /**
     * 请求排行榜数据
     */
    private async sendRandData(): Promise<void> {
        let playerId = PlayerData.roleInfo.player_id
        // console.log(  GameSet.Server_cfg.Rank)
        // let getRankData = GameSet.Server_cfg.Rank ? SendGetRankDataJy : SendGetRankData;
        let data:any = SendGetRankData;
        data.serverUrl = GameSet.Server_cfg.Rank;
        let rankDatas = await Http.Send(data, { rank_type: this.curRankType, page: 1, page_size: 100, player_id: playerId });
        if (!rankDatas) return;
        this.rankData = rankDatas["data"].rankings || [];
        this.myRank = rankDatas["data"].player_rank;
        this.updateShow();
    }

}