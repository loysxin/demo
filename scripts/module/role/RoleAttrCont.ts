import { Button, Component, Label, Node, ProgressBar, Sprite, SpriteFrame, path } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import PlayerData, { CountPower, SPlayerDataRole } from "../roleModule/PlayerData";
import { CardQuality, CfgMgr, StdRole, StdRoleLevel } from "../../manager/CfgMgr";
import { ResMgr } from "../../manager/ResMgr";
import { AttrSub, ConditionSub, FormatAttr, FormatCondition, FormatRoleAttr, FormatRoleFightAttr, UpdateAttrItem } from "../common/BaseUI";
import { RoleAttrPanel } from "./RoleAttrPanel";
import { RoleTuPoPanel } from "./RoleTuPoPanel";

export class RoleAttrCont extends Component {
    private qualBg: Sprite;
    private qualIcon: Sprite;
    private typeIcon: Sprite;
    private nameLab: Label;
    private lvLab: Label;
    private nextLvLab: Label;
    private fightLab: Label;
    private uidLab: Label;
    private attrList: AutoScroller;
    private expProTatleLab: Node;
    private expPro: ProgressBar;
    private expProLab: Label;
    private upgradeBtn: Button;
    private upgradeRedPoint: Node;
    private upCondLab:Label;
    private tuPoBtn: Button;
    private tiPoRedPoint: Node;
    private attrBtn: Button;
    private roleData: SPlayerDataRole;
    private stdRole: StdRole;
    private stdRoleLv: StdRoleLevel;
    private _showUpgradeContCall: Function;
    private isInit: boolean;
    private roleId: string;
    protected onLoad(): void {
        this.qualBg = this.node.getChildByName("qualBg").getComponent(Sprite);
        this.qualIcon = this.node.getChildByName("qualIcon").getComponent(Sprite);
        this.typeIcon = this.node.getChildByName("typeIcon").getComponent(Sprite);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.lvLab = this.node.getChildByName("lvLab").getComponent(Label);
        this.nextLvLab = this.node.getChildByName("nextLvLab").getComponent(Label);
        this.fightLab = this.node.getChildByName("fightLab").getComponent(Label);
        this.uidLab = this.node.getChildByName("uidLab").getComponent(Label);
        this.attrList = this.node.getChildByName("attrList").getComponent(AutoScroller);
        this.expProTatleLab = this.node.getChildByName("expProTatleLab");
        this.expPro = this.node.getChildByName("expPro").getComponent(ProgressBar);
        this.expProLab = this.node.getChildByName("expProLab").getComponent(Label);
        this.upgradeBtn = this.node.getChildByName("upgradeBtn").getComponent(Button);
        this.upgradeRedPoint = this.node.getChildByPath("upgradeBtn/red_point");
        this.upCondLab = this.node.getChildByName("upCondLab").getComponent(Label);
        this.tuPoBtn = this.node.getChildByName("tuPoBtn").getComponent(Button);
        this.tiPoRedPoint = this.node.getChildByPath("tuPoBtn/red_point");
        this.attrBtn = this.node.getChildByName("attrBtn").getComponent(Button);
        this.upgradeBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.tuPoBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.attrBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.attrList.SetHandle(UpdateAttrItem.bind(this));
        this.isInit = true;
        this.initShow();
    }

    /**
     * 设置角色数据
     * @param roleId 
     */
    SetData(roleId: string, isInit: boolean = false) {
        this.roleId = roleId;
        this.initShow(isInit);

    }

    private async initShow(isInit: boolean = false): Promise<void> {
        if (!this.isInit || !this.roleId) return;
        this.roleData = PlayerData.GetRoleByPid(this.roleId);
        this.stdRole = CfgMgr.GetRole()[this.roleData.type];
        this.qualBg.spriteFrame = await ResMgr.LoadResAbSub(path.join("sheets/icons/quality/" + `card_line_${this.roleData.quality}`, "spriteFrame"), SpriteFrame);
        this.qualIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join("sheets/icons/quality/", CardQuality[this.roleData.quality] + "_big", "spriteFrame"), SpriteFrame);
        this.typeIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join("sheets/icons/pos" + this.stdRole.PositionType, "spriteFrame"), SpriteFrame);
        this.nameLab.string = this.stdRole.Name;
        this.uidLab.string = `UiD:${this.roleData.id}`;
        this.updateShow(isInit);
    }

    set ShowUpgradeContCall(value: Function) {
        this._showUpgradeContCall = value;
    }

    private onBtnClick(btn: Button) {
        switch (btn) {
            case this.upgradeBtn:
                this._showUpgradeContCall();
                break;
            case this.tuPoBtn:
                RoleTuPoPanel.Show(this.roleId, this.stdRoleLv);
                break;
            case this.attrBtn:
                RoleAttrPanel.Show(this.roleId);
                break;

        }

    }

    private updateShow(isInit: boolean = false): void {
        this.stdRoleLv = CfgMgr.GetRoleLevel(this.roleData.type, this.roleData.level);
        this.lvLab.string = `Lv.${this.roleData.level}`;
        this.fightLab.string = CountPower(this.roleData.type, this.roleData.level, this.roleData).toString();
        let fightAttrs: AttrSub[] = FormatRoleFightAttr(this.roleData);
        let pickAttrs: AttrSub[] = FormatRoleAttr(this.roleData);
        let attrs: AttrSub[] = fightAttrs.concat(pickAttrs);
        this.attrList.UpdateDatas(attrs);
        this.nextLvLab.node.active = false;
        this.expPro.node.active = true;
        this.expProLab.node.active = true;
        this.expProTatleLab.active = true;
        this.upgradeBtn.node.active = false;
        this.upCondLab.node.active = false;
        this.tuPoBtn.node.active = false;
        let isHavRedPoint:boolean = PlayerData.CheckRoleIsCanUp(this.roleId);
        this.upgradeRedPoint.active = this.tiPoRedPoint.active = isHavRedPoint;
        if (isInit) this.attrList.SelectFirst();

        let maxLv: number = CfgMgr.GetRoleMaxLevel(this.roleData.type);
        //满级
        if (maxLv == this.roleData.level) {
            this.expProLab.string = `MAX`;
            this.expPro.progress = 1;
            return
        }
        let isCanUp:boolean = true;
        if(this.stdRoleLv.ConditionId && this.stdRoleLv.ConditionId){
            let condData:ConditionSub = FormatCondition(this.stdRoleLv.ConditionId[0], this.stdRoleLv.ConditionLv[0], "生命树等级达到%s后可升级");
            if(condData.fail){
                isCanUp = false;
                this.upCondLab.string = condData.fail;
            }
        }
        this.upCondLab.node.active = !isCanUp;
        this.expProLab.string = `${this.roleData.experience}/${this.stdRoleLv.Exp}`;
        if (this.stdRoleLv.BreakItem && this.stdRoleLv.BreakItem.length > 0) {
            this.nextLvLab.node.active = true;
            this.nextLvLab.string = `Lv.${this.roleData.level + 1}`;
            this.tuPoBtn.node.active = isCanUp;
            this.expPro.node.active = false;
            this.expProLab.node.active = false;
            this.expProTatleLab.active = false;
        } else {
            this.expPro.progress = this.roleData.experience / this.stdRoleLv.Exp;
            this.upgradeBtn.node.active = isCanUp;
            this.tuPoBtn.node.active = false;
        }

    }
}