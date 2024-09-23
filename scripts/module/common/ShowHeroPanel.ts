import { Color, Input, Label, Node, RichText, ScrollView, Slider, Sprite, SpriteFrame, Toggle, Tween, UIOpacity, UITransform, Vec3, Widget, easing, find, game, path, quat, sp, tween, v3 } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { SPlayerDataRole, SPlayerDataSkill } from "../roleModule/PlayerData";
import { Card, CardType } from "../home/panel/Card";
import { ResMgr, folder_attr, folder_icon, folder_quality, folder_skill } from "../../manager/ResMgr";
import { AttrFight, CardQuality, CfgMgr, StdActiveSkill, StdPassiveLevel, StdRoleQuality } from "../../manager/CfgMgr";
import { AdaptBgTop, AttrSub, FormatAttr, FormatAttrUp, FormatAttrUpByRole, GetSolderNum, SpliceSolderNum } from "./BaseUI";
import { AutoScroller } from "../../utils/AutoScroller";
import { SpriteLabel } from "../../utils/SpriteLabel";
import { PowerItem } from "./PowerItem";
import { formatNumber } from "../../utils/Utils";
import { PassiveSkillTipsPanel } from "./PassiveSkillTipsPanel";
import { ActiveSkillTipsPanel } from "./ActiveSkillTipsPanel";

export class ShowHeroPanel extends Panel {
    protected prefab: string = "prefabs/panel/ShowHeroPanel";

    private mergeTitle: Node;
    private failTitle: Node;
    private getTitle: Node;
    private effect: Node;
    private frame: Sprite;
    private role: SPlayerDataRole;
    private beforRole: SPlayerDataRole;
    private body: sp.Skeleton;
    private quality: Sprite;
    private level: Label;
    private topScroller: AutoScroller;
    private midScroller: AutoScroller;
    private beforDatas: AttrSub[] = [];
    private beforDatas2: AttrSub[] = [];
    private beforDatas3: SPlayerDataSkill[] = [];
    private skillScroller: AutoScroller;
    private skillRadioScroller: AutoScroller;
    private CardType: number = -1;
    private Sucess: sp.Skeleton;
    private callBack: Function;
    private spine: Node;
    private panelNode:Node;

    protected onLoad() {
        this.spine = this.find(`ui_breed_Aurora`);
        this.panelNode = this.find(`panelNode`);
        this.mergeTitle = this.find(`panelNode/mergeTitle`);
        this.failTitle = this.find(`panelNode/failTitle`);
        this.getTitle = this.find(`panelNode/getTitle`);
        this.effect = this.find(`panelNode/effect`);
        this.frame = this.find(`panelNode/frame`, Sprite);
        this.body = this.find("panelNode/body", sp.Skeleton);
        this.quality = this.find(`panelNode/quality`, Sprite);
        this.level = this.find(`panelNode/level`, Label);
        this.topScroller = this.find(`panelNode/topLayout`, AutoScroller);
        this.midScroller = this.find(`panelNode/midLayout`, AutoScroller);
        this.skillScroller = this.find("panelNode/skills", AutoScroller);
        this.skillRadioScroller = this.find("panelNode/skillLayout", AutoScroller);
        this.Sucess = this.find("panelNode/ui_breed_Success", sp.Skeleton);
        this.CloseBy("mask");

        this.topScroller.SetHandle(this.UpdateAttrItem.bind(this));
        this.midScroller.SetHandle(this.updateItem.bind(this));
        this.skillScroller.SetHandle(this.updateSkillItem.bind(this));
        this.skillRadioScroller.SetHandle(this.updateRadioItem.bind(this));
        //this.node.setScale(0.3, 0.3, 1);
    }

    static ShowMerge(role: SPlayerDataRole, beforRole?: SPlayerDataRole, callback?: Function) {
        this.Show(role, beforRole, CardType.Merge, callback);
    }

    async flush(role: SPlayerDataRole, beforRole?: SPlayerDataRole, cardType?: number, callback?: Function) {
        this.mergeTitle.active = false;
        this.failTitle.active = false;
        this.role = role;
        this.beforRole = beforRole;
        this.CardType = cardType;
        if (callback) {
            this.callBack = callback;
        }
        let stdBefor: StdRoleQuality;
        if (cardType == CardType.Merge) {
            this.setMergeTitle();
            if (beforRole) {
                stdBefor = CfgMgr.GetRoleQuality(beforRole.type, beforRole.quality);
                this.beforDatas = FormatAttrUpByRole(stdBefor, beforRole.type);
                this.effect.active = true;
                this.Sucess.node.active = true;
                this.Sucess.setCompleteListener(() => {
                    this.Sucess.node.active = false;
                })
                this.Sucess.setAnimation(0, `Success`, false);
            } else {
                this.effect.active = false;
            }
        } else {
            this.getTitle.active = true;
            this.effect.active = true;
        }
        this.frame.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[this.role.quality] + "_showbg", "spriteFrame"), SpriteFrame);
        let prefab = CfgMgr.GetRole()[role.type].Prefab;
        this.body.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/role_p", prefab, prefab), sp.SkeletonData);
        this.body.setAnimation(0, `Idle`, true);
        this.quality.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[this.role.quality] + "_big", "spriteFrame"), SpriteFrame);
        this.level.string = `Lv.${this.role.level}`;


        // 基础属性
        let stdNow: StdRoleQuality = CfgMgr.GetRoleQuality(this.role.type, this.role.quality);
        let datas = FormatAttrUpByRole(stdNow, role.type);
        let data: AttrSub = null;
        let datas2: AttrSub[] = [];
        let datas3: any[] = [];
        let datas4: any[] = [];
        // 附加属性
        let soldierNumData = GetSolderNum(datas);
        if (soldierNumData) {
            data = {
                icon: path.join(folder_attr, "AttackVal/spriteFrame"),
                name: "带兵数量",
                value: (soldierNumData.value || 0) + (this.role.soldier_num || 0) + (soldierNumData.per || 0),
                next: 0,
                per: ""
            }
            console.log(`带兵数量`, soldierNumData)
            datas2.push(data);
        }
        SpliceSolderNum(datas);

        let soldierNumDataBefor = GetSolderNum(this.beforDatas);
        if (soldierNumDataBefor) {
            let value = beforRole ? (soldierNumDataBefor.value || 0) + (soldierNumDataBefor.per || 0) : (soldierNumData.value || 0) + (soldierNumData.per || 0);
            data = {
                icon: path.join(folder_attr, "AttackVal/spriteFrame"),
                name: "带兵数量",
                value: value,
                next: 0,
                per: ""
            }
            console.log(`合成前带兵数量`, soldierNumDataBefor)
        }
        this.beforDatas2.push(data);
        if (this.role.active_skills[0]) datas3 = [this.role.active_skills[0]];
        datas3 = [this.role.active_skills[0]];
        stdNow.ActiveSkillUp.forEach((value, index) => {
            if (value == 1) {
                datas3 = [this.role.active_skills[index]];
            }
        })
        if (beforRole) {
            stdBefor.ActiveSkillUp.forEach((value, index) => {
                if (value == 1) {
                    datas3 = [this.role.active_skills[index]];
                }
            })
            this.beforDatas3 = beforRole.passive_skills;
        }
        datas4 = this.role.passive_skills;
        this.topScroller.UpdateDatas(datas);
        this.midScroller.UpdateDatas(datas2);
        this.skillScroller.UpdateDatas(datas3);
        this.skillRadioScroller.UpdateDatas(datas4);
        if (this.effect.active) PowerItem.Show(role, new Vec3(0, 0, 0), beforRole);
    }

    private async setMergeTitle() {
        if (CardQuality[this.role.quality - 1]) {
            let qualityBefor = this.mergeTitle.getChildByName(`qualityBefor`).getComponent(Sprite);
            let qualityNow = this.mergeTitle.getChildByName(`qualityNow`).getComponent(Sprite);
            this.mergeTitle.active = true;
            qualityNow.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[this.role.quality] + "_big", "spriteFrame"), SpriteFrame);
            qualityBefor.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[this.role.quality - 1] + "_big", "spriteFrame"), SpriteFrame);
        }
        this.getTitle.active = false;
        if (this.beforRole) {
            this.mergeTitle.active = true;
            this.failTitle.active = false;
            this.spine.active = true;
        } else {
            this.mergeTitle.active = false;
            this.failTitle.active = true;
            this.spine.active = false;
        }
    }

    protected async UpdateAttrItem(item: Node, data: any, index) {
        let icon = item.getChildByName("icon")?.getComponent(Sprite);
        let name = item.getChildByName("name")?.getComponent(Label);
        let now = item.getChildByName("nowValue")?.getComponent(Label);
        let next = item.getChildByName("nextValue")?.getComponent(Label);
        if (next) next.node.active = false;
        if (this.CardType == CardType.Merge && this.beforDatas.length != 0) {
            let beforData = this.beforDatas[index];
            if (beforData && beforData.icon) {
                icon.node.active = true;
                icon.spriteFrame = await ResMgr.LoadResAbSub(beforData.icon, SpriteFrame);
            } else {
                icon.node.active = false;
            }
            if (name) name.string = data.name;
            now.string = (beforData.value) + beforData.per;
            next.string = "+" + (data.value - beforData.value) + beforData.per;

            if (beforData) this.setValueAddAction(next, now, data, beforData);
        } else {
            if (data.icon) {
                icon.node.active = true;
                icon.spriteFrame = await ResMgr.LoadResAbSub(data.icon, SpriteFrame);
            } else {
                icon.node.active = false;
            }
            if (name) name.string = data.name;
            now.string = (data.value) + data.per;
        }
    }

    protected updateItem(item: Node, data: any) {
        let name = item.getChildByName("name")?.getComponent(Label);
        let now = item.getChildByName("nowValue")?.getComponent(Label);

        if (this.CardType == CardType.Merge) {
            let next = item.getChildByName("nextValue")?.getComponent(Label);
            this.scheduleOnce(async () => {
                let index = item['$$index'];
                let beforData = this.beforDatas2[index];
                if (!beforData) return;
                if (name) name.string = beforData.name;
                now.string = (Number(beforData.value) || 0) + beforData.per;
                next.string = "+" + (data.value - beforData.value) + beforData.per;

                if (beforData) this.setValueAddAction(next, now, data, beforData);
            })
        } else {
            if (name) name.string = data.name;
            now.string = data.value + data.per;
        }
    }

    protected async updateSkillItem(item: Node, data: SPlayerDataSkill) {
        let bg = item.getChildByName("bg").getComponent(Sprite);
        let icon = item.getChildByPath("Mask/icon").getComponent(Sprite);
        let name = item.getChildByName("name").getComponent(Label);
        let level = item.getChildByName("nowValue").getComponent(Label);
        let scrollView = item.getChildByName(`ScrollView`).getComponent(ScrollView);
        let msg = scrollView.content.getChildByName("msg").getComponent(RichText);
        if (data) {
            icon.node.on(Node.EventType.TOUCH_END, () => {
                ActiveSkillTipsPanel.Show(data);
            }, this);
            let stdSkill: StdActiveSkill = CfgMgr.GetActiveSkill(data.skill_id, data.level);
            name.string = stdSkill.Name;
            level.string = `lv.${data.level}`;
            msg.string = stdSkill.Text;
            if (stdSkill) {
                let iconUrl: string = path.join(folder_skill, stdSkill.icon.toString(), "spriteFrame");
                ResMgr.LoadResAbSub(iconUrl, SpriteFrame, res => {
                    icon.spriteFrame = res;
                });
                bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_quality, "a_skill_bg_" + stdSkill.Quality, "spriteFrame"), SpriteFrame);
            }
        }

    }

    protected updateRadioItem(item: Node, data: SPlayerDataSkill) {
        let icon = find(`Mask/icon`, item).getComponent(Sprite);
        let level = find(`lvCont/lvLab`, item).getComponent(Label);
        let bg = item.getChildByName("bg").getComponent(Sprite);
        let up = item.getChildByName("up");
        let Max = item.getChildByName("MAX");
        let newIcon = item.getChildByName("new");
        if (data) {
            icon.node.on(Node.EventType.TOUCH_END, () => {
                PassiveSkillTipsPanel.Show(data);
            }, this);
            let stdSkill: StdPassiveLevel = CfgMgr.GetPassiveSkill(data.skill_id, data.level);
            level.string = `${data.level}`;
            if (stdSkill) {
                let iconUrl: string = path.join(folder_skill, stdSkill.Icon.toString(), "spriteFrame");
                ResMgr.LoadResAbSub(iconUrl, SpriteFrame, res => {
                    icon.spriteFrame = res;
                });
                let bgUrl = path.join(folder_quality, "a_skill_bg_" + stdSkill.RareLevel, "spriteFrame");

                ResMgr.LoadResAbSub(bgUrl, SpriteFrame, res => {
                    bg.spriteFrame = res;
                });

                let beforSkill = null;
                this.beforDatas3.forEach((skill: SPlayerDataSkill) => {
                    if (skill.skill_id == data.skill_id) {
                        beforSkill = skill;
                    }
                })
                if (beforSkill) {
                    up.getComponentInChildren(Label).string = `Lv.${data.level}`;
                    // level.string = `${beforSkill.level}`;
                    if (data.level > beforSkill.level) {
                        level.string = `${data.level - 1}`;
                        up.active = true
                    }
                    newIcon.active = false;
                } else {
                    up.active = false;
                    newIcon.active = true;
                }
                if (!this.beforRole) {
                    newIcon.active = false;
                }
                let nextLevel = CfgMgr.GetPassiveSkill(data.skill_id, data.level + 1);
                if (!nextLevel) {
                    level.string = `${data.level}`;
                    Max.active = true;
                    up.active = false
                } else {
                    Max.active = false;
                }
            }
        }
    }

    private setValueAddAction(nextLaebl: Label, nowLabel: Label, data, beforData) {

        let time = 20
        let end = data.value - beforData.value;
        let add = Math.floor(end / time);
        let num = beforData.value;
        let nextNum = data.value - beforData.value
        if (nextNum > 0) nextLaebl.node.active = true;
        Tween.stopAllByTarget(nextLaebl.node);
        tween(nextLaebl.node).delay(3).repeat(time, tween().delay(.01).call(() => {
            num += add;
            if (num > data.value) {
                num = data.value;
            }
            nextNum -= add;
            if (nextNum < 0) {
                nextNum = 0;
            }
            nowLabel.string = (num) + data.per;
            nextLaebl.string = "+" + (nextNum) + data.per;
        })).call(() => {
            nowLabel.string = (data.value) + data.per;
            nextLaebl.node.active = false;
        }).start();

    }

    protected onShow(...arg): void {
        // AdaptBgTop(this.node.getChildByPath("ui_breed_Aurora"));
        this.beforDatas = [];
        Tween.stopAllByTarget(this.node);
        this.panelNode.setScale(0.3, 0.3, 1);
        this.spine.setScale(0.3, 0.3, 1);
        tween(this.panelNode)
        .to(1, { scale: new Vec3(1, 1, 1) }, { easing: easing.elasticOut})
        .start();

        tween(this.spine)
        .to(1, { scale: new Vec3(1, 1, 1) }, { easing: easing.elasticOut })
        .start()
    }
    protected onHide(...args: any[]): void {
        if (this.callBack) {
            let callBack = this.callBack;
            this.callBack = undefined;
            callBack();
        }
        PowerItem.Hide();
    }
}
