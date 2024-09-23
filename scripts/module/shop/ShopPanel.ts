import { Node, Toggle} from "cc";
import { Panel } from "../../GameRoot";
import { ShopLuckyPage } from "./ShopLuckyPage";
import { ShopDayPage } from "./ShopDayPage";
import { EventMgr, Evt_Change_Scene_Bgm, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import { ConsumeItem, ConsumeNumFormatType } from "../common/ConsumeItem";
import { ItemUtil } from "../../utils/ItemUtils";
import { CfgMgr, ShopGroupId, ShopType, StdLuckyShop, StdShop, StdShopGroup, StdShopIndex, ThingType } from "../../manager/CfgMgr";
import PlayerData, { SThing, SThingItem } from "../roleModule/PlayerData";
import { formatNumber } from "../../utils/Utils";
import { BeforeGameUtils } from "../../utils/BeforeGameUtils";
import { AutoScroller } from "../../utils/AutoScroller";
import { ShopTabBtnItem } from "./ShopTabBtnItem";
import { ShopBasePage } from "./ShopPageBase";
import { ShopWeekPage } from "./ShopWeekPage";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { SceneBgmId } from "../../manager/AudioMgr";

export class ShopPanel extends Panel {
    protected prefab: string = "prefabs/panel/shop/ShopPanel";
    private haveItemList:AutoScroller;
    private luckyPage:ShopLuckyPage;
    private dayPage:ShopDayPage;
    private weekPage:ShopWeekPage;
    private tabBtnList:AutoScroller;
    private tabDatas:StdShopGroup[];
    private curTabIndex:number;
    private shopPageInfo:{[key: string]: ShopBasePage};
    protected onLoad() {
        this.haveItemList = this.find("haveItemList", AutoScroller);
        this.haveItemList.SetHandle(this.updateHaveItem.bind(this));
        this.tabBtnList = this.find("tabBtnList", AutoScroller);
        this.tabBtnList.SetHandle(this.updateTabBtnItem.bind(this));
        this.tabBtnList.node.on('select', this.onTabBtnSelect, this);
        this.luckyPage = this.node.getChildByName("luckyPage").addComponent(ShopLuckyPage);
        this.dayPage = this.node.getChildByName("dayPage").addComponent(ShopDayPage);
        this.weekPage = this.node.getChildByName("weekPage").addComponent(ShopWeekPage);

        this.shopPageInfo = BeforeGameUtils.toHashMapObj(
            ShopType.LuckyShop, this.luckyPage,
            ShopType.DayShop, this.dayPage,
            ShopType.WeekShop, this.weekPage,
        );
        this.CloseBy("backBtn"); 
    }
    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
        Session.Send({type: MsgTypeSend.ShopGetIndex, data:{}});
        EventMgr.emit(Evt_Change_Scene_Bgm, SceneBgmId.SceneBgm_6); 
    }
    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
        EventMgr.emit(Evt_Change_Scene_Bgm); 
    }
    
    public async flush(shopGroupId:number): Promise<void> {
        this.curTabIndex = -1;
        this.tabDatas = PlayerData.ShopGroupInfo[shopGroupId];
        this.tabBtnList.UpdateDatas(this.tabDatas);
        this.tabBtnList.SelectFirst(0);
    }
    protected update(dt: number): void {
        
    }
    private updateTabSelect():void{
        let shopType:number;
        let shopBasePage:ShopBasePage;
        let tabData:StdShopGroup = this.tabDatas[this.curTabIndex];
        for (let key in this.shopPageInfo) {
            shopType = Number(key);
            shopBasePage = this.shopPageInfo[key];
            if(shopType == tabData.ShopType){
                shopBasePage.onShow();
                shopBasePage.SetData(tabData);
            }else{
                shopBasePage.onHide();
            }
        }
        let haveItems:SThing[] = [];
        let stdShopIndex:StdShopIndex = CfgMgr.GetShopIndex(tabData.ShopGroupId, tabData.ShopType);
        if(stdShopIndex){
            haveItems = ItemUtil.GetSThingList(stdShopIndex.MoneyType, stdShopIndex.MoneyID);
        }
        this.haveItemList.UpdateDatas(haveItems);
    }
    private updateHaveItem(item:Node, data:SThing):void{
        let consumeItem = item.getComponent(ConsumeItem);
        if (!consumeItem) consumeItem = item.addComponent(ConsumeItem);
        consumeItem.numFormatType = ConsumeNumFormatType.Have;
        consumeItem.SetData(data);
    }
    protected updateTabBtnItem(item: Node, data: StdShopGroup, index:number) {
        let tabBtnItem = item.getComponent(ShopTabBtnItem);
        if (!tabBtnItem) tabBtnItem = item.addComponent(ShopTabBtnItem);
        let select:Node = item.getChildByName("selectCont");
        select.active = index == this.curTabIndex;
        tabBtnItem.SetData(data);
    }
    private onTabBtnSelect(index: number, item: Node):void{
        if(this.curTabIndex == index) return;
        this.resetSelect();
        let select:Node = item.getChildByName("selectCont");
        select.active = true;
        this.curTabIndex = index;
        this.updateTabSelect();
    }
    private resetSelect():void{
        let node:Node;
        let itemIndex:number;
        let select:Node;
        
        for (let index = 0; index < this.tabBtnList.children.length; index++) {
            node = this.tabBtnList.children[index];
            itemIndex = node["$$index"];
            if(itemIndex == this.curTabIndex){
                select = node.getChildByName("selectCont");
                select.active = false;
                break;
            }
        }
    }
}