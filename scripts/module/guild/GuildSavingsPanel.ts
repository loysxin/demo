import { Button, Color, instantiate, Label, Layout, Node, path, Size, Sprite, SpriteFrame, UITransform } from "cc";
import { Panel } from "../../GameRoot";
import { ConsumeItem, ConsumeNumFormatType } from "../common/ConsumeItem";
import { CfgMgr, StdGuildBank } from "../../manager/CfgMgr";
import { ClickTipsPanel } from "../common/ClickTipsPanel";
import { ItemUtil } from "../../utils/ItemUtils";
import PlayerData, { SGuildDepositTotal, SThing } from "../roleModule/PlayerData";
import { ResMgr } from "../../manager/ResMgr";
import { formatNumber } from "../../utils/Utils";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_GuildChange } from "../../manager/EventMgr";



export class GuildSavingsPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildSavingsPanel";
    private typeBg:Sprite;
    private typeIcon:Sprite;
    private savingsTitleLab:Label;
    private principalItem:ConsumeItem;
    private savingsTotallItem:ConsumeItem;
    private timeTitleLab:Label;
    private timeLab:Label;
    private interestTitleLab:Label;
    private interestLab:Label;
    private consumeItem:ConsumeItem;
    private btn:Button;
    private downBtnCont: Node;
    private downBtn: Button;
    private btnCont:Node;
    private tempItemBtn:Node;
    private std:StdGuildBank;
    private curIndex:number;
    private totlaData:SGuildDepositTotal;
    protected onLoad(): void {
        this.typeBg = this.find("typeBg", Sprite);
        this.typeIcon = this.find("typeIcon", Sprite);
        this.savingsTitleLab = this.find("savingsTitleLab",Label);
        this.principalItem = this.find("principalItem").addComponent(ConsumeItem);
        this.savingsTotallItem = this.find("totalCont/savingsTotallItem").addComponent(ConsumeItem);
        this.timeTitleLab = this.find("timeTitleLab", Label);
        this.timeLab = this.find("timeLab", Label);
        this.interestTitleLab = this.find("interestTitleLab", Label);
        this.interestLab = this.find("interestLab", Label);
        this.consumeItem = this.find("consumeItem").addComponent(ConsumeItem);
        this.btn = this.find("btn", Button);
        this.downBtn = this.find("downBtn", Button);
        this.downBtnCont = this.find("downBtnCont");
        this.btnCont = this.find("downBtnCont/btnCont");
        this.tempItemBtn = this.find("tempItemBtn");
        this.tempItemBtn.active = false;
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.downBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    public flush(std:StdGuildBank, totlaData:SGuildDepositTotal): void{
        this.std = std;
        this.totlaData = totlaData;
        this.curIndex = 0;
        this.downBtn.node.angle = -90;
        this.updateShow();
        this.updateSelect();
    }
    
    protected onShow(): void {
        EventMgr.on(Evt_GuildChange, this.onGuildChange, this);
    }

    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_GuildChange, this.onGuildChange, this);
    }
    private onGuildChange():void{
        if(!this.node.activeInHierarchy) return;
        if(!PlayerData.MyGuild){
            this.Hide();
        }
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.downBtn:
                this.downBtn.node.angle = 0;
                this.updateBtnCont();
                let btnNode:Node = this.downBtn.node;
                let btnSize:Size = btnNode.getComponent(UITransform).contentSize;
                let showPos:Vec3 = btnNode.worldPosition.clone();
                showPos.x = showPos.x - btnSize.width - this.downBtnCont.getComponent(UITransform).width * 0.5;
                showPos.y = showPos.y - btnSize.height - this.downBtnCont.getComponent(UITransform).height * 0.5;
                ClickTipsPanel.Show(this.downBtnCont, this.node, this.downBtn, showPos, 0, ()=>{
                    this.downBtn.node.angle = -90;
                });
                break;
            case this.btn:
                if (!ItemUtil.CheckThingConsumes([this.std.CostType[this.curIndex]], [this.std.CostId[this.curIndex]], [this.std.CostNum[this.curIndex]], true)) {
                    return;
                }
                
                Session.Send({ type: MsgTypeSend.GuildBankDeposit, 
                    data: {
                        guild_id: PlayerData.MyGuild.guild_id,
                        donate_id: this.std.DonateId.toString(),
                        cost_idx: this.curIndex,
                    } 
                });
                break;
        }
    }
    private updateBtnCont():void{
        let len:number = this.std.CostType.length;
        let maxLen = Math.max(len, this.btnCont.children.length);
        let btn:Button;
        let btnNode:Node;
        let consumeItem:ConsumeItem;
        let idx:number = 0;
        let layout:Layout = this.btnCont.getComponent(Layout);
        let totalH:number = layout.paddingTop + layout.paddingBottom;
        let itemData:SThing;
        let consumeItemList:ConsumeItem[] = [];
        let itemDataList:SThing[] = [];
        for (let index = 0; index < maxLen; index++) {
            btnNode = this.btnCont.children[index];
            if(!btnNode){
                btnNode = instantiate(this.tempItemBtn);
                btnNode.parent = this.btnCont;
            }
            btn = btnNode.getComponent(Button);
            btn.node.off(Button.EventType.CLICK, this.onDownBtnClick, this);
            if(index < len){
                itemData = ItemUtil.CreateThing(this.std.CostType[idx], this.std.CostId[idx], this.std.CostNum[idx]);
                consumeItem = btnNode.getChildByName("consumeItem").getComponent(ConsumeItem);
                if(!consumeItem) consumeItem = btnNode.getChildByName("consumeItem").addComponent(ConsumeItem);
                btnNode.active = true;
                consumeItemList.push(consumeItem);
                itemDataList.push(itemData);
                btn.node.on(Button.EventType.CLICK, this.onDownBtnClick.bind(this, idx), this);
                totalH += btnNode.getComponent(UITransform).height;
                if(idx < len) totalH += layout.spacingY;
                idx++;
            }else{
                btnNode.active = false;
                
            }
        }
        this.downBtnCont.getComponent(UITransform).height = totalH;
        this.scheduleOnce(()=>{
            let item:ConsumeItem;
            for (let index = 0; index < consumeItemList.length; index++) {
                item = consumeItemList[index];
                item.SetData(itemDataList[index]);
            }
        },0.1)
        
    }
    private onDownBtnClick(index:number):void{
        ClickTipsPanel.Hide();
        this.curIndex = index;
        this.updateSelect();
    }
    private updateSelect():void{
        let itemData:SThing = ItemUtil.CreateThing(this.std.CostType[this.curIndex], this.std.CostId[this.curIndex], this.std.CostNum[this.curIndex]);
        this.principalItem.SetData(itemData);
        let curNumLab:Label = this.find("consumeItem/curLab", Label);
        let numLab:Label = this.find("consumeItem/numLab", Label);
        this.consumeItem.SetData(itemData);
        numLab.string = `/${formatNumber(PlayerData.GetItemCount(itemData.item.id), 2)}`;
        curNumLab.string = `${formatNumber(itemData.resData.count, 2)}`; 
        if(ItemUtil.CheckItemIsHave(this.std.CostType[this.curIndex], this.std.CostId[this.curIndex], this.std.CostNum[this.curIndex])){
            curNumLab.color = new Color().fromHEX("#176E80");
        }else{
            curNumLab.color = new Color().fromHEX("#C53130");
        }
        let colorList:string[] = CfgMgr.GetGuildSavingsTypeColor(this.std.SavingsType);
        let principalLab:Label = this.find("principalItem/numLab", Label);
        let valColor:Color = new Color().fromHEX(colorList[1]);
        principalLab.color = valColor;
    }
    private updateShow():void{

        let itemData:SThing = ItemUtil.CreateThing(this.totlaData.cost_type, 0, this.totlaData.total_amount);
        this.savingsTotallItem.SetData(itemData);

        let url = path.join("sheets/guild", this.std.TypeBg, "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            this.typeBg.spriteFrame = res;
        });
        url = path.join("sheets/guild", this.std.TypeIcon, "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            this.typeIcon.spriteFrame = res;
        });
        this.timeLab.string = this.std.Duration.toString();

        let colorList:string[] = CfgMgr.GetGuildSavingsTypeColor(this.std.SavingsType);
        let titleColor:Color = new Color().fromHEX(colorList[0]);
        let valColor:Color = new Color().fromHEX(colorList[1]);
        this.savingsTitleLab.color = titleColor;
        this.timeTitleLab.color = titleColor;
        this.interestTitleLab.color = titleColor;
        let principalLab:Label = this.find("principalItem/numLab", Label);
        principalLab.color = valColor;
        this.timeLab.color = valColor;
        this.interestLab.color = valColor;
        this.timeLab.string = `${this.std.Duration}天`;
        let totalAddRate:number[] = CfgMgr.GetGuildSavingsTotalRate(this.std.DonateId, this.totlaData.total_amount);
        let myRate:number = CfgMgr.GetGuildSavingsRate(this.std.DonateId, PlayerData.MyGuild.type, PlayerData.GetMyGuildLimit().ID);
        this.interestLab.string = `${formatNumber(myRate + totalAddRate[1],2)}%`;
    }
    
}