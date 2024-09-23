import { Node, Component, Label, RichText, Sprite, SpriteFrame, path, Color, Button } from "cc";
import PlayerData, { SPlayerDataSkill } from "../roleModule/PlayerData";
import { ResMgr, folder_icon, folder_item, folder_skill, skill_quality_color } from "../../manager/ResMgr";
import { CfgMgr, StdActiveSkill, StdPassiveLevel } from "../../manager/CfgMgr";
import { RoleNoneSkillTipsPanel } from "./RoleNoneSkillTipsPanel";
import { RolePassiveSkillUpgradePanel } from "./RolePassiveSkillUpgradePanel";
import { ItemUtil } from "../../utils/ItemUtils";


export class RolePassiveSkillItem extends Component {
    private btn:Button;
    private bg:Sprite;
    private icon:Sprite;
    private nameLab:Label;
    private lvCont:Node
    private lvLab:Label;
    private upIcon:Node;
    private lock:Node;
    private resIcon:Node;
    private data: SPlayerDataSkill;
    private skillIndex:number;
    private roleId:string;
    private isInit: boolean = false;
    

    protected onLoad(): void {
        this.btn = this.node.getComponent(Button);
        this.bg = this.node.getChildByName("bg").getComponent(Sprite);
        this.icon = this.node.getChildByPath("Mask/icon").getComponent(Sprite);
        this.nameLab = this.node.getChildByPath("nameLab").getComponent(Label);
        this.lvCont = this.node.getChildByName("lvCont");
        this.lvLab = this.node.getChildByPath("lvCont/lvLab").getComponent(Label);
        this.upIcon = this.node.getChildByName("upIcon");
        this.resIcon = this.node.getChildByName("resIcon");
        this.lock = this.node.getChildByName("lock");
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.isInit = true;
        this.initShow();
    }
    private onBtnClick(btn:Button):void{
        if(!this.data){
            RoleNoneSkillTipsPanel.Show();
            return;
        }
        RolePassiveSkillUpgradePanel.Show(this.roleId, this.skillIndex);
    }
    SetData(roleId:string, skillIndex: number) {
        this.roleId = roleId;
        this.skillIndex = skillIndex;
        let roleData = PlayerData.GetRoleByPid(this.roleId);
        if(skillIndex > -1 && skillIndex < roleData.passive_skills.length){
            this.data = roleData.passive_skills[skillIndex];
        }else{
            this.data = null;
        }
        
        this.initShow();

    }

    private initShow():void {
        if(!this.isInit) return;
        let qual:number = 0;
        this.upIcon.active = false;
        if(this.data){
            let stdSkill:StdPassiveLevel = CfgMgr.GetPassiveSkill(this.data.skill_id, this.data.level);
            qual = stdSkill.RareLevel;
            this.lock.active = false;
            this.lvCont.active = true;
            this.icon.node.active = true;
            this.nameLab.color = new Color().fromHEX(skill_quality_color[stdSkill.RareLevel]);
            this.nameLab.string = stdSkill.Name;
            this.resIcon.active = stdSkill.ResoureType > 0;
            this.lvLab.string = this.data.level.toString();
            let iconUrl:string = path.join(folder_skill, stdSkill.Icon.toString(), "spriteFrame");
            ResMgr.LoadResAbSub(iconUrl, SpriteFrame, res => {
                if(this.icon) this.icon.spriteFrame = res;
            });
            let nextLv:number = this.data.level + 1;
            let nextStd:StdPassiveLevel = CfgMgr.GetPassiveSkill(stdSkill.ID, nextLv);
            if(nextStd){
               this.upIcon.active = ItemUtil.CheckThingConsumes(stdSkill.RewardType, stdSkill.RewardID, stdSkill.RewardNumber);
            }
        }else{
            this.lock.active = true;
            this.lvCont.active = false;
            this.icon.node.active = false;
            this.nameLab.string = "";
            this.resIcon.active = false;
            this.lvLab.string = "";
        }
        let bgUrl = path.join(folder_icon, "quality", "p_skill_bg_" + qual, "spriteFrame");
        ResMgr.LoadResAbSub(bgUrl, SpriteFrame, res => {
            if(this.bg)this.bg.spriteFrame = res;
        });
        
    }
}