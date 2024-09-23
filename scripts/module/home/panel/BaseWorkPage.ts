import { _decorator, Color, Component, find, Input, js, Label, Node, path, Sprite, SpriteFrame, UITransform } from 'cc';
import { AutoScroller } from '../../../utils/AutoScroller';
import { Attr, CfgMgr, StdBuilding, StdCommonType, StdDefineBuilding, StdRole } from '../../../manager/CfgMgr';
import { folder_head_round, folder_icon, folder_item, ResMgr } from '../../../manager/ResMgr';
import PlayerData, { SBattleRole, SPlayerDataBuilding, SPlayerDataRole } from '../../roleModule/PlayerData';
import { Evt_Building_Upgrade, Evt_Building_Upgrade_Complete, EventMgr, Evt_Item_Change, Evt_FlushWorker } from '../../../manager/EventMgr';
import { DeepCopy, formatK, formatNumber, formatTime, minn } from '../../../utils/Utils';
import { Session } from '../../../net/Session';
import { Tips } from '../../login/Tips';
import { MsgTypeSend } from '../../../MsgType';
import { AttrSub, FormatAttr, FormatRoleAttr, GetAttrValue, GetAttrValueByIndex, MergeAttrSub, UpdateBuildingAttr } from '../../common/BaseUI';
import { BuildingType } from '../HomeStruct';
import { SelectHeroPanel } from '../../common/SelectHeroPanel';
import { BeforeGameUtils } from '../../../utils/BeforeGameUtils';
import { Audio_CommonWork, AudioMgr } from '../../../manager/AudioMgr';
const { ccclass, disallowMultiple, property } = _decorator;

@ccclass('BaseLvPage')
@disallowMultiple(true)
export class BaseWorkPage extends Component {
    private value: Label;
    private rateCont: Node;
    private rateIcon: Sprite;
    private rateValLab: Label;
    private titleLab: Node;
    private infoScroller: AutoScroller;
    private infoScroller2: AutoScroller;
    private workScroller: AutoScroller;
    private buildingId: number;
    private attrIsActivate: boolean;
    private stdDefBuild: StdDefineBuilding;
    private buildTypeAttrInfo: { [key: string]: number } = BeforeGameUtils.toHashMapObj(
        BuildingType.cai_mu, Attr.WoodCollectEfficiency,
        BuildingType.cai_kuang, Attr.RockCollectEfficiency,
        BuildingType.cai_shui, Attr.WaterCollectEfficiency,
        BuildingType.hua_fang, Attr.SeedCollectEfficiency,
    );
    private attrIconInfo: { [key: string]: string } = BeforeGameUtils.toHashMapObj(
        Attr.CollectEfficiency, "quanneng",
        Attr.WoodCollectEfficiency, "mucai",
        Attr.WaterCollectEfficiency, "shui",
        Attr.RockCollectEfficiency, "shitou",
        Attr.SeedCollectEfficiency, "zhongzi",
    );
    private buildTypeAttr: AttrSub;
    private colletcTime: number;
    private canCollect: boolean;
    protected onLoad(): void {
        this.rateCont = this.node.getChildByName("rateCont");
        this.rateIcon = this.node.getChildByPath("rateCont/icon").getComponent(Sprite);
        this.rateValLab = this.node.getChildByPath("rateCont/valueLab").getComponent(Label);
        this.titleLab = this.node.getChildByPath("rateCont/titleLab");
        this.value = this.node.getChildByPath("workerCount/count/value").getComponent(Label);
        this.infoScroller = this.node.getChildByPath("infoBar/layout").getComponent(AutoScroller);
        this.infoScroller2 = this.node.getChildByPath("infoBar/layout2").getComponent(AutoScroller);
        this.workScroller = this.node.getChildByPath("workLayout/ScrollView").getComponent(AutoScroller);

        this.infoScroller.SetHandle(this.collectAttrItem.bind(this));
        this.infoScroller2.SetHandle(this.collectAttrItem.bind(this));
        this.workScroller.SetHandle(this.updateWorkerItem.bind(this));
        this.workScroller.node.on("select", this.onSelectWorker, this);
        this.node.getChildByName("btn").on(Input.EventType.TOUCH_END, this.onTouch, this);

        EventMgr.on(Evt_FlushWorker, this.flush, this);
    }

    Show(buildingId: number,) {
        this.node.active = true;
        this.buildingId = buildingId;

        this.flush();
    }
    Hide() {
        if (this.workScroller) this.workScroller.Clean();
        this.node.active = false;
    }

    /**
     * 更新等级状态
     * @returns 
     */
    private flush(buildingId?: number) {
        if (buildingId && buildingId != this.buildingId) return;

        let attrTypeList: number[] = [];
        let attrValueList: number[] = [];
        let totalAttrs: AttrSub[] = [];
        let attrSub: AttrSub;

        this.stdDefBuild = CfgMgr.GetBuildingUnLock(this.buildingId);
        this.getColletcTime();
        if (this.buildTypeAttrInfo[this.stdDefBuild.BuildingType]) {
            this.buildTypeAttr = FormatAttr(this.buildTypeAttrInfo[this.stdDefBuild.BuildingType], false);
            this.buildTypeAttr.icon = path.join(folder_item, this.attrIconInfo[this.buildTypeAttr.id], "spriteFrame");
        }
        let jiDiBuildData: SPlayerDataBuilding = PlayerData.GetBuilding(this.stdDefBuild.MainBase, this.stdDefBuild.HomeId);
        let stdJiDiBuild: StdBuilding;
        //家园属性
        if (jiDiBuildData) {
            stdJiDiBuild = CfgMgr.GetBuildingLv(this.stdDefBuild.MainBase, jiDiBuildData.level);
            attrTypeList = attrTypeList.concat(stdJiDiBuild.Attr);
            attrValueList = attrValueList.concat(stdJiDiBuild.AttrValue);
        }
        let info = PlayerData.GetBuilding(this.buildingId);
        let std = CfgMgr.GetBuildingLv(this.buildingId, info.level);
        //建筑属性
        if (std) {
            attrTypeList = attrTypeList.concat(std.Attr);
            attrValueList = attrValueList.concat(std.AttrValue);
        }
        for (let index = 0; index < attrTypeList.length; index++) {
            attrSub = FormatAttr(attrTypeList[index], false);
            attrSub.value = attrValueList[index];
            totalAttrs.push(attrSub);
        }
        //基础采集属性需要有工人才激活
        this.attrIsActivate = info && info.workerIdArr && info.workerIdArr.length > 0;
        //工人属性
        for (let index = 0; index < info.workerIdArr.length; index++) {
            let roleData: SPlayerDataRole = info.workerIdArr[index];
            totalAttrs = totalAttrs.concat(FormatRoleAttr(roleData));
        }
        let wide = this.node.getChildByPath("infoBar/frame").getComponent(UITransform).contentSize.width
        let folder = BuildingType[this.stdDefBuild.BuildingType];
        let url = path.join("home/buildings", folder, std.Prefab, "spriteFrame");
        let icon = this.node.getChildByPath("infoBar/icon").getComponent(Sprite);
        // ResMgr.LoadResAbSub(url, SpriteFrame, res => {
        //     icon.spriteFrame = res;
        //     let iconSize = icon.node.getComponent(UITransform).contentSize;
        //     let scale = minn(wide / iconSize.width, wide / iconSize.height);
        //     icon.node.setScale(scale, scale, 1);
        // });

        ResMgr.LoadResAbSub(this.buildTypeAttr.icon, SpriteFrame, res => {
            icon.spriteFrame = res;
            // let iconSize = icon.node.getComponent(UITransform).contentSize;
            // let scale = minn(wide / iconSize.width, wide / iconSize.height);
            // icon.node.setScale(scale, scale, 1);
        });
        let addRote = std.CollectEfficiencyPct || 0;
        let srdAttrs: number[] = CfgMgr.GetCommon(StdCommonType.Home).ShowAttr;

        let workerAttrs: AttrSub[] = [];
        let totalCollectValue: number = 0;//总采集属性
        for (let index = 0; index < totalAttrs.length; index++) {
            attrSub = totalAttrs[index];
            for (let k = 0; k < srdAttrs.length; k++) {
                let attrId: number = srdAttrs[k];
                if (attrId == attrSub.id && attrSub.value > 0) {
                    attrSub.icon = path.join(folder_item, this.attrIconInfo[attrId], "spriteFrame")
                    attrSub.value = attrId != Attr.CollectEfficiency ? attrSub.value + attrSub.value * addRote : attrSub.value;
                    workerAttrs.push(attrSub);
                    if (this.attrIsActivate) {
                        if (attrSub.id == Attr.CollectEfficiency || (this.buildTypeAttr && attrSub.id == this.buildTypeAttr.id)) {
                            totalCollectValue += attrSub.value;
                        }
                    }


                }
            }
        }
        let collectRate: number = CfgMgr.GetCommon(StdCommonType.Gather).GatherScale;
        let workerRate: number = totalCollectValue;//totalCollectValue * collectRate;//工作效率
        if (this.buildTypeAttrInfo) {
            this.rateCont.active = true;
            ResMgr.LoadResAbSub(this.buildTypeAttr.icon, SpriteFrame, res => {
                this.rateIcon.spriteFrame = res;
            });
            if (this.canCollect) {
                this.titleLab.active = true;
                this.rateValLab.string = `${formatNumber(workerRate, 2)}/5s`;
            } else {
                this.titleLab.active = false;
                this.rateValLab.string = `采集时长不足`;
            }
        } else {
            this.rateCont.active = false;
        }
        workerAttrs = MergeAttrSub(workerAttrs);
        if (workerAttrs.length == 1) {
            this.infoScroller.node.parent.getChildByName(`bg2`).active = false;
            this.infoScroller.node.active = false;
            this.infoScroller2.node.active = true;
            this.infoScroller2.UpdateDatas(workerAttrs);
        } else {
            this.infoScroller.node.active = true;
            this.infoScroller2.node.active = false;
            if (workerAttrs.length == 2) {
                this.infoScroller.node.active = false;
                this.infoScroller2.node.active = true;
                this.infoScroller2.UpdateDatas(workerAttrs);
            } else {
                this.infoScroller.UpdateDatas(workerAttrs);
            }
            this.infoScroller.node.parent.getChildByName(`bg2`).active = true;
        }

        let max = CfgMgr.GetMaxWorkerNum(this.buildingId);
        let len = std.WorkingRolesNum;
        this.value.string = info.workerIdArr.length + "/" + len;
        let datas = [];
        for (let i = 0; i < max.length; i++) {
            let role = info.workerIdArr[i];
            let data = {
                lock: len <= i ? max[i] + "级解锁" : undefined,
                info: role
            }
            datas.push(data);
        }
        this.workScroller.UpdateDatas(datas);
    }
    /**
     * 更新建筑属性
     * @param item 
     * @param data 
     */
    private collectAttrItem(item: Node, data: AttrSub) {
        let icon = item.getChildByName("icon").getComponent(Sprite);
        let name = item.getChildByName("name").getComponent(Label);
        let value = item.getChildByName("value").getComponent(Label);
        if (data.icon) {
            icon.node.active = true;
            ResMgr.LoadResAbSub(data.icon, SpriteFrame, res => {
                icon.spriteFrame = res;
            });
        } else {
            icon.node.active = false;
        }
        name.string = data.name;
        let valColor: string;
        if (this.attrIsActivate) {
            if (data.id == Attr.CollectEfficiency) {
                valColor = "#0FC921";
            } else {
                if (this.buildTypeAttr && this.buildTypeAttr.id == data.id) {
                    valColor = "#0FC921";
                } else {
                    valColor = "4D4C4C";
                }
            }
        } else {
            valColor = "4D4C4C";
        }
        icon.node.setScale(0.7, 0.7, 1);
        if (!data.icon.includes(`/attr/`)) {
            icon.color = Color.WHITE;
            icon.node.setScale(0.5, 0.5, 1);
        }

        value.color = new Color().fromHEX(valColor);
        value.string = `+${formatNumber(data.value, 2) + data.per}`;
    }
    private async updateWorkerItem(item: Node, data: { lock: string, info: SPlayerDataRole }) {
        let icon = item.getChildByPath("mask/icon").getComponent(Sprite);
        let lock = item.getChildByName("lock");
        let add = item.getChildByName("add");
        let name = item.getChildByName("name").getComponent(Label);
        let value = find(`lbl_bg/num`, item).getComponent(Label);
        let resIcon = find(`lbl_bg/icon`, item).getComponent(Sprite);

        value.string = ``;
        icon.node.active = false;
        add.active = false;
        lock.active = false;
        if (!data) return;
        if (data.lock) {
            lock.active = true;
            name.string = data.lock;
            item.getChildByName(`lbl_bg`).active = false;
        } else if (!data.info) {
            add.active = true;
            name.string = "派遣工人";
            item.getChildByName(`lbl_bg`).active = false;
        } else {
            let std = CfgMgr.GetRole()[data.info.type];
            let url = path.join(folder_head_round, std.Icon, "spriteFrame");
            console.log(`std:`, std)
            icon.spriteFrame = await ResMgr.LoadResAbSub(url, SpriteFrame);
            icon.node.active = true;
            name.string = std.Name;
            item.getChildByName(`lbl_bg`).active = false;

            const ls: number[] = CfgMgr.GetCommon(StdCommonType.Home).ShowAttr;
            let spr = ["quanneng", "mucai", "shui", "shitou", "zhongzi"]
            let i = 0
            for (let id of ls) {
                let v = GetAttrValueByIndex(data.info, id);
                console.log(v, id)
                if (v != 0) {
                    ResMgr.LoadResAbSub(path.join(folder_item, spr[i], "spriteFrame"), SpriteFrame, res => {
                        resIcon.spriteFrame = res;
                    });
                    value.string = `+${formatNumber(v, 2)}`
                    item.getChildByName(`lbl_bg`).active = true;
                }
                i++;
            }
        }
    }

    private onSelectWorker(index: number, item: Node) {
        let info = PlayerData.GetBuilding(this.buildingId);
        let role = info.workerIdArr[index];
        if (role) {
            let sendData = {
                type: MsgTypeSend.BuildingRemoveRole,
                data: {
                    building_id: this.buildingId,
                    role_id: role.id
                }
            }
            Session.Send(sendData);
        } else {
            let std = CfgMgr.GetBuildingLv(this.buildingId, info.level);
            let len = std.WorkingRolesNum;
            if (index < len) {
                let roles = [];
                let ls = PlayerData.GetRoles();
                for (let role of ls) {
                    if (!role.building_id) roles.push(role);
                }
                console.log(roles)
                roles.sort(this.workerAttrSort.bind(this));
                SelectHeroPanel.SelectWork(roles, info.workerIdArr, 1, this.fileWorkers.bind(this));
            }
        }
    }
    private workerAttrSort(a: SPlayerDataRole, b: SPlayerDataRole): number {
        let attrA: AttrSub[] = FormatRoleAttr(a);
        let attrB: AttrSub[] = FormatRoleAttr(b);
        let attrValA: number = 0;
        let attrValB: number = 0;
        for (let index = 0; index < attrA.length; index++) {
            let attr = attrA[index];
            if (!attr) continue
            if (attr.id == this.buildTypeAttr.id) {
                attrValA = attr.value;
                break;
            }
        }
        for (let index = 0; index < attrB.length; index++) {
            let attr = attrB[index];
            if (!attr) continue
            if (attr.id == this.buildTypeAttr.id) {
                attrValB = attr.value;
                break;
            }
        }
        if (attrA == attrB) {
            let stdA: StdRole = CfgMgr.GetRole()[a.type];
            let stdB: StdRole = CfgMgr.GetRole()[b.type];
            return stdB.RoleType - stdA.RoleType;
        }
        return attrValB - attrValA;
    }
    private fileWorkers(selects: SPlayerDataRole[]) {
        let info = PlayerData.GetBuilding(this.buildingId);
        let results = info.workerIdArr.concat();
        for (let i = results.length - 1; i >= 0; i--) {
            let select = results[i];
            if (selects.indexOf(select) > -1) {
                results.splice(i, 1);
                let sendData = {
                    type: MsgTypeSend.BuildingRemoveRole,
                    data: {
                        building_id: this.buildingId,
                        role_id: select.id
                    }
                }
                Session.Send(sendData);
            }
        }
        for (let select of selects) {
            if (results.indexOf(select) == -1) {
                let sendData = {
                    type: MsgTypeSend.BuildingAssignRole,
                    data: {
                        building_id: this.buildingId,
                        role_id: select.id
                    }
                }
                Session.Send(sendData);
            }
        }
    }

    private onTouch() {
        AudioMgr.PlayOnce(Audio_CommonWork);
        let info = PlayerData.GetBuilding(this.buildingId);
        let std = CfgMgr.GetBuildingLv(this.buildingId, info.level);
        let stdDefine = CfgMgr.GetBuildingUnLock(this.buildingId);
        let len = std.WorkingRolesNum;
        let frees: SPlayerDataRole[] = [], roles = PlayerData.GetRoles();
        let noBestList:SPlayerDataRole[] = [];//非最优解
        for (let role of roles) {
            let Attrs = FormatRoleAttr(role)
            if (!role.building_id) {
                let isCheck:boolean = false;
                Attrs.forEach((Attr) => {
                    if (Attr.id == this.buildTypeAttr.id) {
                        frees.push(role);
                        isCheck = true;
                    }
                });
                if(!isCheck){
                    noBestList.push(role);
                }
            }
        }
        if(roles.length < 1){
            Tips.Show("英雄不足，无法全部派遣工作");
            return;
        }
        frees.sort(this.workerAttrSort.bind(this));
        
        let getNum = (role: SPlayerDataRole) => {
            let Attrs = FormatRoleAttr(role)
            for (let index = 0; index < Attrs.length; index++) {
                const Attr = Attrs[index];
                if (!Attr) continue
                if (Attr.id == this.buildTypeAttr.id) {
                    return Attr.value
                }
            }
            return 0;

        }
        let isChange = false;
        for (let i = 0; i < len; i++) {//替换已有的
            const role = frees[i];
            if (role) {
                for (let index = 0; index < info.workerIdArr.length; index++) {
                    const curRole = info.workerIdArr[index];
                    let num = getNum(role);
                    let curNum = getNum(curRole)
                    if (num > curNum && role.id != curRole.id) {
                        let sendData = {
                            type: MsgTypeSend.BuildingRemoveRole,
                            data: {
                                building_id: this.buildingId,
                                role_id: curRole.id
                            }
                        }
                        Session.Send(sendData);
                        sendData = {
                            type: MsgTypeSend.BuildingAssignRole,
                            data: {
                                building_id: this.buildingId,
                                role_id: role.id
                            }
                        }
                        Session.Send(sendData);
                        frees.unshift();
                        isChange = true;
                    }
                }
            }
        }
        let noBestIndex:number = 0;
        for (let i = 0; i < len - info.workerIdArr.length; i++) {//填空
            isChange = true;
            let role = frees[i];
            if(!role){
                if(noBestIndex < noBestList.length){
                    role = noBestList[noBestIndex];
                    noBestIndex++;
                }
                
            }
            if (role) {
                let sendData = {
                    type: MsgTypeSend.BuildingAssignRole,
                    data: {
                        building_id: this.buildingId,
                        role_id: role.id
                    }
                }
                Session.Send(sendData);
            }
        }
        if (!isChange) {
            Tips.Show(`目前已是最佳指派方案`);
        }
    }

    private getColletcTime() {
        if (PlayerData.nowhomeLand) {
            this.colletcTime = 0;
            switch (this.stdDefBuild.BuildingType) {
                case BuildingType.cai_mu:
                    this.colletcTime = PlayerData.nowhomeLand.total_wood_collect_duration;
                    break;
                case BuildingType.cai_kuang:
                    this.colletcTime = PlayerData.nowhomeLand.total_rock_collect_duration;
                    break;
                case BuildingType.cai_shui:
                    this.colletcTime = PlayerData.nowhomeLand.total_water_collect_duration;
                    break;
                case BuildingType.hua_fang:
                    this.colletcTime = PlayerData.nowhomeLand.total_seed_collect_duration;
                    break;
                default:
                    break;
            }
            this.colletcTime = PlayerData.nowhomeLand.total_wood_collect_duration + PlayerData.GetServerTime();

            this.canCollect = this.colletcTime > 0;
        }
    }
}
