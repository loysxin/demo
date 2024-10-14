import { Button, Label, Node, path, ProgressBar, RichText, Sprite, SpriteFrame } from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_GuildChange, Evt_GuildEventUpdate, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import { AutoScroller } from "../../utils/AutoScroller";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { GuildInfoPanel } from "./GuildInfoPanel";
import PlayerData, { SGuild, SGuildEvent, SGuildMember } from "../roleModule/PlayerData";
import { GuildMemberPanel } from "./GuildMemberPanel";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { CfgMgr, StdGuildEvent, StdGuildLevel, StdGuildLogo, StdGuildType } from "../../manager/CfgMgr";
import { GuildAuditPanel } from "./GuildAuditPanel";
import { GuildDonatePanel } from "./GuildDonatePanel";
import { GuildManagePanel } from "./GuildManagePanel";
import { GuildEditNotesPanel } from "./GuildEditNotesPanel";
import { GuildBankSelectPanel } from "./GuildBankSelectPanel";
import { GuildRankPanel } from "./GuildRankPanel";
import { GuildBankPanel } from "./GuildBankPanel";
import { MsgPanel } from "../common/MsgPanel";

export class GuildPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildPanel";
    private rankBtn:Button;
    private notesBtn:Button;
    private memberBtn:Button;
    private bankBtn:Button;
    private donateBtn:Button;
    private msgCont: Node;
    private aloneMsgCont: Node;
    private aloneMsgBtn: Button;
    private msgTitleLab: Label;
    private msgLab: Label;
    private allMsgCont: Node;
    private msgList: AutoScroller;
    private msgArrowBtn: Button;
    private guildNameLab:Label;
    private logo:Sprite;
    private guildType:Sprite;
    private logoBtn:Button;
    private applyBtn:Button;
    private infoBtn:Button;
    private helpBtn:Button;
    private lvLab:Label;
    private expPro:ProgressBar;
    private expProLab:Label;
    private presidentNameLab:Label;
    private memberLab:Label;
    private noticeLab:RichText;
    private msgIsStretch: boolean = false;
    private eventDatas:SGuildEvent[];
    protected onLoad(): void {
        this.rankBtn = this.find("btnCont/rankBtn", Button);
        this.notesBtn = this.find("btnCont/notesBtn", Button);
        this.memberBtn = this.find("btnCont/memberBtn", Button);
        this.bankBtn = this.find("btnCont/bankBtn", Button);
        this.donateBtn = this.find("btnCont/donateBtn", Button);
        this.msgCont = this.find("msgCont");
        this.aloneMsgCont = this.find("msgCont/aloneMsgCont");
        this.aloneMsgBtn = this.find("msgCont/aloneMsgCont", Button);
        this.msgTitleLab = this.find("msgCont/aloneMsgCont/titleLab", Label);
        this.msgLab = this.find("msgCont/aloneMsgCont/msgLab", Label);
        this.allMsgCont = this.find("msgCont/allMsgCont");
        this.msgList = this.find("msgCont/allMsgCont/msgList", AutoScroller);
        this.msgArrowBtn = this.find("msgCont/allMsgCont/arrowBtn", Button);
        this.msgList.SetHandle(this.updateMsgItem.bind(this));
        this.guildNameLab = this.find("infoCont/guildNameLab", Label);
        this.helpBtn = this.find("infoCont/helpBtn", Button);
        this.logo = this.find("infoCont/logo", Sprite);
        this.logoBtn = this.find("infoCont/logo", Button);
        this.guildType = this.find("infoCont/logo/guildType", Sprite);
        this.lvLab = this.find("infoCont/lvLab", Label);
        this.applyBtn = this.find("infoCont/limitBtnCont/applyBtn", Button);
        this.infoBtn = this.find("infoCont/limitBtnCont/infoBtn", Button);
        this.expPro = this.find("infoCont/expPro", ProgressBar);
        this.expProLab = this.find("infoCont/expProLab", Label);
        this.presidentNameLab = this.find("infoCont/presidentNameLab", Label);
        this.memberLab = this.find("infoCont/memberLab", Label);
        this.noticeLab = this.find("infoCont/noticeLab", RichText);
        this.msgArrowBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.aloneMsgBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.applyBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.infoBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.rankBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.notesBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.memberBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.bankBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.donateBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.helpBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.logoBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.CloseBy("backBtn");
    }
    public flush(): void{
        this.updateBaseInfo();
        
    }
    
    protected onShow(): void {
        this.eventDatas = [];
        this.updateMsgSate();
        Session.Send({type: MsgTypeSend.GuildGetSelfEvent, data:{}});
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
        EventMgr.on(Evt_GuildChange, this.onGuildChange, this);
        EventMgr.on(Evt_GuildEventUpdate, this.onUpdateMsg, this);
    }

    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
        EventMgr.off(Evt_GuildChange, this.onGuildChange, this);
        EventMgr.off(Evt_GuildEventUpdate, this.onUpdateMsg, this);
    }
    private onGuildChange():void{
        if(!PlayerData.MyGuild){
            this.Hide();
            return;
        }
        this.flush();
    }
    private onUpdateMsg(datas:SGuildEvent[]):void{
        this.eventDatas = datas;
        this.updateMsgSate();
    }
    private onBtnClick(btn: Button): void {
        switch (btn) {
            case this.msgArrowBtn:
                this.msgIsStretch = false;
                this.updateMsgSate();
                break;
            case this.aloneMsgBtn:
                this.msgIsStretch = true;
                this.updateMsgSate();
                break;
            case this.infoBtn:
                GuildManagePanel.Show();
                break;
            case this.logoBtn:
                GuildInfoPanel.Show(PlayerData.MyGuild);
                break;
            case this.rankBtn:
                GuildRankPanel.Show();
                break;
            case this.notesBtn:
                let memberData:SGuildMember = PlayerData.MyGuild.members[PlayerData.roleInfo.player_id];
                GuildEditNotesPanel.Show(memberData.message);
                break;
            case this.memberBtn:
                GuildMemberPanel.Show(PlayerData.MyGuild);
                break;
            case this.bankBtn:
                Session.Send({ type: MsgTypeSend.GuildBankGetDepositInfos, 
                    data: {
                        guild_id: PlayerData.MyGuild.guild_id,
                    } 
                });
                break;
            case this.donateBtn:
                MsgPanel.Show("功能即将开放");
                //GuildDonatePanel.Show();
                break;
            case this.helpBtn:
                break;
            case this.applyBtn:
                GuildAuditPanel.Show();
                break;
        }
    }
    private updateBaseInfo():void{
        this.infoBtn.node.active = PlayerData.GetMyGuildChange();
        this.applyBtn.node.active = PlayerData.GetMyGuildApply();
        let guidData:SGuild = PlayerData.MyGuild;
        if(!guidData) return;
        this.guildNameLab.string = guidData.name;
        this.presidentNameLab.string = guidData.leader_info.name||"";
        this.noticeLab.string = guidData.announcement.content;
        this.lvLab.string = `Lv.${guidData.level}`;
        let stdLv:StdGuildLevel = CfgMgr.GetGuildLevel(guidData.level);
        this.expPro.progress = guidData.exp / stdLv.Exp;
        this.expProLab.string = `${guidData.exp}/${stdLv.Exp}`;
        this.memberLab.string = `${guidData.member_count}/${stdLv.Member}`;
        let stdLogo:StdGuildLogo = CfgMgr.GetGuildLogo(Number(guidData.logo));
        let url = path.join(folder_icon, `guildLogo/${stdLogo.Logo}`, "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            this.logo.spriteFrame = res;
        });
        let stdGuildType:StdGuildType = CfgMgr.GetGuildType(guidData.type);
        if(stdGuildType.TypeIconRes && stdGuildType.TypeIconRes.length > 0){
            this.guildType.node.active = true;
            let url = path.join(folder_icon, `guildLogo/${stdGuildType.TypeIconRes}`, "spriteFrame");
            ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                this.guildType.spriteFrame = res;
            });
        }else{
            this.guildType.node.active = false;
        }
    }
    private updateMsgItem(item: Node, data: SGuildEvent) {
        let titleLab: Label = item.getChildByName("titleLab").getComponent(Label);
        let msgLab: RichText = item.getChildByName("msgLab").getComponent(RichText);
        titleLab.string = "公会";
        msgLab.string = PlayerData.GetGuildEventCont(data);

    }
    private updateMsgSate(): void {
        let msgList: SGuildEvent[] = this.eventDatas;
        if (msgList.length) {
            this.msgCont.active = true;
            if (this.msgIsStretch) {
                this.allMsgCont.active = true;
                this.aloneMsgCont.active = false;
                this.msgList.UpdateDatas(msgList);
                this.msgList.ScrollToLast();
            } else {
                this.allMsgCont.active = false;
                this.aloneMsgCont.active = true;
                this.msgTitleLab.string = "公会";
                this.msgLab.string = PlayerData.GetGuildEventCont(msgList[msgList.length - 1]);
            }
        } else {
            this.msgCont.active = false;
        }
    }
}