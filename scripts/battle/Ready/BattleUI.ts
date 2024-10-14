import { Button, EditBox, Label, Node, Prefab, input, instantiate, resources, find, math, Sprite, SpriteFrame, Toggle, ProgressBar, tween, Vec3, sp, path, Color, Tween } from 'cc';
import { Panel } from "../../GameRoot";
import PlayerData, { FightState, PlayerDataMap, SBattleRole, SSettingData } from '../../module/roleModule/PlayerData';
import { AutoScroller } from '../../utils/AutoScroller';
import { CardQuality, CfgMgr, ResourceType, ShopGroupId, StdCommonType } from '../../manager/CfgMgr';
import { HomeScene } from '../../module/home/HomeScene';
import { HomeLogic } from '../../module/home/HomeLogic';
import { folder_head_card, folder_icon, folder_item, folder_quality, folder_skill, folder_sound, ResMgr } from '../../manager/ResMgr';
import { Session } from '../../net/Session';
import { MsgTypeRet, MsgTypeSend } from '../../MsgType';
import { BattleReadyLogic } from './BattleReadyLogic';
import { BattleLogic } from '../BattleLogic';
import { Runtime } from '../BattleLogic/Runtime';
import { Hero } from '../BattleLogic/logic/actor/Hero';
import { HomeUI } from '../../module/home/panel/HomeUI';
import Logger from '../../utils/Logger';
import { BattleReportPanel } from './BattleReportPanel';
import { AdaptBgTop, FormatRewards } from '../../module/common/BaseUI';
import { PvePanel } from './PvePanel';
import { GetGameData, SaveGameData } from '../../net/MsgProxy';
import { EventMgr, Evt_ConfigData_Update, Evt_HeroDeployed, Evt_ReConnect, Evt_ReConnect_Success, Evt_RoleAttack, Evt_SoldierAssignment, Goto } from '../../manager/EventMgr';
import { Tips } from '../../module/login/Tips';
import { LootPanel } from '../../module/loot/LootPanel';
import { DateUtils } from '../../utils/DateUtils';
import { formatNumber } from '../../utils/Utils';
import { PANEL_TYPE } from '../../manager/UIGuide';
import { BattleArrayPanel } from './BattleArrayPanel';
import { AudioGroup, AudioMgr, Audio_CommonClick } from '../../manager/AudioMgr';
import { ItemTips } from '../../module/common/ItemTips';
import { BuildingType } from '../../module/home/HomeStruct';
import LocalStorage from '../../utils/LocalStorage';
import { CopyToClip } from '../../Platform';
import { MsgPanel } from '../../module/common/MsgPanel';
import { LootVsPanel } from '../../module/loot/LootVsPanel';

export class BattleUI extends Panel {
    protected prefab: string = 'prefabs/battle/BattleUI';

    protected static $self: BattleUI;
    static get self(): BattleUI { return this.$instance; }

    private skillItemContent: Node;
    private skillItem: Node;

    roleScroller: AutoScroller;
    roleConfig: any;

    private left: Node;
    private input: EditBox;
    private info: Label;
    private battleNode: Node;
    private selfBattlePower: Label;

    private autoBattle: Toggle;
    isAutoBattle: boolean = false;
    private autoEffect: sp.Skeleton;

    private timeScale: Toggle;
    private lock: Node;

    private slot2Hero: Map<number, Hero>;
    private slot2Item: Map<number, Node>;
    private slot2Tween: Map<number, boolean>;
    private slot2Die: Map<number, boolean>;

    private updateData: boolean = false;

    private pauseNode: Node;
    private gameSpeed: number = 1;
    private settingNode: Node;
    private bgmToggle:Toggle;
    private soundToggle:Toggle;

    private battleID;
    private stageId: number = 0;

    private resultNode: Node;
    private resultEffect: sp.Skeleton;
    _resultReport;
    _group2unit;

    _IconItem: Node;
    private winItemContent: Node;
    private loseItemContent: Node;
    private itemContent: Node;

    private battleStartTime: number = 0;
    private timeString: Label;
    private canExit: boolean = false;
    private enterHome: boolean = false;
    private canShowReward: boolean = false;
    private isBattleResult: boolean = false;

    private typeLesionPct: number = 0;
    private toBattle: boolean = false;
    private battleIdText: Label;

    private shieldNode: Node;

    constructor() {
        super();
        this.slot2Hero = new Map<number, Hero>();
        this.slot2Item = new Map<number, Node>();
        this.slot2Tween = new Map<number, boolean>();
        this.slot2Die = new Map<number, boolean>();
    }

    protected async onLoad() {
        this.SetLink(undefined);
        AdaptBgTop(this.node);
        AdaptBgTop(this.find("Top/topBg"));
        this.battleNode = this.find("Bottom/battle");
        this.shieldNode = this.find("Top/bg/left/shield");

        this.left = this.find("Left");
        // this.input = this.find("Left/EditBox").getComponent(EditBox);
        // this.info = this.find('Left/Label').getComponent(Label);

        this.skillItemContent = this.find("Bottom/battle/skillList/view/content");
        this.autoBattle = this.find("Bottom/battle/autoBattleBtn").getComponent(Toggle);
        this.autoEffect = this.find("Bottom/battle/autoBattleBtn/Effect").getComponent(sp.Skeleton);
        this.timeScale = this.find("Bottom/battle/beishu/Toggle").getComponent(Toggle);
        this.lock = this.find("Bottom/battle/beishu/lock");
        this.pauseNode = this.find("Middle/pause");
        this.settingNode = this.find("Middle/setting");
        this.selfBattlePower = this.find("Top/LZhanLi").getComponent(Label);
        this.timeString = this.find("Top/timeBg/time").getComponent(Label);

        this.find("Middle/pause/exit").on(Button.EventType.CLICK, this.OnExitBattleResClick, this);
        this.find("Middle/pause/continue").on(Button.EventType.CLICK, this.OnContinueBattleClick, this);
        this.find("Middle/pause/closeBtn").on(Button.EventType.CLICK, this.OnContinueBattleClick, this);
        this.find("Middle/pause/next").on(Button.EventType.CLICK, this.OnNextBattleClick, this);
        this.find("Middle/pause/set").on(Button.EventType.CLICK, this.OnSettingClick, this);
        this.settingNode.getChildByName("closeBtn").on(Button.EventType.CLICK, ()=>{this.settingNode.active = false}, this);

        this.find("Bottom/battle/pauseBtn").on(Button.EventType.CLICK, this.OnBattlePauseClick, this);
        this.autoBattle.node.on(Button.EventType.CLICK, this.OnAutoBattleClick, this);
        this.timeScale.node.on(Button.EventType.CLICK, this.OnTimeScaleClick, this);

        this.resultNode = this.find("Result");
        this.resultEffect = this.resultNode.getChildByPath("effect").getComponent(sp.Skeleton);
        this.resultNode.getChildByPath("mask").on(Button.EventType.CLICK, this.OnExitBattle, this);
        this.resultNode.getChildByPath("btn/fanhui").on(Button.EventType.CLICK, this.OnEnterHome, this);
        this.resultNode.getChildByPath("btn/win/next").on(Button.EventType.CLICK, this.OnExitBattle, this);
        this.resultNode.getChildByPath("btn/lose/next").on(Button.EventType.CLICK, this.OnExitBattle, this);
        this.resultNode.getChildByName("battleReport").on(Button.EventType.CLICK, this.onBattleReport, this);

        this.bgmToggle = this.find("Middle/setting/bgm/bgmToggle", Toggle);
        this.soundToggle = this.find("Middle/setting/audio/audioToggle", Toggle);
        this.bgmToggle.node.on(Toggle.EventType.TOGGLE, this.onToggleChange, this);
        this.soundToggle.node.on(Toggle.EventType.TOGGLE, this.onToggleChange, this);
        AdaptBgTop(this.pauseNode.getChildByName("mask"));
        AdaptBgTop(this.resultNode.getChildByName('mask'));
        AdaptBgTop(this.node.getChildByName('pveBg'));

        //this.input.node.on('editing-return', this.onEditDidEnded, this);
        this.find("Middle").active = true;

        this._IconItem = this.node.getChildByPath("Item/Icon");
        this.skillItem = this.node.getChildByPath("Item/SkillItem");
        this.winItemContent = this.node.getChildByPath("Result/winItemContent");
        this.loseItemContent = this.node.getChildByPath("Result/loseItemContent");
        this.battleIdText = this.node.getChildByPath("Middle/pause/battleId").getComponent(Label);
        this.node.getChildByPath("Middle/pause/copyIdBtn").on(Button.EventType.CLICK, ()=>{
            if(!this.battleID) return;
            let uidStr:string = this.battleID;
            CopyToClip(uidStr, (desc: string) => {
                if (desc != undefined || desc != null) {
                    MsgPanel.Show("已复制到粘贴板");
                    this.battleIdText.string = this.battleID;
                }
            });
        }, this);


        Session.on(MsgTypeRet.SetAttackRolesRet, this.onSetAttackRolesRet, this);
        Session.on(MsgTypeRet.BattleStartPush, this.BattleStartPush, this);
        Session.on(MsgTypeRet.BattleProgressRet, this.onBattleProgressRet, this);
        Session.on(MsgTypeRet.SettlePvEPush, this.SettlePvEPush, this);
        Session.on(MsgTypeRet.SettlePvPPush, this.SettlePvPPush, this);
        Session.on(MsgTypeRet.PvERet, this.onPvERet, this);
        EventMgr.on(Evt_ConfigData_Update, this.onConfigDataUpdate, this);//基础信息更新
        EventMgr.on(Evt_ReConnect, this.onReConnect, this);//断线重连
        EventMgr.on(Evt_ReConnect_Success, this.onReConnectSuccess, this);//断线重连成功
    }

    protected async onShow(...args: any) {
        EventMgr.on(Evt_HeroDeployed, this.onHeroDeployed, this);

        EventMgr.on(Evt_RoleAttack, this.onHeroDeployed, this);


        this.battleStartTime = 0;
        this.roleConfig = CfgMgr.GetRole();
        this.resultNode.active = false;
        this.settingNode.active = false;
        this.pauseNode.active = false;
        this.enterHome = false;
        this.autoEffect.node.active = false;
        this.autoBattle.isChecked = false;
        this.timeScale.interactable = false;
        this.timeScale.isChecked = false;
        this.timeScale.getComponent(Sprite).enabled = true;
        this.timeString.string = "02:00";
        this.toBattle = args[0].to_battle;
        BattleArrayPanel.Show(PlayerData.fightState, PlayerData.attackRoles, 5, this.toBattle);
        this.battleNode.active = false;
        this.left.active = false;

        this.shieldNode.active = PlayerData.fightState == FightState.PvP && PlayerData.LootPlayerData?.has_shield;

        //更新玩家信息
        {
            this.onHeroDeployed();
            this.find("Top/RZhanLi").getComponent(Label).string = args[0].battle_power ? args[0].battle_power.toString() : "0";

            //this.node.getChildByName('pveBg').active = PlayerData.fightState == FightState.PvE;
            //todo 头像
        }

    }


    public flush(...args: any[]): void {
    }
    protected onHide(...args: any[]): void {

        EventMgr.off(Evt_HeroDeployed, this.onHeroDeployed, this);
        EventMgr.off(Evt_RoleAttack, this.onHeroDeployed, this);


        this.resultNode.active = false;
        this.isBattleResult = false;
        this.canShowReward = false;

        this.slot2Hero.clear();
        this.slot2Item.clear();
        this.slot2Tween.clear();
        this.slot2Die.clear();
        this.isAutoBattle = false;
        this.skillItemContent.removeAllChildren();
        this.winItemContent.removeAllChildren();
        this.loseItemContent.removeAllChildren();

        // HomeScene.ins.RemovePveMap();
        // HomeScene.ins.Camera2JiDiPos();
        BattleLogic.ins?.end();
        BattleReadyLogic.ins.isInBattle = false;

        if(this.enterHome)
        {
            HomeLogic.ins.EnterMyHomeScene(undefined, true);
            HomeUI.Show();
            return;
        }

        if (PlayerData.fightState == FightState.PvP) {
            LootPanel.Show();
            if (PlayerData.LootMatchList.length > 0) LootVsPanel.Show();
            HomeLogic.ins.EnterMyHomeScene(undefined, false);
        }
        else if (PlayerData.fightState == FightState.PvE) {
            PvePanel.Show();
            HomeLogic.ins.ExitPveScene();
        }
        else
            HomeUI.Show();

    }

    protected update(dt: number): void {

        if (this.shieldNode.active)
        {
            if(Date.now() - PlayerData.LootPlayerData.shield_end_time * 1000 < 0){
                let seconds= PlayerData.LootPlayerData.shield_end_time - Date.now() / 1000;
                this.shieldNode.getChildByName("time").getComponent(Label).string = DateUtils.SecondsToHourTime(seconds);
            }
            else
            {
                this.shieldNode.active = false;
            }
        }

        if (this.battleStartTime > 0) {
            const continueTime = DateUtils.timeElapsedSince(this.battleStartTime);
            let seconds = 120 - (continueTime.minutes * 60 + continueTime.seconds);
            let time = 120 - Runtime.game.currTime;
            if (seconds <= 0 || time <= 0) {
                Runtime.battleModule?.Over("draw");
                this.battleStartTime = 0;
                //有可能会少帧
                if (Runtime.game.currTime < 119.6) {
                    Tips.Show("战斗已经结束", () => {
                        this.Hide();
                    }, () => {
                        this.Hide();
                    })
                }
            }
            else
                this.timeString.string = this.number2String(Math.floor(time / 60)) + ":" + this.number2String(Math.floor(time % 60));
        }
        // this.lock.active = !this.timeScale.interactable;
        // if (Runtime.game)
        //     this.info.string = Runtime.game.currFrame.toString();

        if (this.updateData) {

            this.slot2Item.forEach((item, slot) => {
                if (this.slot2Hero.get(slot)) {
                    let hero = this.slot2Hero.get(slot);
                    if (!hero || hero.isDie) {
                        if (this.slot2Die.get(slot)) return;
                        if (this.slot2Tween.get(slot)) return;
                        item.getChildByName('skill').setScale(0, 1);
                        item.getChildByPath("head/timeMask").active = false;
                        item.getChildByPath("head/timeMask/time").active = false;
                        let head = item.getChildByName('head');
                        head.setScale(1, 1);
                        head.getChildByName('bgkuang').getComponent(Sprite).grayscale = true;
                        head.getChildByPath('bgkuang/icon').getComponent(Sprite).grayscale = true;
                        this.slot2Die.set(slot, true);
                    }
                    else {
                        if (this.slot2Die.get(slot)) {
                            item.getChildByPath("head/timeMask").active = true;
                            item.getChildByPath("head/timeMask/time").active = true;
                            let head = item.getChildByName('head');
                            head.getChildByName('bgkuang').getComponent(Sprite).grayscale = true;
                            head.getChildByPath('bgkuang/icon').getComponent(Sprite).grayscale = true;
                            this.slot2Die.set(slot, false)
                        }

                        let skill = hero.GetSlotSkillInfo();
                        if (skill.cdTime > 0) {
                            item.getChildByPath("head/timeMask").getComponent(Sprite).fillRange = skill.cdPercent;
                            item.getChildByPath("head/timeMask/time").getComponent(Label).string = Math.ceil(skill.cdTime).toString();
                            if (this.slot2Tween.get(slot)) return;

                            if (item.getChildByName('head').scale.x != 1) {
                                this.slot2Tween.set(slot, true);
                                tween(item.getChildByName('skill')).to(0.3, { scale: new Vec3(0, 1, 1) }).call(() => {
                                    tween(item.getChildByName('head')).to(0.3, { scale: new Vec3(1, 1, 1) }).call(() => {
                                        this.slot2Tween.set(slot, false);
                                    }).start();
                                }).start();
                            }

                        }
                        else {
                            if (this.slot2Tween.get(slot)) return;

                            if (item.getChildByName('skill').scale.x != 1) {
                                this.slot2Tween.set(slot, true);
                                tween(item.getChildByName('head')).to(0.3, { scale: new Vec3(0, 1, 1) }).call(() => {
                                    tween(item.getChildByName('skill')).to(0.3, { scale: new Vec3(1, 1, 1) }).call(() => {
                                        this.slot2Tween.set(slot, false);
                                    }).start();
                                }).start();
                            }


                        }
                    }


                    item.getChildByName("hp").getComponent(ProgressBar).progress = hero.GetHpPercent();

                }
            })
        }
    }
    private onConfigDataUpdate(): void {
        this.updateAutoBattleState();
        this.updateBattleSpeed();
    }

    private onReConnect(){
        if(this.gameSpeed > 0)
        {
            this.OnTimeScaleClick(null, -1);
        }
    }

    private onReConnectSuccess(){

        this.OnTimeScaleClick(null, this.gameSpeed);
        
    }

    private onHeroDeployed() {
        this.selfBattlePower.string = BattleReadyLogic.ins.GetSelfBattlePower().toString();
    }



    onEditDidEnded(editbox) {
        let value = editbox.string;
        Logger.log('onEditDidEnded ----------->>>>>', value);
        if (Runtime.gameView) {
            let value = Number.parseInt(editbox.string);
            if (value > 0) {
                if (Runtime.gameView.actorViews[value]) {
                    let actor = Runtime.gameView.actorViews[value].actor;
                    if (actor) {
                        let data =
                        {
                            Id: actor.actorId,
                            Name: actor.name,
                            Pos: actor.pos.x + "$" + actor.pos.y,
                            AngleY: actor.angleY,
                            Hp: actor.hp,
                        }
                        let str = JSON.stringify(data).slice(1, -1);
                        str = str.replace(/\,/g, "\n");
                        str = str.replace(/\$/g, ",");
                        this.info.string = str;

                    }
                }

            }
        }

    }

    protected OnBattlePauseClick(button: Button) {
        this.pauseNode.active = true;
        this.OnTimeScaleClick(null, -1);

    }

    protected OnAutoBattleClick(button: Button) {
        let autoBttleState: number = GetGameData(PlayerDataMap.BattleAuto);
        SaveGameData(PlayerDataMap.BattleAuto, autoBttleState == undefined || autoBttleState == 0 ? 1 : 0);
    }

    private updateAutoBattleState(): void {
        let autoBttleState: number = GetGameData(PlayerDataMap.BattleAuto);
        this.isAutoBattle = autoBttleState == undefined || autoBttleState == 0 ? false : true;
        this.autoEffect.node.active = this.isAutoBattle;
        this.autoBattle.isChecked = this.isAutoBattle;

        if (Runtime.game) {
            let event =
            {
                type: "PlayerAutoCastSkill",
                isAuto: this.isAutoBattle
            }
            Runtime.game.PlayerInput(event)
        }
    }
    private updateBattleSpeed(): void {
        let battleSpeed: number = GetGameData(PlayerDataMap.BattleSpeed);
        if (battleSpeed > 1.5)
            battleSpeed = 1.5;

        this.gameSpeed = battleSpeed == undefined || battleSpeed == 0 ? 1 : battleSpeed;
        this.timeScale.isChecked = battleSpeed > 1 ? true : false;
        this.timeScale.getComponent(Sprite).enabled = !this.timeScale.isChecked;
        Runtime.game?.SetGameSpeed(this.gameSpeed);
    }

    // 设置战斗时间速度
    protected OnTimeScaleClick(event, speed?: number) {
        if (speed) {
            speed = speed < 0 ? 0 : speed;
            Runtime.game?.SetGameSpeed(speed);
        }
        else {
            let battleSpeed: number = GetGameData(PlayerDataMap.BattleSpeed);
            SaveGameData(PlayerDataMap.BattleSpeed, battleSpeed == undefined || battleSpeed <= 1 ? 1.5 : 1);
        }

    }


    protected onSetAttackRolesRet(data: any) {
        if  (!this.toBattle) 
        {
            Tips.Show(CfgMgr.GetText("battle_6"));
            return;
        }
        if (PlayerData.fightState == FightState.PvP) {
            let sendData =
            {
                type: MsgTypeSend.Plunder,
                data: {
                    player_id: BattleReadyLogic.ins.defID2HomeId[0],
                    homeland_id: BattleReadyLogic.ins.defID2HomeId[1],
                    revenge_battle_id: BattleReadyLogic.ins.defID2HomeId[2],
                    season_id: BattleReadyLogic.ins.defID2HomeId[3],
                    is_revenge: BattleReadyLogic.ins.defID2HomeId[2] != null,
                    assist_role_id: BattleReadyLogic.ins.assistRoleId,
                    version: BattleLogic.version
                }
            }
            Session.Send(sendData, MsgTypeSend.Plunder, 5000);
        }
        else if (PlayerData.fightState == FightState.PvE) {
            let sendData =
            {
                type: MsgTypeSend.PvE,
                data: {
                    stage_id: BattleReadyLogic.ins.defID2HomeId[2],

                }
            }
            Session.Send(sendData, MsgTypeSend.PvE, 2000);
        }
    }

    private onBattleProgressRet(data: any) {
        if (!data.is_finished)
            return;

        if(data.battle_id !== this.battleID) return;

        this.pauseNode.active = false;
        this.battleStartTime = 0;
        this.updateData = false;

        setTimeout(()=>{
            let isWin = data.result === "win";
            this.resultNode.getChildByPath('bg/win').active = isWin;
            this.resultNode.getChildByPath('bg/lose').active = !isWin;
            this.resultNode.getChildByPath('btn/lose').active = !isWin;
            this.resultNode.getChildByPath('btn/win').active = isWin;
            //let type = PlayerData.fightState == FightState.PvP ? "pvp" : "pve";
            let type = "pve";
            if (isWin)
                this.WinShow(type);
            else
                this.LoseShow(type);
        }, 2000);

    }

    protected OnCastSkill(btn: any) {
        if (Runtime.game) {
            let event =
            {
                type: "PlayerCastSkill",
                slotId: btn.data
            }
            Runtime.game.PlayerInput(event)
        }
    }

    private async BattleStartPush(data: any) {
        Logger.log('--------->>>>>>>>>BattleStartPush', data);
        if(BattleLogic.ins?.isBattleStart) return;

        HomeScene.ins.VisibleBuilding(BuildingType.cheng_qiang, false);
        HomeScene.ins.VisibleBuilding(BuildingType.fang_yu_ta, false);
        HomeScene.ins.VisibleBuilding(BuildingType.ji_di, false);
        this.onToggleChange(this.bgmToggle, true);
        this.onToggleChange(this.soundToggle, true);
        this.battleIdText.string = "";
        this.shieldNode.active = false;
        PlayerData.LootMatchList = []; //清空搜索列表

        let attackerData;
        if (data.battle_type == "plunder") {
            this.battleID = data.plunder_data.battle_id;
            attackerData = data.plunder_data.attacker_battle_data;
            if (!attackerData.roles)
                attackerData.roles = [];

            if (data.plunder_data.attacker_assist_role != null)
                attackerData.roles.push(data.plunder_data.attacker_assist_role)
            this.typeLesionPct = Number(CfgMgr.GetCommon(StdCommonType.PVP).LesionPct);
        }
        else if (data.battle_type == "pve") {
            this.battleID = data.pve_data.battle_id;
            this.stageId = data.pve_data.stage_id;
            attackerData = data.pve_data.player_battle_data;
            this.typeLesionPct = Number(CfgMgr.GetCommon(StdCommonType.PVE).LesionPct);
        }

        if (!BattleReadyLogic.ins.onBattleInit)
            BattleReadyLogic.ins.onBattleInit = this.onBattleInit.bind(this);
        BattleReadyLogic.ins.BattleStartPush(data);

        this.battleNode.active = true;
        let roles = attackerData.roles;
        let attackRoles = attackerData.attack_lineup;
        if (roles == undefined || roles == null || roles.length == 0) {
            console.error('attackRoles is null');
            return;
        }

        this.onTimeScaleUnLock(); // todo 先解锁倍数
        this.slot2Item.clear();
        this.slot2Tween.clear();
        this.playStartAni();

        let itemCount = this.skillItemContent.children.length;
        for (let i = itemCount; i < attackRoles.length; i++) {
            let item = instantiate(this.skillItem)
            this.skillItemContent.addChild(item);
        }

        for (let i = 0; i < attackRoles.length; i++) {
            let item = this.skillItemContent.children[i];
            if (attackRoles[i] == undefined || attackRoles[i] == null || attackRoles[i].role_id == '') {
                item.active = false;
                continue;
            }

            for (let j = 0; j < roles.length; j++) {
                if (roles[j].id == attackRoles[i].role_id) {
                    let info = CfgMgr.GetRole()[roles[j].type];
                    let skillconfig = roles[j].active_skills;
                    if (!skillconfig || skillconfig.length < 1) continue;
                    const skill = CfgMgr.GetActiveSkill(skillconfig[1].skill_id, skillconfig[1].level)
                    if (!skill) {
                        Logger.log("--------->>>>>>>>>skill is null");
                        item.active = false;
                        continue;
                    }

                    let skillNode = item.getChildByName("skill");
                    let button = skillNode.getChildByName('choose').getComponent(Button);
                    //button.interactable = false;
                    item.getChildByName("head").active = true;
                    skillNode.active = true;
                    skillNode.setScale(0, 1);

                    item.getChildByPath("head/bgkuang/icon").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(`${folder_head_card}${info.Icon.toString()}/spriteFrame`, SpriteFrame);
                    button.node.getChildByName('icon').getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(`${folder_skill}${skill.icon.toString()}/spriteFrame`, SpriteFrame);
                    button.node.on(Button.EventType.CLICK, this.OnCastSkill, button);
                    button["data"] = i;
                    this.slot2Item.set(i, item);
                    this.slot2Tween.set(i, false);
                    this.slot2Die.set(i, false);
                    item.active = true;
                    break;
                }
            }
        }

    }

    private InitSkillData() {
        this.slot2Hero.clear();

        for (let i = 0; i < 5; i++) {
            let hero = Runtime.gameLogic.GetHeroBySkillSlot(i)
            if (hero)
                this.slot2Hero.set(i, hero);
        }

        this.updateData = true;
    }


    // 逻辑层战斗结束回调，向服务器发送结算
    private onBattleOver(data: any) {
        let casualties = [];
        for (let soldierKey in Runtime.collector.soldierStats) {
            let soldierStats = Runtime.collector.soldierStats[soldierKey];
            if (soldierStats) {
                let casualtie = {}
                casualtie["player_id"] = soldierKey == '1' ? PlayerData.roleInfo.player_id : BattleReadyLogic.ins.defID2HomeId[0];
                casualties.push(casualtie);
                casualtie["soldiers"] = []


                let lesionPct = this.typeLesionPct;
                for (let typeKey in soldierStats) {
                    let typeStats = soldierStats[typeKey];

                    // 初始化伤害和治疗变量
                    let damage = 0;
                    let heal = 0;

                    // 累加伤害值
                    if (Runtime.collector.damageStats && Runtime.collector.damageStats[soldierKey] && Runtime.collector.damageStats[soldierKey][typeKey]) {
                        damage = Runtime.collector.damageStats[soldierKey][typeKey];
                    }

                    // 累加治疗值
                    if (Runtime.collector.healStats && Runtime.collector.healStats[soldierKey] && Runtime.collector.healStats[soldierKey][typeKey]) {
                        heal = Runtime.collector.healStats[soldierKey][typeKey];
                    }

                    let tmpDamage = (damage - heal) * lesionPct;

                    let sortedQualities = Object.keys(typeStats)
                        .map(key => ({ quality: parseInt(key), id: typeStats[key].id, count: typeStats[key].count, hp: typeStats[key].hp }))
                        .sort((a, b) => b.quality - a.quality); // 从高到低排序

                    for (let i = 0; i < sortedQualities.length; i++) {
                        if (tmpDamage > sortedQualities[i].count * sortedQualities[i].hp) {
                            casualtie["soldiers"].push({ id: sortedQualities[i].id, count: sortedQualities[i].count });
                            tmpDamage -= sortedQualities[i].count * sortedQualities[i].hp;
                        }
                        else {
                            let count = Math.floor(tmpDamage / sortedQualities[i].hp);
                            if (count > 0)
                                casualtie["soldiers"].push({ id: sortedQualities[i].id, count: count });
                            tmpDamage = 0;
                            break;
                        }
                    }

                }
            }
        }
        this._resultReport = {};
        this._resultReport = Runtime.collector.settlement();

        let sendData =
        {
            type: MsgTypeSend.BattleProgress,
            data: {
                battle_id: this.battleID,
                process:
                {
                    current_frame: Runtime.game.currFrame,
                    operations: data.operations,
                    casualties: casualties,
                    occupation_rate: this.GetOccupationRate(2),
                    is_finished: true,
                    result: data.result,
                    report: JSON.stringify(this._resultReport),
                },
            }
        }
        Session.Send(sendData);
    }

    private GetOccupationRate(camp: number) {
        if (Runtime.collector) {
            const totalHp = Runtime.collector.unitCampInitStats[camp]?.totalHp;
            const unitBattleStats = Runtime.collector.unitBattleStats;
            let totalDefense = 0;
            let totalHeal = 0;
            if (unitBattleStats.hasOwnProperty(camp)) {
                const campData = unitBattleStats[camp];
                for (let key in campData) {
                    if (campData.hasOwnProperty(key)) {
                        let value = campData[key]
                        totalDefense += Number(value.defense);
                        totalHeal += Number(value.heal);
                    }
                }
            }
            let rate = totalHp != undefined && totalHp > 0 && totalHeal < totalDefense ? (totalDefense - totalHeal) / totalHp : 0;

            return Math.min(rate, 1);
        }

        return 0;
    }



    private onBattleProcess(data) {
        data.occupation_rate = this.GetOccupationRate(2); // 防守方
        let sendData =
        {
            type: MsgTypeSend.BattleProgress,
            data: {
                battle_id: this.battleID,
                process: data
            }
        }
        Session.Send(sendData);
    }

    private onTimeScaleUnLock(unlock: boolean = true) {
        this.timeScale.interactable = unlock;
        this.lock.active = !this.timeScale.interactable;
    }


    private OnExitBattleResClick(event: Event) {
        Runtime.battleModule?.Over('lose');
    }

    private OnContinueBattleClick(event: Event) {
        AudioMgr.PlayOnce(Audio_CommonClick);
        this.pauseNode.active = false;
        this.OnTimeScaleClick(null, this.gameSpeed);
    }

    private OnNextBattleClick(event: Event) {

    }

    private OnSettingClick(event: Event) {
        this.settingNode.active = true;
    }

    private WinShow(type: string) {
        this.itemContent = this.winItemContent;
        this.resultShow();
        
        this.resultEffect.setAnimation(0, type +"winstart", false);
        this.resultEffect.setCompleteListener(() => {
            this.resultEffect.setAnimation(0, type + "winloop", true);
        })

        this.PlaySound("battle_win");
    
    }

    private resultShow(){
        this.resultNode.active = true;
        this.canExit = false;
        this.itemContent.active = false;

        this.resultNode.getChildByName('mask').active = false;
        this.resultNode.getChildByName('battleReport').active = false;

        let bg = this.resultNode.getChildByName('bg');
        let btn = this.resultNode.getChildByName('btn');
        let btnList = []
        btnList.push(btn.getChildByPath('lose/level'));
        btnList.push(btn.getChildByPath('lose/zhaomu'));
        btnList.push(btn.getChildByPath('lose/zhenrong'));
        btnList.push(btn.getChildByName('fanhui'));
        btnList.push(btn.getChildByPath('lose/next'));
        let winNode = btn.getChildByPath('win/next');
        winNode.getChildByName("text").getComponent(Label).string = PlayerData.fightState == FightState.PvE ? "继续探险" : "继续掠夺";
        btnList.push(winNode);
        
        bg.setScale(0, 0);
        btn.setScale(0, 0);
        tween(bg).to(0.5, { scale: new Vec3(1, 1, 1) }).call(() => {
            this.isBattleResult = true;
            for (let i = 0; i < btnList.length; i++) {
                let btn = btnList[i];
                btn.setScale(0, 0);
                tween(btn).to(0.3, { scale: new Vec3(1.2, 1.2, 1) }).call(()=>{
                    tween(btn).to(0.1, { scale: new Vec3(1, 1, 1) }).start();
                }).start();
            }

            btn.setScale(1, 1);

            setTimeout(() => {
                this.resultNode.getChildByName('mask').active = true;
                this.resultNode.getChildByName('battleReport').active = true;
                this.canExit = true;
            }, 0.5)
            if(this.canShowReward)
                this.showItems();
        }).start();


    }

    private showItems() {
        this.itemContent.active = true;
        let children = this.itemContent.children;
        let childCount = children.length;
        let spacing = 50; // 子节点之间的间隔
        let childWidth = 150; // 子节点的宽度
        
        // 计算每行的宽度和高度
        let rowWidth = childWidth * 5 + spacing * (5 - 1); // 5个子节点的宽度加上4个间隔
        let rowHeight = childWidth + spacing; // 一个子节点的高度加上一个间隔

        let startX = 0; // 起始位置的X坐标，设置为0以使中心点为0
        let row = Math.floor(childCount / 6)
        let startY =  (childWidth * row  + spacing * (row - 1)) * 0.5 - childWidth / 2; // 起始位置的Y坐标，设置为0以使中心点为0
        
        // 从上到下排列子节点，从左到右
        for (let i = 0; i < childCount; i++) {
             let child = children[i];
             let row = Math.floor(i / 5); // 计算当前子节点所在的行
             let col = i % 5; // 计算当前子节点所在的列
        
             // 计算子节点的X和Y位置
             let childX = startX + col * (childWidth + spacing) - rowWidth / 2 + childWidth / 2;
             let childY = startY - row * (childWidth) + childWidth / 2 - (row - 1) * spacing;
        
             // 设置子节点的位置
             child.setPosition(childX, childY);
             child.setScale(0, 0);
        
             // 缩放动画
             tween(child).delay(i * 0.2).to(0.3, { scale: new Vec3(1.2, 1.2, 1) }).call(() => {
                 tween(child).to(0.1, { scale: new Vec3(1, 1, 1) }).start();
             }).start();
        }
        this.canShowReward = false;
    }

    private PlaySound(url) {
        AudioMgr.PlayOnce({
            url: `${folder_sound}${url}`,
            num: 1,
            group: AudioGroup.Sound
        });
    }

    private LoseShow(type: string) {
        let transform = this.resultNode.getChildByPath('btn/lose');
        this.itemContent = this.loseItemContent;

        this.resultShow();

        this.resultEffect.setAnimation(0, type +"loststart", false);
        this.resultEffect.setCompleteListener(() => {
            this.resultEffect.setAnimation(0, type + "lostloop", true);
        })

        transform.getChildByName("level").off(Button.EventType.CLICK);
        transform.getChildByName("level").on(Button.EventType.CLICK, () => {
            this.enterHome = true;
            this.Hide();
            Goto(PANEL_TYPE.RolePanel);
        }, this);

        transform.getChildByName("zhaomu").off(Button.EventType.CLICK);
        transform.getChildByName("zhaomu").on(Button.EventType.CLICK, () => {
            this.enterHome = true;
            this.Hide();
            Goto(PANEL_TYPE.ShopPanel, ShopGroupId.BaseShop);
        }, this);


        transform.getChildByName("zhenrong").off(Button.EventType.CLICK);
        transform.getChildByName("zhenrong").on(Button.EventType.CLICK, () => {
            Tips.Show("功能暂未开放");
        }, this);


        this.PlaySound("battle_lose");

        //this.resultNode.getChildByName('lose').active = true;
    }

    private onBattleReport() {
        if(!this._resultReport)
            this._resultReport = Runtime.collector.settlement();
        BattleReportPanel.Show({ resultReport: this._resultReport, stageId: this.stageId, battleID: this.battleID});
    }

    private OnExitBattle() {
        if (!this.canExit) return;
        this.Hide();
    }
    private OnEnterHome(){
        if (!this.canExit) return;
        this.enterHome = true;
        this.Hide();
    }

    onBattleInit() {
        if (!Runtime.battleModule.onInitHeroFinish)
            Runtime.battleModule.onInitHeroFinish = this.InitSkillData.bind(this);
        if (!Runtime.battleModule.onBattleOver)
            Runtime.battleModule.onBattleOver = this.onBattleOver.bind(this);
        if (!Runtime.battleModule.onBattleProcess)
            Runtime.battleModule.onBattleProcess = this.onBattleProcess.bind(this);

    }

    private getProfession(type: number, camp: number = 1): string {
        return path.join("sheets/common/profession", type.toString() + (camp == 1 ? "_B" : "_R"), "spriteFrame");
    }

    private playStartAni() {
        BattleArrayPanel.Hide();
        //this.left.active = true; // tmp

        let start = this.node.getChildByName("Start");
        AdaptBgTop(start.getChildByName("mask"));
        start.active = true;
        let ske = this.node.getChildByPath("Start/startEffect").getComponent(sp.Skeleton);
        ske.setAnimation(0, "animation", false);
        let self = this;
        ske.setCompleteListener(() => {
            setTimeout(() => {
                self.node.getChildByName("Start").active = false;
                console.log("start battle animation play end!")
                BattleLogic.ins.start();
                self.onConfigDataUpdate();
                this.battleStartTime = Date.now();
            }, 0.5)
        })

        this.PlaySound("battle_start");

        // let blue = this.node.getChildByPath("Start/blue");
        // let red = this.node.getChildByPath("Start/red");
        // let effect = this.node.getChildByPath("Start/effect");
        // effect.setScale(0, 0, 0);
        // blue.setPosition(new Vec3(-540, 125, 0));
        // red.setPosition(new Vec3(545, 125, 0));
        // let timer = 0.3
      

        // let self = this;
        // tween(blue).to(timer, { position: new Vec3(10, 125, 0) }).start();
        // tween(red).to(timer, { position: new Vec3(-33, 125, 0) }).call(() => {
        //     tween(effect).to(0.2, { scale: new Vec3(1, 1, 1) }).call(() => {
        //         setTimeout(() => {
        //             self.node.getChildByName("Start").active = false;
        //             console.log("start battle animation play end!")
        //             BattleLogic.ins.start();
        //             self.onConfigDataUpdate();
        //             this.battleStartTime = Date.now();
        //         }, 0.5)
        //     }
        //     ).start();
        // }).start();

    }


    private async SettlePvEPush(data) {
        //if(data.battle_id !== this.battleID) return;
        if (data.pve_data)
            PlayerData.updataPveData(data.pve_data);

        const content = data.result == "win" ? this.winItemContent : this.loseItemContent;

        content.removeAllChildren();
        content.active = false;

        if (data.reward_ids != null) {
            let table = { RewardType: data.reward_types, RewardID: data.reward_ids, RewardNumber: data.reward_numbers };
            let items = FormatRewards(table)
            for (let i = 0; i < items.length; i++) {
                let item = instantiate(this._IconItem)
                content.addChild(item);
                // item.getChildByName("bg").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(path.join(folder_icon, "quality", items[i].quality + "_bag_bg", "spriteFrame"), SpriteFrame);
                // item.getChildByName("icon").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(items[i].icon, SpriteFrame);
                // item.getChildByName("count").getComponent(Label).string = formatNumber(items[i].value);
                // item.off(Button.EventType.CLICK);
                // item.on(Button.EventType.CLICK, () => { ItemTips.Show(items[i]) }, this)
            }

            for (let i = 0; i < items.length; i++) {
                let item = content.children[i];
                await this.addRewardItem(item, items[i].icon, items[i].quality, items[i].value, items[i].id);
            }
        }

        this.canShowReward = true;
        if(this.isBattleResult)
            this.showItems();
    }

    private async SettlePvPPush(data) {
        //if(data.battle_id !== this.battleID) return;
        const content = data.result == "win" ? this.winItemContent : this.loseItemContent;

        content.removeAllChildren();
        content.active = false;

        let itemInfos = [];
        // 定义一个映射，将类型映射到对应的索引
        const typeToIndex = {
            currency: 1,
            water: 8,
            rock: 7,
            wood: 6,
            seed: 9
        };

        // 遍历 data 对象的属性
        for (const type in data) {
            const index = typeToIndex[type];
            const itemInfo = CfgMgr.Getitem(index); // 获取配置项信息
            if (itemInfo) {
                // 修改 Icon 字段，添加 folder_item 前缀
                // 保留 Quality 和 count 字段
                itemInfos.push({
                    Id: itemInfo.Items,
                    Icon: `${folder_item}${itemInfo.Icon}/spriteFrame`,
                    Quality: CardQuality[itemInfo.Quality],
                    count: data[type]
                });
            }
        }
        for (const itemInfo of itemInfos) {
            let item = instantiate(this._IconItem)
            content.addChild(item);
        }

        for(let i = 0; i < itemInfos.length; i++){
            let itemInfo = itemInfos[i];
            let item = content.children[i];
            await this.addRewardItem(item, itemInfo.Icon, itemInfo.Quality, itemInfo.count, itemInfo.Id);
        }

        this.canShowReward = true;
        if(this.isBattleResult)
            this.showItems();
    }

    private async addRewardItem(item, Icon, Quality, Count, Id) {
        item.getChildByName("bg").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(path.join(folder_icon, "quality", Quality + "_bag_bg", "spriteFrame"), SpriteFrame);
        item.getChildByName("icon").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(Icon, SpriteFrame);
        item.getChildByName("count").getComponent(Label).string = formatNumber(Count, 2);
        item.off(Button.EventType.CLICK);
        item.on(Button.EventType.CLICK, () => { ItemTips.ShowHideNode({id: Id, count: Count}) }, this)
    }

    private number2String(value) {
        if (value < 10)
            return "0" + value.toString();

        return value.toString();
    }

    private onPvERet(data) {
        PlayerData.updataPveData(data.pve_data);
    }

    private onToggleChange(toggle:Toggle, isInit:boolean = false):void{
        let onCont:Node = toggle.node.getChildByName("onCont");
        let offCont:Node = toggle.node.getChildByName("offCont");
        onCont.active = toggle.isChecked;
        offCont.active = !toggle.isChecked;
        if(!isInit){
            let data:SSettingData = LocalStorage.GetObject("Setting_Data");
            switch(toggle){
                case this.bgmToggle:
                    data.bgmIsOpen = toggle.isChecked;
                    LocalStorage.SetObject("Setting_Data", data);
                    AudioMgr.All(!data.bgmIsOpen, AudioGroup.Music);
                    break;
                case this.soundToggle:
                    data.soundIsOpen = toggle.isChecked;
                    LocalStorage.SetObject("Setting_Data", data);
                    AudioMgr.All(!data.soundIsOpen, AudioGroup.Sound);
                    AudioMgr.All(!data.soundIsOpen, AudioGroup.Skill);
                    break;
            }
            
        }
    }

} 