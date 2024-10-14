import { _decorator, Component, Input, instantiate, Label, Node, path, Sprite, SpriteFrame, UITransform } from 'cc';
import { AutoScroller } from '../../../utils/AutoScroller';
import { Attr, AttrFight, CfgMgr, StdBuilding, StdDefineBuilding, ThingItemId } from '../../../manager/CfgMgr';
import { BuildingType } from '../HomeStruct';
import { folder_item, ResMgr } from '../../../manager/ResMgr';
import PlayerData, { BoostType } from '../../roleModule/PlayerData';
import { Evt_Building_Upgrade, Evt_Building_Upgrade_Complete, EventMgr, Evt_Item_Change, Evt_Building_Effect, Goto } from '../../../manager/EventMgr';
import { ToFixed, formatNumber, minn } from '../../../utils/Utils';
import { Session } from '../../../net/Session';
import { Tips } from '../../login/Tips';
import { MsgTypeRet, MsgTypeSend } from '../../../MsgType';
import { AttrSub, ConditionSub, FormatAttr, FormatBuildingAttrUp, FormatCondition, FormaThingCondition, FormatSoldierInfo, FormatSoldierUp, UpdateAttrItem, UpdateBuildingAttr, UpdateConditionItem } from '../../common/BaseUI';
import { BoostPanel } from './BoostPanel';
import { DateUtils } from '../../../utils/DateUtils';
import { BeforeGameUtils } from '../../../utils/BeforeGameUtils';
import { Audio_CommonBuilding, AudioMgr } from '../../../manager/AudioMgr';
import { MsgPanel } from '../../common/MsgPanel';
import { PANEL_TYPE } from '../../../manager/UIGuide';
import { GameSet } from '../../GameSet';
const { ccclass, disallowMultiple, property } = _decorator;

@ccclass('BaseLvPage')
@disallowMultiple(true)
export class BaseLvPage extends Component {

    private infoScroller: AutoScroller;
    private infoScroller2: AutoScroller;
    private lvScroller: Node;
    private cdScroller: Node;
    private effNode: Node;

    private btn: Sprite;
    private btnLabel: Label;
    private countDown: Label;

    private stdDefine: StdDefineBuilding;
    private stdLv: StdBuilding;
    private stdnext: StdBuilding;
    private attrIconInfo: { [key: string]: string } = BeforeGameUtils.toHashMapObj(
        Attr.CollectEfficiency, "quanneng",
        Attr.WoodCollectEfficiency, "mucai",
        Attr.WaterCollectEfficiency, "shui",
        Attr.RockCollectEfficiency, "shitou",
        Attr.SeedCollectEfficiency, "zhongzi",
    );

    private is_has_rights: boolean = true;
    private is_jump: boolean = false;
    private is_jy: boolean = false;
    private jump_lv: number = 1;

    protected onLoad(): void {
        this.infoScroller = this.node.getChildByPath("infoBar/layout").getComponent(AutoScroller);
        this.infoScroller2 = this.node.getChildByPath("infoBar/layout2").getComponent(AutoScroller);
        this.lvScroller = this.node.getChildByPath("layout/content/lvLayout/content");
        this.cdScroller = this.node.getChildByPath("layout/content/cdLayout/content");
        this.effNode = this.node.getChildByPath("btn/qipao");

        this.btn = this.node.getChildByName("btn").getComponent(Sprite);
        this.btnLabel = this.node.getChildByPath("btn/layout/lab").getComponent(Label);
        this.countDown = this.node.getChildByPath("btn/layout/layout/timeLab").getComponent(Label);

        this.infoScroller.SetHandle(UpdateBuildingAttr.bind(this));
        this.infoScroller2.SetHandle(UpdateBuildingAttr.bind(this));
        this.node.getChildByPath("btn").on(Input.EventType.TOUCH_END, this.onUpGrade, this);
    }

    Show(buildingId: number) {
        this.node.active = true;
        this.stdDefine = CfgMgr.GetBuildingUnLock(buildingId);
        let state = PlayerData.GetBuilding(this.stdDefine.BuildingId, this.stdDefine.HomeId);
        if (!state) return;
        this.stdLv = CfgMgr.GetBuildingLv(this.stdDefine.BuildingId, state.level);
        this.stdnext = CfgMgr.GetBuildingLv(this.stdDefine.BuildingId, state.level + 1);
        if (!this.stdLv) return;

        EventMgr.on(Evt_Item_Change, this.flush, this);
        EventMgr.on(Evt_Building_Upgrade, this.flush, this);
        EventMgr.on(Evt_Building_Upgrade_Complete, this.flush, this);
        this.flush();
    }
    Hide() {
        this.node.active = false;
        EventMgr.off(Evt_Item_Change, this.flush, this);
        EventMgr.off(Evt_Building_Upgrade, this.flush, this);
        EventMgr.off(Evt_Building_Upgrade_Complete, this.flush, this);
    }

    /**
     * 更新等级状态
     * @returns 
     */
    private flush() {
        this.is_jump = false;
        this.effNode.active = false;
        this.is_has_rights = PlayerData.GetIsActivateRights();
        this.is_jy = GameSet.Server_cfg.Mark ? true : false;
        this.jump_lv = CfgMgr.getEquityListById(19).Value - 1;
        let state = PlayerData.GetBuilding(this.stdDefine.BuildingId, this.stdDefine.HomeId);
        if (!state) return;
        this.stdLv = CfgMgr.GetBuildingLv(this.stdDefine.BuildingId, state.level);
        this.stdnext = CfgMgr.GetBuildingLv(this.stdDefine.BuildingId, state.level + 1);
        if (!this.stdLv) return;
        if(this.stdDefine.BuildingId == BuildingType.ji_di){
            this.is_has_rights = PlayerData.GetIsActivateRights();
        }

        let wide = this.node.getChildByPath("infoBar/frame").getComponent(UITransform).contentSize.width;
        let folder = BuildingType[this.stdDefine.BuildingType];
        let url = path.join("home/buildings", folder, this.stdLv.Prefab, "spriteFrame");
        let icon = this.node.getChildByPath("infoBar/icon").getComponent(Sprite);
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            icon.spriteFrame = res;
            let iconSize = icon.node.getComponent(UITransform).contentSize;
            let scale = minn(wide / iconSize.width, wide / iconSize.height);
            icon.node.setScale(scale, scale, 1);
        });
        // console.log("this.stdLv====", this.stdLv);
        this.flushInfo();
        this.flushLevel();
        this.flushCondition();
    }

    /**生命周期update */
    protected update(dt: number): void {
        if (!this.stdLv) return;
        if (!this.stdnext) {
            this.cdScroller.active = false;
            this.btnLabel.string = "最高级";
            this.countDown.node.parent.active = false;
            this.btn.grayscale = true;
            return;
        }

        //主基地等级>=4并且没有权益卡
        if(this.is_jy && this.stdDefine.BuildingId == BuildingType.ji_di && this.stdLv.Level >= this.jump_lv && !this.is_has_rights){
            this.btnLabel.string = "前往购买";
            this.countDown.node.parent.active = false;
            this.btn.grayscale = false;
            this.is_jump = true;
            this.effNode.active = true;
            return;  
        }
        this.cdScroller.active = true;

        this.btn.grayscale = false;
        let state = PlayerData.GetBuilding(this.stdDefine.BuildingId, this.stdDefine.HomeId);
        this.btnLabel.string = "升级";
        this.btn.node.getChildByName(`green`).active = false;
        this.btn.node.getChildByName(`yellow`).active = false;
        if (state && state.upgrade_time) {
            let lessTime = state.upgrade_time - PlayerData.GetServerTime();
            if (lessTime > 0) {
                this.btn.node.getChildByName(`yellow`).active = true;
                this.btnLabel.string = "加速";
                this.countDown.node.parent.active = true;
                this.countDown.string = DateUtils.FormatTime(lessTime);
            } else {
                this.btnLabel.string = "升级完成";
                this.countDown.node.parent.active = false;
                this.btn.node.getChildByName(`green`).active = true;
            }
        } else {
            this.countDown.node.parent.active = false;
        }
    }

    /**
     * 更新建筑信息
     */
    protected flushInfo() {
        let datas: AttrSub[] = [];
        //解析建筑的基础属性
        if (this.stdLv.Attr.length) {
            let types = this.stdLv.Attr;
            let values = this.stdLv.AttrValue;
            for (let i = 0; i < types.length; i++) {
                let data = FormatAttr(types[i], false);
                data.value = values[i];
                if (this.stdDefine.BattleType != 1) data.icon = path.join(folder_item, this.attrIconInfo[data.id], "spriteFrame")
                datas.push(data);
            }
        }

        //解析建筑的战斗属性
        if (this.stdDefine.BattleType == 1 && this.stdLv.AttrFight.length) {
            let types = this.stdLv.AttrFight;
            let values = this.stdLv.AttrFightValue;
            for (let i = 0; i < types.length; i++) {
                let data = FormatAttr(types[i], true);
                data.value = values[i];
                //城墙不显示移动属性
                if (this.stdLv.BuildingType == BuildingType.cheng_qiang && data.id == AttrFight.GroundMoveSpeed) {
                    continue;
                }
                datas.push(data);
            }
        }

        //处理建筑特殊属性
        switch (this.stdDefine.BuildingType) {
            // case BuildingType.ji_di:
            case BuildingType.cai_kuang:
                var data = { icon: folder_item + "shitou/spriteFrame", name: "采集角色", value: this.stdLv.WorkingRolesNum || this.stdLv.DefenseRolesNum, next: 0, per: "" };;
                datas.push(data);
                break;
            case BuildingType.cai_mu:
                var data = { icon: folder_item + "mucai/spriteFrame", name: "采集角色", value: this.stdLv.WorkingRolesNum || this.stdLv.DefenseRolesNum, next: 0, per: "" };;
                datas.push(data);
                break;
            case BuildingType.cai_shui:
                var data = { icon: folder_item + "shui/spriteFrame", name: "采集角色", value: this.stdLv.WorkingRolesNum || this.stdLv.DefenseRolesNum, next: 0, per: "" };;
                datas.push(data);
                break;
            case BuildingType.hua_fang:
                var data = { icon: folder_item + "zhongzi/spriteFrame", name: "采集角色", value: this.stdLv.WorkingRolesNum || this.stdLv.DefenseRolesNum, next: 0, per: "" };;
                datas.push(data);
                break;
        }
        if (this.stdDefine.BuildingType == BuildingType.bing_ying) {
            //兵营属性
            let stdlvs = CfgMgr.GetSoldierProduction(this.stdDefine.BuildingId);
            datas.push(...FormatSoldierInfo(stdlvs, this.stdLv.Level));
        }

        if (datas.length == 1) {
            this.infoScroller.node.parent.getChildByName(`bg2`).active = false;
            this.infoScroller.node.active = false;
            this.infoScroller2.node.active = true;
            this.infoScroller2.UpdateDatas(datas);
        } else {
            this.infoScroller.node.active = true;
            this.infoScroller2.node.active = false;
            if (datas.length == 2) {
                this.infoScroller.node.active = false;
                this.infoScroller2.node.active = true;
                this.infoScroller2.UpdateDatas(datas);
            } else {
                this.infoScroller.UpdateDatas(datas);
            }
            this.infoScroller.node.parent.getChildByName(`bg2`).active = true;
        }
    }

    protected flushLevel() {
        if (!this.stdLv) {// || (!this.stdLv.Attr.length && !this.stdLv.AttrFight.length)) {
            this.node.getChildByPath("layout").active = false;
        } else {
            this.node.getChildByPath("layout").active = true;
            let datas = [];
            //解析升级属性
            datas.push(...FormatBuildingAttrUp(this.stdDefine.BuildingId, this.stdLv.Level));
            this.lvScroller.children.forEach((node) => {
                node.active = false;
            })

            if (this.stdDefine.BuildingType == BuildingType.bing_ying) {
                //兵营属性
                let stdlvs = CfgMgr.GetSoldierProduction(this.stdDefine.BuildingId);
                datas.push(...FormatSoldierUp(stdlvs, this.stdLv.Level));
            }

            datas.forEach((data, index) => {
                let item: Node = null;
                if (this.lvScroller.children[index]) {
                    item = this.lvScroller.children[index];
                } else {
                    item = instantiate(this.lvScroller.children[0]);
                }
                item.parent = this.lvScroller;
                item.active = true;
                UpdateAttrItem(item, data, index, false);
            })
        }
    }

    private conditions: ConditionSub[] = [];
    /**更新升级条件 */
    protected flushCondition() {
        if (!this.stdLv || !this.stdLv.ConditionId.length) {
            this.node.getChildByPath("layout/content/cdLayout").active = false;
            this.conditions = undefined;
        } else {
            this.conditions.length = 0;
            this.node.getChildByPath("layout/content/cdLayout").active = true;
            for (let i = 0; i < this.stdLv.ConditionId.length; i++) {
                let conditionId = this.stdLv.ConditionId[i]
                let data = FormatCondition(conditionId, this.stdLv.ConditionLv[i]);
                if (data) this.conditions.push(data);
            }
            // if (this.stdLv.RewardID) {
            //     for (let i = 0; i < this.stdLv.RewardID.length; i++) {
            //         let reward = FormatReward(this.stdLv.RewardType[i], this.stdLv.RewardID[i], this.stdLv.RewardNumber[i])
            //         let id = reward.id;
            //         let std = CfgMgr.Getitem(id);
            //         if (!std) continue;
            //         let url = path.join("sheets/items", std.Icon, "spriteFrame");
            //         let has = PlayerData.GetItemCount(id);
            //         let name:string = "";
            //         if(ThingItemId[id]){
            //             name = formatNumber(has, 2) + "/" + formatNumber(this.stdLv.RewardNumber[i]);
            //         }else{
            //             name = has + "/" + this.stdLv.RewardNumber[i];
            //         }  
            //         let data: ConditionSub = { icon: url, name: name };
            //         if (has < this.stdLv.RewardNumber[i]) data.fail = std.ItemName + "不足!";
            //         this.conditions.push(data);
            //     }
            // }
            for (let i = 0; i < this.stdLv.RewardType.length; i++) {
                let data = FormaThingCondition(this.stdLv.RewardType[i], this.stdLv.RewardID[i], this.stdLv.RewardNumber[i]);
                this.conditions.push(data);
            }
            if (this.stdLv.Money > 0) {
                let data: ConditionSub = { icon: "sheets/items/caizuan/spriteFrame", name: this.setResCount(PlayerData.roleInfo.currency) + "/" + this.stdLv.Money };
                if (PlayerData.roleInfo.currency < this.stdLv.Money) data.fail = "彩钻不足!";
                this.conditions.push(data);
            }

            this.cdScroller.children.forEach((node) => {
                node.active = false;
            })
            this.conditions.forEach((data, index) => {
                let item: Node = null;
                if (this.cdScroller.children[index]) {
                    item = this.cdScroller.children[index];
                } else {
                    item = instantiate(this.cdScroller.children[0]);
                }
                item.parent = this.cdScroller;
                item.active = true;
                UpdateConditionItem(item, data);
            })
        }
    }

    /**资源和货币的数量展示 */
    private setResCount(count: number) {
        //判断是否是小数
        let str = count.toString();
        if (str.indexOf(".") != -1) {
            str = ToFixed(count, 2);
        } else {
            str = str + ".00"
        }
        return str;
    }
    /**升级 */
    protected onUpGrade() {
        let state = PlayerData.GetBuilding(this.stdDefine.BuildingId, this.stdDefine.HomeId);
        if (!state || !this.stdLv) {
            Tips.Show("本建筑尚未解锁");
            return;
        }
        if (state.upgrade_time == 0) {
            if (!this.stdnext) return;
            if (!this.conditions) {
                Tips.Show("无法升级!");
                return;
            }
            for (let obj of this.conditions) {
                if (obj.fail) {
                    Tips.Show(obj.fail);
                    //Tips.Show("资源不足");
                    return;
                }
            }
            if(this.is_jump){
                Goto(PANEL_TYPE.rightsPanel);
                return;
            }
            AudioMgr.PlayOnce(Audio_CommonBuilding);
            // 请求开始升级
            let data = {
                type: MsgTypeSend.BuildingUpgrade,
                data: {
                    building_id: this.stdDefine.BuildingId,
                    upgrade_level: this.stdLv.Level + 1
                }
            }
            Session.Send(data, MsgTypeRet.BuildingUpgradeRet);
        } else if (state.upgrade_time <= PlayerData.GetServerTime()) {
            EventMgr.emit(Evt_Building_Effect, this.stdDefine.BuildingId);
            // 确认完成升级
            let data = {
                type: MsgTypeSend.BuildingUpgradeComplete,
                data: {
                    building_id: this.stdDefine.BuildingId,
                    upgrade_level: this.stdLv.Level + 1
                }
            }
            Session.Send(data, MsgTypeRet.BuildingUpgradeCompleteRet);
        } else {
            let startTime: number = state.upgrade_time;
            if(startTime - PlayerData.GetServerTime() <= 0){
                MsgPanel.Show("无需加速");
                return;
            }
            if (!PlayerData.CheckAddTimeItem()) {
                MsgPanel.Show(CfgMgr.GetText("tips_1"));
                return;
            }
            BoostPanel.Show(this.stdLv.BuildingID, BoostType.BoostTypeBuildingUpgrade, startTime, state.upgrade_time);
        }
    }
}
