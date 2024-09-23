import { Button, Component, EditBox, EventTouch, Input, Label, Node, Sprite, SpriteFrame, Toggle, path, sp, tween } from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_Item_Change, Evt_Mail_Update } from "../../manager/EventMgr";
import { MailSendPanel } from "./MailSendPanel";
import { SMailPlayerData } from "../roleModule/PlayerData";
import { CfgMgr } from "../../manager/CfgMgr";

export class MailPlayerPanel extends Panel {
    protected prefab: string = "prefabs/mail/MailPlayerPanel";

    protected head: Node;
    protected nameLab: Label;
    protected uidLab: Label;
    protected homlandLab: Label;
    protected inviteBtn: Node;
    protected giftBtn: Node;
    private data: SMailPlayerData = null;

    protected onLoad() {
        this.CloseBy("mask");
        this.CloseBy("spriteFrame/Close");
        this.head = this.find(`spriteFrame/headInfo`);
        this.nameLab = this.find(`spriteFrame/msg/role_name`, Label);
        this.uidLab = this.find(`spriteFrame/msg/uid`, Label);
        this.homlandLab = this.find(`spriteFrame/msg/land`, Label);
        this.inviteBtn = this.find(`spriteFrame/inviteBtn`);
        this.giftBtn = this.find(`spriteFrame/giftBtn`);
        this.onBntEvent()
        // EventMgr.on(Evt_Mail_Update, this.flush, this);
    }

    private onBntEvent() {
        this.inviteBtn.on(Input.EventType.TOUCH_END, () => { }, this);
        this.giftBtn.on(Input.EventType.TOUCH_END, this.onSendGift, this);
    }

    private onSendGift() {
        MailSendPanel.Show(this.data);
    }

    protected onShow(): void {

    }

    public flush(data: SMailPlayerData): void {
        this.data = data;
        this.initMsg()
    }

    /**初始化玩家信息 */
    private initMsg() {
        this.nameLab.string = this.data.name;
        this.uidLab.string = this.data.player_id;
        let homeLandMsg = CfgMgr.GetHomeLandInit(this.data.homeland_id);
        if (homeLandMsg) {
            this.homlandLab.string = homeLandMsg.Desc[0];
        }
        // this.head
    }

    protected onHide(...args: any[]): void {
        // EventMgr.off(Evt_Mail_Update, this.flush, this);
    }

}
