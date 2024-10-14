import { Node, Button, Component, Label, sp, Color, Vec3, Size, UITransform, RichText, Sprite, path, SpriteFrame } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import { CfgMgr, FishRoundState, StdItem, StdLake } from "../../manager/CfgMgr";
import { FishingLakeItem } from "./FishingLakeItem";
import { ClickTipsPanel } from "../common/ClickTipsPanel";
import PlayerData, { SFishingLakeData, SFishingRoundInfo } from "../roleModule/PlayerData";
import { FishingContBase } from "./FishingContBase";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_FishDataUpdate } from "../../manager/EventMgr";
import { MsgPanel } from "../common/MsgPanel";
import { FishingFeedBuyPanel } from "./FishingFeedBuyPanel";
import { ResMgr } from "../../manager/ResMgr";

export class FishingSelectLakeCont extends FishingContBase {
    private tipsCont:Node;
    private bottomBg:Sprite;
    private tipsLab:RichText;
    private lakeList:AutoScroller;
    private loakCont:Node;
    private downCont:Node;
    public downBtn:Button;
    private downBtnLab:Label;
    private downBtnArrow:Node;
    private btn:Button;
    private btnLab:Label;
    private lakeDatas:{data:StdLake, isSelect:boolean}[];
    private curSelectIndex:number;
    private curSelectBtnIndex:number;
    private curIcedLake:number[];
    protected onLoad(): void {
        
        this.tipsCont = this.node.getChildByPath("tipsCont");
        
        this.bottomBg = this.node.getChildByName("bottomBg").getComponent(Sprite);
        this.tipsLab = this.node.getChildByPath("tipsCont/tipsLab").getComponent(RichText);
        this.lakeList = this.node.getChildByPath("lakeList").getComponent(AutoScroller);
        this.loakCont = this.node.getChildByPath("lakeList/view/content");
        
        this.downBtn = this.node.getChildByName("downBtn").getComponent(Button);
        this.downBtnLab = this.node.getChildByPath("downBtn/downBtnLab").getComponent(Label);
        this.downBtnArrow = this.node.getChildByPath("downBtn/arrow");
        this.btn = this.node.getChildByName("btn").getComponent(Button);
        this.btnLab = this.node.getChildByPath("btn/btnLab").getComponent(Label);
        this.downCont = this.node.getChildByName("downCont");
        this.downBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);

        let btnDatas:number[] = CfgMgr.GetFishCommon.CostSelectType;
        let btnNode:Node;
        let btnLab:Label;
        let btnCont:Node = this.downCont.getChildByPath("btnCont");
        for (let i = 0; i < btnCont.children.length; i++) {
            btnNode = btnCont.children[i];
            btnLab = btnNode.getChildByName("btnLab").getComponent(Label);
            btnLab.string = `x${btnDatas[i]}`;
            btnNode.on(Button.EventType.CLICK, this.onRodClick.bind(this, i));
        }
        this.lakeList.SetHandle(this.updateItem.bind(this));
        this.lakeList.node.on('select', this.onLakeItemSelect, this);
        this.isInit = true;
        this.initShow();
        this.onRodClick(0);
        EventMgr.on(Evt_FishDataUpdate, this.onFishDataUpdate, this);
    }
    onShow(state: number): void {
        this.curIcedLake = [];
        this.downBtnArrow.angle = 0;
        this.stopIcedEffect();
        super.onShow(state);
        
    }
    onHide(): void {
        super.onHide();
        this.stopIcedEffect();
    }
    private onFishDataUpdate():void{
        if(this.node.active) this.updateCont();
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.btn:
                if(this.curRoundState == FishRoundState.Select){
                    if(PlayerData.CurFishRoundInfo && PlayerData.CurFishRoundInfo.is_frozen){
                        MsgPanel.Show("湖面已冰封不可操作");
                        return;
                    }
                    if(PlayerData.fishItems && PlayerData.fishItems.length >= CfgMgr.GetFishCommon.FishItemBagMax){
                        MsgPanel.Show(`钓鱼背包已满，清理后再参加`);
                        return;
                    }
                    let btnDatas:number[] = CfgMgr.GetFishCommon.CostSelectType;
                    let num:number = btnDatas[this.curSelectBtnIndex];
                    let havNum:number = PlayerData.GetItemCount(CfgMgr.GetFishCommon.CostItemID);
                    if(havNum < num){
                        
                        FishingFeedBuyPanel.Show();
                        let stdItem:StdItem = CfgMgr.Getitem(CfgMgr.GetFishCommon.CostItemID);
                        if(PlayerData.fishData.player.round_cost > 0){
                            MsgPanel.Show(`强化鱼竿失败${stdItem.ItemName}不足${num}个`);
                        }else{
                            MsgPanel.Show(`开始钓鱼失败${stdItem.ItemName}不足${num}个`);
                        }
                        return;
                    }
                    Session.Send({type: MsgTypeSend.FishingRod, data:{cost:num}});
                    return;
                }else if(this.curRoundState == FishRoundState.NoSelect){
                    MsgPanel.Show("请先选择垂钓区域");
                    return;
                }else if(this.curRoundState == FishRoundState.LiftRod){
                    MsgPanel.Show("湖面已冰封不可操作");
                    return;
                }else if(this.curRoundState == FishRoundState.NoFishing){
                    MsgPanel.Show("垂钓已开始，请等待下个回合");
                    return;
                }else if(this.curRoundState == FishRoundState.No){
                    MsgPanel.Show("活动未开始");
                    return;
                }
                break;
            case this.downBtn:
                this.downBtnArrow.angle = -180;
                let btnNode:Node = this.downBtn.node;
                let btnSize:Size = btnNode.getComponent(UITransform).contentSize;
                let showPos:Vec3 = btnNode.worldPosition.clone();
                showPos.y = showPos.y + btnSize.height / 2 + this.downCont.getComponent(UITransform).height / 2 + 6;
                ClickTipsPanel.Show(this.downCont, this.node, this.downBtn, showPos, 0, ()=>{
                    this.downBtnArrow.angle = 0;
                });
                break;
        }
    }

    private onRodClick(index:number):void{
        this.curSelectBtnIndex = index;
        let btnDatas:number[] = CfgMgr.GetFishCommon.CostSelectType;
        ClickTipsPanel.Hide();
        this.downBtnLab.string = btnDatas[index].toString();
    }
    
    protected updateCont(): void {
        let bottomUrl:string = "generalBottomBg";
        if(PlayerData.CurFishRoundInfo && PlayerData.CurFishRoundInfo.kill_type > 1){
            bottomUrl = "hellBottomBg";
        }
        bottomUrl = path.join("sheets/fishing", bottomUrl, "spriteFrame");
        ResMgr.LoadResAbSub(bottomUrl, SpriteFrame, res => {
            this.bottomBg.spriteFrame = res;
        });
        let selectId:number = -1;
        this.tipsCont.active = false;
        let tipsStr:string = "";
        let btnStr:string = "开始";
        switch(this.curRoundState){
            case FishRoundState.Select:
                selectId = PlayerData.fishData.player.lake_id;
                if(selectId <= 0){
                    break;
                }
                this.tipsCont.active = true;
                
                if(PlayerData.fishData.player.round_cost > 0){
                    btnStr = "强化";
                    tipsStr = "等待鱼儿上钩...";
                }else{
                    btnStr = "钓鱼";
                    let std = CfgMgr.GetStdLake(selectId);
                    tipsStr = `已选择垂钓区域\n${std.Lakesname}`;
                }
                this.curIcedLake = PlayerData.FishIcedLakeIds;
                
                break;
            case FishRoundState.NoSelect:
                tipsStr = "请选择垂钓区域";  
                this.tipsCont.active = true;
                //this.btnRod.active = true;
                break;
            case FishRoundState.NoFishing:
                tipsStr = "您未垂钓\n请等待下个回合";  
                this.tipsCont.active = true;
                break;
            case FishRoundState.No:
                btnStr = "未开启";
                break;
        }
        this.btnLab.string = btnStr;
        this.curSelectIndex = -1;
        this.lakeDatas = [];
        let list:StdLake[] = CfgMgr.GetLakeList();
        let std:StdLake;
        let isSelect:boolean;
        for (let index = 0; index < list.length; index++) {
            std = list[index];
            isSelect = false;
            if(selectId > -1 && selectId == std.LakesId){
                isSelect = true;
                this.curSelectIndex = index;
                //tipsStr += std.Lakesname;
            }
            this.lakeDatas[index] = {data:std, isSelect: isSelect};
        }
        this.lakeList.UpdateDatas(this.lakeDatas);
        this.UpdateIcedTips(tipsStr);
    }
    public UpdateIcedTips(str:string):void{
        this.tipsLab.string = str;
    }
    public PlayIcedEffect(isNew:boolean):void{
        let lakeNode:Node;
        let lakeCom:FishingLakeItem;
        let lakeName:string = "";
        let tipsStr:string = "";
        let checkIndex:number = 0;
        for(let index = 0; index < this.loakCont.children.length; index++){
            lakeNode = this.loakCont.children[index];
            lakeCom = lakeNode.getComponent(FishingLakeItem);
            if(lakeCom && lakeCom.lakeData && this.curIcedLake.indexOf(lakeCom.lakeData.LakesId) > -1){
                lakeCom.PlayIcedEffect();
                if(checkIndex < 2){
                    if(lakeName != "")lakeName += "、";
                    lakeName += lakeCom.lakeData.Lakesname;
                }
                
                checkIndex++;
                //break;
            }
        }
        if(checkIndex > 1){
            this.UpdateIcedTips(`${lakeName}等，结冰了`);
        }else{
            this.UpdateIcedTips(`${lakeName}结冰了`);
        }
    }
    private stopIcedEffect():void{
        let lakeNode:Node;
        let lakeCom:FishingLakeItem;
        for(let index = 0; index < this.loakCont.children.length; index++){
            lakeNode = this.loakCont.children[index];
            lakeCom = lakeNode.getComponent(FishingLakeItem);
            lakeCom.StopIcedEffect();
        }
    }
    private updateItem(item: Node, data: {data:StdLake, isSelect:boolean}):void{
        let lakeItem:FishingLakeItem = item.getComponent(FishingLakeItem);
        if(!lakeItem) lakeItem = item.addComponent(FishingLakeItem);
        let select: Node = item.getChildByName("select");
        select.active = data.isSelect;
        let feedLab:Label = item.getChildByPath("feedCont/feedLab").getComponent(Label);
        feedLab.color = new Color().fromHEX(data.isSelect ? "#396701" : "#076168"); 
        lakeItem.SetData(data.data, data.isSelect);
    }

    private onLakeItemSelect(index: number, item: Node) {
        let curRoundInfo:SFishingRoundInfo = PlayerData.CurFishRoundInfo;
        if(!curRoundInfo || curRoundInfo.end_time < PlayerData.GetServerTime()){
            MsgPanel.Show("活动未开启");
            return;
        } 
        if(curRoundInfo.is_frozen){
            if(PlayerData.fishData.player.round_cost < 1){
                MsgPanel.Show("未参与本轮垂钓，请下个回合再来");
                return    
            }
            MsgPanel.Show("湖面冰封了不可操作")
            return;
        }
        if(this.curSelectIndex > -1){
            if(this.curSelectIndex == index) return;
            let preData = this.lakeDatas[index];
            preData.isSelect = false;
            let chidlren = this.lakeList.children;
            let preSelect: Node;
            let preFeedLab:Label;
            for (let child of chidlren) {
                preSelect = child.getChildByName("select");
                preSelect.active = preData.isSelect;
                preFeedLab = child.getChildByPath("feedCont/feedLab").getComponent(Label);
                preFeedLab.color = new Color().fromHEX("#076168"); 
            }
        }
        let data = this.lakeDatas[index];
        data.isSelect = true;
        let select: Node = item.getChildByName("select");
        select.active = data.isSelect;
        let feedLab:Label = item.getChildByPath("feedCont/feedLab").getComponent(Label);
        feedLab.color = new Color().fromHEX(data.isSelect ? "#396701" : "#076168"); 
        this.curSelectIndex = index;
        Session.Send({type: MsgTypeSend.FishingSelectLake, data:{lake_id:data.data.LakesId}});
    }

}