import { _decorator, Component, find, Input, Label, Node, path, Sprite, SpriteFrame, UITransform } from 'cc';
import { AutoScroller } from '../../../utils/AutoScroller';
import { Attr, AttrFight, CfgMgr } from '../../../manager/CfgMgr';
import { folder_head_round, folder_icon, ResMgr } from '../../../manager/ResMgr';
import PlayerData, { SBattleRole, SPlayerDataRole } from '../../roleModule/PlayerData';
import { Evt_Building_Upgrade, Evt_Building_Upgrade_Complete, EventMgr, Evt_Item_Change, Evt_FlushWorker } from '../../../manager/EventMgr';
import { formatK, formatNumber, formatTime, minn } from '../../../utils/Utils';
import { Session } from '../../../net/Session';
import { Tips } from '../../login/Tips';
import { MsgTypeSend } from '../../../MsgType';
import { AttrSub, FormatAttr, GetAttrValue, UpdateBuildingAttr, GetFightAttrValue, GetAttrValueByIndex } from '../../common/BaseUI';
import { BuildingType } from '../HomeStruct';
import { SelectHeroPanel } from '../../common/SelectHeroPanel';
import { Soldier } from '../../../battle/BattleLogic/logic/actor/Soldier';
const { ccclass, disallowMultiple, property } = _decorator;

@ccclass('DefensePage')
@disallowMultiple(true)
export class DefensePage extends Component {

    private value: Label;
    private infoScroller: AutoScroller;
    private fightScroller: AutoScroller;
    private buildingId: number;

    protected onLoad(): void {
        this.value = this.node.getChildByPath("workerCount/count/value").getComponent(Label);
        this.infoScroller = this.node.getChildByPath("infoBar/layout").getComponent(AutoScroller);
        this.fightScroller = this.node.getChildByPath("fightLayout/ScrollView").getComponent(AutoScroller);

        this.infoScroller.SetHandle(UpdateBuildingAttr.bind(this));
        this.fightScroller.SetHandle(this.updateFightItem.bind(this));
        this.fightScroller.node.on("select", this.onSelectDefence, this);
        this.node.getChildByName("btn").on(Input.EventType.TOUCH_END, this.onTouch, this);

        EventMgr.on(Evt_FlushWorker, this.flush, this);
    }

    Show(buildingId: number) {
        this.node.active = true;
        this.buildingId = buildingId;

        this.flush();
    }
    Hide() {
        this.node.active = false;
    }

    /**
     * 更新等级状态
     * @returns 
     */
    private flush(buildingId?: number) {
        if (buildingId && buildingId != this.buildingId) return;

        let stdDefine = CfgMgr.GetBuildingUnLock(this.buildingId);
        let info = PlayerData.GetBuilding(this.buildingId);
        let stdlv = CfgMgr.GetBuildingLv(this.buildingId, info.level);
        if (!stdlv) return;
        let wide = this.node.getChildByPath("infoBar/frame").getComponent(UITransform).contentSize.width
        let folder = BuildingType[stdDefine.BuildingType];
        let url = path.join("home/buildings", folder, stdlv.Prefab, "spriteFrame");
        let icon = this.node.getChildByPath("infoBar/icon").getComponent(Sprite);
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            icon.spriteFrame = res;
            let iconSize = icon.node.getComponent(UITransform).contentSize;
            let scale = minn(wide / iconSize.width, wide / iconSize.height);
            icon.node.setScale(scale, scale, 1);
        });

        let datas1: AttrSub[] = [];
        //解析建筑的基础属性和战斗属性
        if (stdlv.AttrFight.length) {
            let types = stdlv.AttrFight;
            let values = stdlv.AttrFightValue;
            for (let i = 0; i < types.length; i++) {
                let data = FormatAttr(types[i], true);
                data.value = values[i];
                datas1.push(data);
            }
        }
        this.infoScroller.UpdateDatas(datas1);

        let max = CfgMgr.GetMaxDefenseNum(this.buildingId);
        let len = stdlv.DefenseRolesNum;

        let ls = PlayerData.roleInfo.defense_lineup || [];
        this.value.string = ls.length + "/" + len;
        let datas2 = [];
        for (let i = 0; i < max.length; i++) {
            let battle = ls[i];
            let role = battle ? PlayerData.GetRoleById(battle.role_id) : undefined;
            let data = {
                lock: len <= i ? max[i] + "级解锁" : undefined,
                info: role
            }
            datas2.push(data);
        }
        this.fightScroller.UpdateDatas(datas2);
    }

    private async updateFightItem(item: Node, data: { lock: string, info: SPlayerDataRole }) {
        let lock = item.getChildByName("lock");
        let add = item.getChildByName("add");
        let unlock = item.getChildByName("unlock");
        let icon = item.getChildByPath("unlock/mask/icon").getComponent(Sprite);
        let frame = item.getChildByPath("unlock/frame").getComponent(Sprite);
        let type = item.getChildByPath("unlock/type").getComponent(Sprite);
        let level = item.getChildByPath("unlock/level").getComponent(Label);
        let power = item.getChildByPath("unlock/power");
        let name = item.getChildByName("name").getComponent(Label);

        icon.node.active = false;
        type.node.active = false;
        add.active = false;
        lock.active = false;
        if (data.lock) {
            unlock.active = false;
            lock.active = true;
            name.string = data.lock;
        } else if (!data.info) {
            unlock.active = true;
            add.active = true;
            level.node.active = false;
            frame.node.active = false;
            power.active = false;
            name.string = "驻守英雄";
        } else {
            let std = CfgMgr.GetRole()[data.info.type];
            let url = path.join(folder_head_round, std.Icon, "spriteFrame");
            icon.node.active = true;
            icon.spriteFrame = await ResMgr.LoadResAbSub(url, SpriteFrame);
            let stdquality = CfgMgr.GetRoleQuality(data.info.type, data.info.quality);
            type.node.active = true;
            type.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "pos" + std.PositionType, "spriteFrame"), SpriteFrame);
            level.node.active = true;
            level.string = "lv" + data.info.level;
            frame.node.active = true;
            frame.spriteFrame = await ResMgr.LoadResAbSub(path.join("sheets/battleUI/quality_" + (data.info.quality || 1), "spriteFrame"), SpriteFrame);
            power.active = true;
            name.string = data.info.battle_power > 10000 ? formatNumber(data.info.battle_power, 2) : `${data.info.battle_power}`;
        }
    }

    private onSelectDefence(index: number, item: Node) {
        let ls = (PlayerData.roleInfo.defense_lineup || []).concat();
        let info = ls[index];
        if (info) {
            ls.splice(index, 1);
            this.DistributeSoldiersToHeros(ls);
            let sendData = {
                type: MsgTypeSend.SetDefenseRoles,
                data: {
                    lineup: ls
                }
            }
            Session.Send(sendData);
        } else {
            let info = PlayerData.GetBuilding(this.buildingId);
            let std = CfgMgr.GetBuildingLv(this.buildingId, info.level);
            let len = std.DefenseRolesNum;
            if (index < len) {
                let roles = PlayerData.GetRoles();
                for (let battle of ls) {
                    if (battle) {
                        let role = PlayerData.GetRoleById(battle.role_id);
                        let idx = roles.indexOf(role);
                        if (idx != -1) roles.splice(idx, 1);
                    }
                }
                SelectHeroPanel.SelectDefense(roles, [], 1, selects => {
                    let select: SPlayerDataRole = selects[0];
                    if (!select || ls[index]) return;
                    ls[index] = { role_id: select.id, soldiers: undefined };
                    this.DistributeSoldiersToHeros(ls);
                    let sendData = {
                        type: MsgTypeSend.SetDefenseRoles,
                        data: {
                            lineup: ls
                        }
                    }
                    Session.Send(sendData);
                });
            }
        }
    }

    /**
     * 一键上阵
     */
    private onTouch() {
        let info = PlayerData.GetBuilding(this.buildingId);
        let std = CfgMgr.GetBuildingLv(this.buildingId, info.level);
        let len = std.DefenseRolesNum;
        let roles = PlayerData.GetRoles();
        let stds = CfgMgr.GetRole();
        let row1: SPlayerDataRole[] = [];
        let row2: SPlayerDataRole[] = [];
        for (let role of roles) {
            if (stds[role.type].PositionType == 1) {
                row1.push(role);
            } else {
                row2.push(role);
            }
        }
        row1.sort((a, b) => { return b.level - a.level; });
        row2.sort((a, b) => { return b.level - a.level; });
        if (row1.length > 2) row1.length = 2;
        if (row2.length > 3) row2.length = 3;
        let results = row1.concat(row2);
        if (results.length > len) results.length = len;
        let battles = [];
        for (let i = 0; i < results.length; i++) {
            let battle: SBattleRole = {
                role_id: results[i].id,
                soldiers: undefined
            }
            battles[i] = battle;
        }
        this.DistributeSoldiersToHeros(battles);
        let sendData = {
            type: MsgTypeSend.SetDefenseRoles,
            data: {
                lineup: battles
            }
        }
        Session.Send(sendData);
    }

    /**
     * 分配小兵
     */
    private DistributeSoldiersToHeros(battles: SBattleRole[]) {
        let playerSoliders = JSON.parse(JSON.stringify(PlayerData.roleInfo.soldiers));

        for (let battle of battles) {
            let hero = PlayerData.GetRoleById(battle.role_id);
            if (hero) {
                let roleType = CfgMgr.GetRole()[hero.type];
                if (battle.soldiers == undefined) battle.soldiers = [];

                if (false) //todo 取消自动填充
                {
                    continue;
                }

                let tmpData = playerSoliders.filter(soldier => roleType.FollowerType.indexOf(soldier.id) != -1);
                tmpData.sort((a, b) => { return b.id - a.id });
                let max = GetAttrValueByIndex(hero, Attr.LeaderShip);
                for (let i = 0; i < tmpData.length; i++) {
                    if (tmpData[i].count <= 0)
                        continue;

                    let count = tmpData[i].count > max ? max : tmpData[i].count;
                    max -= count;
                    tmpData[i].count -= count;
                    let solider =
                    {
                        id: tmpData[i].id,
                        count: count,
                    }

                    battle.soldiers.push(solider);
                    if (max <= 0)
                        break;
                }
            }
        }


    }
}
