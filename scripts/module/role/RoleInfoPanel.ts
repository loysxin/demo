import { Button, Node, Toggle, path, sp } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { SPlayerDataRole } from "../roleModule/PlayerData";
import { RoleAttrPage } from "./RoleAttrPage";
import { ResMgr } from "../../manager/ResMgr";
import { CfgMgr, OneOffRedPointId } from "../../manager/CfgMgr";
import { EventMgr, Evt_Hide_Scene, Evt_LoginRedPointUpdate, Evt_Passive_Skill_Update, Evt_Role_Del, Evt_Role_Update, Evt_Role_Upgrade, Evt_Show_Scene } from "../../manager/EventMgr";
import { RoleSkillPage } from "./RoleSkillPage";
import { MsgPanel } from "../common/MsgPanel";
import { AudioMgr } from "../../manager/AudioMgr";
enum RoleTabType {
    Page_Attr,//属性页
    Page_Skill,//技能页
    Page_Equip,//装备页
};
export class RoleInfoPanel extends Panel {
    protected prefab: string = "prefabs/panel/role/RoleInfoPanel";
    private body: sp.Skeleton;
    private upgradeEffect: sp.Skeleton;
    private roleAttrPage:RoleAttrPage;
    private roleSkillPage:RoleSkillPage;
    private navBtns:Node[];
    private leftBtn:Button;
    private rightBtn:Button;
    private roles: SPlayerDataRole[];
    private roleIndex:number;
    private curRoleId:string;
    private page: RoleTabType;
    protected onLoad() {
        this.body = this.find("body", sp.Skeleton);
        this.upgradeEffect = this.find("upgradeEffect", sp.Skeleton);
        this.navBtns = this.find("navBar/view/content").children.concat();
        this.leftBtn = this.find("leftBtn", Button);
        this.rightBtn = this.find("rightBtn", Button);
        this.roleAttrPage = this.node.getChildByName("roleAttrPage").addComponent(RoleAttrPage);
        this.roleSkillPage = this.node.getChildByName("roleSkillPage").addComponent(RoleSkillPage);
        
        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }
        this.leftBtn.node.on(Button.EventType.CLICK, this.onChangeRole, this);
        this.rightBtn.node.on(Button.EventType.CLICK, this.onChangeRole, this);
        this.upgradeEffect.node.active = false;
        this.CloseBy("backBtn");

        EventMgr.on(Evt_Role_Upgrade, this.onUpgrade, this);
        EventMgr.on(Evt_Passive_Skill_Update, this.onSkillUp, this);
        EventMgr.on(Evt_Role_Del, this.onDelRole, this);
        EventMgr.on(Evt_Role_Update, this.onRoleUpdate, this);
        EventMgr.on(Evt_LoginRedPointUpdate, this.onLoginRedPointUpdate, this);
    }
    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
    }
    async SetPage(page: number) {
        if (!this.$hasLoad) await this.initSub;
        if (!this.navBtns[page]) return;
        this.page = undefined;
        this.navBtns[page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[page].getComponent(Toggle));
    }
    public async flush(roles: SPlayerDataRole[], roleIndex:number): Promise<void> {
        this.roles = roles;
        this.roleIndex = roleIndex;
        this.changeRole();
        this.page = undefined;
        this.SetPage(RoleTabType.Page_Attr);
        
    }
    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }
    private onLoginRedPointUpdate(id:number):void{
        if(!this.node.activeInHierarchy || id != OneOffRedPointId.OffRedPoint_RolePassiveSkill) return;
        this.updateRedPoint();
    }
    private onChangeRole(btn:Button):void{
        switch(btn){
            case this.leftBtn:
                if(this.roleIndex < 1){
                    return;
                }
                this.roleIndex --;
                break;
            case this.rightBtn:
                if(this.roleIndex >= this.roles.length - 1){
                    return;
                }
                this.roleIndex ++;
                
                break;
        }
        this.changeRole(true);
    }
    private changeRole(isChange:boolean = false):void{
        this.curRoleId = this.roles[this.roleIndex].id;
        this.leftBtn.node.active = this.roleIndex > 0;
        this.rightBtn.node.active = this.roleIndex < this.roles.length - 1;
        this.showRoleModel();
        this.updateRedPoint();
        if(isChange) this.updatePage();
    }
    
    private async showRoleModel():Promise<void>{
        let roleData:SPlayerDataRole = PlayerData.GetRoleByPid(this.curRoleId);
        let stdRole = CfgMgr.GetRole()[roleData.type];
        this.body.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/role_p", stdRole.Prefab, stdRole.Prefab), sp.SkeletonData);
        this.body.setAnimation(0, "Idle", true);
    }
    private onPage(t: Toggle):void{
        
        if (!t.isChecked) return;
        let page = this.navBtns.indexOf(t.node);
        if (page < 0 || page == this.page) return;
        
        this.roleAttrPage.node.active = false;
        this.roleSkillPage.node.active = false;
        switch (page) {
            case RoleTabType.Page_Attr: // 属性
                this.roleAttrPage.node.active = true;
                this.roleAttrPage.SetData(this.curRoleId, true);
                break;
            case RoleTabType.Page_Skill: // 技能
                this.roleSkillPage.node.active = true;
                this.roleSkillPage.SetData(this.curRoleId);
                break;
            case RoleTabType.Page_Equip: // 装备
                
                MsgPanel.Show("系统暂未开放");
                this.SetPage(this.page);
                break;
        }
        this.page = page;
    }
    private updatePage():void{
        switch (this.page) {
            case RoleTabType.Page_Attr: // 属性
                this.roleAttrPage.SetData(this.curRoleId, false);
                break;
            case RoleTabType.Page_Skill: // 技能
                this.roleSkillPage.SetData(this.curRoleId, false);
                break;
            case RoleTabType.Page_Equip: // 装备
                
                break;
        }
    }
    private onUpgrade(roleId:string, isUpgrade:boolean = false) {
        if(!this.node.activeInHierarchy) return;
        if(isUpgrade){
            AudioMgr.playSound("role_up", false);
            this.upgradeEffect.node.active = true;
            this.upgradeEffect.setCompleteListener(() => {
                this.upgradeEffect.node.active = false;
            })
            this.upgradeEffect.setAnimation(0, 'animation', false);
        }
        this.updateRedPoint();
    }
    private onSkillUp():void{
        if(!this.node.activeInHierarchy) return;
        this.updateRedPoint();
    }
    private onDelRole(delRole:SPlayerDataRole):void{
        if(!this.node.activeInHierarchy) return;
        let role:SPlayerDataRole;
        let delIndex:number = -1;
        for (let index = 0; index < this.roles.length; index++) {
            role = this.roles[index];
            if(delRole.id == role.id){
                this.roles.splice(index, 1);
                delIndex = index;
                break;
            }
            
        }
        if(delIndex > -1){
            let newIndex:number;
            if(delIndex < this.roleIndex){
                newIndex = this.roleIndex - 1;
            }else {
                newIndex = this.roleIndex;
            }
            if(newIndex > this.roles.length){
                newIndex = this.roles.length - 1;
            } 
            if(newIndex > -1){
                this.roleIndex = newIndex;
                this.changeRole(true);
                
            }else{
                this.Hide();
            }
        }
        
        
    }
    private onRoleUpdate(role:SPlayerDataRole):void{
        if(!this.node.activeInHierarchy) return;
        if(role.id != this.curRoleId) return;
        this.changeRole(true);
    }
    private updateRedPoint():void{
        let btnNode:Node;
        let redPointNode:Node;
        for (let index = 0; index < this.navBtns.length; index++) {
            btnNode = this.navBtns[index];
            redPointNode = btnNode.getChildByName("red_point");
            if(redPointNode){
                if(index == RoleTabType.Page_Attr){
                    redPointNode.active = PlayerData.CheckRoleIsCanUp(this.curRoleId);
                }else if(index == RoleTabType.Page_Skill){
                    redPointNode.active = PlayerData.CheckRolePassiveSkillIsCanUp(this.curRoleId);
                }else if(index == RoleTabType.Page_Equip){
                    redPointNode.active = false;
                }
            }
        }
    }
}