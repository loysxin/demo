import { Button, Component, Label, path, Sprite, SpriteFrame, Node, UITransform, v3, Vec3 } from "cc";
import { HeadItem } from "../common/HeadItem";
import PlayerData, { SGuildMember } from "../roleModule/PlayerData";
import { CfgMgr, StdGuildRole } from "../../manager/CfgMgr";
import { ResMgr } from "../../manager/ResMgr";
import { set } from "../../../../scripting/engine/cocos/core/utils/js-typed";
import { EventMgr, Evt_GuildMenuShow } from "../../manager/EventMgr";

export class GuildMemberItem extends Component {
    private head:HeadItem;
    private baseBg:Node;
    private manageBtn:Button;
    private nameLab: Label;
    private postIcon:Sprite;
    private lvLab: Label;
    private fightTitleLab:Label;
    private fightLab:Label;
    private notesLab:Label;
    private isInit:boolean = false;
    private data:SGuildMember;
    private std:StdGuildRole;
    private myStd:StdGuildRole;
    protected onLoad(): void {
        this.head = this.node.getChildByName("HeadItem").getComponent(HeadItem);
        this.postIcon = this.node.getChildByName("postIcon").getComponent(Sprite);
        this.baseBg = this.node.getChildByName("baseBg");
        this.manageBtn = this.node.getChildByName("manageBtn").getComponent(Button);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.lvLab = this.node.getChildByName("lvLab").getComponent(Label);
        this.fightTitleLab = this.node.getChildByName("fightTitleLab").getComponent(Label);
        this.fightLab = this.node.getChildByName("fightLab").getComponent(Label);
        this.notesLab = this.node.getChildByName("notesLab").getComponent(Label);
        this.manageBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.isInit = true;
        
        this.updateShow();
    }
    
    SetData(data:any,) {
        this.data = data;
        this.updateShow();
    }
    private onBtnClick(btn:Button):void{
        let itemPos = this.manageBtn.node.worldPosition.clone();
        EventMgr.emit(Evt_GuildMenuShow, this.data, itemPos, this.manageBtn.node);
    }
    private updateShow():void{
        if(!this.isInit || !this.data) return;
        this.myStd = PlayerData.GetMyGuildLimit();
        if(this.data.player_id != PlayerData.roleInfo.player_id && this.myStd && this.myStd.PermissionRoleAppointment > 0){
            this.manageBtn.node.active = true;
            this.baseBg.getComponent(UITransform).width = 544;
            this.fightTitleLab.node.position = v3(-16,this.fightTitleLab.node.position.y);
            this.fightLab.node.position = v3(62, this.fightTitleLab.node.position.y);
        }else{
            this.manageBtn.node.active = false;
            this.baseBg.getComponent(UITransform).width = 734;
            this.fightTitleLab.node.position = v3(110,this.fightTitleLab.node.position.y);
            this.fightLab.node.position = v3(188,this.fightLab.node.position.y);
        }
        this.nameLab.string = this.data.name || "";
        this.lvLab.string = `${this.data.level || 0}`;
        this.fightLab.string = `${this.data.fight || 0}`;
        this.notesLab.string = this.data.notes||"";
        this.std = CfgMgr.GetGuildRole(this.data.role);
        if(this.std.PostIcon && this.std.PostIcon != ""){
            this.postIcon.node.active = true;
            let url = path.join("sheets/guild", this.std.PostIcon, "spriteFrame");
            ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                this.postIcon.spriteFrame = res;
            });
        }else{
            this.postIcon.node.active = false;
        }
    }
}