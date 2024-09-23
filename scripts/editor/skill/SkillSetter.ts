import { JsonAsset, Node } from "cc";
import { ResMgr } from "../../manager/ResMgr";
import { SkillAction, SkillAffect, SkillBox, SkillBullet, SkillCfg, SkillEffect, SkillFrameEvent, SkillShake, SkillSound } from '../../module/home/SkillStruct';
import { CfgMgr } from "../../manager/CfgMgr";
import { EventMgr } from "../../manager/EventMgr";
import Logger from "../../utils/Logger";

export enum FrameType {
    Box = 1,
    Effect = 2,
    Shake = 3,
    Bullet = 4,
    Sound = 5,
    Affect = 6,
    End = 7
}

export class SkillSetter {
    static skills: { [id: number]: SkillCfg };
    static actions: { [id: number]: SkillAction };
    static boxs: { [id: number]: SkillBox };
    static effects: { [id: number]: SkillEffect };
    static shakes: { [id: number]: SkillShake };
    static bullets: { [id: number]: SkillBullet };
    static sounds: { [id: number]: SkillSound };
    static affects: { [id: number]: SkillAffect };
    static totalAffects;

    static nowSkill: SkillCfg;
    static nowAction: SkillAction;

    static async load() {
        let jsonAsset = await ResMgr.LoadResAbSub("config/skill/skill", JsonAsset);
        // let actionAsset = await ResMgr.LoadResAbSub("config/skill/action", JsonAsset);
        // let boxAsset = await ResMgr.LoadResAbSub("config/skill/box", JsonAsset);
        // let bulletAsset = await ResMgr.LoadResAbSub("config/skill/bullet", JsonAsset);
        // let effectAsset = await ResMgr.LoadResAbSub("config/skill/effect", JsonAsset);
        // let shakeAsset = await ResMgr.LoadResAbSub("config/skill/shake", JsonAsset);
        // let soundAsset = await ResMgr.LoadResAbSub("config/skill/sound", JsonAsset);
        // let affectAsset = await ResMgr.LoadResAbSub("config/skill/affect", JsonAsset);
        this.skills = jsonAsset ? jsonAsset.json.skill : {};
        this.actions = jsonAsset ? jsonAsset.json.action : {};
        this.boxs = jsonAsset ? jsonAsset.json.box : {};
        this.effects = jsonAsset ? jsonAsset.json.effect : {};
        this.shakes = jsonAsset ? jsonAsset.json.shake : {};
        this.bullets = jsonAsset ? jsonAsset.json.bullet : {};
        this.sounds = jsonAsset ? jsonAsset.json.sound : {};
        this.affects = jsonAsset? jsonAsset.json.affect : {};

        for (let k in this.bullets) {
            if(!this.bullets[k].DelayShoot)
                this.bullets[k].DelayShoot = [0];
        }
    
        // const skills = json.skill
        // for (let k in skills) {
        //     let skill = skills[k];
        //     if (this.skills[skill.SkillId]) {
        //         throw "技能id重复!" + skill.SkillId;
        //     }
        //     this.skills[skill.SkillId] = skill;
            
        // }

        // const actions = json.action
        // for (let k in actions) {
        //     let action = actions[k];
        //     if (this.actions[action.ActionId]) {
        //         throw "技能动作id重复!" + action.ActionId;
        //     }
        //     this.actions[action.ActionId] = action;
        //     let frameEvents = action.FrameEvents;
        //     let timeLine = action.TimeLine;
        //     this.praseGameObj(frameEvents, timeLine)
        // }

        this.totalAffects = CfgMgr.Get("skillAffect");
        //EventMgr.on("skill_line_change", this.onDelayChange, this);
        EventMgr.on("skill_line_del", this.onDel, this);
    }
    /* private static praseGameObj(frameEvent: (SkillBox | SkillEffect | SkillShake | SkillBullet | SkillSound | SkillAffect)[], timeLine: number[]) {
        let len = frameEvent.length - 1;
        for (let i = len; i >= 0; i--) {
            let obj = frameEvent[i];
            let timeTick = timeLine[i];
            if (obj.ObjType == 6) {
                frameEvent.splice(i, 1);
                if (timeTick != undefined) timeLine.splice(i, 1);
                continue;
            }
            switch (obj.ObjType) {
                case FrameType.Box:
                    this.boxs[obj.Id] = obj as SkillBox;
                    for (let affect of this.boxs[obj.Id].Affect) {
                        affect.ObjType = 0;
                    }
                    this.praseGameObj(this.boxs[obj.Id].HitSound, []);
                    this.praseGameObj(this.boxs[obj.Id].HitShake, []);
                    this.praseGameObj(this.boxs[obj.Id].HitEffect, []);
                    break;
                case FrameType.Effect:
                    Logger.log("load====", obj.Id);
                    this.effects[obj.Id] = obj as SkillEffect;
                    obj['TimeTick'] = timeTick;
                    break;
                case FrameType.Shake:
                    this.shakes[obj.Id] = obj as SkillShake;
                    obj['TimeTick'] = timeTick;
                    break;
                case FrameType.Bullet:
                    this.bullets[obj.Id] = obj as SkillBullet;
                    obj['TimeTick'] = timeTick;
                    this.praseGameObj(this.bullets[obj.Id].HitBullet, []);
                    this.praseGameObj(this.bullets[obj.Id].EndBullet, []);
                    this.praseGameObj(this.bullets[obj.Id].HitBox, []);
                    break;
                case FrameType.Sound:
                    this.sounds[obj.Id] = obj as SkillSound;
                    obj['TimeTick'] = timeTick;
                    break;
            }
        }
    } */

    /* private static onDelayChange(index: number, delay: number, data: any) {
        let id = this.nowAction.FrameEvents.indexOf(data);
        if (id != -1) this.nowAction.TimeLine[id] = delay;
    }
 */
    static AddChild(data: SkillFrameEvent, addFrameEvent = true) {
        if (!this.nowAction) return -1;
        if (!data.ObjType) {
            return -1;
        } else {
            switch (data.ObjType) {
                case FrameType.Box:
                    if (!this.boxs[data.Id]){
                        this.NewBox(data.Id);
                    }
                    break;
                case FrameType.Effect:
                    if (!this.effects[data.Id]){
                        this.NewEffect(data.Id);
                    }
                    break;
                case FrameType.Shake:
                    if (!this.shakes[data.Id]){
                        this.NewShake(data.Id);
                    }
                    break;
                case FrameType.Bullet:
                    if (!this.bullets[data.Id]){
                        this.NewBullet(data.Id);
                    }
                    break;
                case FrameType.Sound:
                    if (!this.sounds[data.Id]){
                        this.NewSound(data.Id);
                    }
                    break;
            }

            if (addFrameEvent) {
                this.nowAction.FrameEvents.push(data);
                return this.nowAction.FrameEvents.length - 1;
            }

        }
    }
    private static onDel(data: SkillCfg | SkillFrameEvent, index:number) {
        if (!this.nowSkill) return;
        if (data['SkillId'] != undefined) {
            let skillId = data['SkillId'];
            delete this.skills[skillId];
            EventMgr.emit("skill_reset");
            this.nowSkill = undefined;
        } else {
            if(index < this.nowAction.FrameEvents.length){
                this.nowAction.FrameEvents.splice(index, 1);
            }   
            
            EventMgr.emit("skill_reset", this.nowSkill);
        }
    }

    static get SkillList() {
        let ls = [];
        for (let k in this.skills) {
            ls.push(this.skills[k]);
        }
        return ls;
    }
    static get BoxList() {
        let ls = [];
        for (let k in this.boxs) {
            ls.push(this.boxs[k]);
        }
        return ls;
    }
    static get EffectList() {
        let ls = [];
        for (let k in this.effects) {
            ls.push(this.effects[k]);
        }
        return ls;
    }
    static get ShakeList() {
        let ls = [];
        for (let k in this.shakes) {
            ls.push(this.shakes[k]);
        }
        return ls;
    }
    static get BulletList() {
        let ls = [];
        for (let k in this.bullets) {
            ls.push(this.bullets[k]);
        }
        return ls;
    }
    static get SoundList() {
        let ls = [];
        for (let k in this.sounds) {
            ls.push(this.sounds[k]);
        }
        return ls;
    }
    static get AffectList() {
        let ls = [];
        for (let k in this.affects) {
            ls.push(this.affects[k]);
        }
        return ls;
    }

    /**
     * 新建技能
     * @param skillId 
     * @returns 
     */
    static NewSkill(skillId: number) {
        let skill: SkillCfg = this.skills[skillId];
        if (!skill) {
            skill = {
                SkillId: skillId,
                Level: 1,
                Name: "技能" + skillId,
                Description: "描述",
                Type: 0,
                ReleaseType: 0,
                Prefab: "",
                EndTime: 0,
                ActionId: 1,
                CD: 0,
                TargetType: 0,
                Range: 0,
                Icon: "",
                Quality: 0
            };
            this.skills[skillId] = skill;
        }
        // this.nowSkill = skill;
        EventMgr.emit("new_skill", skill);
        return skill;
    }

    static NewAction(actionId: number)
    {
        let action = this.actions[actionId];
        if (!action) {
            action = {
                ActionId: actionId,
                FrameEvents: [],
                TimeLine: []
            };
            this.actions[actionId] = action;
        }

        return action;
    }


    static copySkill(skillCfg: SkillCfg) {
        let skill: SkillCfg = this.skills[skillCfg.SkillId + 1];
        if (!skill) {
            skillCfg.SkillId++;
            if(!skillCfg.Level)
                skillCfg.Level = skillCfg.SkillId % 10;
            skillCfg.Level++;
            this.skills[skillCfg.SkillId] = skillCfg;
        }

        EventMgr.emit("new_skill", skill);
        return skill;
    }
    static NewFrameEvent(id: number, type:number, timeTick:number = 0, ratio:number = undefined) {
        let data:SkillFrameEvent = {
            Id: id,
            ObjType: type,
            TimeTick:timeTick,
            Ratio: ratio,
        }
        return data;
    }
    static NewAffect(table) {
        let data = {
            Id: table.Id,
            ObjType: FrameType.Affect,
            Desc: table.Desc,
            LifeTime: table.LifeTime,
            CanRemove: table.CanRemove,
            MaxCount: table.MaxCount,
        }
        this.affects[table.Id] = data;
        return data;
    }

    static NewBox(id: any) {
        let data = {
            Id: id,
            ObjType: FrameType.Box,
            Desc: "",
            RangeType: 0,
            HitBound: [[0, 0]],
            RangePara: [[0, 0]],
            Target: 0,
            SearchType: 0,
            Ratio: 1,
            HitSound: [],
            HitShake: [],
            HitEffect: [],
            Affect: []
        }
        this.boxs[id] = data;
        return data;
    }
   /*  static AddBox(id: number) {
        if (this.boxs[id]) return;
        let data = this.NewBox(id);
        this.nowAction.FrameEvents.push(data);
        this.nowAction.TimeLine.push(0);
        // EventMgr.emit(FrameType[FrameType.Box], id);
        return [this.nowAction.TimeLine.length - 1, data];
    } */

    static NewEffect(id: number) {
        let data = {
            Id: id,
            ObjType: FrameType.Effect,
            Desc: "描述",
            Res: "",
            Times: 0,
            Duration: 0,
            Depth: 1,
            Toward: 0,
            Offset: [0, 0],
            Scale: 1
        }
        this.effects[id] = data;
        return data;
    }
    /* static AddEffect(id: number) {
        if (this.effects[id]) return;
        let data = this.NewEffect(id);
        this.nowAction.FrameEvents.push(data);
        this.nowAction.TimeLine.push(0);
        // EventMgr.emit(FrameType[FrameType.Effect], id);
        return [this.nowAction.TimeLine.length - 1, data];
    } */

    static NewShake(id: number) {
        let data = {
            Id: id,
            ObjType: FrameType.Shake,
            Desc: "描述",
            Type: 0,
            Power: 0,
            Tick: 0,
            Duration: 0
        }
        this.shakes[id] = data;
        return data;
    }
    /* static AddShake(id: number) {
        if (this.shakes[id]) return;
        let data = this.NewShake(id);
        this.nowAction.FrameEvents.push(data);
        this.nowAction.TimeLine.push(0);
        // EventMgr.emit(FrameType[FrameType.Shake], id);
        return [this.nowAction.TimeLine.length - 1, data];
    } */

    static NewBullet(id: number) {
        let data = {
            Id: id,
            ObjType: FrameType.Bullet,
            Desc: "描述",
            Res: "",
            DelayShoot: [0],
            Offset: [0, 0],
            FireTarget: 0,
            FireOffset: [0, 0],
            HitBound: [[0, 0]],
            TargetType: 0,
            Scale: 1,
            LifeTime: 0,
            Speed: 0,
            PathType: 0,
            Path: [[0, 0]],
            HitNumber: 0,
            HitInterval: 0,
            HitBullet: [],
            EndBullet: [],
            HitSound: [],
            HitShake: [],
            HitEffect: [],
            HitBox: [],
            EndEffect: [],
        }
        data['TimeTick'] = 0;
        this.bullets[id] = data;
        return data;
    }
    /* static AddBullet(id: number) {
        if (this.bullets[id]) return;
        let data = this.NewBullet(id);
        this.nowAction.FrameEvents.push(data);
        this.nowAction.TimeLine.push(0);
        // EventMgr.emit(FrameType[FrameType.Bullet], id);
        return [this.nowAction.TimeLine.length - 1, data];
    } */

    static NewSound(id: number) {
        let data = {
            Id: id,
            ObjType: FrameType.Sound,
            Desc: "描述",
            Url: "",
            Times: 0,
            Duration: 0
        }
        data['TimeTick'] = 0;
        this.sounds[id] = data;
        return data;
    }
   /*  static AddSound(id: number) {
        if (this.sounds[id]) return;
        let data = this.NewSound(id);
        this.nowAction.FrameEvents.push(data);
        this.nowAction.TimeLine.push(0);
        // EventMgr.emit(FrameType[FrameType.Sound], id);
        return [this.nowAction.TimeLine.length - 1, data];
    } */


    static GetFrameCfgByType(objType: number, Id: number) {
        switch (objType) {
            case FrameType.Box:
                return this.boxs[Id];
            case FrameType.Effect:
                return this.effects[Id];
            case FrameType.Shake:
                return this.shakes[Id];
            case FrameType.Bullet:
                return this.bullets[Id];
            case FrameType.Sound:
                return this.sounds[Id];
            case 0:
                let cfg = this.effects[Id];
                cfg.ObjType = 0;
                return cfg;
        }
    }
}
