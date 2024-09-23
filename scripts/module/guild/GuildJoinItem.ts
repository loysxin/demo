import { Button, Component, Label, path, Sprite, SpriteFrame } from "cc";
import { SGuild } from "../roleModule/PlayerData";
import { CfgMgr, StdGuildLevel, StdGuildLogo } from "../../manager/CfgMgr";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { GuildInfoPanel } from "./GuildInfoPanel";

export class GuildJoinItem extends Component {
    private logo:Sprite;
    private lvLab: Label;
    private nameLab: Label;
    private memberLab: Label;
    private noticeLab:Label;
    private presidentNameLab:Label;
    private condLab:Label;
    private applyBtn:Button;
    private applyBtnLab:Label;
    private checkBtn:Button;
    private isInit:boolean = false;
    private data:SGuild;
    protected onLoad(): void {
        this.logo = this.node.getChildByName("logo").getComponent(Sprite);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.lvLab = this.node.getChildByName("lvLab").getComponent(Label);
        this.memberLab = this.node.getChildByName("memberLab").getComponent(Label);
        this.noticeLab = this.node.getChildByName("noticeLab").getComponent(Label);
        this.presidentNameLab = this.node.getChildByName("presidentNameLab").getComponent(Label);
        this.condLab = this.node.getChildByName("condLab").getComponent(Label);
        this.applyBtn = this.node.getChildByName("applyBtn").getComponent(Button);
        this.applyBtnLab = this.node.getChildByPath("applyBtn/applyBtnLab").getComponent(Label);
        this.checkBtn = this.node.getChildByName("checkBtn").getComponent(Button);
        
        this.applyBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.checkBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        
        this.isInit = true;
        this.updateShow();
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.applyBtn:
                
                break;
            case this.checkBtn:
                GuildInfoPanel.Show(this.data);
                break;
        }
    }
    SetData(data:SGuild) {
        this.data = data;
        this.updateShow();
    }
    private updateShow():void{
        if(!this.isInit || !this.data) return;
        this.nameLab.string = this.data.name;
        this.lvLab.string = `Lv.${this.data.level}`;
        this.presidentNameLab.string = this.data.leader_info.name||"";
        this.condLab.string = `家园等级${this.data.join_criteria.min_home_level}`;
        this.noticeLab.string = this.data.announcement.content;
        let stdLv:StdGuildLevel = CfgMgr.GetGuildLevel(this.data.level);
        this.memberLab.string = `${this.data.member_count}/${stdLv.Member}`;
        let stdLogo:StdGuildLogo = CfgMgr.GetGuildLogo(Number(this.data.logo));
        if(stdLogo){
            let url = path.join(folder_icon, `guildLogo/${stdLogo.Logo}`, "spriteFrame");
            ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                this.logo.spriteFrame = res;
            });
        }
        
    }
}