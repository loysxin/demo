import { Node, assetManager, game, path, resources, sp } from "cc";
import { GameSet } from "../../module/GameSet";
import { HomeScene } from "../../module/home/HomeScene";
import { map } from "../../module/home/MapData";
import { Hero } from "../../module/home/entitys/Hero";
import { IEntity } from "../../module/home/entitys/IEntity";
import { SkillAffect, SkillBox, SkillBullet, SkillCfg, SkillEffect, SkillFrameEvent, SkillShake, SkillSound } from "../../module/home/SkillStruct";
import { FrameType, SkillSetter } from "./SkillSetter";
import { Effect } from "../../module/home/entitys/Effect";
import { SceneCamera } from "../../module/SceneCamera";
import { randomI } from "../../utils/Utils";
import { AudioMgr } from "../../manager/AudioMgr";
import { DEV } from "cc/env";
import { Tips } from "../../module/login/Tips";
import { SkillUitls } from "./SkillUtils";
import { ResMgr } from "../../manager/ResMgr";
import { GameObj } from "../../GameRoot";
import { BattleLogic } from "../../battle/BattleLogic";
import { Runtime } from "../../battle/BattleLogic/Runtime";

export class SkillEditLogic {
    private static _ins: SkillEditLogic;
    constructor() {
        if (SkillEditLogic._ins) throw "error";
        SkillEditLogic._ins = this;
    }

    static get ins() {
        return this._ins;
    }

    private hero: IEntity;
    private others: Hero[]
    Init() {

        if(!BattleLogic.ins)
            new BattleLogic();

        let data = 
        {
            battle_type: "MartialDisplay",
            homeland_id: 101
            
        }

        let node = map.GetGrid(HomeScene.ins.GetHomeCfg().camera);
        SceneCamera.LookAt(node.x, node.y);

        BattleLogic.ins.BattleStartPushData = data;
        BattleLogic.ins.init();

        BattleLogic.ins.start();
        


        // if (!this.hero) {
        //     this.hero = Hero.Create("prefabs/hero/role_002_slr");
        //     this.hero['name'] = "main";
        //     let obj = HomeScene.ins.GetHomeCfg().atkNode[0];
        //     HomeScene.ins.AddEntity(<unknown>this.hero as Node);
        //     let p = map.GetGrid(obj.id);
        //     this.hero.Init(p);
        //     let dir = map.CountDir(obj.angle);
        //     this.hero.Idle(dir.lr, dir.isBack);

        //     this.others = [];
        //     let defNode = HomeScene.ins.GetHomeCfg().defNode;
        //     for (let i = 0; i < defNode.length; i++) {
        //         let obj = defNode[i];
        //         let other = Hero.Create("prefabs/hero/role_001_ngr");
        //         HomeScene.ins.AddEntity(<unknown>other as Node);
        //         let p = map.GetGrid(obj.id);
        //         other.Init(p);
        //         let dir = map.CountDir(obj.angle);
        //         other.Idle(dir.lr, dir.isBack);

        //         this.others.push(other);
        //     }
        // }
    }

    private rolrType: number;
    ChangeHero(roleType: number, skillCfg?) {

        if(Runtime.game)
        {
            let event = 
            {
                type: "ChangeUnit",
                roleType : roleType,
                skillCfg: skillCfg,
                level: 1
            }
            Runtime.game.PlayerInput(event)
            this.rolrType = roleType;
        }
    }

    ChangeBattleSpeed(speed: number) {
        Runtime.game.SetGameSpeed(speed);
    }

    Start() {

    }


    private error(msg: string) {
        if (DEV) {
            Tips.Show(msg);
        } else {
            console.warn(msg);
        }
    }

    private tick: number;
    private skillCfg: SkillCfg;
    private frames: (SkillBox | SkillEffect | SkillShake | SkillBullet | SkillSound | SkillAffect)[];
    Play(skillCfg: SkillCfg) {
        this.bulletid = undefined;
        let action = SkillSetter.nowAction

        if (!this.check(action.FrameEvents)) return;

        this.ChangeHero(this.rolrType, skillCfg);
        // this.Update();
        // if (SkillUitls.actions.indexOf(this.skillCfg.Prefab) == -1) {
        //     Tips.Show("找不到攻击动作：" + this.skillCfg.Prefab);
        // } else {
        //     this.hero[this.skillCfg.Prefab](undefined, undefined, skillCfg.ActTime);
        //}
    }
    private bulletid;
    private check(frames: SkillFrameEvent[]) {
        for (let frame of frames) {
            switch (frame.ObjType) {
                case FrameType.Box:
                    let boxCfg: SkillBox = SkillSetter.boxs[frame.Id];
                    if (!this.check(boxCfg.HitSound)) return false;
                    if (!this.check(boxCfg.HitShake)) return false;
                    if (!this.check(boxCfg.HitEffect)) return false;
                    break;
                case FrameType.Effect:
                    let cfg: SkillEffect = SkillSetter.effects[frame.Id];
                    if (!cfg.Res || cfg.Res == "") {
                        this.error("特效资源字段不能为空！effectId:" + cfg.Id);
                        return false;
                    } else if (!this.checkEffectRes(cfg.Res)) return false;
                    if (!cfg.Duration && !cfg.Times) {
                        this.error("特效播放次数和持续时间必须配一个！effectId:" + cfg.Id);
                        return false;
                    }
                    break;
                case FrameType.Bullet:
                    let bulletCfg = SkillSetter.bullets[frame.Id];
                    if (this.bulletid == undefined) {
                        this.bulletid = bulletCfg.Id;
                    } else if (this.bulletid == bulletCfg.Id) {
                        this.error("子弹循环调用, Id=" + bulletCfg.Id);
                        return false;
                    }
                    // if (!bulletCfg.Res || bulletCfg.Res == "") {
                    //     this.error("子弹资源字段不能为空, Id=" + bulletCfg.Id);
                    //     return false;
                    // } else 
                    if (bulletCfg.Res && !this.checkEffectRes(bulletCfg.Res)) return false;
                    if (!bulletCfg.LifeTime && !bulletCfg.Speed) {
                        this.error("子弹飞行时长和速度字段不能为空, Id=" + bulletCfg.Id);
                        return false;
                    }
                    if (!this.check(bulletCfg.HitBullet)) return false;
                    if (!this.check(bulletCfg.EndBullet)) return false;
                    if (!this.check(bulletCfg.HitBox)) return false;
                    if (bulletCfg.EndEffect && !this.check(bulletCfg.EndEffect)) return false;
                    break;
                case FrameType.Sound:
                    let soundCfg: SkillSound = SkillSetter.sounds[frame.Id];
                    if (!soundCfg.Url || soundCfg.Url == "") {
                        this.error("音效资源字段不能为空, Id=" + soundCfg.Id);
                        return false;
                    }
                    if (!soundCfg.Times && !soundCfg.Duration) {
                        this.error("音效时长和速度字段不能为空, Id=" + soundCfg.Id);
                        return false;
                    }
                    break;
                case FrameType.Shake:
                    let shakeCfg: SkillShake = SkillSetter.shakes[frame.Id];
                    if (!shakeCfg.Power || !shakeCfg.Tick || !shakeCfg.Duration) {
                        this.error("震动配置错误, Id=" + shakeCfg.Id);
                        return false;
                    }
                    break;
            }
        }
        return true;
    }

    private checkEffectRes(res: string) {
        let ab = assetManager.getBundle("res");
        let url = path.join("spine/effect/", res);
        if (!ab.getDirWithPath(url)) {
            this.error("配置了错误的特效资源：" + res);
            return false;
        }
        return true;
    }
}


