import { Button, Component, EditBox, EventTouch, Input, Label, Node, RichText, Sprite, SpriteFrame, Toggle, find, path, sp, tween } from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_Item_Change, Evt_Mail_Update, Evt_SendMail } from "../../manager/EventMgr";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import PlayerData, { SMailPlayerData } from "../roleModule/PlayerData";
import { CfgMgr, StdCommonType } from "../../manager/CfgMgr";
import { GetNumberAccuracy, ToFixed } from "../../utils/Utils";
import { Tips } from "../login/Tips";

export class MailSendPanel extends Panel {
    protected prefab: string = "prefabs/mail/MailSendPanel";

    protected head: Node;
    protected nameLab: Label;
    protected uidLab: Label;
    protected homlandLab: Label;
    protected EditBox: EditBox;
    protected giftBtn: Node;
    private data: SMailPlayerData = null;
    private haveLabel: Label;
    private costLabel: Label;
    private allLabel: Label;
    private surePanel: Node;
    private surePanelLabel: Label;
    private RichText: RichText;
    private MailCost = 0;

    protected onLoad() {
        this.CloseBy("mask");
        this.CloseBy("spriteFrame/Close");
        this.head = this.find(`spriteFrame/headInfo`);
        this.nameLab = this.find(`spriteFrame/msg/role_name`, Label);
        this.uidLab = this.find(`spriteFrame/msg/uid`, Label);
        this.homlandLab = this.find(`spriteFrame/msg/homeLand`, Label);
        this.giftBtn = this.find(`spriteFrame/giftBtn`);
        this.haveLabel = this.find(`spriteFrame/msg/have/PriceLayout/Price`, Label);
        this.costLabel = this.find(`spriteFrame/msg/cost/PriceLayout/Price`, Label);
        this.allLabel = this.find(`spriteFrame/msg/all/PriceLayout/Price`, Label);
        this.EditBox = this.find(`spriteFrame/msg/sendMsg/editboxBg/EditBox`, EditBox);
        this.surePanel = this.find(`surePanel`);
        this.surePanelLabel = this.find(`surePanel/spriteFrame/MidBg/lab`, Label);
        this.RichText = this.find(`spriteFrame/RichText`, RichText);
        this.onBntEvent()
    }

    private onBntEvent() {
        this.giftBtn.on(Button.EventType.CLICK, this.onShowSurePanel, this);
        this.EditBox.node.on(EditBox.EventType.EDITING_DID_ENDED, this.onEditEnd, this);
        this.EditBox.node.on(EditBox.EventType.TEXT_CHANGED, this.onTextChanged, this);
        find(`spriteFrame/Close`, this.surePanel).on(Input.EventType.TOUCH_END, () => { this.surePanel.active = false }, this);
        find(`spriteFrame/closeBtn`, this.surePanel).on(Input.EventType.TOUCH_END, () => { this.surePanel.active = false }, this);
        find(`spriteFrame/sureBtn`, this.surePanel).on(Input.EventType.TOUCH_END, this.onSendGift, this);
    }

    private onShowSurePanel() {
        let count = Number(this.EditBox.string);
        if (!count || count < 1) {
            return Tips.Show(`请输入要赠送的货币数量！`);
        }
        if (count < CfgMgr.GetCommon(StdCommonType.Mail).Min) {
            return Tips.Show(`未达最小起赠值`);
        }
        if (count > CfgMgr.GetCommon(StdCommonType.Mail).Max) {
            return Tips.Show(`要赠送的超过上限，最多赠送${CfgMgr.GetCommon(StdCommonType.Mail).Max}，请检查后重试！`);
        }
        if (Number(this.allLabel.string) > PlayerData.roleInfo.currency) {
            return Tips.Show(`彩虹体不足,请检查后重试！`);
        }
        this.surePanel.active = true;
        this.surePanelLabel.string = `将发送${this.EditBox.string}彩虹体给${this.data.name}，是否确认继续`;
    }

    private onSendGift() {
        let data = {
            type: MsgTypeSend.SendCurrencyMail,
            data: {
                receiver_id: this.data.player_id,        // 玩家ID
                amount: Number(this.EditBox.string),        // 数量
            }
        }
        Session.Send(data);
    }

    private onEditEnd() {
        let count = Number(this.EditBox.string);
        let cost = this.MailCost || 0;
        let num = GetNumberAccuracy((count * cost), 2);
        this.costLabel.string = `${Math.ceil((num) * 100) / 100}`;
        this.allLabel.string = `${Math.ceil((num + count) * 100) / 100}`;
    }

    private onTextChanged() {
        let count = Number(this.keepNumbersAndOneDot(this.EditBox.string));
        this.EditBox.string = `${Math.ceil((count) * 100) / 100}`;
    }

    private keepNumbersAndOneDot(str) {
        // 使用正则表达式来提取所有数字和小数点
        let result = str.replace(/[^0-9.]/g, '');

        // 找到第一个小数点的位置
        let firstDotIndex = result.indexOf('.');

        // 如果找到了小数点，移除其后的所有小数点
        if (firstDotIndex !== -1) {
            result = result.substring(0, firstDotIndex + 1) + result.substring(firstDotIndex + 1).replace(/\./g, '');
        }

        return result;
    }

    protected onShow(): void {
        EventMgr.on(Evt_SendMail, this.Hide, this);
        this.costLabel.string = `${0}`;
        this.allLabel.string = `${0}`;
        this.EditBox.string = ``;
        this.surePanel.active = false;
        let is_has_rights = PlayerData.GetIsActivateRights();
        console.log("is_has_rights", is_has_rights);
        if (is_has_rights) {
            this.MailCost = CfgMgr.getEquityListById(3).Value;
        } else {
            this.MailCost = CfgMgr.GetCommon(StdCommonType.Mail).MailCost;
        }
        this.RichText.string = `<color=#DD6E24>${CfgMgr.GetCommon(StdCommonType.Mail).Min}</color><color=#849AA7>起赠额外消耗赠送数量的</color><color=#DD6E24>${this.MailCost * 100}%</color><color=#849AA7>作为手续费</color>`
    }

    public flush(data: SMailPlayerData): void {
        this.data = data;
        this.initMsg();
    }

    private initMsg() {
        this.nameLab.string = this.data.name;
        this.uidLab.string = `UID:${this.data.player_id}`;
        let homeLandMsg = CfgMgr.GetHomeLandInit(this.data.homeland_id);
        if (homeLandMsg) {
            this.homlandLab.string = homeLandMsg.Desc[0];
        }
        this.haveLabel.string = `${this.setResCount(PlayerData.roleInfo.currency)}`;
    }
    /**资源和货币的数量展示 */
    private setResCount(count: number) {
        //判断是否是小数
        let str = count.toString();
        if (str.indexOf(".") != -1) {
            str = ToFixed(count, 2);
        } else {
            str = str + ".00"
        }
        return str;
    }

    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_SendMail, this.Hide, this);
    }

}
