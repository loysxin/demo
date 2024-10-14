import { Button, Component, EditBox, EventTouch, Input, Label, Layout, Node, ScrollView, Sprite, SpriteFrame, Toggle, Tween, TweenSystem, UITransform, Widget, debug, find, instantiate, path, sp, tween, view } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import PlayerData, { SQueryType, SPlayerData, SPlayerDataItem, SPlayerDataRole, SOonViewData, SOrderData, SOrderType, SSerchData, SQueryArgs, SQuerySortType, Tips2ID, SThing } from "../roleModule/PlayerData";
import { Attr, AttrFight, Bourse, CardQuality, CfgMgr, StdCommonType, StdMerge, StdRoleQuality, ThingType } from "../../manager/CfgMgr";
import { ResMgr, folder_common, folder_head_card, folder_head_round, folder_icon } from "../../manager/ResMgr";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { Second, ToFixed, countDown } from "../../utils/Utils";
import Logger from "../../utils/Logger";
import { SortPanel } from "./SortPanel";
import { BagItem } from "../bag/BagItem";
import { RoleMsgPanel } from "./RoleMsgPanel";
import { BuyPanel } from "./BuyPanel";
import { TradePanelItem } from "./item/TradePanelItem";
import { EventMgr, Evt_Currency_Updtae, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import { Tips2 } from "../home/panel/Tips2";
import { MsgPanel } from "../common/MsgPanel";
import { AdaptBgTop } from "../common/BaseUI";
import { Tips } from "../login/Tips";

export enum GroupType {
    Buy = 0,
    Sell = 1,
    Order = 2
}

export class TradePanel extends Panel {
    protected prefab: string = "prefabs/panel/Trade/TradePanel";

    static get ins(): TradePanel { return this.$instance; }
    private body: sp.Skeleton;
    private title: Label = null;
    private toggleOrder: Node = null;
    private btnSort: Node = null;
    private scrollItem: AutoScroller = null;
    private scrollOrder: AutoScroller = null;
    private toggleGroup: Node = null;
    private selectType: number = 0;
    private selectGroup: number = 0;
    private pageLabel: Label = null;
    private left: Node = null;
    private right: Node = null;
    private currencyLabel: Label = null;
    private heleBtn: Node;
    private noneListCont:Node;

    private combox_item:Node;
    private combox_open:Node;
    private combox_close:Node;
    private item_name:Label
    private open:Node;
    private combox_item_bg:Node;
    private content:Node;
    private combox_item1:Node;
    private combox_item2:Node;
    private item_3:Node;
    private serch: Node = null;

    private pageSize = 30;
    private curPage = 1;
    private copyCode: string = null;

    private SortQueryType: number;
    private SortQArgs: SQueryArgs;
    private TimeLock: number;

    protected onLoad() {
        this.CloseBy("closeBtn");
        this.noneListCont = this.find("noneListCont")
        this.currencyLabel = this.find(`currency/currencyLabel`, Label);
        this.body = this.find(`effBg/body`, sp.Skeleton);
        this.title = this.find(`Bg/title`, Label);
        this.toggleOrder = this.find(`Main/ToggleOrder`);
        this.btnSort = this.find(`Main/btnSort`);
        this.scrollItem = this.find(`Main/ScrollView`, AutoScroller);
        this.scrollOrder = this.find(`Main/ScrollViewOrder`, AutoScroller);
        this.toggleGroup = this.find(`Main/ToggleGroup`);
        this.pageLabel = this.find(`Main/pageBg/Label`, Label);
        this.left = this.find(`Main/pageBg/left`);
        this.right = this.find(`Main/pageBg/right`);
        this.heleBtn = this.find("Bg/heleBtn");
        this.combox_item = this.find("combox_item");
        this.combox_open = this.find("combox_item/combox/open");
        this.combox_close = this.find("combox_item/combox/close");
        this.item_name = this.find("combox_item/combox/item_name",Label);
        this.open = this.find("combox_item/combox/open");
        this.combox_item_bg = this.find("combox_item/combox_item_bg");
        this.content = this.find("combox_item/combox_item_bg/ScrollView/view/content");
        this.combox_item1 = this.find("combox_item/combox_item1");
        this.combox_item2 = this.find("combox_item/combox_item2");
        this.item_3 = this.find("combox_item/item_3");
        this.serch = this.find(`Main/serch`);
        EventMgr.on(Evt_Currency_Updtae, this.updateCurrency, this);
        this.onBtnEvent();
    }

    private onBtnEvent() {
        this.heleBtn.on(Input.EventType.TOUCH_END, this.onHelpBtn, this);
        this.btnSort.on(Input.EventType.TOUCH_END, this.onTouchSort, this);
        this.combox_open.on(Input.EventType.TOUCH_END, this.onOpenComboxItem, this);
        this.combox_close.on(Input.EventType.TOUCH_END, this.onCloseComboxItem, this);
        this.serch.getChildByName(`EditBox`).on(EditBox.EventType.EDITING_DID_ENDED, this.onEditEnd, this)
        this.serch.getChildByName(`EditBox`).on(EditBox.EventType.EDITING_DID_BEGAN, this.onEditBegan, this)
        
        //订单单选
        this.toggleOrder.children.forEach((node, index) => {
            node.on(Input.EventType.TOUCH_END, () => {
                node.getComponent(Toggle).isChecked = true;
                this.onSetScrollItemData(index);
            })
        })
        //功能单选
        this.toggleGroup.children.forEach((node, index) => {
            node.on(Input.EventType.TOUCH_END, () => {
                node.getComponent(Toggle).isChecked = true;
                this.onSetScrollGroupData(index);
            })
        })

        //
        this.left.on(Input.EventType.TOUCH_END, () => {
            if (this.curPage > 1) {
                this.curPage--;
            }
            if (this.SortQArgs) {
                this.SendSortOrSerch(this.curPage);
            }
        })
        this.right.on(Input.EventType.TOUCH_END, () => {
            this.curPage++;
            if (this.SortQArgs) {
                this.SendSortOrSerch(this.curPage);
            }
        })
        this.scrollItem.SetHandle(this.updateItem.bind(this));
        this.scrollOrder.SetHandle(this.updateOrderItem.bind(this));
    }

    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
    }

    async flush(...args: any[]) {
        AdaptBgTop(this.node.getChildByPath("di"));
        this.updateCurrency();
        this.initSortListData()
        this.reset();
    }

    private updateCurrency(){
        this.currencyLabel.string = ToFixed(PlayerData.roleInfo.currency, 2);
    }

    //初始化筛选列表数据
    private initSortListData(){
        //获取商品种类
        this.content.removeAllChildren();
        let all_tag = [1,2,3];
        let all_tag_name = ["道具","角色","资源"];
        let all_tag_data = []
        for (let index = 0; index < all_tag.length; index++) {
            let bourseData:Bourse[] = CfgMgr.GetTradeAllCfgData(all_tag[index]);
            let data = {
                tag:all_tag[index],
                tagData:bourseData,
                tagName:all_tag_name[index]
            }
            all_tag_data.push(data);  
            let item = instantiate(this.combox_item1);
            item.setPosition(0,0);
            item["bourseData"] = bourseData;
            item["sort_type"] = all_tag[index];
            item.getChildByPath("layout/input/label").getComponent(Label).string = all_tag_name[index];
            item.off(Input.EventType.TOUCH_END, this.openTwoTag.bind(this), this);
            item.on(Input.EventType.TOUCH_END, this.openTwoTag.bind(this), this);
            // item.getChildByPath("layout/input/close").on(Input.EventType.TOUCH_END, this.closeTag.bind(this), this);
            this.content.addChild(item);
        }
    }

    /**重置UI和数据 */
    public reset() {
        this.title.string = `交易大厅`;
        this.copyCode = null;
        this.SortQueryType = null;
        this.SortQArgs = {};
        this.SortQArgs.init = 0;
        this.TimeLock = 0;
        this.combox_item_bg.active = false
        for (let index = 0; index < this.content.children.length; index++) {
            const element = this.content.children[index];
            element.getChildByPath("layout/content").removeAllChildren();
            element.getChildByPath("layout/input/open").active = true;
            element.getChildByPath("layout/input/close").active = false;
        }
        this.onCloseComboxItem();
        this.onSetScrollGroupData(0)
    }

    /**
     * 页面页签切换
     * @param index 
     */
    private async onSetScrollGroupData(index) {
        this.noneListCont.active = false;
        let title = ["交易大厅", "求购大厅", "上架管理"]
        this.title.string = title[index];
        let spineData = ["role_001_ngr", "role_005_mg", "role_010_xrz"]
        this.body.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/role_p", spineData[index], spineData[index]), sp.SkeletonData);
        this.body.setAnimation(0,"Idle",true)

        this.btnSort.active = index != GroupType.Order
        this.serch.active = index != GroupType.Order
        this.combox_item.active = index != GroupType.Order
        this.selectType = 0;
        this.selectGroup = index;
        this.SortQArgs = {};
        this.setScrollView();
        this.SendSessionView();
        if(index != GroupType.Order){
            this.onCloseComboxItem();
            this.item_name.string = "道具";
        }
    }

    private setScrollView() {
        if (this.selectGroup == 2) {//订单页面
            this.scrollOrder.node.active = true;
            this.scrollItem.node.active = false;
            this.toggleOrder.active = true;

            this.toggleOrder.children.forEach((node, index) => {
                if (index == this.selectType) {
                    node.getComponent(Toggle).isChecked = true;
                }
            })
        } else {//求购购买页面
            this.scrollOrder.node.active = false;
            this.scrollItem.node.active = true;
            this.toggleOrder.active = false;
        }
        this.toggleGroup.children.forEach((node, i) => {
            if (i == this.selectGroup) {
                node.getComponent(Toggle).isChecked = true;
            }
        })
    }

    public SendSessionView(page: number = 1) {
        //页面切换筛选重置
        this.SortQArgs = {};
        this.TimeLock = 0;
        let index = this.selectGroup;
        let seleType = this.selectType;
        let queryType: SQueryType = SQueryType.Global, queryArgs: SQueryArgs = {}, orderType: string = `sell`;
        switch (seleType) {
            case 0:
                queryArgs.thing_type = ThingType.ThingTypeItem
                break;
            case 1:
                queryArgs.thing_type = ThingType.ThingTypeRole
                break;
            case 2:
                queryArgs.thing_type = ThingType.ThingTypeResource
                break;
            case 3:
                queryArgs.thing_type = ThingType.ThingTypeEquipment
                break;
        }
        switch (index) {
            case GroupType.Buy:
                orderType = `sell`;
                queryType = SQueryType.ThingType
                break;
            case GroupType.Sell:
                orderType = `buy`;
                queryType = SQueryType.ThingType
                break;
            case GroupType.Order:
                queryType = SQueryType.PlayerID
                queryArgs.player_id = PlayerData.roleInfo.player_id
                if (seleType == 1) {
                    orderType = `buy`;
                } else {
                    orderType = `sell`;
                }
                break;
            default:
                break;
        }
        this.SortQArgs = queryArgs;
        this.SortQueryType = queryType
        console.log("页面切换", queryType, this.SortQArgs, page)
        this.SendSerchViewByThingType(queryType, this.SortQArgs, page, this.pageSize, orderType);
    }

    /**筛选排序 */
    public SendSortOrSerch(page = 1, type?: SQueryType, QArgs?: SQueryArgs) {
        //左右切页保留筛选排序
        if (type != null){
            this.SortQueryType = type;
        } 
        if (QArgs != null) this.SortQArgs = QArgs;
        if (type == SQueryType.ThingType) {
            switch (this.selectType) {
                case 0:
                    this.SortQArgs.thing_type = ThingType.ThingTypeItem
                    break;
                case 1:
                    this.SortQArgs.thing_type = ThingType.ThingTypeRole
                    break;
                case 2:
                    this.SortQArgs.thing_type = ThingType.ThingTypeResource
                    break;
                case 3:
                    this.SortQArgs.thing_type = ThingType.ThingTypeEquipment
                    break;
            }
        }
        let index = this.selectGroup;
        let seleType = this.selectType;
        let orderType = `sell`;
        switch (index) {
            case GroupType.Buy:
                orderType = `sell`;
                break;
            case GroupType.Sell:
                orderType = `buy`;
                break;
            case GroupType.Order:
                if (seleType == 1) {
                    orderType = `buy`;
                } else {
                    orderType = `sell`;
                }
                break;
            default:
                break;
        }
        console.log("左右切页", this.SortQueryType, this.SortQArgs, page)
        this.SendSerchViewByThingType(this.SortQueryType, this.SortQArgs, page, this.pageSize, orderType); 
    }

    /**数据请求 */
    public SendSerchViewByThingType(QueryType: SQueryType, QueryArgs: SQueryArgs, PageIndex: number, PageSize: number, OrderType: string) {
        let data = {
            type: MsgTypeSend.ExchangesQueryView,
            data: {
                query_type: QueryType,
                query_args: QueryArgs,
                page_index: PageIndex,
                page_size: PageSize,
                order_type: OrderType,
            }
        }
        Session.Send(data)
    }

    onGetViewData(data: SOonViewData) {
        if (data.page_index > data.page_last_index && data.page_last_index != 0) {
            // if (this.TimeLock) {
                this.curPage = data.page_last_index;
                return this.SendSortOrSerch(data.page_last_index);
            // } else {
            //     return this.SendSessionView(data.page_last_index);
            // }
        }
        console.log("this.TimeLock", this.TimeLock)
        if (data.query_args.selection_time_lock) {
            this.TimeLock = data.query_args.selection_time_lock;
            this.SortQArgs.selection_time_lock = this.TimeLock;
        }
        this.curPage = data.page_index;
        // let datas = data.order_list;
        let  datas = PlayerData.getOrderListData(data.order_list);    
        this.pageLabel.string = `${data.page_index}/${data.page_last_index || 1}`;
        if (data.page_last_index <= 0) { this.pageLabel.string = `1/1` };
        if (this.selectGroup == 2) {//订单页面
            let length = CfgMgr.GetCommon(StdCommonType.Bourse).Warehourse
            if (this.selectType == 1) {
                length = CfgMgr.GetCommon(StdCommonType.Bourse).OrdersLimit
            }
            if (data.total_count < length) datas.unshift(0 as never);
            this.scrollOrder.UpdateDatas(datas);
        } else {//求购购买页面
            this.noneListCont.active = false;
            if(!datas || datas.length == 0){
                this.noneListCont.active = true;
            }
            this.scrollItem.UpdateDatas(datas);
        }
       this.scheduleOnce(()=>{
           this.scrollItem.ScrollToHead();
           this.scrollOrder.ScrollToHead();
       }, 0.01)
    }

    onGetSerchData(data: SSerchData) {
        this.pageLabel.string = `1/1`;
        // let datas = data.order_list || [];   
        let datas = data.order_list ? PlayerData.getOrderListData(data.order_list) : [];
        
        this.selectType = 0;
        // this.selectGroup = 0;
        this.setScrollView();      
        if (datas){
            this.scrollItem.UpdateDatas(datas);
        } 
        this.noneListCont.active = false;
        if(!datas || datas.length == 0){
            this.noneListCont.active = true;
        }
        this.scrollItem.ScrollToHead();
        this.scrollOrder.ScrollToHead();
    }

    //出售求购页签切换
    private async onSetScrollItemData(index, is_show?:boolean) {
        await Second(0);
        this.selectType = index;
        this.SortQArgs = {};
        this.setScrollView();
        this.SendSessionView()
    }



    /**
     * 交易道具角色item
     * @param item 
     * @param data 
     */
    protected async updateItem(item: Node, data: SOrderData, index: number) {
        let itemScropt = item.getComponent(TradePanelItem);
        itemScropt = itemScropt ? itemScropt : item.addComponent(TradePanelItem);
        itemScropt.SetData(data, this.selectType, this.selectGroup);
    }

    /**
     * 订单道具角色item
     * @param item 
     * @param data 
     */
    protected async updateOrderItem(item: Node, data: SOrderData) {
        let itemScropt = item.getComponent(TradePanelItem);
        itemScropt = itemScropt ? itemScropt : item.addComponent(TradePanelItem);
        itemScropt.SetOrderData(data, this.selectType);
    }
   

    private onOpenComboxItem(){
        this.combox_open.active = false;
        this.combox_close.active = true;
        this.combox_item_bg.active = true;
    }

    private onCloseComboxItem(){
        this.combox_open.active = true;
        this.combox_close.active = false;
        this.combox_item_bg.active = false;
    }

    //打开2级列表
    private openTwoTag(event:EventTouch){
        let item:Node = event.target;
        let close = item.getChildByPath("layout/input/close");
        if(close.active){
            this.closeTag(event)
            return;
        }
        item.getChildByPath("layout/input/open").active = false;
        item.getChildByPath("layout/input/close").active = true;
        this.selectType = item.getSiblingIndex();
        let content = item.getChildByPath("layout/content")  
        content.removeAllChildren();
        //设置选中标题
        this.item_name.string = item.getChildByPath("layout/input/label").getComponent(Label).string;
        //选中后修改展示数据
        this.onSetScrollItemData(this.selectType);

        let bourseData:Bourse[] = item["bourseData"];
        //根据物品的类别细分到不同的组
        let group_id = [];
        let group_list_data:Bourse[][] = [];
        //一级页签下未分组的物品 加到最后
        let no_group_list_data:Bourse[] = []
        for (let index = 0; index < bourseData.length; index++) {
            const element = bourseData[index];
            if (group_id.length > 0) {
                if(element.Group != 0){
                    let i = group_id.indexOf(element.Group);
                    if(i == -1){
                        group_id.push(element.Group)
                        group_list_data.push([])
                        group_list_data[group_id.length - 1].push(element)
                    }else{      
                        group_list_data[i].push(element)
                    }    
                }else{
                    no_group_list_data.push(element)
                }
            }else{
                if(element.Group != 0){
                    group_id.push(element.Group)
                    group_list_data.push([])
                    group_list_data[group_id.length - 1].push(element)
                }else{
                    no_group_list_data.push(element)
                }
            }
        }
        if(no_group_list_data.length > 0){
            group_list_data.push(no_group_list_data)
        }

        for (let index = 0; index < group_list_data.length; index++) {
            const element = group_list_data[index];        
            if(element[0].Group == 0){
                for (let index = 0; index < element.length; index++) {
                    const item3 = element[index];
                    let tag_item3 = instantiate(this.item_3);
                    tag_item3.setPosition(0,0);
                    tag_item3["bourseData3"] = item3;
                    tag_item3.getChildByName("item_name").getComponent(Label).string = item3.Name;
                    tag_item3.on(Input.EventType.TOUCH_END, this.setectItemName.bind(this), this);
                    content.addChild(tag_item3);
                }
            }else{
                let tag_item2 = instantiate(this.combox_item2);
                tag_item2.setPosition(0,0);
                tag_item2["bourseData2"] = element;
                tag_item2.getChildByPath("layout/input/label").getComponent(Label).string = element[0].GroupName;
                tag_item2.off(Input.EventType.TOUCH_END, this.openThreeTag.bind(this), this);
                tag_item2.on(Input.EventType.TOUCH_END, this.openThreeTag.bind(this), this);
                // tag_item2.getChildByPath("layout/input/close").on(Input.EventType.TOUCH_END, this.closeTag.bind(this), this);
                content.addChild(tag_item2);
            }  
        }
        item.children.forEach(element => {
            element.getComponent(Layout).updateLayout(true);
        }); 
    }

    //打开3级列表
    private openThreeTag(event:EventTouch){
        let item = event.target;
        let close = item.getChildByPath("layout/input/close");
        if(close.active){
            this.closeTag(event)
            return;
        }
        item.getChildByPath("layout/input/open").active = false;
        item.getChildByPath("layout/input/close").active = true;
        let content = item.getChildByPath("layout/content")  
        content.removeAllChildren();
        let bourseData:Bourse[] = item["bourseData2"];
        this.setectItemListName(bourseData);
        for (let index = 0; index < bourseData.length; index++) {
            const element = bourseData[index];
            let tag_item3 = instantiate(this.item_3);
            tag_item3.setPosition(0,0);
            tag_item3["bourseData3"] = element;
            tag_item3.getChildByName("item_name").getComponent(Label).string = element.Name;
            tag_item3.on(Input.EventType.TOUCH_END, this.setectItemName.bind(this), this);
            content.addChild(tag_item3);
        }
        item.children.forEach(element => {
            element.getComponent(Layout).updateLayout(true);
        });
    }

    //收起列表
    private closeTag(event:EventTouch){
        let item:Node = event.target;
        item.getChildByPath("layout/input/open").active = true;
        item.getChildByPath("layout/input/close").active = false;
        let content = item.getChildByPath("layout//content")  
        content.removeAllChildren();
    }


     /**选中某组物品 */
     private setectItemListName(data:Bourse[]){
       
        let bourseData:Bourse[] = data;
        let ids = []
        let QArgs: SQueryArgs = {};
        let type = SQueryType.ThingType
        if (this.selectType != 0 ) {
            Tips.Show("暂不支持角色和资源搜索")
        } else  {//筛选道具
            type = SQueryType.ItemType; 
            for (let index = 0; index < bourseData.length; index++) {
                const element = bourseData[index];                
                ids.push(element.ItemId);     
            }
            QArgs.item_selection = ids;
        }

        if (ids.length > 0) {//筛选或者排序有已选项，发送查询协议
            console.log(`发送协议查询！`, QArgs);
            this.SendSortOrSerch(1, type, QArgs);
        }
    
    }

    /**选中某个物品 */
    private setectItemName(event:EventTouch){
        let item = event.target;
        let bourseData:Bourse = item["bourseData3"];
        let ids = []
        let QArgs: SQueryArgs = {};
        let type = SQueryType.ThingType
        if (this.selectType != 0 ) {
            Tips.Show("暂不支持角色和资源搜索")
        } else  {//筛选道具
            type = SQueryType.ItemType; 
            ids.push(bourseData.ItemId);     
            QArgs.item_selection = ids;
        }

        if (ids.length > 0) {//筛选或者排序有已选项，发送查询协议
            console.log(`发送协议查询！`, QArgs);
            this.SendSortOrSerch(1, type, QArgs);
        }
    
    }

    private onEditBegan(){
        //编辑时文本会发生偏移在输入时刷新一次对齐
        this.serch.children.forEach((node)=>{
            if(node.getComponent(Widget)){
                node.getComponent(Widget).updateAlignment();
            }
        })
    }

    /**搜索栏事件 */
    private onEditEnd() {
        if (this.serch.getComponentInChildren(EditBox).string) {
            let ids = []
            let QArgs: SQueryArgs = {};
            let type = SQueryType.ThingType
            let str = this.serch.getComponentInChildren(EditBox).string;
            let cfg: Bourse[] = CfgMgr.Get("bourse")
            for (const iterator of cfg) {
                if(iterator.Name == str){
                    if(iterator.WaresType != 1){
                        Tips.Show("暂不支持角色和资源搜索")
                    }else{  
                        ids.push(iterator.ItemId);
                        type = SQueryType.ItemType 
                        QArgs.item_selection = ids; 
                        QArgs.init = 1;
                        this.SendSortOrSerch(1, type, QArgs);
                    }
                    this.serch.getComponentInChildren(EditBox).string = ``;     
                    return;
                }   
            }
        }
        if (this.serch.getComponentInChildren(EditBox).string) {
            let data = {
                "type": MsgTypeSend.ExchangesQueryViewIDList,
                "data": {
                    view_id_list: [
                        this.serch.getComponentInChildren(EditBox).string
                    ]
                }
            }
            Session.Send(data);
            this.ResetCopyCode();
        }
    }

    private onHelpBtn() {
        Tips2.Show(Tips2ID.Trade);
    }
    
    private onTouchSort() {
        SortPanel.Show(this.selectType, this.SortQArgs);
    }

    public GetCopyCode() {
        return this.copyCode;
    }
    public ResetCopyCode() {
        return this.copyCode = null;
    }
    public SetCopyCode(code: string) {
        return this.copyCode = code;
    }

    protected onHide(...args: any[]): void {
        if (SortPanel.ins) SortPanel.ins.reset();
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }
}