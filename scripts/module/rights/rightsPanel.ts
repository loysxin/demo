import { Button, EventTouch, Input, Label, Layout, Node, ScrollView, Sprite, SpriteFrame, Toggle, instantiate, path,} from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_Hide_Scene, Evt_RightsGetReward, Evt_Show_Scene } from "../../manager/EventMgr";
import { CfgMgr, StdEquityList } from "../../manager/CfgMgr";
import { ResMgr, folder_loot } from "../../manager/ResMgr";
import { AutoScroller } from "../../utils/AutoScroller";
import { ItemUtil } from "../../utils/ItemUtils";
import PlayerData, { SPlayerDataRole, SThing } from "../roleModule/PlayerData";
import { BagItem } from "../bag/BagItem";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { ToFixed, countDown, countDown2, formatTime } from "../../utils/Utils";
import { Tips } from "../login/Tips";
import { MsgPanel } from "../common/MsgPanel";
import { CLICKLOCK } from "../common/Drcorator";
import { TradeHeroPanel } from "../trade/TradeHeroPanel";
import { SetNodeGray } from "../common/BaseUI";


export class rightsPanel extends Panel {
    protected prefab: string = "prefabs/panel/rights/rightsPanel";

    private navBtns: Node[];
    private page1: Node;
    private lbl_time:Label;
    private activate:Node;
    private ScrollView: AutoScroller;
    private Layout: Layout;
    private reward_item:Node;
    private page2: Node;
    private car_item:Node[];
    private getBtn:Button
   
    private page:number
    private timedata:number;
    private time:number;

    protected onLoad(): void {
        this.CloseBy("panel/closeBtn");
        this.page1 = this.find("panel/page1");
        this.ScrollView = this.find("panel/page1/ScrollView",AutoScroller);
        this.ScrollView.SetHandle(this.updateData.bind(this))  
        this.Layout = this.find("panel/page1/Layout",Layout);
        this.reward_item = this.find("panel/page1/Layout/BagItem");
        this.lbl_time = this.find("panel/page1/lbl_time", Label);
        this.activate = this.find("panel/page1/activate");
        this.page2 = this.find("panel/page2");
        this.getBtn = this.find("panel/page1/getBtn", Button)
        this.getBtn.node.on("click", this.onGet, this);
        this.navBtns = this.find("navBar").children.concat();
        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }

        this.car_item = this.find("panel/page2/reward3/rewar2ScrollView/view/content").children.concat();
        for (let btn of this.car_item) {
            btn.on(Input.EventType.TOUCH_END, this.onRoleInfoShow, this);
        } 
        EventMgr.on(Evt_RightsGetReward, this.updateBtnState, this)
    }

    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
    }

    async flush(...args: any[]) {
        this.SetPage(0);
    }

    SetPage(page: number) {   
        if (!this.navBtns[page]) return;
        this.page = undefined;
        this.navBtns[page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[page].getComponent(Toggle));
    }

    private onPage(toggle: Toggle) {
        let page = this.navBtns.indexOf(toggle.node);
        if (page < 0 || page == this.page) return;
        this.page = page; 
        switch (this.page) {
            case 0:
                this.page1.active = true;
                this.page2.active = false;   
                let is_active =  Object.keys(PlayerData.rightsData.all_equities).length > 0
                let is_get = PlayerData.rightsData.benefit_card.claimed_today
                let is_can_get = is_active && is_get;
                SetNodeGray(this.getBtn.node, is_can_get)

                this.getBtn.node.getChildByName("get_label").getComponent(Label).string = is_active ? "领取奖励" : "前往购买";
                //策划说写死权益卡的id现在只有一个
                this.activate.active = is_active;
                this.lbl_time.node.active = Object.keys(PlayerData.rightsData.benefit_card.cards).length > 0;
                this.time = PlayerData.rightsData.benefit_card.cards[1001];
                let data: StdEquityList[] = [];
                let itemDataList: SThing[] = []
                let car_cfg = CfgMgr.getEquityCardById(1001);
                for (let index = 0; index < car_cfg.Equity_list.length; index++) {
                    const element = car_cfg.Equity_list[index];
                    let list_cfg = CfgMgr.getEquityListById(element);
                    if(list_cfg){
                        data.push(list_cfg);
                    }
                    if(list_cfg.Equity_Type == 2){
                        itemDataList = ItemUtil.GetSThingList(list_cfg.RewardType, list_cfg.RewardID, list_cfg.RewardNumber);
                    }
                }
                this.ScrollView.UpdateDatas(data);
                
                this.Layout.node.removeAllChildren();
                for (let i = 0; i < itemDataList.length; i++) {
                    let item = instantiate(this.reward_item);
                    this.updateRewardData(item, itemDataList[i]);
                    this.Layout.node.addChild(item);
                };

                break;
            case 1:
                this.page1.active = false;
                this.page2.active = true;
                break;
            default:
                break;
        }
    }
    private async updateData(item:Node, data:StdEquityList){   
        item.getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub(path.join("sheets/rights/" + data.Icon, "spriteFrame"), SpriteFrame);
        item.getChildByName("label").getComponent(Label).string = data.describe;   
    }

    private async updateRewardData(item:Node, data:SThing){   
        let bagItem = item.getComponent(BagItem);
        if (!bagItem) bagItem = item.addComponent(BagItem);
        bagItem.setIsShowSelect(false);
        bagItem.setIsShowTips(true);
        bagItem.SetData(data);
    }

    private updateBtnState(){
        let is_active =  Object.keys(PlayerData.rightsData.all_equities).length > 0
        this.activate.active = is_active;
        this.time = PlayerData.rightsData.benefit_card.cards[1001] ? this.time = PlayerData.rightsData.benefit_card.cards[1001] : 0;
        let is_get = PlayerData.rightsData.benefit_card.claimed_today
        let is_can_get = is_active && is_get;
        SetNodeGray(this.getBtn.node, is_can_get)
        this.getBtn.node.getChildByName("get_label").getComponent(Label).string = is_active ? "领取奖励" : "前往购买";
    }

    @CLICKLOCK(1)
    private onGet(){
        if(Object.keys(PlayerData.rightsData.all_equities).length > 0){
            if(!PlayerData.rightsData.benefit_card.claimed_today){
                let sendData = {
                    type: MsgTypeSend.ClaimDailyBenefitRequest,
                    data: {}
                }
                Session.Send(sendData);
            }else{
                MsgPanel.Show("今日已领取")
            }
        }else{
            MsgPanel.Show("欢迎前往战备营地平台购买")
        }
    }

    private onRoleInfoShow(event:EventTouch){
        let index = event.currentTarget.getSiblingIndex();
        let type = [108, 113, 109, 107, 111, 112, 110];
        let role:SPlayerDataRole = {
            id: "",
            type: type[index],
            level: 1,
            experience: 0,
            soldier_num: 0,
            active_skills: [],
            passive_skills: [],
            is_in_building: false,
            building_id: 0,
            battle_power: 0,
            quality: 1,
            skills: [],
            is_assisting: false,
            is_in_attack_lineup: false,
            is_in_defense_lineup: false,
            trade_cd: 0
        }
        TradeHeroPanel.Show(role) 
    }

    protected update(dt: number): void {
        if(Object.keys(PlayerData.rightsData.benefit_card.cards).length > 0){
                let seconds = this.time - PlayerData.GetServerTime();
                if (seconds > 0) {
                    seconds -= dt;
                    let time = countDown2(this.time);
                    if(time.d > 0){
                        this.lbl_time.string = "剩余" + time.d + "天";
                    }else{
                        let str_h = time.h + ""
                        if(time.h <= 9 ){
                            str_h = "0" + time.h
                        }
                        let str_m = time.m + ""
                        if(time.m <= 9 ){
                            str_m = "0" + time.m
                        }
                        let str_s = time.s + ""
                        if(time.s <= 9 ){
                            str_s = "0" + time.s
                        }
                        this.lbl_time.string = "剩余:" + str_h + ":" + str_m + ":" + str_s;
                    }
                } else {
                    this.lbl_time.string = "";
                }
            
        }
    }

    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }
}