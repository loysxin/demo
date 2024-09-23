import { Button, Input, Label, Node, Size, Toggle, UITransform, Vec3 } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { Card, CardType } from "../home/panel/Card";
import PlayerData, { SBattleRole, SPlayerDataRole } from "../roleModule/PlayerData";
import { CfgMgr, StdRole } from "../../manager/CfgMgr";
import { EventMgr, Evt_FlushWorker, Evt_Hide_Scene, Evt_Role_Del, Evt_Role_Update, Evt_Role_Upgrade, Evt_Show_Scene } from "../../manager/EventMgr";
import { RoleInfoPanel } from "./RoleInfoPanel";
import { ClickTipsPanel } from "../common/ClickTipsPanel";
enum RoleListSotrType{
    Def,//默认排序
    Level,//等级排序
    Quality,//品质排序
    Job,//职业排序
    Power,//战力排序
}
export class RolePanel extends Panel {
    protected prefab: string = "prefabs/panel/role/RolePanel";
    private worker: Label;
    private downBtnCont: Node;
    private downBtnArrow: Node;
    private downBtnTitle: Label;
    private scroller: AutoScroller;
    private noneListCont:Node;
    private datas: SPlayerDataRole[];
    private sotrType:number;
    protected onLoad() {
        this.worker = this.find('worker/Label', Label);
        this.downBtnCont = this.find("downBtnCont");
        let defBtn = this.find("downBtnCont/defBtn");
        let levelBtn = this.find("downBtnCont/levelBtn");
        let qualBtn = this.find("downBtnCont/qualBtn");
        let jobBtn = this.find("downBtnCont/jobBtn");
        let fightBtn = this.find("downBtnCont/fightBtn");
        let downBtn = this.find("downBtn");
        this.downBtnTitle = this.find("downBtn/downBtnTitle", Label);
        this.downBtnArrow = this.find("downBtn/downBtnArrow");
        this.noneListCont = this.find("noneListCont");
        this.scroller = this.find("ScrollView", AutoScroller);
        this.scroller.SetHandle(this.updateItem.bind(this));
        this.scroller.node.on('select', this.onSelect, this);
        this.CloseBy("backBtn");
        defBtn.on(Button.EventType.CLICK, this.onBtnClick, this);
        downBtn.on(Button.EventType.CLICK, this.onBtnClick, this);
        levelBtn.on(Button.EventType.CLICK, this.onBtnClick, this);
        qualBtn.on(Button.EventType.CLICK, this.onBtnClick, this);
        jobBtn.on(Button.EventType.CLICK, this.onBtnClick, this);
        fightBtn.on(Button.EventType.CLICK, this.onBtnClick, this);
        EventMgr.on(Evt_Role_Upgrade, this.onUpgrade, this);
        EventMgr.on(Evt_FlushWorker, this.onFlushWorker, this);
        EventMgr.on(Evt_Role_Del, this.onDelRole, this);
        EventMgr.on(Evt_Role_Update, this.onRoleUpdate, this);
    }
    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
        //this.flush();
    }
    public flush(...args: any[]): void {
        this.downBtnArrow.angle = 0;
        // this.datas = [];
        // for (let role of PlayerData.GetRoles()) {
        //     if (!role.building_id) this.datas.push(role);
        // }
        this.updateShow();
    }
    private updateShow(sotr:number = 0):void{
        this.roleDataSotr(sotr);
        this.updateWorker();
    }
    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }

    private onUpgrade():void{
        this.updateShow(this.sotrType);
    }
    private onFlushWorker(): void {
        if(!this.node.activeInHierarchy) return;
        this.updateWorker();
    }
    private onDelRole():void{
        if(!this.node.activeInHierarchy) return;
        this.updateShow(this.sotrType);
    }
    private onRoleUpdate():void{
        if(!this.node.activeInHierarchy) return;
        this.updateShow(this.sotrType);
    }
    //更人刷新
    private updateWorker(): void {
        // let roles = PlayerData.GetRoles();
        /* let count = 0;
        for (let index = 0; index < roles.length; index++) {
            let role = roles[index];
            if (role.building_id > 0) {
                count += 1;
            }
        } */
        this.worker.string = `${PlayerData.GetRoleNum()}`;
    }
    onBtnClick(event: Button) {
        let name = event.node.name;
        switch (name) {
            case 'downBtn':
                let btnNode:Node = event.node;
                let btnSize:Size = btnNode.getComponent(UITransform).contentSize;
                let showPos:Vec3 = btnNode.worldPosition.clone();
                showPos.y = showPos.y - btnSize.height / 2 - this.downBtnCont.getComponent(UITransform).height / 2 + 6;
                this.downBtnArrow.angle = 180;
                ClickTipsPanel.Show(this.downBtnCont, this.node, btnNode, showPos, 0, ()=>{
                    this.downBtnArrow.angle = 0;
                });
                break;
            case 'levelBtn':
                this.roleDataSotr(RoleListSotrType.Level);
                break;
            case 'qualBtn':
                this.roleDataSotr(RoleListSotrType.Quality);
                break;
            case 'jobBtn':
                this.roleDataSotr(RoleListSotrType.Job);
                break;
            case 'fightBtn':
                this.roleDataSotr(RoleListSotrType.Power);
                break;
            default:
                this.roleDataSotr(RoleListSotrType.Def);
                break;
        }
    }
    private roleDataSotr(type: number): void {
        this.sotrType = type;
        let roleDatas = PlayerData.GetRoles();
        let newRoleDatas:SPlayerDataRole[] = [];
        switch (type) {
            case RoleListSotrType.Def://默认排序
                let attackRoles: SBattleRole[] = PlayerData.attackRoles;
                let defenseRoles:SBattleRole[] = PlayerData.roleInfo.defense_lineup;
                let szRoleDatas:SPlayerDataRole[] = [];//上阵中的角色列表
                let defenseDatas:SPlayerDataRole[] = [];//防守中的角色列表
                let workDatas:SPlayerDataRole[] = [];//工作中的角色列表
                let defRoleDatas:SPlayerDataRole[] = [];//默认的校色列表
                let szFlag:boolean = false;
                let szDic:object = {};
                let dfDic:object = {};
                for (const attack of attackRoles) {
                    if(attack){
                        szDic[attack.role_id] = true;
                    }
                    
                }
                for (const defense of defenseRoles) {
                    //排除上政角色
                    if(!szDic[defense.role_id]) dfDic[defense.role_id] = true;
                }
                for (const roleData of roleDatas) {
                    
                    if(szDic[roleData.id]){
                        szRoleDatas.push(roleData);
                    }else if(dfDic[roleData.id]){
                        defenseDatas.push(roleData); 
                    }else if(roleData.building_id > 0){
                        if(!szDic[roleData.id] || !dfDic[roleData.id]){
                            workDatas.push(roleData);
                        }
                    }else{
                        defRoleDatas.push(roleData);
                    }
                }
                szRoleDatas.sort(this.powerRank);
                defenseDatas.sort(this.powerRank);
                workDatas.sort(this.powerRank);
                defRoleDatas.sort(this.powerRank);
                newRoleDatas = szRoleDatas.concat(defenseDatas, workDatas, defRoleDatas);
                this.downBtnTitle.string = "默认排列";
                break;
            case RoleListSotrType.Level:
                newRoleDatas = roleDatas;
                newRoleDatas.sort(this.levelRank);
                this.downBtnTitle.string = "等级排列";
                break;
            case RoleListSotrType.Quality:
                newRoleDatas = roleDatas;
                newRoleDatas.sort(this.qualRank);
                this.downBtnTitle.string = "品质排列";
                break;
            case RoleListSotrType.Job:
                newRoleDatas = roleDatas;
                newRoleDatas.sort(this.jobRank);
                this.downBtnTitle.string = "职业排列";
                break;
            case RoleListSotrType.Power:
                newRoleDatas = roleDatas;
                newRoleDatas.sort(this.powerRank);
                this.downBtnTitle.string = "战力排列";
                break;
        }

        this.datas = newRoleDatas;
        this.noneListCont.active = this.datas.length <= 0; 
        this.scroller.UpdateDatas(this.datas);
        this.scroller.ScrollToHead();
    }
    
    //战力排序
    private powerRank(a:SPlayerDataRole, b:SPlayerDataRole):number{
        let stdA:StdRole = CfgMgr.GetRole()[a.type];
        let stdB:StdRole = CfgMgr.GetRole()[b.type];
        if(a.battle_power == b.battle_power){
            if(a.level == b.level){
                if(a.quality == b.quality){
                    if(stdA.PositionType == b.battle_power){
                        return stdA.RoleType < stdB.RoleType ? -1 : 1;
                    }else{
                        return stdA.PositionType < stdB.PositionType ? -1 : 1;
                    }
                }else{
                    return a.quality > b.quality ? -1 : 1;
                }
            }else{
                return a.level > b.level ? -1 : 1;
            }
            
        }else{
            return a.battle_power > b.battle_power ? -1 : 1;
        }
    }
    //职业排序
    private jobRank(a:SPlayerDataRole, b:SPlayerDataRole):number{
        let stdA:StdRole = CfgMgr.GetRole()[a.type];
        let stdB:StdRole = CfgMgr.GetRole()[b.type];
        if(stdA.PositionType == stdB.PositionType){
            if(a.battle_power == b.battle_power){
                if(a.quality == b.quality){
                    if(a.level == b.level){
                        return stdA.RoleType < stdB.RoleType ? -1 : 1;
                    }else{
                        return a.level > a.level ? -1 : 1;
                    }
                }else{
                    return a.quality > b.quality ? -1 : 1;
                }
            }else{
                return a.battle_power > b.battle_power ? -1 : 1;
            }
            
        }else{
            return stdA.PositionType < stdB.PositionType ? -1 : 1;
        }
    }
    //品质排序
    private qualRank(a:SPlayerDataRole, b:SPlayerDataRole):number{
        let stdA:StdRole = CfgMgr.GetRole()[a.type];
        let stdB:StdRole = CfgMgr.GetRole()[b.type];
        if(a.quality == b.quality){
            if(a.battle_power == b.battle_power){
                if(a.level == b.level){
                    if(stdA.PositionType == stdB.PositionType){
                        return stdA.RoleType < stdB.RoleType ? -1 : 1;
                    }else{
                        return stdA.PositionType < stdB.PositionType ? -1 : 1;
                    }
                }else{
                    return a.level > b.level ? -1 : 1;
                }
            }else{
                return a.battle_power > b.battle_power ? -1 : 1;
            }
            
        }else{
            return a.quality > b.quality ? -1 : 1;
        }
    }
    //等级排序
    private levelRank(a:SPlayerDataRole, b:SPlayerDataRole):number{
        let stdA:StdRole = CfgMgr.GetRole()[a.type];
        let stdB:StdRole = CfgMgr.GetRole()[b.type];
        if(a.level == b.level){
            if(a.battle_power == b.battle_power){
                if(a.quality == b.quality){
                    if(stdA.PositionType == stdB.PositionType){
                        return stdA.RoleType < stdB.RoleType ? -1 : 1;
                    }else{
                        return stdA.PositionType < stdB.PositionType ? -1 : 1;
                    }
                }else{
                    return a.quality > b.quality ? -1 : 1;
                }
            }else{
                return a.battle_power > b.battle_power ? -1 : 1;
            }
            
        }else{
            return a.level > b.level ? -1 : 1;
        }
    }

    protected updateItem(item: Node, data: SPlayerDataRole) {
        let card = item.getComponent(Card);
        if (!card) card = item.addComponent(Card);
        card.SetData({ role: data, select: false });
        item.getComponent(Toggle).isChecked = false;
        item.getComponent(Toggle).enabled = false;
    }
    protected async onSelect(index: number, item: Node) {
        console.log("onSelect", index);
        item.getComponent(Toggle).isChecked = false;
        RoleInfoPanel.Show(this.datas, index);
    }
}