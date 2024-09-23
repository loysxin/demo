import { Button, Label, Node, path, ProgressBar, RichText, Size, Sprite, SpriteFrame, UITransform } from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_GuildChange, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import { AutoScroller } from "../../utils/AutoScroller";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { GuildInfoPanel } from "./GuildInfoPanel";
import PlayerData, { SGuild, SGuildMember } from "../roleModule/PlayerData";
import { GuildMemberPanel } from "./GuildMemberPanel";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { CfgMgr, StdGuildLevel, StdGuildLogo } from "../../manager/CfgMgr";
import { GuildAuditPanel } from "./GuildAuditPanel";
import { GuildDonatePanel } from "./GuildDonatePanel";
import { GuildManagePanel } from "./GuildManagePanel";
import { ConsumeItem } from "../common/ConsumeItem";
import { ClickTipsPanel } from "../common/ClickTipsPanel";
import { GuildCarveUpItem } from "./GuildCarveUpItem";
enum MemberListSotrType{
    Def,//默认排序
    Post,//职位排序
    Level,//等级排序
    Power,//战力排序
    Donate,//捐献排序
}
export class GuildCarveUpPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildCarveUpPanel";
    private consumeItem:ConsumeItem;
    private peopleLab:Label;
    private list:AutoScroller;
    private downBtn:Button;
    private downBtnTitle:Label;
    private downBtnArrow:Node;
    private downBtnCont:Node;
    private resetBtn:Button;
    private allMaxBtn:Button;
    private oneKeyBtn:Button;
    private sotrType:number;
    private tempCarveUp:{[key:string]:number};
    protected onLoad(): void {
        this.consumeItem = this.find("consumeItem").addComponent(ConsumeItem);
        this.peopleLab = this.find("peopleLab", Label);
        this.list = this.find("list", AutoScroller);
        this.list.SetHandle(this.updateItem.bind(this));
        this.downBtn = this.find("downBtn", Button);
        this.downBtnTitle = this.find("downBtn/downBtnTitle", Label);
        this.downBtnArrow = this.find("downBtn/downBtnArrow");
        this.downBtnCont = this.find("downBtnCont");

        this.resetBtn = this.find("resetBtn", Button);
        this.allMaxBtn = this.find("allMaxBtn", Button);
        this.oneKeyBtn = this.find("oneKeyBtn", Button);
        
        this.resetBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.allMaxBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.oneKeyBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.downBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    public flush(): void{
        this.downBtnArrow.angle = 0;
        this.tempCarveUp = {};
        this.updateShow();
    }
    
    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
        EventMgr.on(Evt_GuildChange, this.onGuildChange, this);
    }

    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
        EventMgr.off(Evt_GuildChange, this.onGuildChange, this);
    }
    private onGuildChange():void{
        if(!PlayerData.MyGuild){
            this.Hide();
            return;
        }
        this.flush();
    }
    private onBtnClick(btn: Button): void {
        switch (btn) {
            case this.resetBtn:
                
                break;
            case this.allMaxBtn:
                
                break;
            case this.oneKeyBtn:
                
                break;
            case this.downBtn:
                let btnSize:Size = this.downBtn.node.getComponent(UITransform).contentSize;
                let showPos:Vec3 = this.downBtn.node.worldPosition.clone();
                showPos.y = showPos.y - btnSize.height / 2 - this.downBtnCont.getComponent(UITransform).height / 2 + 6;
                this.downBtnArrow.angle = 180;
                ClickTipsPanel.Show(this.downBtnCont, this.node, this.downBtn.node, showPos, 0, ()=>{
                    this.downBtnArrow.angle = 0;
                });
                break;
        }
    }
    private updateShow(sotr:number = 0):void{
        this.sotrType = sotr;
        let datas:SGuildMember[] = Object.values(PlayerData.MyGuild.members);
        switch (this.sotrType) {
            case MemberListSotrType.Def://默认排序
                //datas.sort
                this.downBtnTitle.string = "默认排列";
                break;
            case MemberListSotrType.Post:
                datas.sort((a:SGuildMember, b:SGuildMember)=>{
                    return a.role - b.role; 
                });
                this.downBtnTitle.string = "职位排列";
                break;
            case MemberListSotrType.Level:
                datas.sort((a:SGuildMember, b:SGuildMember)=>{
                    return a.level - b.level; 
                });
                this.downBtnTitle.string = "等级排列";
                break;
            case MemberListSotrType.Power:
                datas.sort((a:SGuildMember, b:SGuildMember)=>{
                    return a.fight - b.fight; 
                });
                this.downBtnTitle.string = "战力排列";
                break;
            case MemberListSotrType.Donate:
                
                this.downBtnTitle.string = "捐献排列";
                break;
        }

        this.list.UpdateDatas(datas);
        this.list.ScrollToHead();
    }
    private updateItem(item: Node, data: SGuildMember) {
        let memberItem: GuildCarveUpItem = item.getComponent(GuildCarveUpItem);
        if(!memberItem) memberItem = item.addComponent(GuildCarveUpItem);
        memberItem.SetData(data);

    }
    
}