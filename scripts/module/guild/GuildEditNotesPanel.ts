import { Button, EditBox } from "cc";
import { Panel } from "../../GameRoot";
import { MsgPanel } from "../common/MsgPanel";
import { CfgMgr } from "../../manager/CfgMgr";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_GuildChange } from "../../manager/EventMgr";
import PlayerData from "../roleModule/PlayerData";
export class GuildEditNotesPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildEditNotesPanel";
    private editBox: EditBox;
    private btn:Button;
    private cont:string;
    protected onLoad(): void {
        this.editBox = this.find("editBox", EditBox);
        this.btn = this.find("btn", Button);
        this.CloseBy("mask");
        this.CloseBy("closeBtn");
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        
    }
    public flush(cont:string): void {
        this.cont = cont;
        this.editBox.string = cont;
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
        let inputStr:string = this.editBox.string;
        if(this.cont == inputStr){
            MsgPanel.Show("您输入的留言并没什么变化");
            return;
        }
        if(inputStr.length > CfgMgr.GetGuildComm().MessageLen){
            MsgPanel.Show(`心情留言不可超过${CfgMgr.GetGuildComm().MessageLen}个字符`);
            return;
        }
        Session.Send({ type: MsgTypeSend.GuildChangeSelfMessage, 
            data: {
                new_message: inputStr,
            } 
        });
        this.Hide();
    }
    
    private updateView():void{
        
    }
    
}