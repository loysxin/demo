import { Button, Component, Label, Node, Size, UITransform, Vec3 } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import { FishingSellItem } from "./FishingSellItem";
import { EventMgr, Evt_FishItemUpdate, Evt_SellFishUpdate } from "../../manager/EventMgr";
import PlayerData, {SFishingItem } from "../roleModule/PlayerData";
import { MsgPanel } from "../common/MsgPanel";
import { Session } from "../../net/Session";
import { ClickTipsPanel } from "../common/ClickTipsPanel";
import { CfgMgr, ConditionType, OneOffRedPointId, StdFishItem } from "../../manager/CfgMgr";
import { MsgTypeSend } from "../../MsgType";

export class FishingSellPage extends Component {
    private downBtnCont:Node;
    private downBtnArrow:Node;
    private downBtn:Button;
    private downBtnTitle:Label;
    private weightMaxBtn:Button;
    private weightMiniBtn:Button;
    private typeBtn:Button;
    private sellBtn:Button;
    private oneKeySellBtn:Button;
    private sellList:AutoScroller;
    private noneListCont:Node;
    private isInit:boolean = false;
    private fishShopDatas:SFishingItem[];
    private selectList:number[];
    private sortType:number = 0;
    protected onLoad(): void {
        this.downBtnCont = this.node.getChildByName("downBtnCont");
        this.weightMaxBtn = this.node.getChildByPath("downBtnCont/weightMaxBtn").getComponent(Button);
        this.weightMiniBtn = this.node.getChildByPath("downBtnCont/weightMiniBtn").getComponent(Button);
        this.typeBtn = this.node.getChildByPath("downBtnCont/typeBtn").getComponent(Button);
        this.downBtn = this.node.getChildByName("downBtn").getComponent(Button);
        this.downBtnArrow = this.node.getChildByPath("downBtn/downBtnArrow");
        this.downBtnTitle = this.node.getChildByPath("downBtn/downBtnTitle").getComponent(Label);
        this.sellBtn = this.node.getChildByName("sellBtn").getComponent(Button);
        this.oneKeySellBtn = this.node.getChildByName("oneKeySellBtn").getComponent(Button);
        this.sellList = this.node.getChildByName("sellList").getComponent(AutoScroller);
        this.noneListCont = this.node.getChildByName("noneListCont");
        this.sellList.SetHandle(this.updateSellItem.bind(this));
        this.sellList.node.on('select', this.onSellSelect, this);
        this.sellBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.oneKeySellBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.weightMaxBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.weightMiniBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.typeBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.downBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.isInit = true;
        this.noneListCont.active = false;
        this.initShow();
        EventMgr.on(Evt_FishItemUpdate, this.onSellFishUpdate, this);
    }

    onShow():void{
        this.sortType = 0;
        this.selectList = [];
        this.node.active = true;
        PlayerData.SetOneOffRedPoint(OneOffRedPointId.OffRedPoint_FishSell);
        this.initShow();
        
        
    }
    onHide():void{
        this.node.active = false;
        
    }
    private initShow():void{
        if(!this.isInit) return;
        this.sortFishData(this.sortType);
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.weightMaxBtn:
                this.sortFishData(0);
                ClickTipsPanel.Hide();
                break;
            case this.weightMiniBtn:
                this.sortFishData(1);
                ClickTipsPanel.Hide();
                break;
            case this.typeBtn:
                this.sortFishData(2);
                ClickTipsPanel.Hide();
                break;
            case this.downBtn:
                let btnNode:Node = this.downBtn.node;
                let btnSize:Size = btnNode.getComponent(UITransform).contentSize;
                let showPos:Vec3 = btnNode.worldPosition.clone();
                showPos.y = showPos.y - btnSize.height / 2 - this.downBtnCont.getComponent(UITransform).height / 2 + 6;
                this.downBtnArrow.angle = 0;
                ClickTipsPanel.Show(this.downBtnCont, this.node, this.downBtn, showPos, 0, ()=>{
                    this.downBtnArrow.angle = -180;
                });
                break;
            case this.sellBtn:
                if(this.fishShopDatas.length < 1){
                    MsgPanel.Show("没有可出售的鱼");
                    return;
                }
                if(this.selectList.length < 1){
                    MsgPanel.Show("您还没选择要出售的鱼");
                    return;
                }
                Session.Send({type: MsgTypeSend.FishingSellFishItem, data:{item_id_list:this.selectList}});
                break;
            case this.oneKeySellBtn:
                if(this.fishShopDatas.length < 1){
                    MsgPanel.Show("没有可出售的鱼");
                    return;
                }
                let allList:number[] = [] = [];
                for (let index = 0; index < this.fishShopDatas.length; index++) {
                    let fishItem = this.fishShopDatas[index];
                    allList[index] = fishItem.id;
                }
                Session.Send({type: MsgTypeSend.FishingSellFishItem, data:{item_id_list:allList}});
                break;
        }
    }
    private sortFishData(type:number):void{
        this.sortType = type;
        this.fishShopDatas = PlayerData.fishItems ? PlayerData.fishItems.concat() : [];
        switch(type){
            case 0:
                this.downBtnTitle.string = "重量大";
                this.fishShopDatas.sort((a:SFishingItem, b:SFishingItem)=>{
                    return b.weight - a.weight;
                });
                break;
            case 1:
                this.downBtnTitle.string = "重量小";
                this.fishShopDatas.sort((a:SFishingItem, b:SFishingItem)=>{
                    return a.weight - b.weight;
                });
                break;
            case 2:
                this.downBtnTitle.string = "类型";
                this.fishShopDatas.sort((a:SFishingItem, b:SFishingItem)=>{
                    let stdA:StdFishItem = CfgMgr.GetFishItem(a.fish_id);
                    let stdB:StdFishItem = CfgMgr.GetFishItem(b.fish_id);
                    return stdB.FishsId - stdA.FishsId;
                });
                break;
        }
        this.noneListCont.active = this.fishShopDatas.length < 1;
        this.sellList.UpdateDatas(this.fishShopDatas);
    }
    
    private onSellFishUpdate(type:string):void{
        if(type == "remove"){
            this.selectList = [];
            this.sortFishData(this.sortType);
        }
    }
    protected updateSellItem(item: Node, data: SFishingItem) {
        let isSelect:boolean;
        let sellItem = item.getComponent(FishingSellItem);
        if (!sellItem) sellItem = item.addComponent(FishingSellItem);
        let select:Node = item.getChildByName("select");
        select.active = this.selectList.indexOf(data.id) > -1;
        sellItem.SetData(data);
    }
    private onSellSelect(index: number, item: Node):void{
        let select:Node = item.getChildByName("select");
        let selectData:SFishingItem = this.fishShopDatas[index];
        let findIndex:number = this.selectList.indexOf(selectData.id);
        if(findIndex > -1){
            select.active = false;
            this.selectList.splice(findIndex, 1);
        }else{
            select.active = true;
            this.selectList.push(selectData.id);
        }
    }
}