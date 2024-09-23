import { Button, Event, EventTouch, input, Input, instantiate, lerp, Node, Prefab, Skeleton, Slider, sp, Sprite, UITransform, v3, Vec2, Vec3 } from 'cc';
import { Attr, CfgMgr, ThingSubType } from "../../manager/CfgMgr";
import { Hero } from '../../module/home/entitys/Hero';
import { IEntity } from '../../module/home/entitys/IEntity';
import { HomeLogic } from "../../module/home/HomeLogic";
import { HomeScene } from '../../module/home/HomeScene';
import { LikeNode, map, MapData } from '../../module/home/MapData';
import { SceneCamera } from "../../module/SceneCamera";
import PlayerData, { CountPower, FightState, SBattleRole, SPlayerDataRole, SPlayerDataSoldier } from "../../module/roleModule/PlayerData";
import { Session } from "../../net/Session";
import { MsgTypeSend, MsgTypeRet } from '../../MsgType';
import { Deployment, SliderValue } from "../BattleModule/BattleData";
import { BattleLogic } from "../BattleLogic";
import { BattleUI } from './BattleUI';
import { Tips } from '../../module/login/Tips';
import { GetAttrValueByIndex } from '../../module/common/BaseUI';
import { EventMgr, Evt_HeroDeployed } from '../../manager/EventMgr';
import { ResMgr } from '../../manager/ResMgr';

export class BattleReadyLogic {
    private static $ins: BattleReadyLogic;
    static get ins() { return this.$ins; }

    private atkIndexs : {id:number,angle:number}[];
    private defIndexs : {id:number,angle:number}[];
    private index2Hero : Deployment[];
    
    private entitys : Array<IEntity>;
    defID2HomeId : [string, number, number, number];

    onBattleInit;

    indexs: number = 0;

    private _sliders : SliderValue[] = []

    // 准备阶段玩家小兵快照
    playerSoldiers: SPlayerDataSoldier[] = [];

    assistRoleId:string;

    isInBattle:boolean = false;
    isInitLineup :boolean = false;

    private battleSelectEffects: { [prefab: number]: Node } = {};
    private attackLineupCenterPos: Vec2 = new Vec2(0, 0);

    constructor() {
        if (BattleReadyLogic.$ins) throw "error";
        BattleReadyLogic.$ins = this;
        this.index2Hero = [];
        this.entitys = [];
    }

    async RealyBattle(battleData: any) {
        
        this.playerSoldiers = JSON.parse(JSON.stringify(PlayerData.roleInfo.soldiers));

        if(battleData.type == FightState.PvP)
        {
            this.defID2HomeId = [battleData.player_id, battleData.homeland_id,battleData.revenge_battle_id,battleData.season_id];
            await HomeLogic.ins.EnterPvpScene(battleData.homeland_id, battleData.type, battleData.buildings); // 初始化战斗场景
            this.assistRoleId = "";
            console.log("=================>")
        }
        else if(battleData.type == FightState.PvE)
        {
            this.defID2HomeId = [battleData.player_id, battleData.homeland_id, battleData.stage_id, null];
            await HomeLogic.ins.EnterPveScene(battleData.mapId); // 初始化战斗场景
        }



        this.atkIndexs  = HomeScene.ins.GetAtkIndexs();
        this.defIndexs = HomeScene.ins.GetDefIndexs();

        this.AddAttackRoles();

        if(battleData.type == FightState.PvP)
            this.AddDefRoles(battleData);
        else if(battleData.type == FightState.PvE)
            this.AddMonster(battleData);

        let defData = {
            battle_power: battleData.battle_power,
            icon : battleData.icon,
            to_battle: battleData.deploy_formation? !battleData.deploy_formation : true
        } 

        BattleUI.Show(defData);

    }

    private AddBattleRole(sprite : string, index : number, position : LikeNode, angle: number, soldierId: number, needTouch: boolean = true) : IEntity {
        let hero : IEntity = Hero.Create(sprite);
        hero.Init(position);
        let node = <unknown>hero as Node;
        HomeScene.ins.AddEntity(node);
        let isBack = angle > 90 && angle < 270 ? false : true;
        let isLeft = angle >= 180 ? true : false;
        hero.Idle(isLeft? 1 : -1 , isBack);
        this.entitys.push(hero);
        this.AddSoldier(node, isBack, soldierId);
        hero["data"] = index;
        if(needTouch)
            this.AddTouchEvent(node);
        return hero;
    }

    async AddTouchEvent(node){

        let touch = new Node("touch");
        touch.parent = node;
        touch.addComponent(UITransform);
        touch.layer = 1;
        touch.getComponent(UITransform).setContentSize(100, 100);
        touch.setPosition(0, 50);
        
        let effect = new Node("effect");
        effect.parent = node;
        effect.setSiblingIndex(0);
        effect.addComponent(sp.Skeleton);
        effect.getComponent(sp.Skeleton).skeletonData = await ResMgr.LoadResAbSub("spine/effect/ui_battlemove/ui_battlemove", sp.SkeletonData);
        effect.layer = 1;
        //touch.setPosition(0, -65);
        effect.active = false;

        touch.on(Input.EventType.TOUCH_START, this.OnTouchStart, this);
        touch.on(Input.EventType.TOUCH_MOVE, this.OnTouchMove, this);
        touch.on(Input.EventType.TOUCH_CANCEL, this.OnTouchEnd, this);
        touch.on(Input.EventType.TOUCH_END, this.OnTouchEnd, this);

    }

   
    startMovePos;
    touchIndex;
    
    private OnTouchStart(evt){
        this.startMovePos = evt.getLocation();
        this.touchIndex = evt.target.parent.data;
        let effect = evt.target.parent.getChildByName("effect");
        effect.active = true;
        effect.getComponent(sp.Skeleton).setAnimation(0, "animation", true);
        this.PlaySelectEffect(this.touchIndex, "animation");
        this.indexs -= 2 << this.touchIndex;
    }

    private OnTouchMove(evt){
        let current = evt.getLocation();
        let delta = new Vec3(current.x -  this.startMovePos.x, current.y - this.startMovePos.y, 0);
        delta.multiplyScalar(1.5);
        let target = evt.target.parent;
        let newPos = target.position.add(delta);

        // 计算限制后的新位置
        newPos.x = Math.max(this.attackLineupCenterPos.x - 500, Math.min(this.attackLineupCenterPos.x + 500, newPos.x));
        newPos.y = Math.max(this.attackLineupCenterPos.y - 500, Math.min(this.attackLineupCenterPos.y + 500, newPos.y));
        target.setPosition(newPos.x, newPos.y, 0);

        this.startMovePos = current;
    }

    private OnTouchEnd(evt)
    {
        let posIndex = this.GetIndexByPos(evt.target.parent.position);
        // 如果 posIndex 无效（小于0），则使用当前触摸的英雄索引
        posIndex = posIndex < 0 ? this.touchIndex : posIndex;
        
        // 获取当前触摸的英雄对象
        let self = this.GetHeroByIndex(this.touchIndex);
        
        // 获取目标位置的英雄对象
        let tmp = this.GetHeroByIndex(posIndex);
        
        // 如果目标位置的英雄对象不存在，或者目标位置和当前触摸位置相同，则不需要互换
        if (!tmp || posIndex === this.touchIndex) {
            // 直接将当前触摸的英雄移动到目标位置
            let heroPosition = map.GetGrid(this.atkIndexs[posIndex].id);
            self.Index = posIndex;
            self.Role.Init(heroPosition);
            self.Role["data"] = self.Index;
            this.PlaySelectEffect(this.touchIndex, "animation");
            this.PlaySelectEffect(posIndex, "animation2");
        } else {
            // 保存当前触摸英雄的原始位置索引
            let originalSelfIndex = self.Index;
        
            // 交换两个英雄的索引
            self.Index = posIndex;
            tmp.Index = originalSelfIndex;

            self.Role["data"] = self.Index;
            tmp.Role["data"] = tmp.Index;
        
            // 获取并设置两个英雄的新位置
            let heroPositionSelf = map.GetGrid(this.atkIndexs[self.Index].id);
            self.Role.Init(heroPositionSelf);
            this.PlaySelectEffect(self.Index, "animation2");
        
            let heroPositionTmp = map.GetGrid(this.atkIndexs[tmp.Index].id);
            tmp.Role.Init(heroPositionTmp);
            this.PlaySelectEffect(tmp.Index, "animation2");

            if((this.indexs | (2 << tmp.Index)) != this.indexs )
                this.indexs += 2 << tmp.Index;
        }
        let effect = evt.target.parent.getChildByName("effect");
        effect.active = false;

        if((this.indexs | (2 << self.Index)) != this.indexs)
            this.indexs += 2 << self.Index;
        // effect.getComponent(sp.Skeleton).setAnimation(0, "animation", true);
      
    }

    private GetIndexByPos(pos): number {
        
        let dis = 1000;
        let posIndex = -1;
        this.atkIndexs.forEach((item, index) => {
            let tmp : number = item.id;
            let heroPosition : LikeNode = map.GetGrid(tmp);
            // 显示特效带有偏移
            let x = Math.abs((pos.x + 49) - heroPosition.x);
            let y = Math.abs((pos.y + 10) - heroPosition.y);
            let disTmp = Math.sqrt(x * x + y * y);
            if (dis > disTmp && disTmp < 150)
            {
                dis = disTmp;
                posIndex = index;
            }
        })

        return posIndex;
    }


    private async PlaySelectEffect(index: number, animation : string) {
        if(!this.battleSelectEffects)
            this.battleSelectEffects = {}

        if(this.battleSelectEffects[index]){
            let effect = this.battleSelectEffects[index];
            effect.active = true;
            let ske = effect.getComponent(sp.Skeleton);
            ske.setAnimation(0, animation, true);
        }
        else{
            let tmp : number = this.atkIndexs[index].id;
            let pos : LikeNode = map.GetGrid(tmp);
            let effect = new Node();
            effect.name = "battleSelectEffect";
            effect.layer = 1;
            this.battleSelectEffects[index] = effect;
            let ske = effect.addComponent(sp.Skeleton);
            ske.skeletonData = await ResMgr.LoadResAbSub("spine/effect/ui_battleselect/ui_battleselect", sp.SkeletonData);
            effect.setPosition(pos.x - 49, pos.y - 10, 0);
            HomeScene.ins.AddPveMap(effect); //暂时加在这个层上
            ske.setAnimation(0, animation, true);
        }

    }

    private StopSelectEffect(index: number){
        if(this.battleSelectEffects?.[index]){
            let effect = this.battleSelectEffects[index];
            let ske = effect.getComponent(sp.Skeleton);
            ske.clearTracks();
            effect.active = false;
        }
    }

    private async AddSoldier(parent: Node, isBack, soldierId){
        if(soldierId <= 0) return;
        let unitTypeConfig = CfgMgr.GetRole()[soldierId];
        let prefab: Prefab = await ResMgr.GetResources<Prefab>(`prefabs/hero/${unitTypeConfig.Prefab}_${isBack ? "B_group" : "R_group"}`);
        let soldier = instantiate(prefab);
        soldier['name'] = 'soldier';
        parent.addChild(soldier);
        let position = isBack? new Vec3(-82, -7, 0) : new Vec3(32, 35, 0);
        soldier.setPosition(position);
        setTimeout(() => {
            soldier.setSiblingIndex(isBack? parent.children.length - 1 : 0);
        }, 500);
    }

    public RemoveBattleRoleByIndex(index: number) {

        for(let i = 0; i < this.index2Hero.length; i++)
        {
            if(this.index2Hero[i].Index == index)
            {
                let role = this.index2Hero[i].Role;
                let node = <unknown>role as Node;
                let touch = node.getChildByName("touch")
                if(touch)
                {
                    touch.destroy();
                }
                this.index2Hero.splice(i, 1);
                let tmp : number = this.entitys.indexOf(role);
                this.entitys.splice(tmp, 1);
                let soldier = (<unknown>role as Node).getChildByName('soldier');
                if(soldier)
                    soldier.destroy();
                role.RemoveMyself();
                this.indexs -= 2 << index;
                this._sliders = []; // 清空存储信息
                this.PlaySelectEffect(index, "animation");
                break;
            }
        }

        EventMgr.emit(Evt_HeroDeployed);
    }

    private GetHeroByIndex(index): Deployment{

        for(let i = 0; i < this.index2Hero.length; i++)
        {
            if(this.index2Hero[i].Index == index)
            {
                return this.index2Hero[i];
            }
        }
        return null;
    }

    public RemoveAllUpBattle(){
       for (let index = 0; index < 5; index++) {
            this.RemoveBattleRoleByIndex(index);
       }
    }

    public async AddBattleHeroByIndex(id : string, index: number, data: SPlayerDataRole, is_assist?: boolean) {
        if(index >= this.atkIndexs.length)
        {
            console.error("超出攻击槽位上限");
            return;
        }

        if((this.indexs | (2 << index)) == this.indexs )
        {
            console.error("重复添加");
            return;
        }

        this.index2Hero.forEach((item, tmp) => {
            if(item.Index === index)
            {
                console.error("重复添加");
                return;
            }
        })

        let tmp : number = this.atkIndexs[index].id;
        let heroPosition : LikeNode = map.GetGrid(tmp);
        let tabel = CfgMgr.GetRole()[data.type];
        let hero : IEntity= this.AddBattleRole("prefabs/hero/" + tabel.Prefab, index, heroPosition, this.atkIndexs[index].angle, this.GetSoldierId(tabel));
        this.indexs += 2 << index;
        this.index2Hero.push({
            ID: id,
            Index: index,
            Role: hero,
            Type: data.type,
            MaxCount: GetAttrValueByIndex(data, Attr.LeaderShip),
            SoldierType: tabel.FollowerType,
            Soldiers: [],
            BattlePower: data.battle_power,
            pos: heroPosition,
            IsAssist: is_assist,
        });
        //this.StopSelectEffect(index);
        this.PlaySelectEffect(index, "animation2");
        this._sliders = []; // 清空存储信息
        this.isInitLineup = false;
        EventMgr.emit(Evt_HeroDeployed);
    }

    private AddAttackRoles()
    {
        this.atkIndexs.forEach((item, index) => {
            let heroPosition : LikeNode = map.GetGrid(item.id);
            this.attackLineupCenterPos.x += heroPosition.x;
            this.attackLineupCenterPos.y += heroPosition.y;
        })

        this.attackLineupCenterPos.x /= this.atkIndexs.length;
        this.attackLineupCenterPos.y /= this.atkIndexs.length;

        let roleData = PlayerData.GetRoles();
        let attackRoles : SBattleRole[] = PlayerData.attackRoles;

        for(let i = 0; i < 5; i++)
        {
            if( !attackRoles || attackRoles.length < i + 1 || attackRoles[i] == null)
            {
                this.PlaySelectEffect(i, "animation");
                continue;
            }
            for(let j = 0; j < roleData.length; j++){
                if(roleData[j].id == attackRoles[i].role_id){
                    BattleReadyLogic.ins.AddBattleHeroByIndex(roleData[j].id, i, roleData[j]);
                    break;
                }
            }
        }

        this.isInitLineup = true;
    }

    private async AddDefRoles(defData : any)
    {
        let defHeros = defData.defense_lineup;
        let heros = defData.roles
        if(heros == undefined || defHeros == undefined)
            return;
        
        for(let i = 0; i < defHeros.length; i++)
        {
            if(defHeros[i] == null || defHeros[i].role_id == '')
                continue;
            for(let j = 0; j < heros.length; j++)
            {
                if(heros[j].id == defHeros[i].role_id)
                {
                    let heroPosition : LikeNode = map.GetGrid(this.defIndexs[i].id);
                    let unitTypeConfig = CfgMgr.GetRole()[heros[j].type];
                    this.AddBattleRole("prefabs/hero/" + unitTypeConfig.Prefab, i, heroPosition, this.defIndexs[i].angle, this.GetSoldierId(unitTypeConfig), false);
                    break;
                }
            }

        }

    }

    private async AddMonster(defData : any)
    {
        for(let i = 0; i < defData.monsters.length; i++)
        {
            if(defData.monsters[i] == undefined || defData.monsters[i] <= 0)
                continue;

            let monsterPosition : LikeNode = map.GetGrid(this.defIndexs[i].id);
            let monsterConfig = CfgMgr.Get("Monster")[defData.monsters[i]];
            let unitTypeConfig = CfgMgr.GetRole()[monsterConfig.ImageID];
            this.AddBattleRole("prefabs/hero/" + unitTypeConfig.Prefab, i, monsterPosition, this.defIndexs[i].angle, this.GetSoldierId(unitTypeConfig), false);    
        }
    }

    StartBattleConfirmation(): boolean {
        
        if(this.index2Hero.length == 0)
        {
            Tips.Show(CfgMgr.GetText("battle_1"));
            return false;
        }
        else if(this.index2Hero.length < 5)
        {
            Tips.Show(CfgMgr.GetText("battle_5", {count: 5}), ()=>{
                this.SendStartBattleMsg();
                return true;;
            }, ()=>{
                return false;
            });
        }
        else
        {
            this.SendStartBattleMsg();
            return true;
        }

    }

    private SendStartBattleMsg()
    {
        let attackHeros = [null, null, null, null, null];
        for(let i = 0; i < this.index2Hero.length; i++)
        {
            let tmp = this.index2Hero[i];
            if(tmp.Index < attackHeros.length)
            {
                this.DistributeSoldiersToHeros(tmp);
                const role = {
                    role_id: tmp.ID,
                    soldiers: tmp.Soldiers
                }
                attackHeros[tmp.Index] = role
                if(tmp.IsAssist)
                    this.assistRoleId = tmp.ID;
            }
        }

        let data = {
            type : MsgTypeSend.SetAttackRoles,
            data : {
                lineup: attackHeros
            }
        }
        Session.Send(data);
        this.isInitLineup = true;
    }


    HasDeployment(id : string, type : number) : [boolean, number, boolean]
    {
        let result:[boolean, number, boolean] = [false, -1, false];

        if(this.index2Hero.length == 0)
            return result;
        for(let i = 0; i < this.index2Hero.length; i++)
        {
            if(this.index2Hero[i].ID == id)
            {
                result[0] = true;
                result[1] = this.index2Hero[i].Index;
            }
            if(this.index2Hero[i].Type == type)
                result[2] = true;
        }
        return result;
    }

    IsAttackerFull() : boolean
    {
        if(this.index2Hero.length == 5)
            return true;
        return false;
    }

    GetSelfBattlePower() : number {

        const herosPower = this.index2Hero.reduce((sum, hero) => sum + hero.BattlePower, 0);
        let soldiersPower = 0;
        if(this.isInitLineup)
        {
            let attackRoles : SBattleRole[] = PlayerData.attackRoles;
            if(attackRoles != null && attackRoles.length > 0)
            {
                for(let i = 0; i < attackRoles.length; i++)
                {
                     if(attackRoles[i] == null || attackRoles[i].soldiers == null)
                        continue;
                    soldiersPower += attackRoles[i].soldiers.reduce((sum, soldier) => {
                        return sum + soldier.count * CountPower(soldier.id, 1)
                    }, 0);
                }
            }
        }
        else
        {
            soldiersPower = this._sliders.reduce((accumulator, currentValue) => {
                let battlePower = CountPower(currentValue.id, 1) * currentValue.count;
                return accumulator + battlePower;
            }, 0);
        }

       

        return Math.floor(herosPower + soldiersPower); 
    }

    GetAttackIndexByPositionType(positionType : number) : number
    {
        for(let i = 0; i < 5; i++)
        {
            let index = i;
            if(positionType > 2)
                index = (i + 2) % 5;
            if((this.indexs | (2 << index)) == this.indexs)
                continue;
            else
                return index;
        }
            
        return -1;
    }
    

    BattleStartPush(data: any)
    {
        if(this.isInBattle) return;
        this.OnHide();

        if(!BattleLogic.ins) new BattleLogic();

        data.homeland_id = this.defID2HomeId[1];
        BattleLogic.ins.BattleStartPushData = data;
        BattleLogic.ins.init();
        if(this.onBattleInit)
            this.onBattleInit();

        let node = map.GetGrid(HomeScene.ins.GetHomeCfg().camera);
        SceneCamera.LookAt(node.x, node.y);
        this.isInBattle = true;
        //BattleLogic.ins.start();
    }

    OnHide()
    {
        this.entitys.forEach(element => {
            element.RemoveMyself();
        });
        this.entitys.length = 0;
        this.index2Hero.length = 0;
        this.indexs = 0;

        for(let effect in this.battleSelectEffects)
        {
            this.battleSelectEffects[effect].destroy();
        }

        this.battleSelectEffects = {};
    }


    GetSoldiers(): Map<number, number>
    {
        let soldier2Number = new Map<number, number>();
        for(let i = 0; i < this.index2Hero.length; i++)
        {
            let hero = this.index2Hero[i];
            hero.SoldierType.sort((a, b) => {return a - b});
            if(soldier2Number.get(hero.SoldierType[0]))
                soldier2Number.set(hero.SoldierType[0], soldier2Number.get(hero.SoldierType[0]) + hero.MaxCount);
            else
                soldier2Number.set(hero.SoldierType[0], hero.MaxCount);
        }

        return soldier2Number;
    }

    public set sliders(v : SliderValue[]) {
        this._sliders = v;
    }

    public get sliders()
    {
        return this._sliders;
    }
    

    private DistributeSoldiersToHeros(hero: Deployment)
    {   
        let tmpData;
        if(this._sliders.length > 0)
            tmpData = this._sliders.filter(soldier => hero.SoldierType.indexOf(soldier.id) != -1);
        else
            tmpData = this.playerSoldiers.filter(soldier => hero.SoldierType.indexOf(soldier.id) != -1);

        tmpData.sort((a, b) => {return b.id - a.id});

        if(this.isInitLineup)
        {
            const matchingRole = PlayerData.attackRoles.find(role => role != null && role.role_id === hero.ID);
            if (matchingRole) {
                hero.MaxCount = matchingRole.soldiers.reduce((sum, soldier) => sum + soldier.count, 0);
            }
        }

        for(let i = 0; i < tmpData.length; i++)
        {
            if(tmpData[i].count <= 0)
                continue;
            
            let count = tmpData[i].count > hero.MaxCount ? hero.MaxCount : tmpData[i].count;
            hero.MaxCount -= count;
            tmpData[i].count -= count;
            let solider = 
            {
                id: tmpData[i].id,
                count: count,
            }

            hero.Soldiers.push(solider);

            if(hero.MaxCount <= 0)
                break;
        }

        // if (hero.Soldiers.length <= 0) {
        //     hero.Soldiers.push({id: hero.SoldierType[0], count: 0}); //默认配置一个
        // }
    }

    private GetSoldierId(config){
        let soldierId = 0;
        if(config.FollowerType?.length > 0)
        {
            soldierId = Math.max(...config.FollowerType);
            // 过滤出playerSoldiers中id存在于config.FollowerType的soldier
            const filteredSoldiers = this.playerSoldiers.filter(soldier => config.FollowerType.includes(soldier.id));
            if (filteredSoldiers.length > 0) {
                // 从过滤后的soldier中找到最大的id
                const maxIdInSoldiers = Math.max(...filteredSoldiers.map(soldier => soldier.id));
                // 返回最大id
                soldierId = maxIdInSoldiers;
            }
        }
        return soldierId;
    }

    /**获取上阵的角色 */
    public getUpBattleRole(){

        return this.index2Hero;
    }



}