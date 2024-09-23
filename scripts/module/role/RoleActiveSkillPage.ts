import { Component, Node } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import { RoleActiveSkillItem } from "./RoleActiveSkillItem";
import PlayerData, { SPlayerDataSkill } from "../roleModule/PlayerData";
import { ActiveSkillTipsPanel } from "../common/ActiveSkillTipsPanel";


export class RoleActiveSkillPage extends Component {
    private activeSkillItemLits:AutoScroller;
    private roleId:string;
    private isInit:boolean = false;
    private skillDataList:SPlayerDataSkill[];
    protected onLoad(): void {
        this.activeSkillItemLits = this.node.getChildByName("activeSkillItemLits").getComponent(AutoScroller);
        this.activeSkillItemLits.SetHandle(this.updatSkillItem.bind(this));
        this.activeSkillItemLits.node.on('select', this.onSelect, this);
        this.isInit = true;
        this.initShow();
    }

    /**
     * 设置角色数据
     * @param roleId 
     */
    SetData(roleId: string) {
        this.roleId = roleId;
        this.initShow();

    }

    private updatSkillItem(item:Node, data: SPlayerDataSkill):void{
        let skillItem:RoleActiveSkillItem = item.getComponent(RoleActiveSkillItem);
        if(!skillItem) skillItem = item.addComponent(RoleActiveSkillItem);
        skillItem.SetData(data);
    }

    protected onSelect(index: number, item: Node) {
        let skillData:SPlayerDataSkill = this.skillDataList[index];
        if(!skillData) return;
        ActiveSkillTipsPanel.Show(skillData);
    }

    private initShow():void {
        if (!this.isInit || !this.roleId) return;
        let roleData = PlayerData.GetRoleByPid(this.roleId);
        this.skillDataList = roleData.active_skills ? roleData.active_skills.concat() : [];
        this.activeSkillItemLits.UpdateDatas(this.skillDataList);
    }
}