import { Node, Button, Label, RichText, Sprite } from "cc";
import { Panel } from "../../GameRoot";
import { CfgMgr } from "../../manager/CfgMgr";
import PlayerData from "../roleModule/PlayerData";
import { Tips } from "../login/Tips";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";


export class LootVsBuyNumPanel extends Panel {
    protected prefab: string = "prefabs/panel/loot/LootVsBuyNumPanel";
    //private tipsLab: RichText;
    private numLab: Label;
    private buyNumLab: Label;
    private buyBtn: Node;
    private callBack: Function = null;
    private money: Label;
    private itemCount: Label;
    private itemShow: Label;
    private count: Label;
    private useMoneyNode: Node;
    private useItemNode: Node;
    private useItem: Node;
    private isUseItem: boolean = false;
    protected onLoad() {
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
        this.useMoneyNode = this.find(`tipsBg/Money`);
        this.buyBtn = this.useMoneyNode.getChildByName(`buyBtn`);
        this.useItemNode = this.find(`tipsBg/Item`);
        this.useItem = this.useItemNode.getChildByName(`useItem`);
        this.itemCount = this.useItemNode.getChildByName("money").getComponent(Label);

        //this.tipsLab = this.find(`tipsBg/tipsLab`, RichText);
        this.numLab = this.find(`numCont/numLab`, Label);
        this.buyNumLab = this.buyBtn.getChildByPath(`ConsumeItem/numLab`).getComponent(Label);
        this.money = this.find(`tipsBg/Money/money`, Label);
        this.count = this.find(`tipsBg/Money/money/Label/qiangduo/count`, Label);
        this.itemShow = this.find(`tipsBg/Item/useItem/ConsumeItem/numLab`, Label);
        this.onBtnEvent();
    }

    private onBtnEvent() {
        this.buyBtn.on(Button.EventType.CLICK, this.onClickBuy, this);
        this.useItem.on(Button.EventType.CLICK, this.onClickBuy, this);
    }

    protected onShow(): void {

    }
    public flush(...args: any[]): void {
        this.callBack = args[0];
        // this.revengeId = args[1];
        // let str = `<color=#49737C>是否花费<color=#dc7816>%s</color>彩虹体购买并消耗抢夺战帖后增加<color=#dc7816>1</color>次抢夺次数？</color>\n<color=#587379><size=30>（挑战次数每天刷新，跨天不会累积）</size></color>`
        let seasonData = CfgMgr.getPVPById(PlayerData.LootSeasonInfo.season_id);
        let replacement = seasonData.Money;
        this.isUseItem = PlayerData.GetItemCount(seasonData.ConsumeItem) >= seasonData.ConsumeNumber;
        this.useItemNode.active = this.isUseItem;
        this.useMoneyNode.active = !this.isUseItem;
        this.itemShow.string = seasonData.ConsumeNumber.toString();
        this.itemCount.string = `x${seasonData.ConsumeNumber}`
        // str = str.replace(/%s/g, `${replacement}`);
        // this.tipsLab.string = str;
        this.money.string = `x${replacement}`;
        this.count.string = `x1`;
        this.buyNumLab.string = `${replacement}`;

        this.numLab.string = `${PlayerData.LootPlayerData.paid_refresh_count}/${seasonData.AddTime}`
        this.buyBtn.getComponent(Sprite).grayscale = PlayerData.LootPlayerData.paid_refresh_count <= 0 || PlayerData.roleInfo.currency < replacement;
        this.useItem.getComponent(Sprite).grayscale = !this.isUseItem;
    }
    protected onEnable(): void {
    }
    protected onHide(...args: any[]): void {

    }
    private onClickBuy() {
        let seasonData = CfgMgr.getPVPById(PlayerData.LootSeasonInfo.season_id);
        if(this.isUseItem)
        {
            PlayerData.LootPlayerData.is_use_item = true;
            if (this.useItem.getComponent(Sprite).grayscale) return;
            let data = {
                type: MsgTypeSend.UseItem,
                data: {
                    item_id: seasonData.ConsumeItem
                }
            }
            Session.Send(data);
        }
        else
        {
            if (this.buyBtn.getComponent(Sprite).grayscale) return;
            PlayerData.LootPlayerData.is_use_item = false;
            let money = seasonData.Money;
            if (money > PlayerData.roleInfo.currency) {
                this.Hide();
                Tips.Show(`彩虹体不足!`);
                return;
            }

            let data = {
                type: MsgTypeSend.BuyPlunderTimes,
                data: {
                }
            }
            Session.Send(data);
        }
        LootVsBuyNumPanel.Hide();
    }
}