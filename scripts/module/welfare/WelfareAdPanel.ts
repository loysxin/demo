import { Button, game, Label, Node } from "cc";
import { Panel } from "../../GameRoot";
import { AwardItem } from "../common/AwardItem";
import { AutoScroller } from "../../utils/AutoScroller";
import PlayerData, { SAdvister, SThing } from "../roleModule/PlayerData";
import { AdvisterId, CfgMgr, StdAdvister } from "../../manager/CfgMgr";
import { ItemUtil } from "../../utils/ItemUtils";
import { SetNodeGray } from "../common/BaseUI";
import { MsgPanel } from "../common/MsgPanel";
import { AdActionResult, AdHelper } from "../../AdHelper";
import { getAdcfg, getQbAdCfg } from "../../Platform";
import { EventMgr, Evt_AdvisterUpdate } from "../../manager/EventMgr";
import { Tips } from "../login/Tips";
import { DateUtils } from "../../utils/DateUtils";
import { GameSet } from "../GameSet";

export class WelfareAdPanel extends Panel {
    protected prefab: string = "prefabs/panel/welfare/WelfareAdPanel";
    private awardList: AutoScroller;
    private btn: Button;
    private btnLab: Label;
    private btnIcon: Node;
    private jumpAd:Node;
    protected onLoad() {
        this.awardList = this.find("awardList", AutoScroller);
        this.awardList.SetHandle(this.updateItem.bind(this));
        this.btn = this.find("btn", Button);
        this.btnLab = this.find("btn/cont/btnLab", Label);
        this.btnIcon = this.find("btn/cont/icon");
        this.jumpAd = this.find("btn/cont/icon/jumpAd");
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);

    }
    protected onShow(): void {

        EventMgr.on(Evt_AdvisterUpdate, this.onAdvisterUpdate, this);
    }
    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_AdvisterUpdate, this.onAdvisterUpdate, this);
    }

    public async flush(): Promise<void> {
        let stdAd: StdAdvister = CfgMgr.GetAdvister(AdvisterId.Advister_4);
        let listDatas: SThing[] = ItemUtil.GetSThingList(stdAd.RewardType, stdAd.RewardID, stdAd.RewardNumber);
        this.awardList.UpdateDatas(listDatas);
        this.updateAddTime();
        this.jumpAd.active = PlayerData.GetIsActivateRights();
    }
    protected update(dt: number): void {
        this.updateAddTime();
    }
    private onAdvisterUpdate(): void {
        if (!this.node.activeInHierarchy) return;
        this.updateAddTime();
    }
    private updateAddTime(): void {
        let adData: SAdvister = PlayerData.GetAdvisterData(AdvisterId.Advister_4);
        let stdAd: StdAdvister = CfgMgr.GetAdvister(AdvisterId.Advister_4);
        if (adData.count > 0) {
            SetNodeGray(this.btn.node, false, true);
            let cd: number = adData.cdEndTime - game.totalTime;
            if (cd > 0) {
                this.btnLab.string = DateUtils.FormatTime(cd / 1000, "%{mm}:%{ss}");
            } else {
                this.btnLab.string = `立即补充${adData.count}/${stdAd.Max_numb}`;
            }

        } else {
            //this.btn.node.active = false;
            this.btnLab.string = "已看完";
            SetNodeGray(this.btn.node, true, true);
        }

    }
    async onBtnClick(btn: Button): Promise<void> {
        let adData: SAdvister = PlayerData.GetAdvisterData(AdvisterId.Advister_4);
        if (adData.count < 1) {
            MsgPanel.Show("广告已看完");
            return;
        }
        if (game.totalTime < adData.cdEndTime) {
            MsgPanel.Show("冷却中，请稍后！");
            return;
        }
        this.btn.interactable = false;
        // SetNodeGray(this.btn.node, true, true);
        if(PlayerData.GetIsActivateRights()){
            AdHelper.JumpAd(AdvisterId.Advister_4, "")
        }else{
            console.log("AdHelper---> rewardAdId4:", GameSet.globalCfg.ad_channel.rewardAdId4);
            let action, errorCode, errorMsg;
            if (Math.abs(GameSet.globalCfg.ad_channel.rewardAdId4) == 1) {
                [action, errorCode, errorMsg] = await AdHelper.rewardAd(getAdcfg().rewardAdId4, AdvisterId.Advister_4, "");
            } else {
                [action, errorCode, errorMsg] = await AdHelper.rewardQbAd(getQbAdCfg().rewardAdId4, AdvisterId.Advister_4, "");
            }
            if (action == "onLoadFailed") {
                if (Math.abs(GameSet.globalCfg.ad_channel.rewardAdId4) == 1) {
                    if (GameSet.globalCfg.ad_channel.rewardAdId4 > 0) GameSet.globalCfg.ad_channel.rewardAdId4 = 2;
                    Tips.Show("广告加载失败，请稍后再试！");
                } else {
                    if (GameSet.globalCfg.ad_channel.rewardAdId4 > 0) GameSet.globalCfg.ad_channel.rewardAdId4 = 1;
                    Tips.Show("广告展示失败，请稍后再试！");
                }
            } else {
                // SetNodeGray(this.btn.node, false, true);
            }
        }
        PlayerData.SetAdvisterCd(AdvisterId.Advister_4);
        this.btn.interactable = true;
    }
    private updateItem(item: Node, data: SThing) {
        let awardItem = item.getComponent(AwardItem);
        if (!awardItem) awardItem = item.addComponent(AwardItem);
        awardItem.SetData({ itemData: data });
    }
}