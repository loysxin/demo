import { Button, Component, EditBox, EventTouch, Input, Label, Node, ScrollView, Sprite, SpriteFrame, Toggle, find, path, sp, tween } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { SPlayerDataItem, SPlayerMailData, SThing } from "../roleModule/PlayerData";
import { AutoScroller } from "../../utils/AutoScroller";
import { ResMgr, folder_icon, folder_mail } from "../../manager/ResMgr";
import { EventMgr, Evt_Hide_Scene, Evt_Item_Change, Evt_Mail_Add, Evt_Mail_Update, Evt_ReadMail, Evt_Show_Scene } from "../../manager/EventMgr";
import { countDown2, formatDate, formatK } from "../../utils/Utils";
import { MailContentPanel } from "./MailContentPanel";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { Tips } from "../login/Tips";
import { UpdateBagItem } from "../common/BaseUI";
import { DateUtils } from "../../utils/DateUtils";
import { AudioMgr, Audio_CommonDelete, Audio_OpenMail } from "../../manager/AudioMgr";
import { CfgMgr, StdCommonType } from "../../manager/CfgMgr";

export class MailPanel extends Panel {
    protected prefab: string = "prefabs/mail/MailPanel";

    protected page = 1;
    protected pageSize = 6;
    protected scroller: AutoScroller;
    private nav: Node;
    private SendMail: Node;
    private myUidLab:Label;
    private EditBox: EditBox;
    private deletBtn: Node;
    private getAwardBtn: Node;
    private serchBtn: Node;
    private seleteIndex: 0;
    private systemList: SPlayerMailData[] = []
    private playerList: SPlayerMailData[] = []
    private empty: Node;
    private content:Node;
    private deleteTime1:number;
    private deleteTime2:number

    // private time_lock:number

    protected onLoad() {
        this.CloseBy("layout/closeBtn");
        this.nav = this.find(`layout/nav`);
        this.scroller = this.find("layout/ScrollView", AutoScroller);
        this.content = this.find(`layout/ScrollView/view/content`);
        this.SendMail = this.find("layout/SendMail");
        this.EditBox = this.find("layout/SendMail/editboxBg/EditBox", EditBox);
        this.myUidLab = this.find("layout/SendMail/myUidLab", Label);
        this.deletBtn = this.find("layout/deletBtn");
        this.getAwardBtn = this.find("layout/getAwardBtn");
        this.serchBtn = this.find("layout/serchBtn");
        this.empty = this.find("layout/empty");

        this.scroller.SetHandle(this.updateMailItem.bind(this));
        this.onBntEvent()
    }

    private onBntEvent() {
        this.nav.children.forEach((node, index) => {
            node.on(Input.EventType.TOUCH_END, () => { this.onTouchNav(index) }, this);
        })
        this.serchBtn.on(Input.EventType.TOUCH_END, this.onSerch, this);
        this.deletBtn.on(Input.EventType.TOUCH_END, this.onDeleteAll, this);
        this.getAwardBtn.on(Input.EventType.TOUCH_END, this.onClaimAll, this);
    }

    private onTouchNav(index) {
        this.seleteIndex = index;
        this.nav.children[index].getComponent(Toggle).isChecked = true;
        if (index == 2) {//发件
            this.scroller.node.active = false;
            this.SendMail.active = true;
            this.deletBtn.active = false;
            this.getAwardBtn.active = false;
            this.serchBtn.active = true;
        } else {//个人和系统邮件
            this.scroller.node.active = true;
            this.SendMail.active = false;
            this.deletBtn.active = true;
            this.getAwardBtn.active = true;
            this.serchBtn.active = false;
            this.page = 1;
            PlayerData.mails = [];
            PlayerData.mailmap = {};
            this.onRefershItem();
        }
    }

    private async updateMailItem(item: Node, data: SPlayerMailData, index: number) {
        item.getChildByName(`title`).getComponent(Label).string = data.title;
        let time = DateUtils.timeElapsedSince(data.time * 1000);
        let str = "";
        if (time.days > 0) {
            str = `${time.days}天前`
        } else if (time.hours > 0) {
            str = `${time.hours}小时前`
        } else if (time.minutes > 0) {
            str = `${time.minutes}分前`
        } else if (time.seconds > 0) {
            str = `${time.seconds}秒前`
        } 
        
        item.getChildByName("time").getComponent(Label).string = `${str}`;
        let scroller = item.getChildByName(`itemLayout`).getComponent(AutoScroller);
        scroller.SetHandle(this.UpdateBagItem.bind(this));
        let reward_data = PlayerData.getMailReward(data.attachments.data);
        scroller.UpdateDatas(reward_data);
        let bg = item.getChildByName(`bg`).getComponent(Sprite);
        let mailIcon = item.getChildByName(`mailIcon`).getComponent(Sprite);
        let awardIcon = item.getChildByName(`awardIcon`).getComponent(Sprite);
        let state = item.getChildByName(`state`).getComponent(Label);

        let max_time:number;
        if (data.is_attachment_claimed) {
            awardIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_mail, `getAward`, "spriteFrame"), SpriteFrame);
            bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_mail, `readBg`, "spriteFrame"), SpriteFrame);
            state.string = `已领取`;
            scroller.node.getComponent(ScrollView).content.children.forEach((node) => {
                node.children.forEach((child) => {
                    if (child.getComponent(Sprite)) child.getComponent(Sprite).grayscale = true;
                })
            })
            max_time = this.deleteTime2
            // if(time_differ > this.deleteTime2){
            //     delete_item.string = "";
            // }else{
            //     //最大时间 - 已过时间 = 剩余时间
            //     this.setTimeLabel(delete_item, this.deleteTime2, time_differ, data.lock_time)
            // }
        } else {
            scroller.node.getComponent(ScrollView).content.children.forEach((node) => {
                node.children.forEach((child) => {
                    if (child.getComponent(Sprite)) child.getComponent(Sprite).grayscale = false;
                })
            })
            awardIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_mail, `unGetAward`, "spriteFrame"), SpriteFrame);
            if (data.is_read) {
                bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_mail, `readBg`, "spriteFrame"), SpriteFrame);
                mailIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_mail, `redIcon`, "spriteFrame"), SpriteFrame);
                state.string = `已读`;

                if(reward_data.length > 0){  
                    max_time = this.deleteTime1   
                }else{
                    max_time = this.deleteTime2
                }

            } else {
                bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_mail, `unReadBg`, "spriteFrame"), SpriteFrame);
                mailIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_mail, `unRedIcon`, "spriteFrame"), SpriteFrame);
                state.string = `未读`;
                max_time = this.deleteTime1
            }
        }
        item["data"] = {is_attachment_claimed:data.is_attachment_claimed, is_read:data.is_read,
             is_reward:reward_data.length>0, max_time:max_time, time: data.time};
      

        item.off(Input.EventType.TOUCH_END)
        item.on(Input.EventType.TOUCH_END, () => { this.onSelect(data._id) }, this);
        this.checkPage(data);
    }

    /**
     * 更新背包道具item
     * @param item 
     * @param data 
     */
    private async UpdateBagItem(item: Node, data: SPlayerDataItem | SThing) {
        await UpdateBagItem(item, data);
        item.getComponent(Toggle).enabled = false;
    }

    protected onSelect(id: string) {
        AudioMgr.PlayOnce(Audio_OpenMail);
        let info = {
            type: MsgTypeSend.ReadMail,
            data: {
                mail_id: id,        // 邮件读取状态筛选条件: 0-所有邮件, 1-已读邮件, 2-未读邮件
            }
        }
        Session.Send(info);
    }

    private onSerch() {
        if (this.EditBox.string) {
            if (this.EditBox.string == PlayerData.roleInfo.player_id) return Tips.Show(`无法搜索自己的ID`);
            let data = {
                type: MsgTypeSend.GetPlayerInfo,
                data: {
                    player_id: this.EditBox.string,        // 玩家ID
                }
            }
            this.EditBox.string = ``;
            Session.Send(data);
        } else {
            Tips.Show(`请输入玩家ID！`);
        }
    }

    protected onShow(): void {
        this.scroller.UpdateDatas([]);
        this.page = 1;
        this.onTouchNav(0);
        EventMgr.on(Evt_Mail_Add, this.onRefershItem, this);
        EventMgr.on(Evt_Mail_Update, this.flush, this);
        EventMgr.on(Evt_ReadMail, this.flush, this)
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
    }

    public flush(...args: any[]): void {
        this.myUidLab.string = `我的UID:${PlayerData.roleInfo.player_id}`;
        let time_data = CfgMgr.GetCommon(StdCommonType.Mail);
        this.deleteTime1 = time_data.DeleteTime1;
        this.deleteTime2 = time_data.DeleteTime2;

        let datas = [];
        PlayerData.mails.forEach((data) => {
            if (this.seleteIndex == 0) {
                if (!data.sender_player_id || data.sender_player_id.length < 1) {
                    datas.push(data)
                    this.systemList.push(data);
                }
            } else {
                if (data.sender_player_id && data.sender_player_id.length >= 1) {
                    datas.push(data)
                    this.playerList.push(data);
                }
            }
        })
        this.scroller.UpdateDatas(datas);
        this.empty.active = datas.length <= 0;
    }


    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_Mail_Update, this.flush, this);
        EventMgr.off(Evt_ReadMail, this.flush, this)
        EventMgr.off(Evt_Mail_Add, this.onRefershItem, this);
        // PlayerData.resetMail();
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }

    private onRefershItem() {
        let data = {
            type: MsgTypeSend.GetPlayerMails,
            data: {
                read_flag: 0,        // 邮件读取状态筛选条件: 0-所有邮件, 1-已读邮件, 2-未读邮件
                page: this.page,             // 邮件列表的页码,用于分页
                page_size: this.pageSize, // 每页的邮件数量,用于分页
            }
        }
        Session.Send(data);
    }

    private onDeleteAll() {
        AudioMgr.PlayOnce(Audio_CommonDelete);
        let data = {
            type: MsgTypeSend.DeleteAllMails,
            data: {},
        }
        Session.Send(data);
    }

    private onClaimAll() {
        let data = {
            type: MsgTypeSend.ClaimAllMailAttachments,
            data: {},
        }
        Session.Send(data);
    }

    private checkPage(data: SPlayerMailData) {
        let list = []
        if (this.seleteIndex == 0) {
            list = this.systemList;
        } else {
            list = this.playerList;
        }
        if (!data.is_last && list[list.length - 1] == data) {
            data.is_last = true;
            this.page++;
            this.onRefershItem()
        }

    }

    protected update(dt: number): void {
        for (let index = 0; index < this.content.children.length; index++) {
            const element = this.content.children[index];
            if(element && element["data"] ){
                let data:{is_attachment_claimed:boolean, is_read: boolean, is_reward:boolean, max_time:number, time:number} = element["data"];
                let max_time:number;
                if (data.is_attachment_claimed) {                  
                    max_time = this.deleteTime2            
                } else {
                    if (data.is_read) {
                        if(data.is_reward){  
                            max_time = this.deleteTime1   
                        }else{
                            max_time = this.deleteTime2
                        }    
                    } else {  
                        max_time = this.deleteTime1                    
                    }
                }
                let delete_item =  element.getChildByName("delete_time").getComponent(Label)
                let time_differ = PlayerData.GetServerTime() - data.time
                if(time_differ > max_time){
                    delete_item.string = "";
                }else{
                    //最大时间 - 已过时间 = 剩余时间   
                    let seconds = max_time - time_differ + PlayerData.GetServerTime();
                    seconds = Math.floor(seconds)
                    let show_time = countDown2(seconds);
                    if( show_time.d > 0){
                        delete_item.string = "剩余" + show_time.d + "天";
                    }else{
                        delete_item.string = "剩余" + show_time.h + ":" + show_time.m + ":" + show_time.s;
                    }
                }
            }
            
        }

        
    }

}

