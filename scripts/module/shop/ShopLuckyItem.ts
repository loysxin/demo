import { Button, Component, Label, path, Sprite, SpriteFrame, Node, game } from "cc";
import { ConsumeItem, ConsumeNumFormatType } from "../common/ConsumeItem";
import { CfgMgr, StdAdvister, StdLuckyShop, StdShopLucky, StdShopLuckyPool } from "../../manager/CfgMgr";
import PlayerData, { SAdvister, SLuckyContent, SShopContent, SThing } from "../roleModule/PlayerData";
import { ResMgr } from "../../manager/ResMgr";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { ItemUtil } from "../../utils/ItemUtils";
import { MsgPanel } from "../common/MsgPanel";
import { ShopLuckyBuyPanel } from "./ShopLuckyBuyPanel";
import { Tips2 } from "../home/panel/Tips2";
import { AutoScroller } from "../../utils/AutoScroller";
import { AwardItem } from "../common/AwardItem";
import { ItemTips } from "../common/ItemTips";
import { CanSet } from "../home/HomeStruct";
import { AdActionResult, AdHelper } from "../../AdHelper";
import { getAdcfg, getQbAdCfg } from "../../Platform";
import { SetNodeGray } from "../common/BaseUI";
import { EventMgr, Evt_AdvisterUpdate } from "../../manager/EventMgr";
import { Tips } from "../login/Tips";
import { DateUtils } from "../../utils/DateUtils";
import { GameSet } from "../GameSet";

export class ShopLuckyItem extends Component {
    private bg: Sprite;
    private titleImg: Sprite;
    private numLab: Label;
    private yetNumLab: Label;
    private oneBtn: Button;
    private oneAdBtn: Button;
    private oneAdBtnLab: Label;
    private oneFreeNumLab: Label;
    private oneConsumeItem: ConsumeItem;
    private tenBtn: Button;
    private helpBtn: Button;
    private tenFreeNumLab: Label;
    private tenConsumeItem: ConsumeItem;
    private awardList: AutoScroller;
    private isInit: boolean = false;
    private std: StdLuckyShop;
    private data: SLuckyContent;
    private jumpAd:Node;
    protected onLoad(): void {
        this.bg = this.node.getChildByName("bg").getComponent(Sprite);
        this.titleImg = this.node.getChildByName("titleImg").getComponent(Sprite);
        this.numLab = this.node.getChildByName("numLab").getComponent(Label);
        this.yetNumLab = this.node.getChildByName("yetNumLab").getComponent(Label);
        this.oneBtn = this.node.getChildByName("oneBtn").getComponent(Button);
        this.oneFreeNumLab = this.node.getChildByPath("oneBtn/oneFreeNumLab").getComponent(Label);
        this.oneConsumeItem = this.node.getChildByPath("oneBtn/oneConsumeItem").addComponent(ConsumeItem);
        this.oneAdBtn = this.node.getChildByName("oneAdBtn").getComponent(Button);
        this.jumpAd = this.node.getChildByPath("oneAdBtn/cont/icon/jumpAd")
        this.oneAdBtnLab = this.node.getChildByPath("oneAdBtn/cont/oneAdBtnLab").getComponent(Label);
        this.tenBtn = this.node.getChildByName("tenBtn").getComponent(Button);
        this.tenFreeNumLab = this.node.getChildByPath("tenBtn/tenFreeNumLab").getComponent(Label);
        this.tenConsumeItem = this.node.getChildByPath("tenBtn/tenConsumeItem").addComponent(ConsumeItem);
        this.awardList = this.node.getChildByName("awardList").getComponent(AutoScroller);
        if (!this.awardList) this.awardList = this.node.getChildByName("awardList").addComponent(AutoScroller);
        this.helpBtn = this.node.getChildByName("helpBtn").getComponent(Button);
        this.awardList.SetHandle(this.updateAwardItem.bind(this));
        this.awardList.node.on('select', this.onAwardItemSelect, this);
        this.oneConsumeItem.numFormatType = ConsumeNumFormatType.ContrastHave;
        this.tenConsumeItem.numFormatType = ConsumeNumFormatType.ContrastHave;
        this.isInit = true;
        this.tenBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.oneBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.oneAdBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.helpBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.updateShow();
        EventMgr.on(Evt_AdvisterUpdate, this.onAdvisterUpdate, this);
    }
    protected update(dt: number): void {
        this.updateAdCdTime();
    }
    private updateAdCdTime(): void {
        let adId: number = this.std.shopStd.AdTime;
        if (adId > 0) {
            let adData: SAdvister = PlayerData.GetAdvisterData(adId);
            let stdAd: StdAdvister = CfgMgr.GetAdvister(adId);
            let cd: number = adData.cdEndTime - game.totalTime;
            if (cd > 0) {
                this.oneAdBtnLab.string = DateUtils.FormatTime(cd / 1000, "%{mm}:%{ss}");
            } else {
                this.oneAdBtnLab.string = `免费(${adData.count}/${stdAd.Max_numb})`;
            }
        }

    }
    private onAdvisterUpdate(): void {
        if (!this.node.activeInHierarchy) return;
        this.updateAddTime();
    }
    private updateAddTime(): void {
        if (!this.std) return;
        if (this.data.freex1_count > 0) {
            this.oneAdBtn.node.active = false;
            this.oneBtn.node.active = true;
            this.oneFreeNumLab.node.active = true;
            this.oneFreeNumLab.string = `免费次数：${this.data.freex1_count}`;
            this.oneConsumeItem.node.active = false;
        } else {
            let adId: number = this.std.shopStd.AdTime;
            if (adId > 0) {
                let adData: SAdvister = PlayerData.GetAdvisterData(adId);
                let stdAd: StdAdvister = CfgMgr.GetAdvister(adId);
                if (adData.count < 1) {
                    this.oneAdBtn.node.active = false;
                    this.oneBtn.node.active = true;
                    this.oneFreeNumLab.node.active = false;
                    this.oneConsumeItem.node.active = true;
                    let item = ItemUtil.CreateThing(this.std.shopStd.ConsumeX1Type[0], this.std.shopStd.ConsumeX1ItemId[0], this.std.shopStd.ConsumeX1Cost[0]);
                    this.oneConsumeItem.SetData(item);
                } else {
                    this.oneAdBtn.node.active = true;
                    this.jumpAd.active = PlayerData.GetIsActivateRights();
                    this.oneBtn.node.active = false;
                }
            } else {
                this.oneFreeNumLab.node.active = false;
                this.oneConsumeItem.node.active = true;
                let item = ItemUtil.CreateThing(this.std.shopStd.ConsumeX1Type[0], this.std.shopStd.ConsumeX1ItemId[0], this.std.shopStd.ConsumeX1Cost[0]);
                this.oneConsumeItem.SetData(item);
            }
        }

    }
    private async onBtnClick(btn: Button): Promise<void> {
        switch (btn) {
            case this.oneBtn:
                if (this.data.frequency < 0) {
                    MsgPanel.Show("抽卡次数不足");
                    return;
                }
                if (this.data.freex1_count < 1) {
                    if (!ItemUtil.CheckThingConsumes(this.std.shopStd.ConsumeX1Type, this.std.shopStd.ConsumeX1ItemId, this.std.shopStd.ConsumeX1Cost, false)) {
                        let count: number = ItemUtil.GetHaveThingNum(this.std.shopStd.ConsumeX1Type[0], this.std.shopStd.ConsumeX1ItemId[0]);
                        ShopLuckyBuyPanel.Show(this.std, 1, 1);
                        return;
                    }
                }
                Session.Send({ type: MsgTypeSend.ShopDoLucky, data: { shop_index_id: this.std.shopId, count: 1, convert_count: 0 } });
                break;
            case this.tenBtn:
                if (this.data.frequency < 0) {
                    MsgPanel.Show("抽卡次数不足");
                    return;
                }
                if (this.data.freex10_count < 1) {
                    let needCount: number = this.std.shopStd.ConsumeX1Cost[0] * 10;
                    if (!ItemUtil.CheckThingConsumes(this.std.shopStd.ConsumeX1Type, this.std.shopStd.ConsumeX1ItemId, [needCount], false)) {
                        let haveNum: number = ItemUtil.GetHaveThingNum(this.std.shopStd.ConsumeX1Type[0], this.std.shopStd.ConsumeX1ItemId[0]);
                        ShopLuckyBuyPanel.Show(this.std, 10, needCount - haveNum);
                        return;
                    }
                }
                Session.Send({ type: MsgTypeSend.ShopDoLucky, data: { shop_index_id: this.std.shopId, count: 10, convert_count: 0 } });
                break;
            case this.helpBtn:
                let stdPool: StdShopLuckyPool = CfgMgr.GetShopLuckyPool(this.std.shopStd.RewardPools);
                if (stdPool) {
                    Tips2.Show(stdPool.Instructions);
                }

                break;
            case this.oneAdBtn:
                let adId: number = this.std.shopStd.AdTime;
                let adData: SAdvister = PlayerData.GetAdvisterData(adId);
                if (!adData || adData.count < 1) {
                    MsgPanel.Show("广告已看完");
                    return;
                }
                if (game.totalTime < adData.cdEndTime) {
                    MsgPanel.Show("冷却中，请稍后！");
                    return;
                }
                this.oneAdBtn.interactable = false;
                // SetNodeGray(this.oneAdBtn.node, true, true);
                if(PlayerData.GetIsActivateRights()){
                    AdHelper.JumpAd(adId, "")
                }else{
                    console.log("AdHelper---> rewardAdId3:", GameSet.globalCfg.ad_channel.rewardAdId3);
                    let action, errorCode, errorMsg;
                    if (Math.abs(GameSet.globalCfg.ad_channel.rewardAdId3) == 1) {
                        [action, errorCode, errorMsg] = await AdHelper.rewardAd(getAdcfg().rewardAdId3, adId, "");
                    } else {
                        [action, errorCode, errorMsg] = await AdHelper.rewardQbAd(getQbAdCfg().rewardAdId3, adId, "");
                    }
                    if (action == "onLoadFailed") {
                        if (Math.abs(GameSet.globalCfg.ad_channel.rewardAdId3) == 1) {
                            if (GameSet.globalCfg.ad_channel.rewardAdId3 > 0) GameSet.globalCfg.ad_channel.rewardAdId3 = 2;
                            Tips.Show("广告加载失败，请稍后再试！");
                        } else {
                            if (GameSet.globalCfg.ad_channel.rewardAdId3 > 0) GameSet.globalCfg.ad_channel.rewardAdId3 = 1;
                            Tips.Show("广告展示失败，请稍后再试！");
                        }
                    } else {
                        // SetNodeGray(this.oneAdBtn.node, false, true);
                    }
                    PlayerData.SetAdvisterCd(adId);
                    this.oneAdBtn.interactable = true;
                }
                break;
        }
    }
    SetData(std: StdLuckyShop) {
        this.std = std;
        this.updateShow();

    }

    private updateShow() {
        if (!this.isInit || !this.std) return;
        this.data = PlayerData.GetShopLuckyData(this.std.shopId);
        if (!this.data) return;
        let stdPool: StdShopLuckyPool = CfgMgr.GetShopLuckyPool(this.std.shopStd.RewardPools);
        let awardList: SThing[] = [];
        let num: number = 100;
        if (stdPool) {
            for (let i = 0; i < stdPool.Target.length; i++) {
                let index: number = stdPool.Target[i];
                let itemType = stdPool.RewardType[index];
                let itemId = stdPool.RewardId[index];
                let itemNum = stdPool.RewardNumber[index];
                awardList.push(ItemUtil.CreateThing(itemType, itemId, itemNum));
            }
            num = stdPool.GetNumber;
        }
        this.awardList.UpdateDatas(awardList);
        this.numLab.string = num.toString();
        this.yetNumLab.string = `${Math.max(num - this.data.get_number)}次`;
        this.updateAddTime();
        if (this.data.freex10_count > 0) {
            this.tenFreeNumLab.node.active = true;
            this.tenFreeNumLab.string = `免费次数：${this.data.freex10_count}`;
            this.tenConsumeItem.node.active = false;
        } else {
            this.tenFreeNumLab.node.active = false;
            this.tenConsumeItem.node.active = true;
            let item = ItemUtil.CreateThing(this.std.shopStd.ConsumeX1Type[0], this.std.shopStd.ConsumeX1ItemId[0], this.std.shopStd.ConsumeX1Cost[0] * 10);
            this.tenConsumeItem.SetData(item);
        }
        let url = path.join("sheets/shop", this.std.shopStd.LuckyBgRes, "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            this.bg.spriteFrame = res;
        });

        url = path.join("sheets/shop", this.std.shopStd.LuckyTitleRes, "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            this.titleImg.spriteFrame = res;
        });
    }
    protected updateAwardItem(item: Node, data: SThing) {
        let awardItem = item.getComponent(AwardItem);
        if (!awardItem) awardItem = item.addComponent(AwardItem);
        awardItem.SetData({ itemData: data }, true);
    }
    protected onAwardItemSelect(index: number, item: Node) {
        console.log("onSelect", index);
        let data: SThing = item.getComponent(AwardItem).itemData as SThing;
        ItemTips.Show(data);
    }
}