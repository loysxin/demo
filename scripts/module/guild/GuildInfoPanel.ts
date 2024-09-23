import { Button, Label, Node, path, ProgressBar, RichText, Sprite, SpriteFrame } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import PlayerData, { SGuild } from "../roleModule/PlayerData";
import { CfgMgr, GuildPostType, StdGuildLevel, StdGuildLogo } from "../../manager/CfgMgr";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { GuildPrivilegeItem } from "./GuildPrivilegeItem";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { MsgPanel } from "../common/MsgPanel";
import { Tips } from "../login/Tips";
import { GuildExitPanel } from "./GuildExitPanel";
import { EventMgr, Evt_GuildChange } from "../../manager/EventMgr";

export class GuildInfoPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildInfoPanel";
    private logo:Sprite;
    private expPro:ProgressBar;
    private expProLab:Label;
    private nameLab:Label;
    private presidentNameLab:Label;
    private memberLab:Label;
    private lvLab:Label;
    private condLab:Label;
    private privilegeList:AutoScroller;
    private noticeLab:RichText;
    private btn:Button;
    private btnLab:Label;
    private data:SGuild;
    protected onLoad(): void {
        
        this.logo = this.find("logo", Sprite);
        this.nameLab = this.find("nameLab", Label);
        this.presidentNameLab = this.find("presidentNameLab", Label);
        this.memberLab = this.find("memberLab", Label);
        this.lvLab = this.find("lvLab", Label);
        this.condLab = this.find("condLab", Label);
        this.privilegeList = this.find("privilegeList", AutoScroller);
        this.privilegeList.SetHandle(this.updatePrivilegeItem.bind(this));
        this.noticeLab = this.find("noticeLab", RichText);
        this.btn = this.find("btn", Button);
        this.btnLab = this.find("btn/btnLab", Label);
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    public flush(guildData:SGuild): void{
        this.data = guildData;
        this.updateShow();
    }
    
    protected onShow(): void {
        EventMgr.on(Evt_GuildChange, this.onGuildChange, this);
    }

    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_GuildChange, this.onGuildChange, this);
    }
    private onGuildChange():void{
        if(!PlayerData.MyGuild){
            this.Hide();
            return;
        }
    }
    private updateShow():void{
        if(PlayerData.MyGuild && PlayerData.MyGuild.guild_id == this.data.guild_id){
            if(PlayerData.GetGuildMeetPost(PlayerData.roleInfo.player_id, GuildPostType.President))
            {
                this.btnLab.string = "解散公会";
            }else{
                this.btnLab.string = "退出公会";
            }
            
        }else{
            this.btnLab.string = "申请加入";
        }
        this.nameLab.string = this.data.name;
        this.presidentNameLab.string = this.data.leader_info.name || "";
        let stdLv:StdGuildLevel = CfgMgr.GetGuildLevel(this.data.level);
        this.memberLab.string = `${this.data.member_count}/${stdLv.Member}`;
        this.lvLab.string = `Lv.${this.data.level}`;
        this.condLab.string = `家园等级${this.data.join_criteria.min_home_level}级可进入公会`;
        this.noticeLab.string = this.data.announcement.content;
        let stdLogo:StdGuildLogo = CfgMgr.GetGuildLogo(Number(this.data.logo));
        if(stdLogo){
            let url = path.join(folder_icon, `guildLogo/${stdLogo.Logo}`, "spriteFrame");
            ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                this.logo.spriteFrame = res;
            });
        }
        
    }
    private onBtnClick(btn: Button): void {
        switch (btn) {
            case this.btn:
                if(PlayerData.MyGuild && PlayerData.MyGuild.guild_id == this.data.guild_id){
                    let tipsStr:string = "";
                    if(PlayerData.GetGuildMeetPost(PlayerData.roleInfo.player_id, GuildPostType.President))
                    {
                        if(PlayerData.MyGuild.member_count > 1){
                            MsgPanel.Show("会长不可退出公会，转让会长后再尝试");
                            return;
                        }
                    }
                    GuildExitPanel.Show(PlayerData.roleInfo.player_id);
                
                }else{
                    Session.Send({type: MsgTypeSend.GuildJoin, data:{guild_id:this.data.guild_id}});
                    this.Hide();
                }
                break;
        }
    }
    private updatePrivilegeItem(item: Node, data: any, index:number):void{
        let privilegeItem:GuildPrivilegeItem = item.getComponent(GuildPrivilegeItem);
        if(!privilegeItem) privilegeItem = item.addComponent(GuildPrivilegeItem);
        privilegeItem.SetData(data);
        
    }
    
}