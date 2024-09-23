import { Node, Button, Label, Sprite, Component, path, SpriteFrame, Toggle } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { AwardItem } from "../common/AwardItem";
import { CfgMgr, StdCommonType, StdLootRank } from "../../manager/CfgMgr";
import PlayerData, { SThing, SThings } from "../roleModule/PlayerData";
import { countDown, formatDate } from "../../utils/Utils";
import { DateUtils } from "../../utils/DateUtils";
import { ResMgr, folder_icon } from "../../manager/ResMgr";
import { BagItem } from "../bag/BagItem";


export class LootAwardPanel extends Panel {
    protected prefab: string = "prefabs/panel/loot/LootAwardPanel";
    private rankAwardList: AutoScroller;
    private myRankAwardItem: Node;
    private timeCont: Label;
    private navBar: Node;
    private maxCount = 500;
    private maxAward: any;

    protected onLoad() {
        this.CloseBy("closeBtn");
        this.rankAwardList = this.find(`rankAwardList`, AutoScroller);
        this.myRankAwardItem = this.find(`mayRankAwardItem`);
        this.timeCont = this.find(`timeCont/timeLab`, Label);
        this.navBar = this.find(`navBar`);
        this.onBtnEvent();
        this.rankAwardList.SetHandle(this.updateRankAward.bind(this));
    }

    private onBtnEvent() {
        this.navBar.children.forEach((node) => {
            node.on(Node.EventType.TOUCH_END, this.onTouchNav, this);
        })
    }

    protected onShow(): void {

    }
    public flush(...args: any[]): void {
        this.onTouchNav(0);
    }
    protected onHide(...args: any[]): void {
        this.timeCont.node.getComponent(Component).unscheduleAllCallbacks();
    }
    private onTouchNav(index) {
        if (index == 0) {
            this.initThisSeason();
        }
    }

    private initThisSeason() {
        let pvpData = CfgMgr.GetCommon(StdCommonType.PVP)
        this.maxAward = pvpData;
        this.timeCont.node.getComponent(Component).unscheduleAllCallbacks();
        this.timeCont.string = `剩余时间：${DateUtils.FormatTime(PlayerData.LootSeasonInfo.end_time - PlayerData.GetServerTime(), "%{d}天%{hh}:%{mm}:%{ss}")}`;
        this.timeCont.node.getComponent(Component).schedule(() => {
            this.timeCont.string = `剩余时间：${DateUtils.FormatTime(PlayerData.LootSeasonInfo.end_time - PlayerData.GetServerTime(), "%{d}天%{hh}:%{mm}:%{ss}")}`;
        }, 1)
        let stdRank: StdLootRank[] = CfgMgr.Get(`RankList`);
        let datas = []
        stdRank.forEach((data) => {
            if (data.ListModeID == PlayerData.LootSeasonInfo.season_id && data.ListType == 1) {
                datas.push(data);
            }
        })
        this.rankAwardList.UpdateDatas(datas);
        this.updateMyAward(this.myRankAwardItem)

    }
    private async updateRankAward(item: Node, data: StdLootRank, index: number) {
        let rankIcon = item.getChildByName(`rankIcon`).getComponent(Sprite);
        let rankLab = item.getChildByName(`rankLab`).getComponent(Label);
        let awardList = item.getChildByName(`awardList`).getComponent(AutoScroller);
        awardList.SetHandle(this.updateAwardItemLits.bind(this));
        rankLab.node.active = true;
        rankIcon.node.active = false;
        if (data.Ranking[0] == 1) {
            rankLab.string = `${data.Ranking[1]}`
            rankLab.fontSize = 70;
            if (data.Ranking[1] <= 3) {
                rankIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, `rank${data.Ranking[1]}`, "spriteFrame"), SpriteFrame);
                rankIcon.node.active = true;
                rankLab.node.active = false;
            }
        } else {
            rankLab.string = `前${data.Ranking[1] * 100}%奖池`
            rankLab.fontSize = 40;
        }
        let datas: SThing[] = PlayerData.GetLootAwardThings(PlayerData.LootSeasonInfo, data.RainbowReward);
        awardList.UpdateDatas(datas);
    }
    private async updateMyAward(item: Node) {
        let rankIcon = item.getChildByName(`rankIcon`).getComponent(Sprite);
        let rankLab = item.getChildByName(`rankLab`).getComponent(Label);
        let rangeLab = item.getChildByName(`rangeLab`).getComponent(Label);
        let awardList = item.getChildByName(`awardList`).getComponent(AutoScroller);
        awardList.SetHandle(this.updateAwardItemLits.bind(this));
        rankLab.node.active = true;
        rankIcon.node.active = false;
        let seasonData = PlayerData.LootSeasonInfo;

        //获取对应排名配置
        let stdRank: StdLootRank[] = CfgMgr.Get(`RankList`);
        let data;
        stdRank.forEach((curData) => {
            if (curData.ListModeID == PlayerData.LootSeasonInfo.season_id && curData.ListType == 1) {
                if (seasonData.rank = -1) return;
                if (curData.Ranking[0] == 1) {
                    if (seasonData.rank == curData.Ranking[1]) {
                        data = curData;
                    }
                } else {
                    if (seasonData.rank <= curData.Ranking[1] * this.maxCount) {
                        data = curData;
                    }
                }
            }
        })
        rankIcon.node.active = false;
        rankLab.node.active = true;
        if (data) {
            if (data.Ranking[0] == 1) {
                rankLab.string = `${data.Ranking[1]}`
                rangeLab.string = ``;
                rankLab.fontSize = 70;
                if (data.Ranking[1] <= 3) {
                    rankIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, `rank${data.Ranking[1]}`, "spriteFrame"), SpriteFrame);
                    rankIcon.node.active = true;
                    rankLab.node.active = false;
                }
            } else {
                rankLab.string = `${seasonData.rank}`
                rangeLab.string = `前${data.Ranking[1] * 100}%`;
                rankLab.fontSize = 50;
            }
            let datas: SThing[] = [];
            this.maxAward.RewardType.forEach((d, index) => {
                let curData = {
                    Rranklist: this.maxAward.Rranklist,
                    RewardType: this.maxAward.RewardType[index],
                    RewardID: this.maxAward.RewardID[index],
                    RewardNumber: this.maxAward.RewardNumber[index] * data.RainbowReward,
                }
                let thing = PlayerData.GetLootBaseAwardThing(curData);
                datas.push(thing);
            })
            awardList.UpdateDatas(datas);
        } else {
            rankLab.string = `暂无`
            rangeLab.string = ``;
        }
    }
    private updateAwardItemLits(item: Node, data: SThing) {
        let awardItem = item.getComponent(BagItem);
        if (!awardItem) awardItem = item.addComponent(BagItem);
        awardItem.SetData(data);
        awardItem.node.getChildByName(`name`).active = false;
        this.scheduleOnce(() => {
            awardItem.node.getComponent(Toggle).enabled = false;
        })
    }
}