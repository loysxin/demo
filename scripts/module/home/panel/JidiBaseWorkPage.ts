import { _decorator, Color, Component, find, Input, js, Label, Node, path, Sprite, SpriteFrame, UITransform } from 'cc';
import { AutoScroller } from '../../../utils/AutoScroller';
import { Attr, CfgMgr, StdBuilding, StdCommonType, StdDefineBuilding, StdRole } from '../../../manager/CfgMgr';
import { folder_head_round, folder_icon, folder_item, ResMgr } from '../../../manager/ResMgr';
import PlayerData, { SBattleRole, SPlayerDataBuilding, SPlayerDataRole } from '../../roleModule/PlayerData';
import { Evt_Building_Upgrade, Evt_Building_Upgrade_Complete, EventMgr, Evt_Item_Change, Evt_FlushWorker, Evt_FlushJiDiReward } from '../../../manager/EventMgr';
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
export class JidiBaseWorkPage extends Component {
    private value: Label;
    private rateCont: Node;
    private rateIcon: Sprite;
    private rateValLab: Label;
    private titleLab: Node;
    private btn: Node;
    private get_btn: Node;
 
    private workScroller: AutoScroller;
    private buildingId: number;
    private canCollect: boolean;
    protected onLoad(): void {
        this.rateCont = this.node.getChildByName("rateCont");
        this.rateIcon = this.node.getChildByPath("rateCont/icon").getComponent(Sprite);
        this.rateValLab = this.node.getChildByPath("rateCont/valueLab").getComponent(Label);
        this.titleLab = this.node.getChildByPath("rateCont/titleLab");
        this.value = this.node.getChildByPath("workerCount/count/value").getComponent(Label);

        this.workScroller = this.node.getChildByPath("workLayout/ScrollView").getComponent(AutoScroller);
        this.workScroller.SetHandle(this.updateWorkerItem.bind(this));
        this.workScroller.node.on("select", this.onSelectWorker, this);

        this.btn = this.node.getChildByPath("btnNode/btn");
        this.btn.on(Input.EventType.TOUCH_END, this.onTouch, this);

        this.get_btn = this.node.getChildByPath("btnNode/get_btn");
        this.get_btn.on(Input.EventType.TOUCH_END, this.getReward, this);

        EventMgr.on(Evt_FlushWorker, this.flush, this);
        EventMgr.on(Evt_FlushJiDiReward, this.updateReward, this);
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

        let workerRate: number = 0;//工作效率
        this.updateReward();
    
        let info = PlayerData.GetBuilding(this.buildingId);
        let std = CfgMgr.GetBuildingLv(this.buildingId, info.level);
        //工人属性
        for (let index = 0; index < info.workerIdArr.length; index++) {
            let roleData: SPlayerDataRole = info.workerIdArr[index];
            let cfg = CfgMgr.GetProduceCasting(roleData.type, roleData.quality)
            workerRate = workerRate + cfg.produce_casting;
        }
        
        this.rateCont.active = true;
        ResMgr.LoadResAbSub(path.join(folder_item, "qianghuashi", "spriteFrame"), SpriteFrame, res => {
            this.rateIcon.spriteFrame = res
        });
        
        this.titleLab.active = true;
        this.rateValLab.string = `${formatNumber(workerRate, 2)}/8h`;

        let max = CfgMgr.GetMaxWorkerNum(this.buildingId);
        let len = std.WorkingRolesNum;
        this.value.string = info.workerIdArr.length + "/" + len;

        info.workerIdArr.sort(this.workerAttrSort.bind(this))
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
            icon.spriteFrame = await ResMgr.LoadResAbSub(url, SpriteFrame);
            icon.node.active = true;
            name.string = std.Name;
            item.getChildByName(`lbl_bg`).active = false;

            let cfg = CfgMgr.GetProduceCasting(data.info.type, data.info.quality)
            let v: number = -1
            if(cfg){
                v = cfg.produce_casting
            }
            if (v >= 0) {
                ResMgr.LoadResAbSub(path.join(folder_item, "qianghuashi", "spriteFrame"), SpriteFrame, res => {
                    resIcon.spriteFrame = res;
                });
                value.string = `+${formatNumber(v, 2)}`
                item.getChildByName(`lbl_bg`).active = true;
            }     
        }
    }

    private onSelectWorker(index: number, item: Node) {
        let info = PlayerData.GetBuilding(this.buildingId);
        info.workerIdArr.sort(this.workerAttrSort.bind(this))
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
                if(ls.length < 1){
                    Tips.Show("英雄不足，无法派遣工作");
                    return;
                }
                let results = info.workerIdArr
               
                for (let role of ls) {
                    let is_has = true;      
                    if(results.indexOf(role) == -1){
                        is_has = false;
                    }
                    // for (let index = 0; index < results.length; index++) {
                    //     const element = results[index];
                    //     if(role.type == element.type){
                    //         // console.log(role.type, element.type)
                    //         is_has = true;
                    //         break
                    //     }        
                    // }
                    if(!is_has){
                        roles.push(role);
                    }
                }              
                roles.sort(this.workerAttrSort.bind(this));
                SelectHeroPanel.SelectWork(roles, info.workerIdArr, 1, this.fileWorkers.bind(this), true);
            }
        }
    }
    private workerAttrSort(a: SPlayerDataRole, b: SPlayerDataRole): number {
        let a_cfg = CfgMgr.GetProduceCasting(a.type, a.quality);
        let b_cfg = CfgMgr.GetProduceCasting(b.type, b.quality);
        if (a_cfg && b_cfg) {
            if(b_cfg.produce_casting == a_cfg.produce_casting){
                return a.type - b.type;
            }
            return b_cfg.produce_casting - a_cfg.produce_casting;
        }
    }
    private fileWorkers(selects: SPlayerDataRole[]) {
        //每个类型的角色只能上一个相同类型的需要替换掉
        let info = PlayerData.GetBuilding(this.buildingId);
        let results = info.workerIdArr.concat();
        for (let select of selects) {
            for (let index = 0; index < results.length; index++) {
                const element = results[index];          
                if(select.type == element.type){
                    let sendData = {
                        type: MsgTypeSend.BuildingRemoveRole,
                        data: {
                            building_id: this.buildingId,
                            role_id: element.id
                        }
                    }
                    Session.Send(sendData);
                }
            }
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
        let len = std.WorkingRolesNum;
        if(len == 0){
            Tips.Show("等级不足，无法派遣工作");
            return;
        }
        let roles = PlayerData.GetRoles();

        if(roles.length < 1){
            Tips.Show("英雄不足，无法全部派遣工作");
            return;
        }
        roles.sort(this.workerAttrSort.bind(this));

        let sort_roles = [];
        for (const iterator of roles) {
            // console.log(CfgMgr.GetProduceCasting(iterator.type, iterator.quality))
            if(sort_roles.length <= 0){
                sort_roles.push(iterator)
            }else{
                let is_jump = false;
                for (let index = 0; index < sort_roles.length; index++) {
                    const element = sort_roles[index];
                    if(iterator.type == element.type){
                        is_jump = true;                      
                        break;
                    }
                }
                if(!is_jump){
                    sort_roles.push(iterator)
                }
            }
            if(sort_roles.length >= len){
                break;
            }
        }

        let results = info.workerIdArr.concat();
        let isChange = false;
        for (let index = 0; index < len; index++) {      
            if(results.indexOf(sort_roles[index]) == -1){
                isChange = true;
            }
        }
        if (!isChange) {
            Tips.Show(`目前已是最佳指派方案`);
            return;
        }

        for (let index = 0; index < info.workerIdArr.length; index++) {
            const curRole = info.workerIdArr[index];
            let sendData = {
                type: MsgTypeSend.BuildingRemoveRole,
                data: {
                    building_id: this.buildingId,
                    role_id: curRole.id
                }
            }
            Session.Send(sendData);
        }

        for (let i = 0; i < len; i++) {
            let role = sort_roles[i]
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

    private getColletcTime() {
        let stone_data = PlayerData.roleInfo.fusion_stone_data;
        if (stone_data &&  stone_data.amount) {
             let ids = Object.keys(PlayerData.roleInfo.fusion_stone_data.amount);
            this.canCollect =   ids.length > 0 && PlayerData.roleInfo.fusion_stone_data.amount[BuildingType.ji_di] > 0
        }
    }
    private updateReward(){
        this.getColletcTime();
        this.get_btn.active = this.canCollect;
    }

    /**领取奖励 */
    private getReward(){  
        let sendData = {
            type: MsgTypeSend.CollectFusionStonesRequest,
            data: {
                building_id: this.buildingId,
            }
        }
        Session.Send(sendData);
    }
}
