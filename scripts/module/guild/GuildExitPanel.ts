import { Button, Label, Node, RichText} from "cc";
import { Panel } from "../../GameRoot";
import { GuildPrivilegeItem } from "./GuildPrivilegeItem";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import PlayerData from "../roleModule/PlayerData";
import { CfgMgr, GuildPostType } from "../../manager/CfgMgr";
import { EventMgr, Evt_GuildChange } from "../../manager/EventMgr";

export class GuildExitPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildExitPanel";
    private titleLab:Label;
    private cont:RichText;
    private btn:Button;
    private playerId:string;
    protected onLoad(): void {
        
        this.titleLab = this.find("titleLab", Label);
        this.cont = this.find("cont", RichText);
        this.btn = this.find("btn", Button);
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    public flush(id:string): void{
        this.playerId = id;
        this.updateShow();
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
    private updateShow():void{
        let tipsStr:string = "";
        let exitCdTime:number = CfgMgr.GetGuildComm().ExitCdTime / 3600;
        if(PlayerData.GetGuildMeetPost(this.playerId, GuildPostType.President))
        {
            this.titleLab.string = "解散公会";
            tipsStr = `解散公会后，将影响捐献和领取福利，加入新公会<color=#C75D17>${exitCdTime}小时</color>后才可重新捐献或领取福利，确认解散吗?`;
            
        }else{
            this.titleLab.string = "退出公会";
            tipsStr = `退出公会后，将影响捐献和领取福利，加入新公会<color=#C75D17>${exitCdTime}小时</color>后才可重新捐献或领取福利，确认退出吗?`;
        }
        this.cont.string = tipsStr;
    }
    private onBtnClick(btn: Button): void {
        Session.Send({type: MsgTypeSend.GuildLeave, data:{guild_id:PlayerData.MyGuild.guild_id}});    
        this.Hide(); 
    }
    private updatePrivilegeItem(item: Node, data: any, index:number):void{
        let privilegeItem:GuildPrivilegeItem = item.getComponent(GuildPrivilegeItem);
        if(!privilegeItem) privilegeItem = item.addComponent(GuildPrivilegeItem);
        privilegeItem.SetData(data);
        
    }
    
}