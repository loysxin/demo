import { Button, Color, Input, Label, Layout, Node, Slider, Sprite, SpriteFrame, Toggle, Tween, UIOpacity, UITransform, Widget, game, instantiate, path, sp, tween, v3 } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { CountPower, SPlayerDataRole, SOrderData, SOrderType } from "../roleModule/PlayerData";
import { Card, CardType } from "../home/panel/Card";
import { ResMgr, folder_common, folder_icon, folder_quality, folder_skill, quality_color } from "../../manager/ResMgr";
import { Attr, CardQuality, CfgMgr, JobName, StdCommonType, StdPassiveLevel, StdRoleQuality, ThingType } from "../../manager/CfgMgr";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { SelectHeroPanel } from "../common/SelectHeroPanel";
import { AttrSub, FormatRoleAttr, GetAttrValueByIndex } from "../common/BaseUI";
import { PassiveSkillTipsPanel } from "../common/PassiveSkillTipsPanel";
import { ToFixed } from "../../utils/Utils";
import { Tips } from "../login/Tips";

export class RoleMsgPanel extends Panel {
    protected prefab: string = "prefabs/panel/Trade/RoleMsgPanel";

    private figure: Sprite
    private quality: Sprite;
    private level: Label;
    private body: sp.Skeleton;
    private role_name: Label;
    private jobIcon: Sprite;
    private jobName: Label;
    private power: Label;
    private SoldierNum: Label;
    private okBtn: Button;
    private layout: Layout;
    private value: Label;
    private skillLayout: Node;
    private skill_item: Node;
    private spriteFrame: Node;
    private sellNode: Node;
    private sellBtn: Button;
    private sellVaule: Label;
    private get_money_icon: Sprite;
    private costVaule: Label;


    private role: SPlayerDataRole;
    private roleData: SOrderData;
    private type: number;
    private id: string;

    protected onLoad() {
        this.CloseBy("mask");
        this.CloseBy("spriteFrame/Close");
        this.spriteFrame = this.find("spriteFrame")
        this.figure = this.find(`spriteFrame/juese/figure`, Sprite);
        this.quality = this.find(`spriteFrame/juese/quality`, Sprite);
        this.level = this.find(`spriteFrame/juese/level`, Label);
        this.body = this.find("spriteFrame/juese/body", sp.Skeleton);
        this.role_name = this.find(`spriteFrame/msg/role_name`, Label);
        this.jobIcon = this.find(`spriteFrame/msg/jobLayout/jobIcon`, Sprite);
        this.jobName = this.find(`spriteFrame/msg/jobLayout/jobName`, Label);
        this.power = this.find(`spriteFrame/msg/power`, Label);
        this.SoldierNum = this.find(`spriteFrame/msg/SoldierNum`, Label);
        this.okBtn = this.find("spriteFrame/mid/okBtn", Button);
        this.layout = this.find("spriteFrame/skillLayout/ScrollView/view/layout", Layout)
        this.value = this.find(`spriteFrame/mid/okBtn/layout/value`, Label);
        this.skillLayout = this.find("spriteFrame/skillLayout")
        this.skill_item = this.find("spriteFrame/skillLayout/ScrollView/view/layout/item")
        this.sellNode = this.find("spriteFrame/mid/sellNode");
        this.sellBtn = this.find("spriteFrame/mid/sellNode/sellBtn", Button);
        this.sellVaule = this.find("spriteFrame/mid/sellNode/layout/sellVaule", Label);
        this.get_money_icon = this.find("spriteFrame/mid/sellNode/layout/get_money_icon", Sprite);
        this.costVaule = this.find("spriteFrame/mid/sellNode/layout/costVaule", Label);

        this.okBtn.node.on("click", this.onClick, this)
        this.sellBtn.node.on("click", this.onClick, this)
        // this.sellBtn.node.on("click", this.onSend, this);

    }

    async flush(type: number, roleData: SOrderData,) {
        this.type = type;
        this.roleData = roleData;
        this.role = roleData.things.data[0].role;
        this.skillLayout.active = true;
        let soldier_num = this.role.soldier_num ? this.role.soldier_num : 0;
        if (type == SOrderType.SELL) {
            this.skillLayout.active = false;
            this.spriteFrame.getComponent(UITransform).height = 1150 - this.skillLayout.getComponent(UITransform).height;
            this.okBtn.node.active = false;
            this.sellNode.active = true;
            let cost_num = CfgMgr.GetCommon(StdCommonType.Bourse).Fees;
            this.sellVaule.string = Math.ceil((this.roleData.unit_value - this.roleData.unit_value * cost_num) * 100) / 100 + "";
            this.costVaule.string = "(" + Math.ceil(cost_num * 100 * 100) / 100 + "%手续费)";

            let role = PlayerData.GetRoleByTypeAndLvAndQuality(this.role.type, this.role.level, this.role.quality);
            if (!role) {
                this.sellBtn.enabled = false
                this.sellBtn.node.getComponent(Sprite).grayscale = true;
            } else {
                this.sellBtn.enabled = true
                this.sellBtn.node.getComponent(Sprite).grayscale = false;
            }
        } else {
            this.okBtn.node.active = true;
            this.sellNode.active = false;
        }
        this.spriteFrame.children.forEach((node) => {
            if (node.getComponent(Widget)) {
                node.getComponent(Widget).updateAlignment();
            }
        })

        let cfg = CfgMgr.GetRole()[this.role.type]
        let prefab = cfg.Prefab;
        this.body.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/role_p", prefab, prefab), sp.SkeletonData);
        this.body.setAnimation(0, `Idle`, true);
        this.quality.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[this.role.quality] + "_big", "spriteFrame"), SpriteFrame);
        this.level.string = `Lv.${this.role.level}`;
        this.figure.color = new Color().fromHEX(quality_color[this.role.quality]);
        this.role_name.string = cfg.Name;
        this.jobIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "pos" + cfg.PositionType, "spriteFrame"), SpriteFrame);
        this.jobName.string = JobName[cfg.PositionType];
        this.power.string = CountPower(this.role.type, this.role.level, this.role) + "";
        this.SoldierNum.string = GetAttrValueByIndex(this.role, Attr.LeaderShip) + "";

        this.layout.node.removeAllChildren();
        if (this.role.passive_skills && this.role.passive_skills.length > 0) {
            for (let index = 0; index < this.role.passive_skills.length; index++) {
                const element = this.role.passive_skills[index];
                //获取被动技能表
                let skill_cfg: StdPassiveLevel = CfgMgr.GetPassiveSkill(element.skill_id, element.level);
                let item = instantiate(this.skill_item);
                item.on(Input.EventType.TOUCH_END,()=>{PassiveSkillTipsPanel.Show({skill_id:element.skill_id, level:element.level});})
                if (skill_cfg) {
                    item.getChildByPath("lvCont/lvLab").getComponent(Label).string = element.level + "";
                    let iconUrl: string = path.join(folder_skill, skill_cfg.Icon.toString(), "spriteFrame");
                    ResMgr.LoadResAbSub(iconUrl, SpriteFrame, res => {
                        item.getChildByPath("Mask/icon").getComponent(Sprite).spriteFrame = res;
                    });

                    let quality: string = path.join(folder_quality, "p_skill_bg_" + skill_cfg.RareLevel, "spriteFrame");
                    ResMgr.LoadResAbSub(quality, SpriteFrame, res => {
                        item.getChildByName("frame").getComponent(Sprite).spriteFrame = res
                    });
                    this.layout.node.addChild(item);
                }
            }
        }
        this.value.string = roleData.unit_count * roleData.unit_value + "";
        this.value.color = PlayerData.roleInfo.currency > roleData.unit_count * roleData.unit_value ? new Color().fromHEX("#ffffff") : new Color().fromHEX("#ff3f3f") 
    }

    private onClick() {
        if (this.type == SOrderType.SELL) {
            let callBack = (role: SPlayerDataRole[]) => {
                if (role && role[0]) {
                    let okCallBack = ()=>{
                        this.id = role[0].id;
                        this.onSend();
                    }
                    let noCallBack = ()=>{
                    }
                    if(role[0].level > 1){
                        Tips.Show("出售植灵等级将重置为1级，通过邮件返回90%经验道具以及全部突破道具。", okCallBack.bind(this), noCallBack.bind(this))
                    }else{
                        okCallBack();
                    }
                }
            }
            let canSelectRoleData: SPlayerDataRole[] = [];

            let roles: SPlayerDataRole[] = PlayerData.GetRoles();
            for (const iterator of roles) {
                let is_show = iterator.trade_cd - PlayerData.GetServerTime() > 0; 
                let is_add = iterator.type == this.role.type && iterator.quality == this.role.quality && iterator.level == this.role.level
                if ( is_add && iterator.building_id == 0 && !iterator.is_assisting && !is_show) {
                    canSelectRoleData.push(iterator);
                }
            }
            SelectHeroPanel.Show(canSelectRoleData, [], 1, callBack.bind(this), CardType.Trade);

        } else {          
            let currency = PlayerData.roleInfo.currency;
            if (currency < this.roleData.unit_value) {
                Tips.Show("货币不足")
                return;
            }
            
            this.id = this.role.id;
            this.onSend();
        }

    }

    private onSend() {
        let sendData = {
            type: MsgTypeSend.ExchangesTrade,
            data: {
                order_id: this.roleData.order_id,
                payment_things: {
                    data: [{
                        type: ThingType.ThingTypeRole,
                        role: {
                            id: this.id,
                            type: this.role.type,
                            level: this.role.level,
                            quality: this.role.quality,
                            experience: this.role.experience ? this.role.experience : 0,
                            soldier_num: this.role.soldier_num ? this.role.soldier_num : 0,
                            active_skills: this.role.active_skills ? this.role.active_skills : [],
                            passive_skills: this.role.passive_skills ? this.role.passive_skills : [],
                            is_in_building: this.role.is_in_building,
                            building_id: this.role.building_id ? this.role.building_id : 0,
                            battle_power: this.role.battle_power ? this.role.battle_power : 0,
                            skills: this.role.skills ? this.role.skills : [],
                            is_assisting: this.role.is_assisting,
                        }
                    }]
                },
                unit_count: 1,
            }
        }
        Session.Send(sendData)
    }
    protected onShow(): void {

    }
    protected onHide(...args: any[]): void {

        this.roleData = undefined;
        this.role = undefined;
        this.spriteFrame.getComponent(UITransform).height = 1150;
    }
}
