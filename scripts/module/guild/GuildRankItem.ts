import { Button, Component, Label, path, Sprite, SpriteFrame } from "cc";
import { SGuild } from "../roleModule/PlayerData";
import { CfgMgr, StdGuildLevel, StdGuildLogo, StdGuildType } from "../../manager/CfgMgr";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { GuildInfoPanel } from "./GuildInfoPanel";

export class GuildRankItem extends Component {
    private logo:Sprite;
    private guildType:Sprite;
    private rankIcon:Sprite;
    private rankLab:Label;
    private lvLab: Label;
    private nameLab: Label;
    private memberLab: Label;
    private noticeLab:Label;
    private presidentNameLab:Label;
    private condLab:Label;
    private checkBtn:Button;
    private isInit:boolean = false;
    private data:SGuild;
    private index:number;
    protected onLoad(): void {
        this.logo = this.node.getChildByName("logo").getComponent(Sprite);
        this.guildType = this.node.getChildByName("guildType").getComponent(Sprite);
        this.rankIcon = this.node.getChildByName("rankIcon").getComponent(Sprite);
        this.rankLab = this.node.getChildByName("rankLab").getComponent(Label);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.lvLab = this.node.getChildByName("lvLab").getComponent(Label);
        this.memberLab = this.node.getChildByName("memberLab").getComponent(Label);
        this.noticeLab = this.node.getChildByName("noticeLab").getComponent(Label);
        this.presidentNameLab = this.node.getChildByName("presidentNameLab").getComponent(Label);
        this.condLab = this.node.getChildByName("presidentNameLab").getComponent(Label);
        this.checkBtn = this.node.getChildByName("checkBtn").getComponent(Button);
        this.checkBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        
        this.isInit = true;
        this.updateShow();
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.checkBtn:
                GuildInfoPanel.Show(this.data);
                break;
        }
    }
    SetData(data:SGuild, index:number) {
        this.data = data;
        this.index = index;
        this.updateShow();
    }
    private updateShow():void{
        if(!this.isInit || !this.data) return;
        let stdLogo:StdGuildLogo = CfgMgr.GetGuildLogo(Number(this.data.logo));
        if(stdLogo){
            let url = path.join(folder_icon, `guildLogo/${stdLogo.Logo}`, "spriteFrame");
            ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                this.logo.spriteFrame = res;
            });
        }
        let stdGuildType:StdGuildType = CfgMgr.GetGuildType(this.data.type);
        if(stdGuildType.TypeIconRes && stdGuildType.TypeIconRes.length > 0){
            this.guildType.node.active = true;
            let url = path.join(folder_icon, `guildLogo/${stdGuildType.TypeIconRes}`, "spriteFrame");
            ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                this.guildType.spriteFrame = res;
            });
        }else{
            this.guildType.node.active = false;
        }
        this.nameLab.string = this.data.name;
        this.lvLab.string = `Lv.${this.data.level}`;
        let stdLv:StdGuildLevel = CfgMgr.GetGuildLevel(this.data.level);
        this.memberLab.string = `${this.data.member_count}/${stdLv.Member}`;
        this.noticeLab.string = this.data.announcement.content;
        this.presidentNameLab.string = this.data.leader_info.name;
        let rank:number = this.index + 1;
        if(rank > 3){
            this.rankIcon.node.active = false;
            this.rankLab.node.active = true;
            this.rankLab.string = rank.toString();
        }else{
            this.rankIcon.node.active = true;
            this.rankLab.node.active = false;
            let url = path.join(folder_icon, `rank${rank}`, "spriteFrame");
            ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                this.rankIcon.spriteFrame = res;
            });
        }
    }
}