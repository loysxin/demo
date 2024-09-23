import { Input, Label, Node, ScrollView, Toggle, UITransform } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { SPlayerDataItem, SPlayerMailData, SThing } from "../roleModule/PlayerData";
import { AutoScroller } from "../../utils/AutoScroller";
import { UpdateBagItem } from "../common/BaseUI";
import { countDown2, formatDate, formatK } from "../../utils/Utils";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { Tips } from "../login/Tips";
import LocalStorage from "../../utils/LocalStorage";
import { DateUtils } from "../../utils/DateUtils";
import { MailDeletePanel } from "./MailDeletePanel";
import { BagItem } from "../bag/BagItem";
import { CfgMgr, StdCommonType } from "../../manager/CfgMgr";

export class MailContentPanel extends Panel {
    protected prefab: string = "prefabs/mail/MailContentPanel";

    protected title: Label;
    protected time: Label;
    protected sender: Label;
    protected desc: Label;
    protected scroller: AutoScroller;
    protected getBtn: Node;
    protected mailInfo: SPlayerMailData;
    protected delete_time: Label;
    private time_lock:number;

    protected onLoad() {
        this.CloseBy("mask");
        this.CloseBy("closeBtn");
        this.title = this.find("title", Label);
        this.time = this.find("time", Label);
        this.sender = this.find("sender", Label);
        this.desc = this.find("ScrollViewLab/view/content/desc", Label);
        this.scroller = this.find("ScrollView", AutoScroller);
        this.scroller.SetHandle(this.UpdateBagItem.bind(this));

        this.delete_time = this.find("bottom/delete_time", Label);
        this.getBtn = this.find("getBtn");
        this.find("delBtn").on(Input.EventType.TOUCH_END, this.onDel, this);
        this.getBtn.on(Input.EventType.TOUCH_END, this.onGet, this);
    }

    /**获取附件 */
    protected onGet() {
        let data = {
            type: MsgTypeSend.ClaimMailAttachments,
            data: {
                mail_id: this.mailInfo._id
            }
        }
        Session.Send(data);
    }

    /**删除邮件 */
    protected onDel() {
        if (!this.mailInfo.is_attachment_claimed) {
            Tips.Show("请先提取附件");
        } else {
            let time = LocalStorage.GetNumber("MailDeletePanel" + PlayerData.roleInfo.player_id)
            if (time) {
                let isopen = DateUtils.isSameDay(time)
                if (isopen) {
                    this.onDelMail();
                    return;
                }
            }
            MailDeletePanel.Show(this.onDelMail.bind(this));
        }
    }

    private onDelMail() {
        let data = {
            type: MsgTypeSend.DeleteMail,
            data: {
                mail_ids: [this.mailInfo._id]
            }
        }
        Session.Send(data);
        this.Hide();
    }

    protected onShow(): void {

    }
    /**
     * 更新背包道具item
     * @param item 
     * @param data 
     */
    private async UpdateBagItem(item: Node, data: SPlayerDataItem | SThing) {
        await UpdateBagItem(item, data);
        this.scheduleOnce(() => {
            item.getComponent(Toggle).enabled = false;
        })
        item.getComponent(BagItem).setIsShowTips(true);
    }

    public flush(data: SPlayerMailData): void {
        this.mailInfo = data;
        this.title.string = this.mailInfo.title
        this.time.string = `收件时间：${formatDate(data.time * 1000, 'yyyy-MM-dd hh:mm:ss')}`;
        this.desc.string = data.content;
        this.sender.string = `发件人：${data.sender_player_name || `系统邮件`}`;
        let time_differ = PlayerData.GetServerTime() - data.time;
        let deleteTime:number
        if (data.attachments && data.attachments.data && data.attachments.data.length) {
            let reward_data = PlayerData.getMailReward(data.attachments.data);
            this.scroller.UpdateDatas(reward_data);
            if (data.is_attachment_claimed) {
                this.getBtn.active = false;
                deleteTime = CfgMgr.GetCommon(StdCommonType.Mail).DeleteTime2
            } else {
                this.getBtn.active = true;
                deleteTime = CfgMgr.GetCommon(StdCommonType.Mail).DeleteTime1
            }
        } else {
            this.scroller.UpdateDatas([]);
            this.getBtn.active = false;
            deleteTime = CfgMgr.GetCommon(StdCommonType.Mail).DeleteTime2
        }
       
        if(time_differ > deleteTime){
            this.delete_time.string = "";
        }else{
            //最大时间 - 已过时间 = 剩余时间
            this.setTimeLabel(this.delete_time, deleteTime, time_differ)
        }
    }

    private setTimeLabel(lbl:Label, max_time:number,  pass_time:number){
        let seconds = max_time - pass_time + PlayerData.GetServerTime();
        seconds = Math.floor(seconds)
        let show_time = countDown2(seconds);
        if( show_time.d > 0){
            lbl.string = "剩余" + show_time.d + "天";
        }else{
            lbl.string = "剩余" + show_time.h + ":" + show_time.m + ":" + show_time.s;
        }
        if(this.time_lock){
            clearInterval(this.time_lock)
        }
        if(this.time_lock){
            clearInterval(this.time_lock)
        }
        this.time_lock = setInterval(() => {
            if (seconds > 0) {
                seconds -= 1;
                let time = countDown2(seconds);
                if(time.d > 0){
                    lbl.string = "剩余" + time.d + "天";
                }else{
                    lbl.string = "剩余" + time.h + ":" + time.m + ":" + time.s;
                }
            } else {
                clearInterval(this.time_lock);
            }
        }, 1000)
    }

    protected onHide(...args: any[]): void {

    }

}
