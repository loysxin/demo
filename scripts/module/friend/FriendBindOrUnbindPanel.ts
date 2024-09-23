import { Button, EditBox, EventTouch, Input, Label, Node, Sprite, SpriteFrame, Toggle, Touch, UIOpacity, instantiate, path, v3 } from "cc";
import { Panel } from "../../GameRoot";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import PlayerData, { SGetIncomes, SGetUplineInfo, SIncomesInfo, SUplineInfo } from "../roleModule/PlayerData";
import { DateUtils } from "../../utils/DateUtils";
import { EventMgr, Evt_CloseFriendBindOrUnbindPanel } from "../../manager/EventMgr";
import { Tips } from "../login/Tips";
import { CfgMgr, StdCommonType } from "../../manager/CfgMgr";

export enum FriendBindType {
    bind,
    unbind,
}

export class FriendBindOrUnbindPanel extends Panel {
    protected prefab: string = "prefabs/panel/friend/FriendBindOrUnbindPanel";

    private buildTittle: Label;
    private confirmBtn: Button;
    private unbindNode: Node;
    private bindNode: Node;
    private EditBox: EditBox;
    private lbl: Label;
    private last_day: Label;
    private unday1: Label;
    private unday2: Label;


    private type: number
    private id: string;
    private uplineData: SUplineInfo;
    private isCanUnbind: boolean = false;
    protected onLoad(): void {
        this.CloseBy("mask");
        this.CloseBy("node/close");
        this.buildTittle = this.find("node/buildTittle", Label);
        this.confirmBtn = this.find("node/confirmBtn", Button);
        this.lbl = this.find("node/confirmBtn/Label", Label);
        this.unbindNode = this.find("node/unbindNode");
        this.last_day = this.find("node/unbindNode/bg/lastNode/last_day", Label);
        this.unday1 = this.find("node/unbindNode/bg/Node/day_num", Label);
        this.unday2 = this.find("node/bindNode/Node/day_num", Label);
        this.bindNode = this.find("node/bindNode");
        this.EditBox = this.find("node/bindNode/EditBox", EditBox)
        this.confirmBtn.node.on("click", this.onConfirmBtn, this);
        this.EditBox.node.on('editing-did-ended', this.onEditBoxEnded, this)
        EventMgr.on(Evt_CloseFriendBindOrUnbindPanel, this.onClose, this)
    }

    protected onShow(): void {
    }

    async flush(type: number, info: SUplineInfo) {
        this.type = type;
        this.uplineData = info;
        let day = CfgMgr.GetCommon(StdCommonType.Friend).UnboundDays
        day = day ? day : 0
        this.buildTittle.string = type == FriendBindType.bind ? "绑定邀请人" : "解绑邀请人"
        let isbind = type == FriendBindType.bind ? true : false;
        this.lbl.string = type == FriendBindType.bind ? "绑定" : "解绑"
        this.unday1.string = day + "天";
        this.unday2.string = day + "天";
        this.bindNode.active = isbind;
        this.unbindNode.active = !isbind;
        if(info){
            if(!info.is_online){  
                if(info.last_offline_time != 0){
                    let time_data = DateUtils.timeElapsedSince(info.last_offline_time * 1000);
                    if (time_data.days) {
                        this.last_day.string = time_data.days + "天前";
                        this.isCanUnbind = time_data.days >= day;
                    } else if (time_data.hours) {
                        this.last_day.string = time_data.hours + "小时前";
                    } else if (time_data.minutes) {
                        this.last_day.string = time_data.minutes + "分钟前";
                    }
                }else{
                    this.isCanUnbind = true;
                    this.last_day.string = day + "天前";
                }
            }else{
                this.last_day.string = "在线"
            }
        }
    }


    private onConfirmBtn() {
        let isbind = (this.type == FriendBindType.bind);

        if (isbind) {
            //绑定确认
            let lv = CfgMgr.GetCommon(StdCommonType.Friend).BindingLv
            let home_lv:number;
            for (let building of PlayerData.roleInfo.homelands[0].buildings) {
                if (building.id == 1) {
                    home_lv = building.level;
                }
            }
            let isCanBind = (lv <= home_lv);
            if(isCanBind){
                let data = {
                    type: MsgTypeSend.BindUplineRequest,
                    data: { upline_id: this.id },
                }
                Session.Send(data)
            }else{
                Tips.Show("生命树需要" + lv + "级")
            }
        } else {
            //解绑确认
            if (this.isCanUnbind) {
                let data = {
                    type: MsgTypeSend.UnbinduplineRequest,
                    data: {},
                }
                Session.Send(data);
            } else {
                Tips.Show("未到解绑时间")
            }
        }

    }

    private onEditBoxEnded(editbox: EditBox) {
        this.id = editbox.string;
    }

    private onClose() {
        this.Hide();
    }

    protected onHide(...args: any[]): void {
        this.EditBox.string = "";
    }
}