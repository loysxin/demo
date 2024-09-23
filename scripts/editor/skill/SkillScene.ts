import { _decorator, Asset, AssetManager, Camera, Component, EditBox, find, Input, instantiate, Label, Layout, Node, path, Prefab, resources, UITransform } from 'cc';
import { GameRoot } from '../../GameRoot';
import { ResMgr } from '../../manager/ResMgr';
import { SceneEditor } from '../SceneEditor';
import { CfgMgr } from '../../manager/CfgMgr';
import { SceneCamera } from '../../module/SceneCamera';
import { FrameType, SkillSetter } from './SkillSetter';
import { Tips } from '../../module/login/Tips';
import { EventMgr } from '../../manager/EventMgr';
import { SkillLineEditor } from './SkillLineEditor';
import { IsArray, maxx, randomI, SaveFile, Second } from '../../utils/Utils';
import { HomeLogic } from '../../module/home/HomeLogic';
import { HomeScene } from '../../module/home/HomeScene';
import { SkillAction, SkillBullet, SkillCfg, SkillEffect, SkillFrameEvent } from '../../module/home/SkillStruct';
import { Effect } from '../../module/home/entitys/Effect';
import { IEntity } from '../../module/home/entitys/IEntity';
import { Hero } from '../../module/home/entitys/Hero';
import { LikeNode, map } from '../../module/home/MapData';
import { SkillEditLogic } from './SkillEditLogic';
import { GameSet } from '../../module/GameSet';
import Logger from '../../utils/Logger';
import { Selector } from './Selector';
// import * as fgui from "fairygui-cc";
import { BattleLogic } from '../../battle/BattleLogic';
const { ccclass, property } = _decorator;

const buildings = {
    "1": {
        "ID": 1,
        "Level": 3,
        "IsUpgrading": false,
        "UpgradeCompleteTime": 0,
        "workers": 0
    },
    "2": {
        "ID": 2,
        "Level": 1,
        "IsUpgrading": true,
        "UpgradeCompleteTime": 1715130103,
        "workers": 1
    },
    "3": {
        "ID": 3,
        "Level": 1,
        "IsUpgrading": false,
        "UpgradeCompleteTime": 0,
        "workers": 0
    },
    "4": {
        "ID": 4,
        "Level": 0,
        "IsUpgrading": true,
        "UpgradeCompleteTime": 1715226134,
        "workers": 0
    }
}

@ccclass('SkillScene')
export class SkillScene extends Component {

    @property(Prefab)
    $SkillLine: Prefab;
    @property(Prefab)
    $SkillBox: Prefab;
    @property(Prefab)
    $SkillBullet: Prefab;
    @property(Prefab)
    $SkillEffect: Prefab;
    @property(Prefab)
    $SkillShake: Prefab;
    @property(Prefab)
    $SkillSound: Prefab;
    @property(Prefab)
    $SkillAffect: Prefab;

    private btns: Selector[];
    private skill: Selector;
    private box: Selector;
    private bullet: Selector;
    private effect: Selector;
    private sound: Selector;
    private shake: Selector;
    private body: Selector;
    private battleSpeed: EditBox;
    private menu: Node;
    private itemLay: Node;
    protected onLoad(): void {
        this.btns = [];
        this.menu = find("Canvas/menu");
        this.itemLay = find("Canvas/itemLay");
        this.skill = this.menu.getChildByName("skill").getComponent(Selector);
        this.box = this.menu.getChildByName("box").getComponent(Selector);
        this.bullet = this.menu.getChildByName("bullet").getComponent(Selector);
        this.effect = this.menu.getChildByName("effect").getComponent(Selector);
        this.sound = this.menu.getChildByName("sound").getComponent(Selector);
        this.shake = this.menu.getChildByName("shake").getComponent(Selector);
        this.body = this.menu.getChildByName("body").getComponent(Selector);
        this.btns.push(this.skill, this.box, this.bullet, this.effect, this.sound, this.shake);

        this.skill.node.on("select", this.onSkill, this);
        this.box.node.on("select", this.onBox, this);
        this.bullet.node.on("select", this.onBullet, this);
        this.effect.node.on("select", this.onEffect, this);
        this.sound.node.on("select", this.onSound, this);
        this.shake.node.on("select", this.onShake, this);
        this.body.node.on("select", this.onBody, this);
        this.menu.getChildByName("save").on(Input.EventType.TOUCH_END, this.onSave, this);
        this.menu.getChildByName("test").on(Input.EventType.TOUCH_END, this.onTest, this);
        this.menu.getChildByName("copy").on(Input.EventType.TOUCH_END, this.onCopy, this);

        this.battleSpeed = this.menu.getChildByName("battleSpeed").getComponent(EditBox);
        this.battleSpeed.node.on("editing-return", this.onBattleSpeedInput, this);

        // 创建游戏显示框架
        new GameRoot(find("Canvas"));

        find("Canvas/bg").setSiblingIndex(0);
        this.menu.setSiblingIndex(1);
        this.itemLay.setSiblingIndex(1);

        let canvas = find("SceneCanvas");
        let camera = find("SceneCanvas/Camera").getComponent(Camera);
        SceneCamera.Init(camera, canvas);

        EventMgr.on("layout_all_line", this.layoutItem, this);
        EventMgr.on("clean_all_item", this.cleanAll, this);
        EventMgr.on("skill_reset", this.onResetSkill, this);
        EventMgr.on("skill_hide_lab", this.onHideScroll, this);

        let thisObj = this;
        window['CreateSkillLine'] = function (objType: number) {
            let ls = thisObj.pool[objType];
            if (ls && ls.length) return ls.pop();
            switch (objType) {
                case FrameType.Box:
                    return instantiate(thisObj.$SkillBox);
                case FrameType.Effect:
                    return instantiate(thisObj.$SkillEffect);
                case FrameType.Shake:
                    return instantiate(thisObj.$SkillShake);
                case FrameType.Bullet:
                    return instantiate(thisObj.$SkillBullet);
                case FrameType.Sound:
                    return instantiate(thisObj.$SkillSound);
                case 0:
                case 6:
                    return instantiate(thisObj.$SkillAffect);
            }
        }
        window['ReceiveSKillLine'] = function (line: SkillLineEditor) {
            if (line.ObjType == undefined) return;
            let objType = line.ObjType;
            let ls = thisObj.pool[objType];
            if (!ls) {
                ls = [];
                thisObj.pool[objType] = ls;
            }
            if (ls.indexOf(line.node) == -1) ls.push(line.node);
        }
    }
    private pool: { [objType: number]: Node[] } = {};

    async start() {
        
        // fgui.GRoot.create();

        // 加载ab包
        await ResMgr.PrevLoad();
        await HomeScene.load();
        await CfgMgr.Load();
        await SkillSetter.load();

        new HomeLogic();
        await HomeLogic.ins.EnterSkillScene();

        new SkillEditLogic();
        SkillEditLogic.ins.Init();

        // this.subList.setSiblingIndex(0);

        let updateItem = (item: Node, data: any) => {
            let id: string;
            if (data.Id != undefined) {
                id = String(data.Id);
            } else {
                id = String(data.SkillId);
            }
            if (item.getComponent(EditBox)) {
                item.getComponent(EditBox).string = id;
            } else {
                item.getComponent(Label).string = id;
            }
        };
        this.skill.Init(SkillSetter.SkillList, updateItem);
        this.box.Init(SkillSetter.BoxList, updateItem);
        this.bullet.Init(SkillSetter.BulletList, updateItem);
        this.effect.Init(SkillSetter.EffectList, updateItem);
        this.sound.Init(SkillSetter.SoundList, updateItem);
        this.shake.Init(SkillSetter.ShakeList, updateItem);

        let bodys = [];
        let ab = AssetManager.instance.getBundle("res");
        let files = ab.getDirWithPath("spine/role");
        for (let file of files) {
            let name = file.path.replace("spine/role/", "").split("/")[0];
            if (bodys.indexOf(name) == -1) bodys.push(name);
        }
        this.body.Init(bodys, (item: Node, data: any) => {
            if (item.getComponent(EditBox)) {
                item.getComponent(EditBox).string = String(data);
            } else {
                item.getComponent(Label).string = String(data);
            }
        });
    }

    update(deltaTime: number) {
        GameSet.Update(deltaTime);
    }
    private cleanAll() {
        this.itemLay.removeAllChildren();
    }
    private layoutItem(node?: Node) {
        const gev = 20;
        let children = this.itemLay.children;
        let height = 0;
        for (let i = 0; i < children.length; i++) {
            let item = children[i];
            let line = item.getComponent(SkillLineEditor);
            if (!line) continue;
            let bound = line.bound;
            item.setPosition(0, -(height + bound[0]));
            height += (bound[1] + gev);
        }
    }

    private addItem(node: Node) {
        let itemLay = this.itemLay;
        itemLay.addChild(node);
        this.layoutItem();
    }

    private onResetSkill(skill: SkillCfg) {
        this.cleanAll();
        if (skill) {
            this.newSkill(skill);
        }
    }

    private onHideScroll() {
        for (let selector of this.btns) {
            selector.HideList();
        }
    }

    private newSkill(skill: SkillCfg) {
        SkillSetter.nowSkill = skill;
        let node = instantiate(this.$SkillLine);
        this.addItem(node);
        node.getComponent(SkillLineEditor).setData(-1, skill);
        let action = SkillSetter.actions[skill.ActionId]
        if(action)
        {
            SkillSetter.nowAction = action;
            for (let i = 0; i < action.FrameEvents.length; i++) {
                let frameEvent:SkillFrameEvent = action.FrameEvents[i];
                let child: Node;
                switch (frameEvent.ObjType) {
                    case FrameType.Box:
                        child = instantiate(this.$SkillBox);
                        this.addItem(child);
                        child.getComponent(SkillLineEditor).setData(i, frameEvent);
                        break;
                    case FrameType.Bullet:
                        child = instantiate(this.$SkillBullet);
                        this.addItem(child);
                        child.getComponent(SkillLineEditor).setData(i, frameEvent);
                        break;
                    case FrameType.Effect:
                        child = instantiate(this.$SkillEffect);
                        this.addItem(child);
                        child.getComponent(SkillLineEditor).setData(i, frameEvent);
                        break;
                    case FrameType.Shake:
                        child = instantiate(this.$SkillShake);
                        this.addItem(child);
                        child.getComponent(SkillLineEditor).setData(i, frameEvent);
                        break;
                    case FrameType.Sound:
                        child = instantiate(this.$SkillSound);
                        this.addItem(child);
                        child.getComponent(SkillLineEditor).setData(i, frameEvent);
                        break;
                }
            }
        }
        else
        {
            SkillSetter.nowAction = SkillSetter.NewAction(skill.ActionId);
            /* Tips.Show("创建行为：" + skill.ActionId, () => {
                SkillSetter.nowAction = SkillSetter.NewAction(skill.ActionId);
            }); */
        }

    }

    private onSkill(data: any) {
        if (SkillSetter.nowSkill && SkillSetter.nowSkill.SkillId == data) return;
        Logger.log("onSkill", data);
        let skill = SkillSetter.skills[data];
        if (!skill) {
            let thisObj = this;
            Tips.Show("创建新技能：" + data, () => {
                let skill = SkillSetter.NewSkill(data);
                if (SkillSetter.nowSkill && SkillSetter.nowSkill != skill) {
                    thisObj.cleanAll();
                }
                thisObj.newSkill(skill);
            });
        } else {
            if (SkillSetter.nowSkill && SkillSetter.nowSkill != skill) {
                this.cleanAll();
            }
            this.newSkill(skill);
        }
    }
    private onBox(data: number, delay?: number, passTips: boolean = false) {
        if (!SkillSetter.nowSkill) {
            Tips.Show("请先选取或创建一个技能!");
        } else {
            Logger.log("onBox");
            let box = SkillSetter.boxs[data];
            let boxData:SkillFrameEvent = SkillSetter.NewFrameEvent(data, FrameType.Box, 0, 1);
            let index = SkillSetter.AddChild(boxData);
            if (box) {
                this.createItem(this.$SkillBox, index, boxData);
            } else {
                Tips.Show("创建伤害盒：" + data, ()=>{
                    this.createItem(this.$SkillBox, index, boxData);
                });
                
                
            }

        }
    }
    private createItem(prefab:Prefab, index:number, data:SkillFrameEvent):void{
        let node = instantiate(prefab);
        this.addItem(node);
        node.getComponent(SkillLineEditor).setData(index, data);
    }
    private onBullet(data: number, delay?: number, passTips: boolean = false) {
        if (!SkillSetter.nowSkill) {
            Tips.Show("请先选取或创建一个技能!");
        } else {
            let bullet = SkillSetter.bullets[data];
            let bulletData:SkillFrameEvent = SkillSetter.NewFrameEvent(data, FrameType.Bullet, 0);
            let index = SkillSetter.AddChild(bulletData);
            if (bullet) {
                this.createItem(this.$SkillBullet, index, bulletData);
            } else {
                Tips.Show("创建子弹：" + data, ()=>{
                    this.createItem(this.$SkillBullet, index, bulletData);
                });
            }
        }
    }
    private onEffect(data: number, delay?: number, passTips: boolean = false) {
        if (!SkillSetter.nowSkill) {
            Tips.Show("请先选取或创建一个技能!");
        } else {
            let effect = SkillSetter.effects[data];
            let effectData:SkillFrameEvent = SkillSetter.NewFrameEvent(data, FrameType.Effect, 0);
            let index = SkillSetter.AddChild(effectData);
            if (effect) {
                this.createItem(this.$SkillEffect, index, effectData);
            } else {
                
                Tips.Show("创建特效：" + data, ()=>{
                    this.createItem(this.$SkillEffect, index, effectData);
                });
            }
        }
    }
    private onSound(data: number, delay?: number, passTips: boolean = false) {
        if (!SkillSetter.nowSkill) {
            Tips.Show("请先选取或创建一个技能!");
        } else {
            let sound = SkillSetter.sounds[data];
            let soundData:SkillFrameEvent = SkillSetter.NewFrameEvent(data, FrameType.Sound, 0);
            let index = SkillSetter.AddChild(soundData);
            if (sound) {
                this.createItem(this.$SkillSound, index, soundData);
            } else {
                
                Tips.Show("创建音效：" + data, ()=>{
                    this.createItem(this.$SkillSound, index, soundData);
                });
            }
        }
    }
    private onShake(data: number, delay?: number, passTips: boolean = false) {
        if (!SkillSetter.nowSkill) {
            Tips.Show("请先选取或创建一个技能!");
        } else {
            let shake = SkillSetter.shakes[data];
            let shakeData:SkillFrameEvent = SkillSetter.NewFrameEvent(data, FrameType.Shake, 0);
            let index = SkillSetter.AddChild(shakeData);
            if (shake) {
                this.createItem(this.$SkillShake, index, shakeData);
            } else {
                
                Tips.Show("创建震屏：" + data, ()=>{
                    this.createItem(this.$SkillShake, index, shakeData);
                });
            }
        }
    }

    private onBody(data: string, delay?: number, passTips: boolean = false) {
        let config = CfgMgr.GetRole();
        for (let k in config) {
            let role = config[k];
            if (role.Prefab == data) {
                SkillEditLogic.ins.ChangeHero(role.RoleType);
                break;
            }
        }

        let url = path.join("spine/role/", data, data);
    }

    private onSave() {
        if (!SkillSetter.skills) return;
        EventMgr.emit("skill_edit_flush");
        
        let table = {}
        table["skill"] = SkillSetter.skills;
        table["action"] = SkillSetter.actions;
        table["box"] = SkillSetter.boxs;
        table["effect"] = SkillSetter.effects;
        table["bullet"] = SkillSetter.bullets;
        table["shake"] = SkillSetter.shakes;
        table["sound"] = SkillSetter.sounds;
        table["affect"] = SkillSetter.affects;
        
        Logger.log("saveSkillJson", table);
        SaveFile(JSON.stringify(table), "skill.json");
    }


    private hero: IEntity;
    private others: IEntity[];
    private onTest() {
        // if (!this.cfgs.length) return;
        // Effect.Play(this.cfgs.shift(), this.hero);
        // const cfg: SkillBullet = {
        //     Id: 0,
        //     ObjType: FrameType.Bullet,
        //     Desc: "",
        //     Res: "ef4_001",
        //     Offset: [0, 0],
        //     Scale: 0.16,
        //     LifeTime: 0,
        //     Speed: 15,
        //     Path: [0, 0, 100, 200, 200, 0],
        //     HitNumber: 0,
        //     HitBullet: [],
        //     EndBullet: [],
        //     HitSound: [],
        //     HitShake: [],
        //     HitEffect: [],
        //     HitBox: []
        // }

        // let i = randomI(0, this.others.length - 1);
        // let other = this.others[i];
        // Effect.Bullet(null, cfg, this.hero, this.hero["position"], other["position"]);
        if (!SkillSetter.nowSkill) return;
        EventMgr.emit("skill_edit_flush");
        SkillEditLogic.ins.Play(SkillSetter.nowSkill);
    }
    private onCopy()
    {
        if (!SkillSetter.nowSkill) return;
        let skill = {...SkillSetter.nowSkill};
        
        SkillSetter.copySkill(skill);
        this.cleanAll();
        this.newSkill(skill);
        //SkillEditLogic.ins.Play(SkillSetter.nowSkill);
    }

    private onBattleSpeedInput(editbox)
    {
        let value = parseFloat(editbox.string);
        if (isNaN(value) || value < 0) return;
        console.log(`battlespeed: ${value}`);
        SkillEditLogic.ins.ChangeBattleSpeed(value);
    }
}


