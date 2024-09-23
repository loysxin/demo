import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_ClaimMailAttachments, Evt_DelMail, Evt_Mail_Add, Evt_Mail_Update, Evt_ReadMail as Evt_MailRefersh, Evt_SendMail } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { RewardTips } from "../common/RewardTips";
import { Tips } from "../login/Tips";
import PlayerData, { SMailPlayerData, SPlayerMailData, SThing, SThings } from "../roleModule/PlayerData";
import { MailContentPanel } from "./MailContentPanel";
import { MailPanel } from "./MailPanel";
import { MailPlayerPanel } from "./MailPlayerPanel";

export class MailModule {

    constructor() {
        Session.on(MsgTypeRet.NewMailPush, this.onMailPush, this);
        Session.on(MsgTypeRet.GetPlayerMailsRet, this.onReadMailList, this);
        Session.on(MsgTypeRet.ReadMailRet, this.onReadMail, this);
        Session.on(MsgTypeRet.ClaimMailAttachmentsRet, this.onClaimMailAttachments, this);
        Session.on(MsgTypeRet.DeleteMailRet, this.onDeleteMail, this);
        Session.on(MsgTypeRet.DeleteAllMailsRet, this.onDeleteAllMails, this);
        Session.on(MsgTypeRet.ClaimAllMailAttachmentsRet, this.onClaimAllMailAttachments, this);
        Session.on(MsgTypeRet.GetPlayerInfoRet, this.onPlayerInfo, this);
        Session.on(MsgTypeRet.SendCurrencyMailRet, this.onSendCurrency, this);
    }

    /**
     * 新邮件
     * @param data 
     */
    protected onMailPush(data: { mail: SPlayerMailData }) {
        // if (!PlayerData.mailmap[data.mail._id]) {
        //     PlayerData.mailmap[data.mail._id] = data.mail;
        //     PlayerData.mails.push(data.mail);
        // }
        // EventMgr.emit(Evt_Mail_Add);
        let sendData = {
            type: MsgTypeSend.GetPlayerMails,
            data: {
                read_flag: 0,        // 邮件读取状态筛选条件: 0-所有邮件, 1-已读邮件, 2-未读邮件
                page: 1,             // 邮件列表的页码,用于分页
                page_size: 99999, // 每页的邮件数量,用于分页
            }
        }
        Session.Send(sendData);
    }

    /**接收邮件列表 */
    protected onReadMailList(data: { mails: SPlayerMailData[] }) {
        if (data.mails) {
            for (let mail of data.mails) {
                if (!PlayerData.mailmap[mail._id]) {
                    PlayerData.mailmap[mail._id] = mail;
                    PlayerData.mails.push(mail);
                } else {
                    let curMail = PlayerData.mails.find(item => item._id === mail._id) || null;
                    curMail = mail;
                }
            }
        }
        EventMgr.emit(Evt_Mail_Update);
    }

    /**读取邮件内容 */
    protected onReadMail(data: { mail: SPlayerMailData }) {
        for (let i = 0; i < PlayerData.mails.length; i++) {
            let mail = PlayerData.mails[i];
            if (mail._id == data.mail._id) {
                PlayerData.mails[i] = data.mail;
                PlayerData.mails[i].is_read = true;
                PlayerData.mails[i].content = data.mail.content;
                EventMgr.emit(Evt_MailRefersh);
                MailContentPanel.Show(PlayerData.mails[i]);
                console.log(PlayerData.mails)
                return;
            }
        }
    }

    /**提取附件 */
    protected onClaimMailAttachments(data: { mail_id: string, attachments: SThings }) {
        for (let i = 0; i < PlayerData.mails.length; i++) {
            let mail = PlayerData.mails[i];
            if (mail._id == data.mail_id) {
                mail.is_read = true;
                mail.is_attachment_claimed = true;
                EventMgr.emit(Evt_ClaimMailAttachments, mail.attachments);
                EventMgr.emit(Evt_MailRefersh);
                let reward_data = PlayerData.getMailReward(data.attachments.data);
                RewardTips.Show(reward_data);
                MailContentPanel.Hide();
                console.log(PlayerData.mails)
                return;
            }
        }
    }

    /**删除邮件 */
    protected onDeleteMail(data: { mail_ids: string[] }) {
        for (let i = 0; i < PlayerData.mails.length; i++) {
            let mail = PlayerData.mails[i];
            if (data.mail_ids.indexOf(mail._id) != -1) {
                PlayerData.mails.splice(i, 1);
                delete PlayerData.mailmap[mail._id];
                EventMgr.emit(Evt_DelMail);
            }
        }
    }

    /**删除所有邮件 */
    protected onDeleteAllMails() {
        PlayerData.resetMail();
        let data = {
            type: MsgTypeSend.GetPlayerMails,
            data: {
                read_flag: 0,        // 邮件读取状态筛选条件: 0-所有邮件, 1-已读邮件, 2-未读邮件
                page: 1,             // 邮件列表的页码,用于分页
                page_size: 6, // 每页的邮件数量,用于分页
            }
        }
        Session.Send(data);
        Tips.Show(`删除已读、已领取邮件成功`);
        EventMgr.emit(Evt_MailRefersh);
    }

    /**提取所有附件 */
    protected onClaimAllMailAttachments(data: { claimed_attachments: SThings }) {
        for (let i = 0; i < PlayerData.mails.length; i++) {
            let mail = PlayerData.mails[i];
            mail.is_read = true;
            mail.is_attachment_claimed = true;
        }
        if (data.claimed_attachments.data) {
            let reward_data = PlayerData.getMailReward(data.claimed_attachments.data);
            RewardTips.Show(reward_data);
        } else {
            Tips.Show(`没有可领取邮件!`)
        }
        console.log(PlayerData.mails)
        EventMgr.emit(Evt_MailRefersh);
    }

    /**邮件玩家查询 */
    protected onPlayerInfo(data: SMailPlayerData) {
        if (data.name)
            MailPlayerPanel.Show(data);
        else
            Tips.Show(`没找到指定玩家，请检查后重试！`);
    }

    /**发送五彩石邮件回调 */
    protected onSendCurrency(data) {
        MailPlayerPanel.Hide();
        EventMgr.emit(Evt_SendMail);
        Tips.Show(`发送成功`)
    }

}