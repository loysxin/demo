import { Button, Label, Node, ProgressBar, RichText, Sprite, UIOpacity, UITransform, Vec3 } from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_GuildChange, Evt_GuildMenuShow, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import { AutoScroller } from "../../utils/AutoScroller";
import { GuildMemberItem } from "./GuildMemberItem";
import PlayerData, { SGuild, SGuildMember } from "../roleModule/PlayerData";
import { CfgMgr, GuildPostType, StdGuildLevel } from "../../manager/CfgMgr";
import { GuildMenuCont } from "./GuildMenuCont";
import { ClickTipsPanel } from "../common/ClickTipsPanel";

export class GuildMemberPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildMemberPanel";
    private memberNumLab:Label;
    private list: AutoScroller;
    private menuBtnCont:GuildMenuCont;
    private data:SGuild;
    activeBoxTips: any;
    protected onLoad(): void {
        this.memberNumLab = this.find("memberNumLab", Label);
        this.list = this.find("list", AutoScroller);
        this.menuBtnCont = this.find("menuBtnCont").addComponent(GuildMenuCont);
        this.list.SetHandle(this.updateItem.bind(this));
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    public flush(): void{
       this.data = PlayerData.MyGuild;
       this.updateShow();
    }
    
    protected onShow(): void {
        EventMgr.on(Evt_GuildMenuShow, this.onShowMenu, this);
        EventMgr.on(Evt_GuildChange, this.onGuildChange, this);
    }

    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_GuildMenuShow, this.onShowMenu, this);
        EventMgr.on(Evt_GuildChange, this.onGuildChange, this);
        ClickTipsPanel.Hide();
    }
    private onGuildChange():void{
        if(!PlayerData.MyGuild){
            this.Hide();
            
            return;
        }
        this.flush();
    }
    private onShowMenu(data:SGuildMember, showPos:Vec3, clickTarget:Node):void{
        let uiOpacity:UIOpacity = this.menuBtnCont.getComponent(UIOpacity);
        uiOpacity.opacity = 0;
        this.menuBtnCont.node.active = true;
        this.menuBtnCont.SetData(data);
        this.scheduleOnce(()=>{
            showPos.x += 126; 
            showPos.y -= this.menuBtnCont.node.getComponent(UITransform).height / 2 + 40;
            ClickTipsPanel.Show(this.menuBtnCont.node, this.node, clickTarget, showPos, 0);
            uiOpacity.opacity = 255;
        });
        //this.menuBtnCont.node.active = true;
        
                
    }
    private updateShow():void{
        let stdLv:StdGuildLevel = CfgMgr.GetGuildLevel(this.data.level);
        this.memberNumLab.string = `${this.data.member_count}/${stdLv.Member}`;
        let topDatas:SGuildMember[] = [];
        let memberList:SGuildMember[] = [];
        let member:SGuildMember;
        for (let id in this.data.members) {
            member = this.data.members[id];
            if(member.role < GuildPostType.Member){
                topDatas.push(member);
            }else{
                memberList.push(member);
            }
            
        }
        topDatas.sort((a, b) => {
            return a.role - b.role;
        });
        memberList.sort((a, b) => {
            return a?.level - b?.level;
        });
        let newList:SGuildMember[] = topDatas.concat(memberList);
        this.list.UpdateDatas(newList);
    }
    protected updateItem(item: Node, data: SGuildMember) {
        let memberItem = item.getComponent(GuildMemberItem);
        if (!memberItem) memberItem = item.addComponent(GuildMemberItem);
        memberItem.SetData(data);
    }
}