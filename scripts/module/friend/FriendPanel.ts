import { Button, EditBox, EventTouch, Input, Label, Node, Skeleton, Sprite, SpriteFrame, Toggle, Touch, UIOpacity, instantiate, path, random, sp, utils, v3 } from "cc";
import { Panel } from "../../GameRoot";
import { MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_Currency_Updtae, Evt_GetIncommons, Evt_GetUPLineInfo, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { FriendListPanel } from "./FriendListPanel";
import { FriendInviteListPanel } from "./FriendInviteListPanel";
import { FriendIncomeListPanel } from "./FriendIncomeListPanel";
import PlayerData, { SGetAgentInfo, SGetIncomes, SGetUplineInfo, SIncomesInfo, SUplineInfo, Tips2ID } from "../roleModule/PlayerData";
import { ResMgr, folder_item, folder_sound } from "../../manager/ResMgr";
import { FriendHelpPanel } from "./FriendHelpPanel";
import { FriendBindOrUnbindPanel, FriendBindType } from "./FriendBindOrUnbindPanel";
import { Second, ToFixed, formatNumber, randomI, randomf } from "../../utils/Utils";
import { DateUtils } from "../../utils/DateUtils";
import { CfgMgr, StdCommonType } from "../../manager/CfgMgr";
import { AudioGroup, AudioMgr, SoundDefine } from "../../manager/AudioMgr";
import { Tips2 } from "../home/panel/Tips2";
import { MsgPanel } from "../common/MsgPanel";
import { AdaptBgTop } from "../common/BaseUI";

export class FriendPanel extends Panel {
    protected prefab: string = "prefabs/panel/friend/FriendPanel";

    private itemNode: Node[];
    private item: Node;
    private currency3: Label;
    private currency: Label;
    private friendInfoPage: Node;
    private invitePage: Node;
    private addNode: Node;
    private infoNode: Node;
    private navBtns: Node[];
    private lookFriendBtn: Button;
    private lookIncomBtn: Button;
    private helpFightBtn: Button;
    private inviteBtn: Button;
    private friendNum: Label;
    private incomeNum: Label;

    private friend_name: Label;
    private friend_time: Label;
    private friend_lv: Label;
    private friend_power: Label;
    private addBtn: Button;
    private unbind: Button;
    private unGetIncome: Node;
    private value: Label;
    private qipao_bg: Node;
    private heleBtn: Node;

    private page: number
    private FriendData: SGetAgentInfo;
    private friendIncomeData: SGetIncomes;
    private uplineFriendInfo: SUplineInfo;
    private totalIncome: number;//累计收益
    private maxFriendNum: number;
    protected onLoad(): void {
        this.CloseBy("closeBtn");
        this.heleBtn = this.find("page/frame/helpBtn");
        this.itemNode = this.find("itemNode").children.concat();
        this.item = this.find("item");
        this.currency3 = this.find("topLayout/currency3/Label", Label);
        this.currency = this.find("topLayout/currency/Label", Label);
        this.friendInfoPage = this.find("page/frame/friendInfoPage");
        this.invitePage = this.find("page/frame/invitePage");
        this.addNode = this.find("page/frame/invitePage/addNode");
        this.infoNode = this.find("page/frame/invitePage/infoNode");
        this.lookFriendBtn = this.find("page/frame/friendInfoPage/frined_bg/lookFriendBtn", Button);
        this.lookIncomBtn = this.find("page/frame/friendInfoPage/incom_bg/lookIncomBtn", Button);
        this.helpFightBtn = this.find("page/frame/helpFightBtn", Button);
        this.inviteBtn = this.find("page/frame/inviteBtn", Button);
        this.friendNum = this.find("page/frame/friendInfoPage/frined_bg/friendNum", Label);
        this.incomeNum = this.find("page/frame/friendInfoPage/incom_bg/Layout/incomeNum", Label);
        this.friend_name = this.find("page/frame/invitePage/infoNode/invite_bg/friend_name", Label);
        this.friend_time = this.find("page/frame/invitePage/infoNode/invite_bg/friend_time", Label);
        this.friend_lv = this.find("page/frame/invitePage/infoNode/juese/friend_lv", Label);
        this.friend_power = this.find("page/frame/invitePage/infoNode/invite_bg/friend_power", Label);
        this.addBtn = this.find("page/frame/invitePage/addNode/addBtn", Button);
        this.unbind = this.find("page/frame/invitePage/infoNode/invite_bg/unbind", Button);
        this.unGetIncome = this.find("page/unGetIncome");
        this.qipao_bg = this.find("page/unGetIncome/qipao_bg");
        this.value = this.find("page/unGetIncome/qipao_bg/value", Label);

        this.navBtns = this.find("page/navBar").children.concat();
        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }
        this.lookFriendBtn.node.on("click", this.onLookFriend, this);
        this.lookIncomBtn.node.on("click", this.onLookIncom, this);
        this.helpFightBtn.node.on("click", this.onHelpFight, this);
        this.inviteBtn.node.on("click", this.onInvite, this);
        this.addBtn.node.on("click", this.onAdd, this);
        this.unbind.node.on("click", this.onUnbind, this);
        this.qipao_bg.on(Input.EventType.TOUCH_END, this.onGet, this);
        this.heleBtn.on(Input.EventType.TOUCH_END, this.onHelpBtn, this);
        EventMgr.on(Evt_GetIncommons, this.updateIncomeData, this)
        EventMgr.on(Evt_GetUPLineInfo, this.updateUpLineData, this)
        EventMgr.on(Evt_Currency_Updtae, this.onCurrencyUpdate, this);
    }

    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
        AudioMgr.playScene("friend_fountain", true);
    }

    async flush(...args: any[]) {
        AdaptBgTop(this.node.getChildByPath("di"));
        this.onCurrencyUpdate();
        this.SetPage(0);
    }

    async SetPage(page: number) {
        if (!this.$hasLoad) await this.initSub;
        if (!this.navBtns[page]) return;
        this.page = undefined;
        this.navBtns[page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[page].getComponent(Toggle));
    }

    private onPage(toggle: Toggle) {
        let page = this.navBtns.indexOf(toggle.node);
        if (page < 0 || page == this.page) return;
        this.page = page;
        this.friendInfoPage.active = false;
        this.invitePage.active = false;
        this.unGetIncome.active = false;
        switch (this.page) {
            case 0:
                let incomeData = {
                    type: MsgTypeSend.GetIncomesRequest,
                    data: {},
                }
                Session.Send(incomeData);

                let friendData = {
                    type: MsgTypeSend.GetAgentInfoRequest,
                    data: {},
                }
                Session.Send(friendData);

                this.friendInfoPage.active = true;
                break;
            case 1:
                // this.navBtns[page].getComponent(Toggle).isChecked = false;
                // MsgPanel.Show("功能暂未开启")
                // this.SetPage(0)
                // return;
                this.invitePage.active = true;
                if (this.FriendData && this.FriendData.upline_id) {
                    let upLineData = {
                        type: MsgTypeSend.GetUplineInfoRequest,
                        data: {},
                    }
                    Session.Send(upLineData);
                } else {
                    let info: SUplineInfo = {
                        player_id: "",
                        name: "",
                        icon_url: "",
                        level: 0,
                        last_offline_time: 0,
                        battle_power: 0,
                        is_online: false,
                    }
                    let upline_data: SGetUplineInfo = { has_upline: false, upline: info }
                    this.updateUpLineData(upline_data);
                }
                break;
            default:
                break;
        }
    }

    /**刷新收益信息 */
    private updateIncomeData(data: SGetIncomes | SGetAgentInfo) {
        if(data){
            if ((data as SGetIncomes).incomes) {
                let Income: SGetIncomes = (data as SGetIncomes);
                this.friendIncomeData = Income;
                this.friendNum.string = Income.total_downlines + "";
                this.maxFriendNum = Income.total_downlines;
                let datas: SIncomesInfo[] = Income.incomes;
                let anmindex = ["animation1", "animation2", "animation3"]
                if (Income.incomes.length != 0) {
                    for (let index = 0; index < this.itemNode.length; index++) {
                        if (datas[index] && datas[index].amount != 0) {
                            this.itemNode[index].getComponent(sp.Skeleton).setAnimation(0, anmindex[randomI(0, 2)], true)
                            let item = this.itemNode[index].getChildByPath("item");
                            let value = this.itemNode[index].getChildByPath("item/value").getComponent(Label);
                            let name = this.itemNode[index].getChildByPath("item/name").getComponent(Label);
                            value.string = ToFixed(datas[index].amount, 4) + "";
                            name.string = datas[index].name;
                            item.getComponent(UIOpacity).opacity = 255;
                            item.off(Input.EventType.TOUCH_END, this.onGet, this);
                            item.on(Input.EventType.TOUCH_END, this.onGet, this);
                        }
                    }
                } else {
                    for (let index = 0; index < this.itemNode.length; index++) {
                        this.itemNode[index].getComponent(sp.Skeleton).setAnimation(0, anmindex[randomI(0, 2)], true)
                        let item = this.itemNode[index].getChildByPath("item");
                        item.getComponent(UIOpacity).opacity = 0;
                        item.off(Input.EventType.TOUCH_END, this.onGet, this);
                    }
                }
    
                if (this.page == 0 && Income.total_unclaimed > 0 && datas.length >= 10) {
                    this.unGetIncome.active = true;
                } else {
                    this.unGetIncome.active = false;
                }
                // this.unGetIncome.active = (Income.total_unclaimed > 0 && datas.length >=10);
                this.value.string = ToFixed(Income.total_unclaimed, 4);
            } else {
                let agentInfo: SGetAgentInfo = (data as SGetAgentInfo);
                this.incomeNum.string = ToFixed((data as SGetAgentInfo).daily_income, 4);
                this.totalIncome = (data as SGetAgentInfo).total_income;
                this.FriendData = agentInfo;
            }
        }
    }

    /**刷新上线信息 */
    private updateUpLineData(data: SGetUplineInfo) {
        this.uplineFriendInfo = data.upline;
        this.addNode.active = !data.has_upline;
        this.infoNode.active = data.has_upline;
        if (data.has_upline) {
            this.friend_name.string = data.upline.name;
            if (!data.upline.is_online) {
                if (data.upline.last_offline_time != 0) {
                    let time_data = DateUtils.timeElapsedSince(data.upline.last_offline_time * 1000);
                    if (time_data.days) {
                        this.friend_time.string = time_data.days + "天前";
                    } else if (time_data.hours) {
                        this.friend_time.string = time_data.hours + "小时前";
                    } else if (time_data.minutes) {
                        this.friend_time.string = time_data.minutes + "分钟前";
                    }
                } else {
                    let day = CfgMgr.GetCommon(StdCommonType.Friend).UnboundDays;
                    this.friend_time.string = day + "天前";
                }
            } else {
                this.friend_time.string = "在线";
            }

            this.friend_lv.string = "Lv" + data.upline.level;
            this.friend_power.string = data.upline.battle_power + "";
        }
    }

    private onCurrencyUpdate(): void {
        this.currency3.string = ToFixed(PlayerData.roleInfo.currency3, 4);
        this.currency.string = ToFixed(PlayerData.roleInfo.currency, 4);
    }

    /**领取收益 */
    private onGet() {
        AudioMgr.playSound("friend_get_income", false);
        let data = {
            type: MsgTypeSend.IncomeRequest,
            data: {},
        }
        Session.Send(data);
    }

    //查看好友
    private onLookFriend() {
        FriendListPanel.Show(this.maxFriendNum);
    }

    //查看收益记录
    private onLookIncom() {
        FriendIncomeListPanel.Show(this.totalIncome);
    }

    /**协助 */
    private onHelpFight() {
        FriendHelpPanel.Show(this.FriendData);
    }

    /**邀请 */
    private onInvite() {
        FriendInviteListPanel.Show();
    }

    //添加绑定好友
    private onAdd() {
        FriendBindOrUnbindPanel.Show(FriendBindType.bind);
    }

    //解绑
    private onUnbind() {
        FriendBindOrUnbindPanel.Show(FriendBindType.unbind, this.uplineFriendInfo);
    }

    private onHelpBtn() {
        Tips2.Show(Tips2ID.Friend);
    }

    protected onHide(...args: any[]): void {
        AudioMgr.stopScene("friend_fountain")
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }
}