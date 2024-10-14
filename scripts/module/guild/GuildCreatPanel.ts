import { Button, Label, Node, path, Size, Sprite, SpriteFrame, UITransform, v3 } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { GuildAuditItem } from "./GuildAuditItem";
import { CfgMgr, StdGuildLogo, StdGuildType } from "../../manager/CfgMgr";
import { ClickTipsPanel } from "../common/ClickTipsPanel";
import PlayerData, { SGuildAnnouncement, SGuildJoinCriteria, SThing } from "../roleModule/PlayerData";
import { ItemUtil } from "../../utils/ItemUtils";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { ConsumeItem } from "../common/ConsumeItem";
import { EventMgr, Evt_GuildChange } from "../../manager/EventMgr";



export class GuildCreatPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildCreatPanel";
    private nameLab:Label;
    private typeLab:Label;
    private logo:Sprite;
    private guildType:Sprite;
    private downBtnCont: Node;
    private downBtn: Button;
    private btn:Button;
    private consumeList: AutoScroller;
    private curType:StdGuildType;
    private guildName:string;
    private guildLogoId:number;
    private announcement:SGuildAnnouncement;
    private joinCriteria:SGuildJoinCriteria;
    protected onLoad(): void {
        this.nameLab = this.find("nameLab", Label);
        this.typeLab = this.find("typeLab", Label);
        this.logo = this.find("logo", Sprite);
        this.guildType = this.find("guildType", Sprite);
        this.downBtn = this.find("downBtn", Button);
        this.downBtnCont = this.find("downBtnCont");
        this.btn = this.find("btn", Button);
        this.consumeList = this.find("btn/consumeList", AutoScroller);
        this.consumeList.SetHandle(this.updateItem.bind(this));
        let btn:Button;
        let btnLab:Label;
        let typeList:StdGuildType[] = CfgMgr.GetGuildTypeList();
        let stdGuildType:StdGuildType;
        let idx:number = 0;
        for (let i = 0; i < this.downBtnCont.children.length; i++) {
            btn = this.downBtnCont.children[i].getComponent(Button);
            if(btn){
                stdGuildType = typeList[idx];
                btnLab = btn.node.getChildByName("Label").getComponent(Label);
                btnLab.string = stdGuildType.Name;
                btn.node.on(Button.EventType.CLICK, this.onDownBtnClick.bind(this, stdGuildType));
                idx++;
            }
            
        }
        this.downBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    public flush(guildName:string, guildLogoId:number, announcement:SGuildAnnouncement, join_criteria:SGuildJoinCriteria): void{
        this.guildName = guildName;
        this.guildLogoId = guildLogoId;
        this.announcement = announcement;
        this.joinCriteria = join_criteria;
        this.curType = CfgMgr.GetGuildTypeList()[0];
        this.updateSelectGuildType();
        this.updateShow();
        this.showDownTips();
    }
    
    protected onShow(): void {
        
        EventMgr.on(Evt_GuildChange, this.onGuildChange, this);
    }

    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_GuildChange, this.onGuildChange, this);
    }
    private onGuildChange():void{
        if(!this.node.activeInHierarchy) return;
        if(PlayerData.MyGuild){
            this.Hide();
        }
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.downBtn:
                this.showDownTips();
                break;
            case this.btn:
                if (!ItemUtil.CheckThingConsumes(this.curType.CreateCostType, this.curType.CreateCostID, this.curType.CreateCostCount, true)) {
                    return;
                }
                
                Session.Send({ type: MsgTypeSend.GuildCreate, 
                    data: {
                        name: this.guildName,
                        create_type: this.curType.ID,
                        logo: this.guildLogoId.toString(),
                        announcement:this.announcement,
                        join_criteria:this.joinCriteria,
                    } 
                });
                break;
        }
    }
    private showDownTips():void{
        this.downBtn.node.angle = 0;
        let btnNode:Node = this.downBtn.node;
        let btnSize:Size = btnNode.getComponent(UITransform).contentSize;
        let showPos:Vec3 = btnNode.worldPosition.clone();
        showPos.x = showPos.x - btnSize.width - this.downBtnCont.getComponent(UITransform).width * 0.5;
        showPos.y = showPos.y - btnSize.height - this.downBtnCont.getComponent(UITransform).height * 0.5;
        ClickTipsPanel.Show(this.downBtnCont, this.node, this.downBtn, showPos, 0, ()=>{
            this.downBtn.node.angle = -90;
        });
    }
    private onDownBtnClick(std:StdGuildType):void{
        ClickTipsPanel.Hide();
        this.curType = std;
        this.updateSelectGuildType();
    }
    private updateSelectGuildType():void{
        this.typeLab.string = this.curType.Name;
        if(this.curType.TypeIconRes && this.curType.TypeIconRes.length > 0){
            this.guildType.node.active = true;
            let url = path.join(folder_icon, `guildLogo/${this.curType.TypeIconRes}`, "spriteFrame");
            ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                this.guildType.spriteFrame = res;
            });
        }else{
            this.guildType.node.active = false;
        }
        
        let datas:SThing [] = ItemUtil.GetSThingList(this.curType.CreateCostType, this.curType.CreateCostID, this.curType.CreateCostCount);
        let trans:UITransform = this.consumeList.node.getComponent(UITransform);
        if(datas.length > 1){
            this.consumeList.node.position = v3(0, this.consumeList.node.position.y);
        }else{
            this.consumeList.node.position = v3(76, this.consumeList.node.position.y);
        }
        this.consumeList.UpdateDatas(datas);
    }
    private updateShow():void{
        this.nameLab.string = this.guildName;
        let stdLogo:StdGuildLogo = CfgMgr.GetGuildLogo(this.guildLogoId);
        let url = path.join(folder_icon, `guildLogo/${stdLogo.Logo}`, "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            this.logo.spriteFrame = res;
        });
        
    }
    protected updateItem(item: Node, data: SThing) {
        let consumeItem = item.getComponent(ConsumeItem);
        if (!consumeItem) consumeItem = item.addComponent(ConsumeItem);
        consumeItem.SetData(data);
    }
}