import { Button, Component, EventTouch, Input, Label, Node, Sprite, SpriteFrame, Toggle, path, sp, tween } from "cc";
import { Panel } from "../../GameRoot";
import { BagItem } from "./BagItem";
import PlayerData, { SPlayerDataItem, SThing } from "../roleModule/PlayerData";
import { AutoScroller } from "../../utils/AutoScroller";
import { CardQuality, CfgMgr, ConditionType, ItemSubType, ItemType, Job, JobName, StdCommonType, StdItem, ThingItemId, ThingType } from "../../manager/CfgMgr";
import { ConditionSub, FormatCondition, UpdateBagItem } from "../common/BaseUI";
import { ResMgr, folder_icon } from "../../manager/ResMgr";
import { ComboBox } from "../../utils/ComboBox";
import { GetMoreWin } from "./GetMoreWin";
import { ComposePanel } from "./ComposePanel";
import Logger from "../../utils/Logger";
import { EventMgr, Evt_Item_Change } from "../../manager/EventMgr";
import { MsgPanel } from "../common/MsgPanel";
import { Second, ToFixed, formatK, formatNumber } from "../../utils/Utils";
import { OpenBoxPanel } from "./OpenBoxPanel";
import { TradePanel } from "../trade/TradePanel";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { Tips } from "../login/Tips";
import { DateUtils } from "../../utils/DateUtils";
import { BuildingType } from "../home/HomeStruct";
import { rightsTips } from "../rights/rightsTips";
import { CheckCondition } from "../../manager/ConditionMgr";

export class BagPanel extends Panel {
    protected prefab: string = "prefabs/panel/bag/BagPanel";

    private page: number;
    private page1: Node;
    private scroller1: AutoScroller;
    private page2: Node;
    private scroller2: AutoScroller;
    private page3: Node;
    private scroller3: AutoScroller;
    private combo1: ComboBox;
    private combo2: ComboBox;
    private item: BagItem;
    private selectName: Label;
    private selectDesc: Label;
    private selectHas: Label;
    private empty: Node;
    private useBtns: Node[];
    private navBtns: Node[];
    private scroller: AutoScroller;
    private selectData: SPlayerDataItem;
    private datas: SPlayerDataItem[];
    private chipJobSort:number;
    private chipQualSort:number;
    private _curSelectIndex:number;
    protected onLoad() {
        this.CloseBy("layout/closeBtn");
        this.CloseBy("mask");
        this.page1 = this.find("layout/page1");
        this.scroller1 = this.page1.getChildByPath("ScrollView").getComponent(AutoScroller);
        this.scroller1.SetHandle(this.updateBagItem.bind(this));
        this.scroller1.node.on('select', this.SelectItem, this);

        this.page2 = this.find("layout/page2");
        this.scroller2 = this.page2.getChildByPath("ScrollView").getComponent(AutoScroller);
        this.scroller2.SetHandle(this.updateBagItem.bind(this));
        this.scroller2.node.on('select', this.SelectItem, this);
        this.combo1 = this.find("layout/page2/selectJob", ComboBox);
        this.combo1.Init([1, 2, 3, 4], this.updateJobItem.bind(this), this.updateHead1.bind(this));
        this.combo1.node.on('select', this.onSelectJob, this);
        this.combo2 = this.find("layout/page2/selectQuality", ComboBox);
        this.combo2.Init([1, 2, 3, 4, 5], this.updatequalityItem.bind(this), this.updateHead2.bind(this));
        this.combo2.node.on('select', this.onSelectquality, this);

        this.page3 = this.find("layout/page3");
        this.scroller3 = this.page3.getChildByPath("ScrollView").getComponent(AutoScroller);
        this.scroller3.SetHandle(this.updateBagItem.bind(this));
        this.scroller3.node.on('select', this.SelectItem, this);

        this.item = this.find("layout/infoBar/item").addComponent(BagItem);
        this.selectName = this.find("layout/infoBar/name", Label);
        this.selectDesc = this.find("layout/infoBar/desc", Label);
        this.selectHas = this.find("layout/infoBar/has", Label);
        this.empty = this.find("layout/infoBar/empty");
        this.useBtns = this.find("layout/infoBar/layout").children.concat();

        this.useBtns[0].on(Input.EventType.TOUCH_END, this.openJiaoyi, this);
        this.useBtns[1].on(Input.EventType.TOUCH_END, this.openHecheng, this);
        this.useBtns[2].on(Input.EventType.TOUCH_END, this.openUse, this);
        this.useBtns[3].on(Input.EventType.TOUCH_END, this.openGet, this);

        this.navBtns = this.find("layout/nav").children.concat();
        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }

        EventMgr.on(Evt_Item_Change, this.onItemChange, this);
    }
    async SetPage(page: number, isOperat:boolean = true) {
        if (!this.$hasLoad) await this.initSub;
        if (!this.navBtns[page]) return;
        this.page = undefined;
        this.navBtns[page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[page].getComponent(Toggle), isOperat);
    }
    protected onShow(): void {
        this.chipJobSort = 0;
        this.chipQualSort = 0;
        this.SetPage(0);
    }
    public flush(...args: any[]): void {

    }
    protected async onHide(...args: any[]) {
        if (!this.$hasLoad) await this.initSub;
        this.combo1.HideList();
        this.combo2.HideList();
        this.scroller = undefined;
        this.datas = undefined;
    }

    protected onItemChange() {
        if (!this.node.parent) return;
        this.SetPage(this.page, false);
    }

    protected openJiaoyi() {
        let buildings = PlayerData.GetBuildingByType(BuildingType.ji_di, 101);
        let building = buildings ? buildings[0] : undefined;
        if(building && building.level >= 6){
            TradePanel.Show();
        }else{
           Tips.Show("生命树等级不足");
        }
    }
    protected openHecheng() {
        let std = CfgMgr.Getitem(this.selectData.id);
        if (std.SubType == ItemSubType.shard) {
            ComposePanel.showByItemId(std.Items);
        }
    }
    protected openUse() {
        let std = CfgMgr.Getitem(this.selectData.id);
        let condIds = std.ConditionId;
        let condDatas: ConditionSub[] = [];
        if (condIds && condIds.length) {
            let condVals = std.ConditionId;
            let condId: number;
            let condVal: number;
            for (let i = 0; i < condIds.length; i++) {
                condId = condIds[i];
                condVal = condVals[i];
                let data = FormatCondition(condId, condVal);
                if (data) condDatas.push(data);
            }
            for (const cond of condDatas) {
                if (cond.fail) {
                    MsgPanel.Show(cond.fail);
                    return;
                }
            }
        }

        switch (std.Itemtpye) {
            case ItemType.box://使用宝箱
                OpenBoxPanel.Show(std);
                break;
            case ItemType.shield:
                 let needLv: number = CfgMgr.GetCommon(StdCommonType.PVP).PVPOpenLevel;
                 let msg = CheckCondition(ConditionType.Home_1, needLv)
                if (msg) {
                    Tips.Show(msg);
                    return;
                }
                let shield_date = DateUtils.SecondsToDetailedTime(std.ItemEffect1);
                let shield_end_time = PlayerData.LootPlayerData.shield_end_time
                let time1 = "使用后会重置防护时间为" + shield_date
                rightsTips.Show(std, shield_end_time, time1);
                break;
            case ItemType.rights:
                let rights_date = DateUtils.SecondsToDetailedTime(std.ItemEffect2);
                let cards_time = PlayerData.rightsData.benefit_card.cards[1001]
                let rights_tips = "使用后增加权益时长" + rights_date
                rightsTips.Show(std, cards_time, rights_tips);
                break
            default:
                break;
        }

    }
    protected openGet() {

        let get_path = CfgMgr.Getitem(this.selectData.id).SkipGet
        GetMoreWin.Show(get_path)

    }

    protected updateHead1(item: Node, data: number) {
        item.getChildByName("label").getComponent(Label).string = this.chipJobSort == data ? "职业" : JobName[data];
    }
    protected async updateJobItem(item: Node, job: number) {
        let icon = item.getChildByName("icon").getComponent(Sprite);
        icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "job/" + job, "spriteFrame"), SpriteFrame);
    }
    protected onSelectJob(value: number) {
        this.chipJobSort = this.chipJobSort == value ? 0 : value;
        this.chipSort();
        this._curSelectIndex = 0;
        this.updateListData(true);
    }
    protected updateHead2(item: Node, data: number) {
        item.getChildByName("label").getComponent(Label).string = this.chipQualSort == data ? "品质" : CardQuality[data];
    }
    protected async updatequalityItem(item: Node, quality: number) {
        let icon = item.getChildByName("icon").getComponent(Sprite);
        icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality/" + CardQuality[quality], "spriteFrame"), SpriteFrame);
    }
    protected onSelectquality(value: number) {
        this.chipQualSort = this.chipQualSort == value ? 0 : value;
        this.chipSort();
        this._curSelectIndex = 0;
        this.updateListData(true);
    }


    protected onPage(t: Toggle, isOperat:boolean = true) {
        if (!t.isChecked) return;
        if(isOperat) this._curSelectIndex = 0;
        let page = this.navBtns.indexOf(t.node);
        if ((page < 0 || page == this.page)) return;
        
        this.page1.active = false;
        this.page2.active = false;
        this.page3.active = false;
        // console.log("onPage", page);
        switch (page) {
            case 0: // 交易
                this.datas = PlayerData.GetitemBySubType(ItemSubType.material);
                this.datas.sort(this.commSort);
                this.page1.active = true;
                this.scroller = this.scroller1;
                break;

            case 1: // 碎片
                this.chipSort();
                this.page2.active = true;
                this.scroller = this.scroller2;
                break;
            case 2: // 道具
                this.datas = PlayerData.GetitemBySubType(ItemSubType.cost);
                this.datas.sort(this.commSort);
                this.page3.active = true;
                this.scroller = this.scroller3;
                break;
            case 3: //装备
                MsgPanel.Show("功能未开启");
                this.SetPage(this.page, false);
                //return 
                break;
            default:
                this.datas.length = 0;
        }
        this.page = page;
        this.updateListData(isOperat);
    }
    private updateListData(isOperat:boolean):void{
        if (this.scroller && this.datas) {
            this.scroller.UpdateDatas(this.datas);
            this.SelectItem(this._curSelectIndex, isOperat);
        }else{
            this._curSelectIndex = 0;
        }
    }
    private resetSelect():void{
        let cont:Node = this.scroller.node.getChildByPath("view/content");
        let selectIndex:number = -1;
        let defSelect:Node;
        for (let index = 0; index < cont.children.length; index++) {
            let node:Node = cont.children[index];
            let itemIndex:number = node["$$index"];
            if(itemIndex == 0) defSelect = node;
            if(itemIndex == this._curSelectIndex){
                selectIndex = this._curSelectIndex;
                node.getChildByName("select").active = true;
            }else{
                node.getChildByName("select").active = false;
            }
        }
        if(selectIndex < 0){
            selectIndex = 0;
            if(defSelect){
                defSelect.getChildByName("select").active = true;
            }
        }
        this._curSelectIndex = selectIndex;
    }
    private commSort(a:SPlayerDataItem, b:SPlayerDataItem):number{
        let stdA = CfgMgr.Getitem(a.id);
        let stdB = CfgMgr.Getitem(b.id);
        return stdB.Sort - stdA.Sort;
    }
    private chipSort():void{
        this.datas = PlayerData.GetitemBySubType(ItemSubType.shard);
        if(this.chipJobSort < 1 && this.chipQualSort < 1){
            this.datas.sort(this.commSort);
        }else {
            this.chipFilter();
        }
    }
    private chipFilter():void{
        let tempData:SPlayerDataItem;
        let std:StdItem;
        let tempList:SPlayerDataItem[] = [];
        let job:number;
        for (let index = 0; index < this.datas.length; index++) {
            tempData= this.datas[index];
            std = CfgMgr.Getitem(tempData.id);
            job = CfgMgr.GetRole()[std.ItemEffect1].PositionType;
            if(this.chipJobSort > 0){
                if(this.chipJobSort == job){
                    if(this.chipQualSort > 0){
                        if(this.chipQualSort == std.Quality){
                            tempList.push(tempData);
                        }
                    }else{
                        tempList.push(tempData);
                    }
                }
            }else{
                if(this.chipQualSort > 0){
                    if(this.chipQualSort == std.Quality){
                        tempList.push(tempData);
                    }
                }
            }
        }
        this.datas = tempList.sort(this.commSort);
    }
    private updateBagItem(item: Node, data: SPlayerDataItem | SThing, index:number) {
        let bagItem = item.getComponent(BagItem);
        if (!bagItem) bagItem = item.addComponent(BagItem);
        bagItem.setIsShowSelect(false);    
        bagItem.setIsShowRedPoint(true);
        bagItem.SetData(data);
        item.getChildByName("select").active = index == this._curSelectIndex;
    }
    /**
     * 选中道具
     * @param index 
     */
    protected async SelectItem(index: number, isOperat:boolean = true) {
        if (!this.$hasLoad) await this.initSub;
        this._curSelectIndex = index;
        this.resetSelect();
        if(this._curSelectIndex == 0 && isOperat) this.scroller.ScrollToHead();
        let data = this.datas[this._curSelectIndex];
        this.selectData = data;
        if (data) {
            this.empty.active = false;
            this.item.node.getComponent(Toggle).interactable = false;
            this.item.SetData(data);
            let std = CfgMgr.Getitem(data.id);
            this.selectName.string = std.ItemName;
            this.selectDesc.string = std.Remark;
            this.selectHas.string = `已拥有：${ThingItemId[std.Items] ? this.setResCount(data.count) : data.count}`;
            let btnNode:Node;
            let redNode:Node;
            for (let i = 0; i < this.useBtns.length; i++) {
                btnNode = this.useBtns[i];
                if(std.Button.indexOf(i + 1) != -1){
                    btnNode.active = true;
                    redNode = btnNode.getChildByName("red_point");
                    if(redNode){
                        if(i == 1){//碎片红点
                            if (std.Type == ThingType.ThingTypeItem && std.Itemtpye == ItemType.shard) {
                                redNode.active = data.count >= std.ItemEffect3;
                            }else{
                                redNode.active = false;
                            }
                        }else if(i == 2){//宝箱红点
                            if (std.Type == ThingType.ThingTypeItem && std.Itemtpye == ItemType.box) {
                                redNode.active = true;
                            }else{
                                redNode.active = false;
                            }
                        }
                    }
                }else{
                    btnNode.active = false;
                }
                
            }
        } else {
            this.empty.active = true;
        }
    }

    /**资源和货币的数量展示 */
    private setResCount(count:number){
        //判断是否是小数
        let str = count.toString();
        if(str.indexOf(".") != -1){
            str = ToFixed(count,2);
        }else{
            str = str + ".00" 
        }
        return str;
    }
}
