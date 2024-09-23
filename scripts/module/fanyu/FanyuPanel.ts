import { Button, Component, EventTouch, Input, Label, Node, RichText, Sprite, SpriteFrame, Tween, UIOpacity, Vec3, easing, find, path, sp, tween, view } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import PlayerData, { SPlayerData, SPlayerDataRole, SPlayerDataSkill, Tips2ID } from "../roleModule/PlayerData";
import { Attr, AttrFight, AttrType, CardQuality, CfgMgr, StdActiveSkill, StdMerge, StdPassiveLevel, StdRoleQuality } from "../../manager/CfgMgr";
import { ResMgr, folder_attr, folder_icon, folder_quality, folder_skill } from "../../manager/ResMgr";
import { Session } from "../../net/Session";
import { Tips } from "../login/Tips";
import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { AttrSub, FormatAttrUp, FormatAttrUpByRole, GetSolderNum, SpliceSolderNum } from "../common/BaseUI";
import { Second, ToFixed } from "../../utils/Utils";
import Logger from "../../utils/Logger";
import { SelectHeroPanel } from "../common/SelectHeroPanel";
import { FanyuUpPage } from "./FanyuUpPage";
import { ShowHeroPanel } from "../common/ShowHeroPanel";
import { EventMgr, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import { CLICKLOCK } from "../common/Drcorator";
import { FanyuCard } from "./FanyuCard";
import { ActiveSkillTipsPanel } from "../common/ActiveSkillTipsPanel";
import { PassiveSkillTipsPanel } from "../common/PassiveSkillTipsPanel";
import { Tips2 } from "../home/panel/Tips2";
import { AudioMgr, Audio_FanyuFail, Audio_FanyuSucc } from "../../manager/AudioMgr";
import { HomeLogic } from "../home/HomeLogic";
import LocalStorage from "../../utils/LocalStorage";
import { DateUtils } from "../../utils/DateUtils";
import { fanyuTips } from "./fanyuTips";
// import { fanyuTips } from "./fanyuTips";

export class FanyuPanel extends Panel {
    protected prefab: string = "prefabs/panel/FanyuPanel";

    static get ins(): FanyuPanel { return this.$instance; }
    private mainCard: FanyuCard;
    private otherCard: FanyuCard;
    private body: sp.Skeleton;
    private quality: Sprite;
    private attrScroller: AutoScroller;
    private fightScroller: AutoScroller;
    private skillScroller: AutoScroller;
    private skillRadioScroller: AutoScroller;
    private radio: Label;
    private okBtn: Sprite;
    private costLabel: Label;
    private addBtn: Node;
    private showNode: Node;
    private okBtn2: Node;
    private Main: Node;
    private Top: Node;
    private closeBtn: Node;
    private Lock: Node;
    private helpBtn1: Node;
    private helpBtn2: Node;
    //数据
    private upitems: string[] = [];
    private upitemNum: number[] = [];
    private friend_ids: string[] = [];
    private std: StdMerge;
    private mainRole: SPlayerDataRole;
    private otherRole: SPlayerDataRole;
    private TopY: number = 0;
    private friendData = [];
    //特效
    private light: sp.Skeleton;
    private Energy: sp.Skeleton;
    private Egg: sp.Skeleton;
    private Merger: sp.Skeleton;
    private Aurora: sp.Skeleton;

    protected onLoad() {
        this.closeBtn = this.find(`closeBtn`);
        this.helpBtn1 = this.find(`showUnselect/tipsBg/helpBtn`);
        this.helpBtn2 = this.find(`Main/helpBtn`);
        this.mainCard = this.find("Top/main").addComponent(FanyuCard);
        this.otherCard = this.find("Top/other").addComponent(FanyuCard);
        this.body = this.find("Main/body", sp.Skeleton);
        this.quality = this.find("Main/quality", Sprite);
        this.attrScroller = this.find("Main/leftLayout", AutoScroller);
        this.fightScroller = this.find("Main/rightLayout", AutoScroller);
        this.skillScroller = this.find("Main/skills", AutoScroller);
        this.skillRadioScroller = this.find("Main/skillLayout", AutoScroller);
        this.radio = this.find("Main/radio", Label);
        this.okBtn = this.find("Main/okBtn", Sprite);
        this.okBtn2 = this.find("showUnselect/okBtn");
        this.costLabel = this.find("Main/okBtn/layout/value", Label);
        this.addBtn = this.find(`Main/addBtn`);
        this.showNode = this.find(`showUnselect`);
        this.Main = this.find(`Main`);
        this.Top = this.find(`Top`);
        this.Lock = this.find(`Lock`);

        this.light = this.find(`Main/light/spine`, sp.Skeleton);
        this.Energy = this.find(`Top/ui_breed_Energy`, sp.Skeleton);
        this.Egg = this.find(`egg/ui_breed_egg`, sp.Skeleton);
        this.Merger = this.find(`ui_breed_Merger`, sp.Skeleton);
        this.Aurora = this.find(`ui_breed_Aurora`, sp.Skeleton);

        this.mainCard.SetMain(true);
        this.otherCard.SetMain(false);

        this.attrScroller.SetHandle(this.UpdateAttrItem.bind(this));
        this.fightScroller.SetHandle(this.updateItem.bind(this));
        this.skillScroller.SetHandle(this.updateSkillItem.bind(this));
        this.skillRadioScroller.SetHandle(this.updateRadioItem.bind(this));
        this.scheduleOnce(() => {
            this.TopY = this.Top.getPosition().y;
        })

        this.okBtn.node.on(Input.EventType.TOUCH_END, this.onFanyu, this);
        this.okBtn2.on(Input.EventType.TOUCH_END, this.onFanyu, this);
        this.closeBtn.on(Input.EventType.TOUCH_END, this.Hide, this);
        this.mainCard.node.on(Input.EventType.TOUCH_END, this.onClickCard, this);
        this.otherCard.node.on(Input.EventType.TOUCH_END, this.onClickCard, this);
        this.addBtn.on(Input.EventType.TOUCH_END, this.onClickAdd, this);
        this.helpBtn1.on(Input.EventType.TOUCH_END, this.onHelpBtn, this);
        this.helpBtn2.on(Input.EventType.TOUCH_END, this.onHelpBtn, this);
    }

    /**重置UI和数据 */
    public Reset() {
        this.body.skeletonData = undefined;
        this.quality.spriteFrame = undefined;
        this.radio.string = 0 + "%"
        this.upitems = [];
        this.upitemNum = [];
        this.friend_ids = [];
    }

    /**点击卡片 */
    @CLICKLOCK(1)
    private onClickCard(event: EventTouch) {
        if (event.target == this.mainCard.node) {//主卡
            this.selectMainRole();
        } else {//副卡
            // if (!this.mainRole) return Tips.Show("请选择繁育主卡！");
            this.selectMainRole();
        }
    }

    /**选择主卡 */
    private selectMainRole() {
        let curRoles = CfgMgr.getFanyuMainRole();
        SelectHeroPanel.SelectMerge(curRoles, [this.mainRole, this.otherRole], 2, this.selectCallBack.bind(this));
    }

    /**选择副卡 */
    private selectOrtherRole() {
        let curRoles = CfgMgr.getFanyuOrtherRole(this.mainRole, this.std);
        SelectHeroPanel.SelectMerge(curRoles, [this.mainRole, this.otherRole], 2, this.selectCallBack.bind(this));
    }

    private selectCallBack(selects: SPlayerDataRole[]) {
        if (selects[0]) {
            this.mainCard.SetData(selects[0]);
            this.mainRole = selects[0];
            let stds = CfgMgr.Get("role_quality");
            stds.forEach((curStd) => {
                if (curStd.MainRoleid == this.mainRole.type && this.mainRole.quality + 1 === curStd.RoleQuailty) {
                    this.std = curStd;
                }
            })
            if (selects[1]) {
                this.otherCard.SetData(selects[1]);
                this.otherRole = selects[1];
            } else {
                this.otherRole = undefined;
                this.otherCard.SetData(this.otherRole);
            }
        } else {
            this.mainRole = undefined;
            this.mainCard.SetData(this.mainRole);
            this.otherRole = undefined;
            this.otherCard.SetData(this.otherRole);
        }
        this.flush();
    }
    protected onShow(): void {
        this.Lock.active = false;
        this.mainRole = undefined;
        this.otherRole = undefined;
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
    }

    /**刷新,初始化 */
    async flush(...args: any[]) {
        this.Reset();
        this.Energy.node.active = true;
        this.setMainMoveAction();
        this.mainCard.SetData(this.mainRole);
        this.otherCard.SetData(this.otherRole);
        let datas1: AttrSub[] = [];
        let datas2: AttrSub[] = [];
        let datas3: any[] = [];
        let datas4: any[] = [];
        if (this.mainRole) {
            let prefab = CfgMgr.GetRole()[this.mainRole.type].Prefab;
            this.body.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/role_p", prefab, prefab), sp.SkeletonData);
            this.body.setAnimation(0, `Idle`, true);
            let url = path.join(folder_icon + "quality", CardQuality[this.std.RoleQuailty] + "_big", "spriteFrame");
            this.quality.spriteFrame = await ResMgr.LoadResAbSub(url, SpriteFrame);
            //品质特效
            let lightPath = path.join("spine/effect", `ui_breed_Magic_${CardQuality[this.std.RoleQuailty]}`, `ui_breed_Magic_${CardQuality[this.std.RoleQuailty]}`);
            this.light.skeletonData = await ResMgr.LoadResAbSub(lightPath, sp.SkeletonData);
            this.light.setAnimation(0, "Loop", true);

            // 基础属性
            let stdNow = CfgMgr.GetRoleQuality(this.mainRole.type, this.mainRole.quality);
            let stdNext: StdRoleQuality;
            if (this.std) stdNext = CfgMgr.GetRoleQuality(this.mainRole.type, this.std.RoleQuailty);
            datas1 = FormatAttrUpByRole(stdNow, this.mainRole.type, stdNext);
            let soldierNumData = GetSolderNum(datas1);

            if (soldierNumData) {
                // 附加属性
                let data: AttrSub = {
                    icon: path.join(folder_attr, "AttackVal/spriteFrame"),
                    name: "带兵数量",
                    value: (soldierNumData.value || 0) + this.mainRole.soldier_num + (soldierNumData.per || 0),
                    next: 0,
                    per: ""
                }
                if (stdNow) data.next = (stdNow.SoldierNum[0] + (soldierNumData.next || 0) + (soldierNumData.per || 0)) + "~" + (stdNow.SoldierNum[1] + (soldierNumData.next || 0) + (soldierNumData.per || 0));
                datas2.push(data);
            }
            if (stdNow) {
                let str = `被动技能概率提升 数量<color=#49FF11><outline color=#000000 width=3>+${stdNow.PassiveSkillNumAdd[0]}~${stdNow.PassiveSkillNumAdd[1]}</outline></color>`;
                this.Main.getChildByName(`skillBg`).getComponentInChildren(RichText).string = str
            }
            SpliceSolderNum(datas1);

            this.radio.string = ToFixed(stdNow.BaseRate * 100, 2) + "%"
            datas3 = [this.mainRole.active_skills[0]];
            stdNow.ActiveSkillUp.forEach((value, index) => {
                if (value == 1) {
                    datas3 = [this.mainRole.active_skills[index]];
                }
            })
            datas4 = this.mainRole.passive_skills;
        } else {
            // this.okBtn.grayscale = true;
            this.costLabel.node.parent.active = false;
        }
        this.attrScroller.UpdateDatas(datas1);
        this.fightScroller.UpdateDatas(datas2);
        this.skillScroller.UpdateDatas(datas3);
        this.skillRadioScroller.UpdateDatas(datas4);
    }

    /**设置spine动画 */
    private setSpineAction() {
        this.Energy.clearAnimations();
        this.Egg.clearAnimations();
        this.Energy.setAnimation(0, `Loop`, true);

        let spine_call_back = () => {
            this.Egg.setAnimation(0, `Loop`, false);
            this.Egg.setCompleteListener(() => {
                this.Egg.setAnimation(0, `Start`, false);
                this.Egg.setCompleteListener(() => {
                    spine_call_back();
                })
            })
        }
        spine_call_back();
    }

    private setMainMoveAction() {
        let mainOpacity = this.Main.getComponent(UIOpacity);
        Tween.stopAllByTarget(this.Main);
        Tween.stopAllByTarget(this.Top);
        Tween.stopAllByTarget(mainOpacity);
        this.Aurora.node.active = false;
        if (!this.mainRole) {
            this.Main.active = false;
            this.showNode.active = true;
            this.Egg.node.parent.active = true;
            mainOpacity.opacity = 255;
            this.Top.setPosition(new Vec3(0, this.TopY, 1));
            this.setSpineAction();
        } else {
            this.showNode.active = false;
            this.Egg.node.parent.active = false;
            this.Main.active = true;
            mainOpacity.opacity = 0;
            this.Main.setPosition(0, -100, 1);
            tween(mainOpacity).to(1, { opacity: 255 }, { easing: easing.sineInOut }).start();
            tween(this.Main).to(.5, { position: new Vec3(0, 0, 1) }, { easing: easing.sineInOut }).start();
            tween(this.Top).to(.5, { position: new Vec3(0, 230, 1) }, { easing: easing.sineInOut }).start();
        }
    }

    /**刷新Item */
    protected async UpdateAttrItem(item: Node, data: any) {
        let icon = item.getChildByName("icon")?.getComponent(Sprite);
        let name = item.getChildByName("name")?.getComponent(Label);
        let now = item.getChildByName("nowValue")?.getComponent(Label);
        let next = item.getChildByName("nextValue")?.getComponent(Label);
        if (data.icon) {
            icon.node.active = true;
            icon.spriteFrame = await ResMgr.LoadResAbSub(data.icon, SpriteFrame);
        } else {
            icon.node.active = false;
        }
        if (name) name.string = data.name;
        now.string = data.value + data.per;
        if (next) {
            if (data.next) {
                next.node.active = true;
                next.string = "+" + data.next + data.per;
            } else {
                next.node.active = false;
            }
        }
    }

    protected updateItem(item: Node, data: any) {
        let name = item.getChildByName("name")?.getComponent(Label);
        let now = item.getChildByName("nowValue")?.getComponent(Label);
        let next = item.getChildByName("nextValue")?.getComponent(Label);
        if (name) name.string = data.name;
        now.string = data.value + data.per;
        if (next) {
            if (data.next) {
                next.node.active = true;
                next.string = "+" + data.next + data.per;
            } else {
                next.node.active = false;
            }
        }
    }

    protected async updateSkillItem(item: Node, data: SPlayerDataSkill) {
        let bg = item.getChildByName("bg").getComponent(Sprite);
        let icon = item.getChildByPath("Mask/icon").getComponent(Sprite);
        let name = item.getChildByName("name").getComponent(Label);
        let level = item.getChildByName("level").getComponent(Label);
        let next = item.getChildByName("next").getComponent(Label);
        if (data) {
            icon.node.on(Node.EventType.TOUCH_END, () => {
                ActiveSkillTipsPanel.Show(data);
            }, this);
            let stdSkill: StdActiveSkill = CfgMgr.GetActiveSkill(data.skill_id, data.level);
            name.string = stdSkill.Name;
            level.string = `lv.${data.level}`;
            next.string = `lv.${data.level + 1}`;
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
        let level = item.getChildByName("lvCont").getComponentInChildren(Label);
        let bg = item.getChildByName("bg").getComponent(Sprite);
        let up = item.getChildByName("up");
        if (data) {
            icon.node.on(Node.EventType.TOUCH_END, () => {
                PassiveSkillTipsPanel.Show(data);
            }, this);
            let stdSkill: StdPassiveLevel = CfgMgr.GetPassiveSkill(data.skill_id, data.level);
            let stdNextSkill: StdPassiveLevel = CfgMgr.GetPassiveSkill(data.skill_id, data.level + 1);
            level.string = `${data.level}`;
            if (stdNextSkill) {
                up.active = true;
            } else {
                up.active = false;
            }
            if (stdSkill) {
                let iconUrl: string = path.join(folder_skill, stdSkill.Icon.toString(), "spriteFrame");
                ResMgr.LoadResAbSub(iconUrl, SpriteFrame, res => {
                    icon.spriteFrame = res;
                });
                let bgUrl = path.join(folder_icon, "quality", "p_skill_bg_" + stdSkill.RareLevel, "spriteFrame");
                ResMgr.LoadResAbSub(bgUrl, SpriteFrame, res => {
                    bg.spriteFrame = res;
                });
            }
        }
    }

    protected onHide(...args: any[]): void {
        HomeLogic.ins.ExistFanyuScene();
        if (FanyuUpPage.ins) FanyuUpPage.ins.resetData();
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }

    public OnMerge(role) {
        // PlayerData.DelRole(this.otherRole.id);
        // this.Top.active = false;
        // this.Main.active = false;
        // this.Merger.node.active = true;
        // this.Aurora.node.active = true;
        // this.Egg.node.parent.active = true;
        // this.Merger.setCompleteListener(() => {
        //     this.Egg.setCompleteListener(() => {
        //         if (this.mainRole.quality == role.quality) {
        //             ShowHeroPanel.ShowMerge(role);
        //             this.ResetOther();
        //         } else {
        //             ShowHeroPanel.ShowMerge(role, this.mainRole);
        //             this.ResetSelect();
        //         }
        //         this.Lock.active = false;
        //         this.Top.active = true;
        //         this.Main.active = true;
        //         this.Egg.setAnimation(0, `Start`, false);
        //     })
        //     this.Merger.node.active = false;
        //     this.Aurora.node.active = false;
        //     this.Egg.setAnimation(0, `Break`, false);
        // })
        // this.Aurora.setCompleteListener(() => {
        //     this.Aurora.setAnimation(0, `Loop`, false);
        // })
        // this.Merger.setAnimation(0, `animation`, false);
        // this.Aurora.setAnimation(0, `Start`, false);


        PlayerData.DelRole(this.otherRole.id);
        this.Main.active = false;
        this.Top.active = true;
        this.friendData = [];
        // this.Merger.node.active = true;
        // this.Aurora.node.active = true;
        this.Egg.node.parent.active = true;
        this.Egg.setAnimation(0, `Start`, true);
        if (this.mainRole.quality == role.quality) {
            AudioMgr.PlayOnce(Audio_FanyuFail);   
        } else {
            AudioMgr.PlayOnce(Audio_FanyuSucc); 
        }

        let action1 = () => {
            tween(this.otherCard.node)
                .to(0.17, { eulerAngles: new Vec3(0, 90, 0) })
                .call(() => {
                    this.otherCard.node.active = false;
                    this.otherCard.node.eulerAngles = new Vec3(0, 0, 0);
                })
                .start();
        }

        let action2 = (callback) => {
            tween(this.Egg)
                .call(()=>{this.Egg.setCompleteListener(() => {this.Egg.clearAnimations();})    
                    this.Egg.setAnimation(0, `Break`, false);
                })
                .delay(1.66)
                .call(() => {
                    if (this.mainRole.quality == role.quality) {
                        ShowHeroPanel.ShowMerge(role, null, callback);   
                    } else {
                        ShowHeroPanel.ShowMerge(role, this.mainRole, callback);
                    }
                    this.Aurora.node.active = false;
                })
                .start();
        }
        //卡牌1/6秒反转90度
        tween(this.mainCard.node)
            .to(0.17, { eulerAngles: new Vec3(0, 90, 0) })
            .call(() => {
                this.mainCard.node.active = false;
                this.mainCard.node.eulerAngles = new Vec3(0, 0, 0);
                this.Merger.setCompleteListener(() => {
                    this.Merger.node.active = false;
                })
                this.Merger.node.active = true;
                this.Merger.setAnimation(0, `animation`, false);
                if (this.mainRole.quality == role.quality) {
                    this.Aurora.node.active = false; 
                } else {
                    this.Aurora.node.active = true;
                    this.Aurora.setAnimation(0, `Start`, false);
                }
               
            })
            .call(action1)
            .delay(1)
            .call(() => {
                this.Top.active = false;
                this.mainCard.node.active = true;
                this.otherCard.node.active = true;
                let callback = () => {
                    this.Top.active = true;
                    this.Main.active = true;
                    this.Lock.active = false;
                    if (this.mainRole.quality == role.quality) {
                        this.ResetOther();
                    } else {
                        this.ResetSelect();
                    }
                }
                action2(callback);
                // this.Egg.setCompleteListener(() => {
                //     if (this.mainRole.quality == role.quality) {
                //         ShowHeroPanel.ShowMerge(role, null, callback);
                //         // this.ResetOther();
                //     } else {
                //         ShowHeroPanel.ShowMerge(role, this.mainRole, callback);
                //         // this.ResetSelect();
                //     }
                //     this.Egg.clearAnimations();
                // })
                // this.Egg.setAnimation(0, `Break`, false);
            })
            // .delay(1.3)
            // .call(() => { this.Aurora.setAnimation(0, `Loop`, true); })
            .start();

    }

    /**重置选择 */
    public ResetSelect() {
        let self = this;
        this.scheduleOnce(() => {
            self.mainRole = undefined;
            self.otherRole = undefined;
            self.Reset()
            if (FanyuUpPage.ins) FanyuUpPage.ins.resetData();
            self.flush();
        }, .1)
    }

    public ResetOther() {
        let self = this;
        this.scheduleOnce(() => {
            self.otherRole = undefined;
            self.Reset()
            if (FanyuUpPage.ins) FanyuUpPage.ins.resetData();
            self.flush();
        }, .1)
    }

    @CLICKLOCK(1)
    private onClickAdd() {
        if (!this.mainRole || !this.otherRole) {
            return Tips.Show(`请先选择需要繁育的英雄`);
        }
        FanyuUpPage.Show(this.mainRole.type, this.mainRole.quality, this.addCallBack.bind(this), this.upitemNum, this.friend_ids, this.friendData)
    }

    private addCallBack(upitems: string[], upitemNums: number[], friendIds: string[], radio: number, friendData) {
        this.upitems = upitems;
        this.upitemNum = upitemNums;
        this.friend_ids = friendIds;
        this.radio.string =ToFixed(radio, 2) + "%"
        this.friendData = friendData;
    }

    @CLICKLOCK(1)
    protected onFanyu() {
        if (this.mainRole) {
            if (!this.otherRole) {
                Tips.Show("请选择繁育副卡！");
                return;
            }
            let stdNow = CfgMgr.GetRoleQuality(this.mainRole.type, this.mainRole.quality);
            if (PlayerData.roleInfo.currency >= stdNow.CoinCostNum) {
                if (this.otherRole) {
                    let callback = ()=>{
                        this.Lock.active = true;
                        this.Energy.node.active = false;
                        let data = {
                            type: MsgTypeSend.MergeRoleRequest,
                            data: {
                                role_id: this.mainRole.id,
                                target_quality: this.std.RoleQuailty,
                                consume_role_id: this.otherRole.id,
                                up_item_ids: this.upitems,
                                up_item_nums: this.upitemNum,
                                friend_ids: this.friend_ids,
                            }
                        }
                        Session.Send(data, MsgTypeRet.MergeRoleRet)
                    }
                    if(this.otherRole.level > 1 || this.mainRole.level > 1){
                        let time = LocalStorage.GetNumber("Fanyu" + PlayerData.roleInfo.player_id)
                        if (time) {
                            let isopen = DateUtils.isSameDay(time)
                            if (isopen) {
                                callback();
                                return;
                            }
                        }
                        fanyuTips.Show(callback.bind(this));
                    }else{
                        callback();
                    }
                }
            } else {
                Tips.Show("彩钻不足!");
            }
        } else {
            Tips.Show("请先选择需要繁育的英雄");
        }
    }

    private onHelpBtn() {
        Tips2.Show(Tips2ID.Fanyu);
    }

    /**自动选择可繁育的目标 */
    // public MapRole() {
    //     let stds: StdMerge[] = CfgMgr.Get("role_quality");
    //     let roles = PlayerData.GetRoles();
    //     let curStd = null;
    //     for (let std of stds) {
    //         this.mainRole = undefined;
    //         this.otherRole = undefined;
    //         curStd = null;
    //         for (let role of roles) {
    //             if (!this.mainRole && role.type == std.MainRoleid && role.quality + 1 === std.RoleQuailty) {
    //                 this.mainRole = role;
    //                 curStd = std;
    //             } else if (this.mainRole && curStd) {
    //                 // if (curStd.OtherRoleid.indexOf(role.type) != -1 && this.mainRole.quality === role.quality && this.mainRole !== role) {//副卡ID是多个的时候
    //                 if (curStd.OtherRoleid[0] == role.type && this.mainRole.quality === role.quality && this.mainRole !== role) {
    //                     this.otherRole = role;
    //                 }
    //             }
    //             if (this.mainRole && this.otherRole) {
    //                 this.mainCard.SetData(this.mainRole);
    //                 this.otherCard.SetData(this.otherRole);
    //                 this.std = std;
    //                 return
    //             };
    //         }
    //     }
    //     this.mainRole = undefined;
    //     this.otherRole = undefined;
    // }
}