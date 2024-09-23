import { Component, Node, instantiate} from "cc";
import PlayerData, { SPlayerDataSkill } from "../roleModule/PlayerData";
import { RolePassiveSkillItem } from "./RolePassiveSkillItem";
import { OneOffRedPointId } from "../../manager/CfgMgr";


export class RolePassiveSkillPageItem extends Component {
    private passiveSkillItem:Node;
    private isInit:boolean = false;
    private roleId:string;
    private skillIndexList:number[];
    protected onLoad(): void {
        

        this.isInit = true;
        this.initShow();
    }

    /**
     * 设置角色数据
     * @param roleId 
     */
    SetData(roleId: string, skillIndexList:number[], passiveSkillItem:Node) {
        this.roleId = roleId;
        this.skillIndexList = skillIndexList;
        this.passiveSkillItem = passiveSkillItem;
        this.initShow();

    }

    private initShow():void {
        if (!this.isInit || !this.roleId) return;
        PlayerData.SetOneOffRedPoint(OneOffRedPointId.OffRedPoint_RolePassiveSkill);
        let len:number = this.skillIndexList.length;
        this.node.destroyAllChildren();
        let skillItem:Node;
        let skillCom:RolePassiveSkillItem;
        for (let index = 0; index < len; index++) {
            let skillIndex:number = this.skillIndexList[index];
            if(skillIndex < -1) continue;
            skillItem = instantiate(this.passiveSkillItem);
            skillItem.active = false;
            this.node.addChild(skillItem);
            skillCom = skillItem.getComponent(RolePassiveSkillItem);
            if(!skillCom) skillCom = skillItem.addComponent(RolePassiveSkillItem);
            skillCom.SetData(this.roleId, this.skillIndexList[index]);
            skillItem.active = true;
        }
    }
}