import { _decorator, Component, Input, instantiate, Label, Layout, Node, path, Sprite, UITransform, v3 } from 'cc';
import { Panel } from '../../../GameRoot';
import PlayerData from '../../roleModule/PlayerData';
import { CfgMgr, ConditionType, StdDefineBuilding } from '../../../manager/CfgMgr';
import { MsgPanel } from '../../common/MsgPanel';
import { MsgTypeRet, MsgTypeSend } from '../../../MsgType';
import { Session } from '../../../net/Session';
import Logger from '../../../utils/Logger';
import { BuildingType } from '../HomeStruct';
import { AutoScroller } from '../../../utils/AutoScroller';
import { ConditionSub, UpdateConditionItem } from '../../common/BaseUI';
import { Tips } from '../../login/Tips';
import { ToFixed, formatNumber } from '../../../utils/Utils';
import { Audio_CommonBuilding, Audio_CommonClick, AudioMgr } from '../../../manager/AudioMgr';
const { ccclass, property } = _decorator;

@ccclass('BuildingPanel')
export class BuildingPanel extends Panel {
    protected prefab: string = 'prefabs/panel/BuildingPanel';
    protected static $self: BuildingPanel;
    static get self(): BuildingPanel { return this.$instance; }
    @property({ type: Label, displayName: '建筑描述' })
    protected desLab: Label = null;

    private cdScroller: AutoScroller;
    // levelUpCondition: Node;
    buildingId: any;
    Level: number;
    /**升级建筑等级 */
    conditionLv: number;
    /**升级需要的物品 */
    items: number[];
    /**升级需要的物品数量 */
    itemsNum: number[];
    Money: number;
    closeBtn: Node;
    timeNode: Node;
    timeStr: Label;
    build: Node;
    private buildingDef: StdDefineBuilding;
    private conditions: ConditionSub[] = [];

    protected onLoad(): void {
        this.CloseBy("mask");
        this.cdScroller = this.find("panel/cdLayout/ScrollView", AutoScroller);
        this.cdScroller.SetHandle(UpdateConditionItem.bind(this));
        // this.levelUpCondition = this.find('panel/ScrollView/view/content/Item2');
        this.desLab = this.find('panel/infoBar/des').getComponent(Label);
        this.desLab.string = '';
        this.closeBtn = this.find('panel/closeBtn');
        this.closeBtn.on(Input.EventType.TOUCH_END, this.onClose, this)

        this.timeNode = this.find('panel/build/layout/time');
        this.timeStr = this.timeNode.getChildByName('timeLab').getComponent(Label);

        this.build = this.find('panel/build');
        this.build.on(Input.EventType.TOUCH_END, this.buildClick, this);
    }
    protected onShow(...args: any[]): void {
        this.buildingDef = args[0] as StdDefineBuilding;
        Logger.log('buildingDef', this.buildingDef)
        this.find("panel/InfoItem/buildName", Label).string = "建造" + this.buildingDef.remark;
        this.items = this.buildingDef.ItemId;
        this.itemsNum = this.buildingDef.ItemNum;
        this.conditionLv = this.buildingDef.Level;
        this.buildingId = this.buildingDef.BuildingId;
        // let wood = RoleData.resources.Wood;
        this.Level = PlayerData.GetBuildingByType(BuildingType.ji_di, PlayerData.RunHomeId)[0].level;
        this.Money = this.buildingDef.Money;
        let str_id = [12,13,14,14,15,16]
        // this.desLab.string = this.buildingDef.remark;
        this.desLab.string = CfgMgr.GetLanguageById(str_id[this.buildingDef.BuildingType - 7])
        // this.showCondition();


        this.conditions.length = 0;
        if (this.buildingDef.Level) {
            let jidi = CfgMgr.GetBuildingDefine(PlayerData.RunHomeId, BuildingType.ji_di)[0];
            let data: ConditionSub = { id: ConditionType.Home_1, icon: "sheets/icons/tree2/spriteFrame", name: jidi.remark + "lv" + this.buildingDef.Level };
            let homeLand = PlayerData.GetHomeLand(this.buildingDef.HomeId);
            if (homeLand && homeLand.level < this.buildingDef.Level) {
                data.fail = "生命树等级不足！";
            }
            this.conditions.push(data);
        }
        if (this.buildingDef.ItemId) {
            for (let i = 0; i < this.buildingDef.ItemId.length; i++) {
                let id = this.buildingDef.ItemId[i];
                let std = CfgMgr.Getitem(id);
                if (!std) continue;
                let url = path.join("sheets/items", std.Icon, "spriteFrame");
                let has = PlayerData.GetItemCount(id);
                let data: ConditionSub = { id: ConditionType.Home_1, icon: url, name: has + "/" + this.buildingDef.ItemNum[i] };
                if (has < this.buildingDef.ItemNum[i]) data.fail = "资源不足!";
                this.conditions.push(data);
            }
        }
        if (this.buildingDef.Money > 0) {
            let data: ConditionSub = { id: ConditionType.Home_1, icon: "sheets/items/caizuan/spriteFrame", name: this.setResCount(PlayerData.roleInfo.currency) + "/" + this.buildingDef.Money };
            if (PlayerData.roleInfo.currency < this.buildingDef.Money) data.fail = "彩钻不足!";
            this.conditions.push(data);
        }
        this.cdScroller.UpdateDatas(this.conditions);
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
    public flush(...args: any[]): void {

    }
    protected onHide(...args: any[]): void {

    }

    onClose() {
        AudioMgr.PlayOnce(Audio_CommonClick);
        this.Hide();
    }

    // showCondition() {
    //     this.initCondition();
    //     let BuildItem = this.levelUpCondition.getChildByName('BuildItem');
    //     let ResItem = this.levelUpCondition.getChildByName('ResItem');
    //     /**升级条件 建筑等级是否达标 */
    //     if (this.conditionLv && this.conditionLv > 0) {
    //         let item = instantiate(BuildItem);
    //         this.levelUpCondition.addChild(item);
    //         item.active = true;
    //         let icon = item.getChildByName("icon").getComponent(Sprite);
    //         let name = item.getChildByPath("layout/name").getComponent(Label);
    //         let level = item.getChildByPath("layout/level").getComponent(Label);
    //         let can = item.getChildByName("can");
    //         let notcan = item.getChildByName("notcan");
    //         name.string = '家园';
    //         level.string = `Lv.${this.conditionLv}`;

    //         can.active = this.Level >= this.conditionLv;
    //         notcan.active = !can.active;

    //     }

    //     /**升级条件 需要资源是否达标 */
    //     for (let index = 0; index < this.items.length; index++) {
    //         let itemId = this.items[index];
    //         let itemNum = this.itemsNum[index];
    //         let item = instantiate(ResItem);
    //         this.levelUpCondition.addChild(item);
    //         item.active = true;
    //         let icon = item.getChildByName('icon').getComponent(Sprite);
    //         let all = item.getChildByPath('count/all').getComponent(Label);
    //         let need = item.getChildByPath('count/need').getComponent(Label);
    //         let can = item.getChildByName('can');
    //         let notcan = item.getChildByName('notcan');
    //         if (itemId == 1001) {//木头
    //             all.string = `${PlayerData.resources.wood}`;
    //             need.string = `/${itemNum}`;
    //             can.active = PlayerData.resources.wood >= itemNum;
    //             notcan.active = !can.active;
    //         }
    //     }
    //     this.checkLayoutNode(this.levelUpCondition);
    // }

    // checkLayoutNode(layoutNode) {
    //     let count = 0;
    //     for (let index = 0; index < layoutNode.children.length; index++) {
    //         let child = layoutNode.children[index];
    //         if (child.active) {
    //             count += 1;
    //         }
    //     }
    //     if (count < 2) {
    //         layoutNode.getComponent(Layout).enabled = false;
    //         layoutNode.getComponent(UITransform).setContentSize(856, 259.7);
    //         if (count == 2) {
    //             let child = layoutNode.children[3];
    //             child.setPosition(v3(0, -160, 0));
    //         }
    //     } else {
    //         layoutNode.getComponent(Layout).enabled = true;
    //     }
    // }

    buildClick() {
        AudioMgr.PlayOnce(Audio_CommonBuilding);
        if (!this.conditions) {
            Tips.Show("无法升级!");
            return;
        }
        for (let obj of this.conditions) {
            if (obj.fail) {
                Tips.Show(obj.fail);
                return;
            }
        }
        let data = {
            type: MsgTypeSend.BuildingUnlock,
            data: { building_id: this.buildingId }
        }
        Session.Send(data, MsgTypeRet.BuildingUnlockRet);
        this.onClose();
    }

    // chcekLevelUp() {
    //     for (let index = this.levelUpCondition.children.length - 1; index > 2; index--) {
    //         let item = this.levelUpCondition.children[index];
    //         let notcan = item.getChildByName("notcan");
    //         if (notcan.active) {
    //             return false;
    //         }
    //     }
    //     return true;
    // }

    // initCondition() {
    //     for (let index = this.levelUpCondition.children.length - 1; index > 2; index--) {
    //         let item = this.levelUpCondition.children[index];
    //         item.parent.removeChild(item);
    //     }
    // }


}


