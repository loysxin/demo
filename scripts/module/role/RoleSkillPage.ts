import { Button, Component, Label, Node, Sprite, SpriteFrame, Toggle, path } from "cc";
import { RoleActiveSkillPage } from "./RoleActiveSkillPage";
import { RolePassiveSkillPage } from "./RolePassiveSkillPage";
import PlayerData, { CountPower, SPlayerDataRole } from "../roleModule/PlayerData";
import { CardQuality, CfgMgr, OneOffRedPointId } from "../../manager/CfgMgr";
import { ResMgr, folder_icon, folder_item } from "../../manager/ResMgr";
import { EventMgr, Evt_LoginRedPointUpdate, Evt_Passive_Skill_Update } from "../../manager/EventMgr";
enum RoleSkillPageType{
    Page_Skill,//技能页
    Page_PassiveSkill,//被动技能页
}
export class RoleSkillPage extends Component {
    private qualBg:Sprite;
    private qualIcon:Sprite;
    private typeIcon:Sprite;
    private nameLab:Label;
    private lvLab:Label;
    private helpBtn:Button;
    private fightLab:Label;
    private roleActiveSkillPage:RoleActiveSkillPage;
    private rolePassiveSkillPage:RolePassiveSkillPage;
    private navBtns:Node[];
    private page: RoleSkillPageType;
    private roleId:string;
    private roleData:SPlayerDataRole;
    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;
    
    protected onLoad(): void {
        this.qualBg = this.node.getChildByPath("roleInfoCont/qualBg").getComponent(Sprite);
        this.qualIcon = this.node.getChildByPath("roleInfoCont/qualIcon").getComponent(Sprite);
        this.typeIcon = this.node.getChildByPath("roleInfoCont/typeIcon").getComponent(Sprite);
        this.nameLab = this.node.getChildByPath("roleInfoCont/nameLab").getComponent(Label);
        this.lvLab = this.node.getChildByPath("roleInfoCont/lvLab").getComponent(Label);
        this.fightLab = this.node.getChildByPath("roleInfoCont/fightLab").getComponent(Label);
        this.helpBtn = this.node.getChildByPath("roleInfoCont/helpBtn").getComponent(Button);
        this.navBtns = this.node.getChildByPath("navBar/view/content").children.concat();
        this.roleActiveSkillPage = this.node.getChildByName("roleActiveSkillPage").addComponent(RoleActiveSkillPage);
        this.rolePassiveSkillPage = this.node.getChildByName("rolePassiveSkillPage").addComponent(RolePassiveSkillPage);

        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }

        this.hasLoad = true;
        this.complete?.();   
        EventMgr.on(Evt_Passive_Skill_Update, this.onUpdateSkill, this);
        EventMgr.on(Evt_LoginRedPointUpdate, this.onLoginRedPointUpdate, this);
    }

    protected get loadSub() {
        if (this.$loadSub) return this.$loadSub;
        let thisObj = this;
        this.$loadSub = new Promise((resolve, reject) => {
            thisObj.complete = resolve;
        });
    }
    private onUpdateSkill():void{
        if(!this.node.activeInHierarchy) return;
        this.updateFight();
        this.updateRedPoint();
    }
    private onLoginRedPointUpdate(id:number):void{
        if(!this.node.activeInHierarchy || id != OneOffRedPointId.OffRedPoint_RolePassiveSkill) return;
        this.updateRedPoint();
    }
    /**
     * 设置角色数据
     * @param roleId 
     */
    async SetData(roleId: string, isInit:boolean = true) {
        if (!this.hasLoad) await this.loadSub;
        this.roleId = roleId;
        this.roleData = PlayerData.GetRoleByPid(this.roleId);
        if(isInit){
            this.page = undefined;
            this.SetPage(RoleSkillPageType.Page_Skill);
        }else{
            this.updatePage();
        }
        
        this.updateRoleInfo();
        this.updateFight();
        this.updateRedPoint();
        
    }
    private async updateRoleInfo():Promise<void>{
        let stdRole = CfgMgr.GetRole()[this.roleData.type];
        this.nameLab.string = stdRole.Name;
        this.lvLab.string = `Lv.${this.roleData.level}`;
        //this.uidLab.string = `UiD:${this.roleData.id}`;
        
        this.qualBg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", `card_line_${this.roleData.quality}`, "spriteFrame"), SpriteFrame);
        this.qualIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[this.roleData.quality] + "_big", "spriteFrame"), SpriteFrame);
        this.typeIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "pos" + stdRole.PositionType, "spriteFrame"), SpriteFrame);
        
    }
    private SetPage(page: number) {
        if (!this.navBtns[page]) return;
        this.page = undefined;
        this.navBtns[page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[page].getComponent(Toggle));
    }

    private onPage(t: Toggle):void{
        if (!t.isChecked) return;
        let page = this.navBtns.indexOf(t.node);
        if (page < 0 || page == this.page) return;
        this.page = page;
        this.roleActiveSkillPage.node.active = false;
        this.rolePassiveSkillPage.node.active = false;
        this.rolePassiveSkillPage.node.active = false;
        switch (page) {
            case RoleSkillPageType.Page_Skill: // 主动技能
                this.roleActiveSkillPage.node.active = true;
                this.roleActiveSkillPage.SetData(this.roleId);
                break;

            case RoleSkillPageType.Page_PassiveSkill: // 被动技能
                this.rolePassiveSkillPage.node.active = true;
                this.rolePassiveSkillPage.SetData(this.roleId);
                break;
        }
    }
    private updatePage():void{
        switch (this.page) {
            case RoleSkillPageType.Page_Skill: // 主动技能
                this.roleActiveSkillPage.SetData(this.roleId);
                break;

            case RoleSkillPageType.Page_PassiveSkill: // 被动技能
                this.rolePassiveSkillPage.SetData(this.roleId);
                break;
        }
    }
    private updateFight():void{
        this.fightLab.string = CountPower(this.roleData.type, this.roleData.level,this.roleData).toString();
    }
    private updateRedPoint():void{
        let btnNode:Node;
        let redPointNode:Node;
        for (let index = 0; index < this.navBtns.length; index++) {
            btnNode = this.navBtns[index];
            redPointNode = btnNode.getChildByName("red_point");
            if(redPointNode){
                if(index == RoleSkillPageType.Page_Skill){
                    redPointNode.active = false;
                }else if(index == RoleSkillPageType.Page_PassiveSkill){
                    redPointNode.active = PlayerData.CheckRolePassiveSkillIsCanUp(this.roleId);
                }
            }
        }
    }
}