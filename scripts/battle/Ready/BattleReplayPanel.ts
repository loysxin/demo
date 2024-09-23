import { Panel } from "../../GameRoot";
import { BattleLogic } from '../BattleLogic';
import { HomeLogic } from '../../module/home/HomeLogic';
import { Runtime } from "../BattleLogic/Runtime";
import { Button, Label, Toggle, Node, Sprite, SpriteFrame, ProgressBar, tween, Vec3, instantiate, sp } from 'cc';
import { LootLogPanel } from "../../module/loot/LootLogPanel";
import { HomeUI } from "../../module/home/panel/HomeUI";
import { SSettingData } from "../../module/roleModule/PlayerData";
import LocalStorage from "../../utils/LocalStorage";
import { Audio_CommonClick, AudioGroup, AudioMgr } from "../../manager/AudioMgr";
import { AdaptBgTop } from "../../module/common/BaseUI";
import { CfgMgr } from "../../manager/CfgMgr";
import { folder_head_card, folder_skill, folder_sound, ResMgr } from "../../manager/ResMgr";
import { Hero } from "../BattleLogic/logic/actor/Hero";
import { BattleReportPanel } from "./BattleReportPanel";
import { LootPanel } from "../../module/loot/LootPanel";


export class BattleReplayPanel extends Panel {

    protected prefab: string = "prefabs/battle/BattleReplayPanel";
    private timeString: Label;

    private pauseNode: Node;
    private gameSpeed: number = 1;
    private settingNode: Node;
    private bgmToggle:Toggle;
    private soundToggle:Toggle;

    private slot2Hero: Map<number, Hero>;
    private slot2Item: Map<number, Node>;
    private slot2Tween: Map<number, boolean>;
    private slot2Die: Map<number, boolean>;
    
    private skillItemContent: Node;
    private skillItem: Node;

    private updateData: boolean = false;

    private resultNode: Node;
    private resultEffect: sp.Skeleton;

    private canExit: boolean = false;
    private enterHome: boolean = false;

    private beishuNode: Node;
    _resultReport;
    private battleID;

    exitType: number = 0;

    constructor() {
        super();
        this.slot2Hero = new Map<number, Hero>();
        this.slot2Item = new Map<number, Node>();
        this.slot2Tween = new Map<number, boolean>();
        this.slot2Die = new Map<number, boolean>();
    }

    protected override onLoad(): void {

        this.timeString = this.find("Top/timeBg/time").getComponent(Label);

        this.pauseNode = this.find("Middle/pause");
        this.settingNode = this.find("Middle/setting");
        this.find("Middle/pause/set").on(Button.EventType.CLICK, this.OnSettingClick, this);
        this.settingNode.getChildByName("closeBtn").on(Button.EventType.CLICK, ()=>{this.settingNode.active = false}, this);

        this.bgmToggle = this.find("Middle/setting/bgm/bgmToggle", Toggle);
        this.soundToggle = this.find("Middle/setting/audio/audioToggle", Toggle);
        this.bgmToggle.node.on(Toggle.EventType.TOGGLE, this.onToggleChange, this);
        this.soundToggle.node.on(Toggle.EventType.TOGGLE, this.onToggleChange, this);


        this.find("Bottom/battle/pauseBtn").on(Button.EventType.CLICK, ()=>{
            this.pauseNode.active = true;
            this.SetGameSpeed(0);
        }, this);

        this.find("Middle/pause/continue").on(Button.EventType.CLICK, this.OnContinueBattleClick, this);
        this.find("Middle/pause/closeBtn").on(Button.EventType.CLICK, this.OnContinueBattleClick, this);
        this.find("Middle/pause/exit").on(Button.EventType.CLICK, this.OnExitBattle, this);
        this.skillItemContent = this.find("Bottom/battle/skillList/view/content");
        this.skillItem = this.node.getChildByPath("Item/SkillItem");

        this.resultNode = this.find("Result");
        this.resultEffect = this.resultNode.getChildByPath("effect").getComponent(sp.Skeleton);
        this.resultNode.getChildByPath("mask").on(Button.EventType.CLICK, this.OnExitBattle, this);
        this.resultNode.getChildByName("battleReport").on(Button.EventType.CLICK, this.onBattleReport, this);
        this.beishuNode = this.find("Bottom/battle/beishu");
        this.beishuNode.on(Button.EventType.CLICK, this.onBeishuClick, this);

        AdaptBgTop(this.pauseNode.getChildByName("mask"));
        AdaptBgTop(this.resultNode.getChildByName('mask'));
    }

    protected async onShow(...arg: any[]) {
        this.settingNode.active = false;
        this.pauseNode.active = false;
        this.resultNode.active = false;

        let data = arg[0]
        this.exitType = data.exitType;
        data.isReplay = true;
        data.battle_type = "plunder"
        data.homeland_id = data.plunder_data.defender_battle_data.homeland_id;
        this.battleID = data.plunder_data.battle_id;
        await HomeLogic.ins.EnterPvPReplayScene(data.homeland_id, data.plunder_data.defender_battle_data.buildings);
        if(!BattleLogic.ins) new BattleLogic();
        BattleLogic.ins.BattleStartPushData = data;
        BattleLogic.ins.init();
        this.playStartAni();
        //BattleLogic.ins.start();

  

        Runtime.battleModule.onBattleOver = (result)=>
        {
            this.node.getChildByName("Result").active = true;
            let mask = this.node.getChildByPath("Result/mask");
            mask.active = true;
            mask.off(Button.EventType.CLICK);
            mask.on(Button.EventType.CLICK,()=>{
                mask.active = false;
                this.Hide();
            })

            let isWin = result === "win";
            this.resultNode.getChildByPath('bg/win').active = isWin;
            this.resultNode.getChildByPath('bg/lose').active = !isWin;
            this.resultNode.getChildByPath('btn/lose').active = !isWin;
            this.resultNode.getChildByPath('btn/win').active = isWin;
            if (isWin)
                this.WinShow();
            else
                this.LoseShow();
        }

        if (!Runtime.battleModule.onInitHeroFinish)
            Runtime.battleModule.onInitHeroFinish = this.InitSkillData.bind(this);

        {
            this.find("Top/RZhanLi").getComponent(Label).string = data.plunder_data.defender_battle_data.battle_power.toString();
            this.find("Top/LZhanLi").getComponent(Label).string = data.plunder_data.attacker_battle_data.battle_power.toString();
            this.find("Middle/pause/version").getComponent(Label).string = BattleLogic.version;
        }


        this.onToggleChange(this.bgmToggle, true);
        this.onToggleChange(this.soundToggle, true);



        {
            let attackerData = data.plunder_data.attacker_battle_data;
            let roles = attackerData.roles;
            let attackRoles = attackerData.attack_lineup;
            if (roles == undefined || roles == null || roles.length == 0) {
                console.error('attackRoles is null');
                return;
            }
    
            this.slot2Item.clear();
            this.slot2Tween.clear();
    
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
    }

    protected update(dt: number): void {
        if (!Runtime.game) return;
        let time = 120 - Runtime.game.currTime;
        this.timeString.string = this.number2String(Math.floor(time / 60)) + ":" + this.number2String(Math.floor(time % 60));


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


    public flush(...args: any[]): void {
    }

    protected onHide(...args: any[]): void {
        this.node.getChildByName("Result").active = false;

        this.slot2Hero.clear();
        this.slot2Item.clear();
        this.slot2Tween.clear();
        this.slot2Die.clear();
        this.skillItemContent.removeAllChildren();
        
        HomeLogic.ins.EnterMyHomeScene(undefined, false);

        if(this.exitType == 1)
        {
            LootPanel.Show();
            LootLogPanel.Show();
        }
        else
        {
            HomeUI.Show();
        }

        BattleLogic.ins?.end();
    }

    private number2String(value) {
        if (value < 10)
            return "0" + value.toString();

        return value.toString();
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

    private OnContinueBattleClick(event: Event) {
        AudioMgr.PlayOnce(Audio_CommonClick);
        this.pauseNode.active = false;
        this.SetGameSpeed(this.gameSpeed);
    }

    private SetGameSpeed(speed: number){
        speed = speed < 0 ? 0 : speed;
        Runtime.game?.SetGameSpeed(speed);
        if(speed != 0)
            this.gameSpeed = speed;
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

    private WinShow() {
        this.resultShow();
        
        this.resultEffect.setAnimation(0,  "pvpwinstart", false);
        this.resultEffect.setCompleteListener(() => {
            this.resultEffect.setAnimation(0, "pvpwinloop", true);
        })

        this.PlaySound("battle_win");
    
    }
    
    private PlaySound(url) {
        AudioMgr.PlayOnce({
            url: `${folder_sound}${url}`,
            num: 1,
            group: AudioGroup.Sound
        });
    }

    private resultShow(){
        this.resultNode.active = true;
        this.canExit = false;

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
        
        bg.setScale(0, 0);
        btn.setScale(0, 0);
        tween(bg).to(0.5, { scale: new Vec3(1, 1, 1) }).call(() => {
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
        }).start();


    }


    private LoseShow() {
        this.resultShow();

        this.resultEffect.setAnimation(0, "pvploststart", false);
        this.resultEffect.setCompleteListener(() => {
            this.resultEffect.setAnimation(0, "pvplostloop", true);
        })

        this.PlaySound("battle_lose");
    }

    private OnExitBattle() {
        this.Hide();
    }


    private onBattleReport() {
        if(!this._resultReport)
            this._resultReport = Runtime.collector.settlement();
        BattleReportPanel.Show({ resultReport: this._resultReport, battleID: this.battleID});
    }

    private onBeishuClick(){
        this.beishuNode.children.forEach((node)=>{
            node.active = false;
        })
        this.gameSpeed = this.gameSpeed == 1 ? 1.5 : this.gameSpeed == 1.5 ? 3 : 1;
        this.beishuNode.getChildByName("x" + this.gameSpeed).active = true;
        this.SetGameSpeed(this.gameSpeed);
    }


    private playStartAni() {

        let start = this.node.getChildByName("Start");
        AdaptBgTop(start.getChildByName("mask"));
        start.active = true;
        let ske = this.node.getChildByPath("Start/startEffect").getComponent(sp.Skeleton);
        ske.setAnimation(0, "animation", false);
        let self = this;
        ske.setCompleteListener(() => {
            setTimeout(() => {
                self.node.getChildByName("Start").active = false;
                BattleLogic.ins.start();
                this.gameSpeed = 1;
                this.onBeishuClick();
            }, 0.5)
        })

        this.PlaySound("battle_start");

    }

    private OnSettingClick(event: Event) {
        this.settingNode.active = true;
    }
}




