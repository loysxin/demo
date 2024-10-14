import { Button, Component, Label, SpriteFrame, UITransform} from "cc";
import { HeadItem } from "../common/HeadItem";
import PlayerData, { SGuildApplication, SPlayerViewInfo } from "../roleModule/PlayerData";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_GuildAuditResult } from "../../manager/EventMgr";
import { MsgPanel } from "../common/MsgPanel";
export class GuildAuditItem extends Component {
    private head:HeadItem;
    private consentBtn:Button;
    private refuseBtn:Button;
    private nameLab: Label;
    private lvLab: Label;
    private fightLab:Label;
    private isInit:boolean = false;
    private data:SGuildApplication;
    protected onLoad(): void {
        this.head = this.node.getChildByName("head").addComponent(HeadItem);
        this.consentBtn = this.node.getChildByName("consentBtn").getComponent(Button);
        this.refuseBtn = this.node.getChildByName("refuseBtn").getComponent(Button);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.lvLab = this.node.getChildByName("lvLab").getComponent(Label);
        this.fightLab = this.node.getChildByName("fightLab").getComponent(Label);
        this.consentBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.refuseBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.isInit = true;
        
        this.updateShow();
    }
    
    SetData(data:any,) {
        this.data = data;
        this.updateShow();
    }
    private onBtnClick(btn:Button):void{
        let isPermit:boolean = true;
        switch(btn){
            case this.consentBtn:
                
                break;
            case this.refuseBtn:
                isPermit = false;
                break;
        }
        if(PlayerData.MyGuild && PlayerData.MyGuild.members[this.data.player_id]){
            MsgPanel.Show(`${this.data.name}已是公会成员`);
            EventMgr.emit(Evt_GuildAuditResult, isPermit, [], [] ,[this.data.player_id]);
            return;
        }
        Session.Send({
                type: MsgTypeSend.GuildApprovalApplications, 
                data: {
                    guild_id:PlayerData.MyGuild.guild_id, 
                    is_permit:isPermit, 
                    applications_ids:[this.data._id]
                } 
            });
    }
    
    private updateShow():void{
        if(!this.isInit || !this.data) return;
        this.nameLab.string = this.data.name;
        this.lvLab.string = this.data.level.toString();
        this.fightLab.string = this.data.battle_power.toString();
        let viewInfo:SPlayerViewInfo = {player_id: this.data.player_id};
        this.head.SetData(viewInfo);
    }
}