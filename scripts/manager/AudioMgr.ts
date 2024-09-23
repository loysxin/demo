import { AudioClip, AudioSource, Node, game } from "cc";
import { ResMgr, folder_bgm, folder_scene, folder_sound } from "./ResMgr";
import { IsBackGround } from "../Platform";
import { GameSet } from "../module/GameSet";
import Logger from "../utils/Logger";
import { BeforeGameUtils } from "../utils/BeforeGameUtils";

/**声音定义 */
export type SoundDefine = {
    /**资源路径 */
    readonly url: string;
    /**声音数量上限 */
    readonly num: number;
    /**音效分组，主要用于分组控制播放和停止 */
    readonly group: number;
}

type $AudioState = {
    playing: boolean; // 是否已触发播放
    startTick: number;// 开始播放的时间,与当前时间和音效时长计算出当前是否已经播放结束
    group: number;    // 分组
    url: string;
    loading: boolean;
}

let skillSounds: { [path: string]: { sound: AudioSource, loop: number, duration: number } } = {};
let sounds: { [path: string]: AudioSource[] } = {};
let status: { [uuid: string]: $AudioState } = {};
let pauses: boolean[] = [];// 暂停播放的声音分组表

function AudioState(audio: SoundDefine) {
    //let playing = audio.group == undefined ? true : !pauses[audio.group];
    // 背景音，场景音，无分组音效都默认正在播放状态
    let playing = audio.group == AudioGroup.Music || audio.group == AudioGroup.Scene || audio.group == undefined ? true : !pauses[audio.group];
    let state: $AudioState = {
        playing: playing,
        group: audio.group,
        url: audio.url,
        loading: true,
        startTick: game.totalTime
    }
    return state;
}
function CanPlay(target: AudioSource) {
    var state = status[target.node.uuid];
    if (skillSounds[state.url] && !pauses[state.group]) return true;
    if (!IsBackGround() && !state.loading && !pauses[state.group] && state.playing) {
        if (target.loop || game.totalTime - state.startTick < target.duration * 1000) return true;
    }
    return false;
}

export class AudioMgr {

    /**
     * 播放一次音效
     * @param audio 
     * @returns 
     */
    static PlayOnce(audio: SoundDefine) {
        return this.Play(audio, false);
    }

    /**
     * 循环播放音效
     * @param audio 
     * @returns 
     */
    static PlayCycle(audio: SoundDefine) {
        return this.Play(audio, true);
    }

    static Update(dt?: number) {
        if (!skillSounds) return;
        for (let url in skillSounds) {
            let obj = skillSounds[url];
            if (obj.duration && obj.duration <= game.totalTime / 1000) {
                obj.sound.stop();
                delete skillSounds[url];
            }
        }
    }

    static async PlaySkill(url: string, loop: number, duration?: number) {
        if (!skillSounds) {
            skillSounds = {};
            GameSet.RegisterUpdate(this.Update, this);
        }
        for (let url in skillSounds) {
            let obj = skillSounds[url];
            obj.sound.volume = 0.6;
        }

        let def: SoundDefine = {
            url: url,
            num: 1,
            group: AudioGroup.Skill
        }
        loop--;
        if (duration) duration = game.totalTime / 1000 + duration;
        if (loop < 0 && duration <= game.totalTime / 1000) return;
        let [i, t, sound] = await this.Play(def, false);
        skillSounds[url] = { sound: sound, loop: loop, duration: duration };
        sound.node.on(AudioSource.EventType.ENDED, this.onSoundEnd, this);

    }
    private static async onSoundEnd(audio: AudioSource) {
        audio.node.off(AudioSource.EventType.ENDED, this.onSoundEnd, this);
        var state = status[audio.node.uuid];
        // Logger.log("onSoundEnd", skillSounds[state.url]);
        if (skillSounds[state.url].loop > 0) {
            this.PlaySkill(state.url, skillSounds[state.url].loop - 1, skillSounds[state.url].duration);
        } else {
            delete skillSounds[state.url];
        }
    }

    /**
     * 播放多次音效
     * @param audio 
     * @param loop 
     * @returns 
     */
    static async Play(audio: SoundDefine, loop: boolean): Promise<any[]> {
        let ls = sounds[audio.url] || [];
        sounds[audio.url] = ls;
        for (var i = 0; i < audio.num; i++) {
            let sound = ls[i];
            if (sound && !sound.playing) {
                // 对象池有空闲资源
                sound.loop = loop;
                status[sound.node.uuid].startTick = game.totalTime;// 开始播放时间
                status[sound.node.uuid].playing = true;// 正在播放状态
                CanPlay(sound) && sound.play(); // 判断如果当前能播放则立即播放
                return Promise.resolve([i, sound.duration, sound]);
            } else if (!sound) {
                let node = new Node();
                sound = node.addComponent(AudioSource);
                ls.push(sound);
                status[sound.node.uuid] = AudioState(audio);
                return new Promise((resolve, reject) => {
                    ResMgr.LoadResAbSub(audio.url, AudioClip).then(clip => {
                        sound.clip = clip;
                        sound.loop = loop;
                        status[sound.node.uuid].loading = false;
                        CanPlay(sound) && sound.play();
                        resolve([i, sound.duration, sound]);
                    })
                });
            }
        }
        // 非循环音效重头开始播放
        let sound = ls[0];
        if (loop) return Promise.resolve([i, sound.duration, sound]);
        sound.loop = loop;
        status[sound.node.uuid].startTick = game.totalTime;
        status[sound.node.uuid].playing = true;
        CanPlay(sound) && sound.play();
        return Promise.resolve([i, sound.duration, sound]);
    }

    /**
     * 同步播放音效
     * @param audio 
     * @param loop 
     * @returns 
     */
    static PlayAsync(audio: SoundDefine, loop: boolean) {
        if (pauses[audio.group]) return;
        let ls = sounds[audio.url] || [];
        sounds[audio.url] = ls;
        for (var i = 0; i < audio.num; i++) {
            let sound = ls[i];
            if (sound && !sound.playing) {
                sound.loop = loop;
                status[sound.node.uuid].startTick = game.totalTime;
                status[sound.node.uuid].playing = true;
                CanPlay(sound) && sound.play();
                return [i, sound.duration];
            } else {
                let node = new Node();
                sound = node.addComponent(AudioSource);
                ls.push(sound);
                status[sound.node.uuid] = AudioState(audio);
                ResMgr.LoadResAbSub(audio.url, AudioClip).then(clip => {
                    sound.clip = clip;
                    sound.loop = loop;
                    status[sound.node.uuid].loading = false;
                    CanPlay(sound) && sound.play();
                })
                return [i, 0, sound];
            }
        }
        // 非循环音效重头开始播放
        let sound = ls[0];
        if (loop) return Promise.resolve([i, sound.duration]);
        sound.loop = loop;
        status[sound.node.uuid].startTick = game.totalTime;
        status[sound.node.uuid].playing = true;
        CanPlay(sound) && sound.play();
        return [i, sound.duration, sound];
    }

    /**
     * 暂停音效
     * @param audio 
     * @param id 
     * @returns 
     */
    static Pause(audio: SoundDefine, id?: number) {
        let ls = sounds[audio.url];
        if (!ls || !ls.length) return;
        if (id != undefined) {
            status[ls[id].node.uuid].playing = false;
            ls[id].pause();
        } else {
            for (let sound of ls) {
                status[sound.node.uuid].playing = false;
                sound.pause();
            }
        }
    }

    /**
     * 停止音效
     * @param audio 
     * @param id 
     * @returns 
     */
    static Stop(audio: SoundDefine, id?: number) {
        let ls = sounds[audio.url];
        if (!ls || !ls.length) return;
        if (id != undefined) {
            status[ls[id].node.uuid].playing = false;
            ls[id].stop();
        } else {
            for (let sound of ls) {
                status[sound.node.uuid].playing = false;
                sound.stop();
            }
        }
    }

    static StopSkillAudio() {
        if (!skillSounds) return;
        for (let url in skillSounds) {
            let obj = skillSounds[url];
            obj.sound.stop();
            delete skillSounds[url];
        }
    }

    /**
     * 分组操作
     * @param stop  是否停止
     * @param group 分组
     */
    static All(stop: boolean, group?: number) {
        Logger.log("All", stop, group);
        let nowTick = game.totalTime;
        if (group != undefined) {
            pauses[group] = stop;
            for (let k in sounds) {
                let ls = sounds[k];
                for (let sound of ls) {
                    if (stop) {
                        if (!CanPlay(sound)) sound.stop();
                    } else {
                        let state = status[sound.node.uuid];
                        //if (CanPlay(sound) && state.playing && nowTick - state.startTick < sound.duration * 1000) {
                        if (CanPlay(sound)) {
                            sound.play();
                        }
                    }
                }
            }
        } else {
            for (let i = 0; i < 1000; i++) {
                pauses[i] = stop;
            }
            for (let k in sounds) {
                let ls = sounds[k];
                for (let sound of ls) {
                    if (stop) {
                        status[sound.node.uuid].playing = false;
                        sound.stop();
                    } else {
                        let state = status[sound.node.uuid];
                        if (CanPlay(sound) && state.playing && nowTick - state.startTick < sound.duration * 1000) {
                            sound.play();
                        }
                    }
                }
            }
        }
    }

    static playSound(url:string, is_loop:boolean){
        let audio: SoundDefine = {
            url: folder_sound + url,
            num: 1,
            group: AudioGroup.Sound
        };
        if(is_loop){
            AudioMgr.PlayCycle(audio);
        }else{
            AudioMgr.PlayOnce(audio);
        }
    }

    static playScene(url:string, is_loop:boolean){
        let audio: SoundDefine = {
            url: folder_scene + url,
            num: 1,
            group: AudioGroup.Scene
        };
        if(is_loop){
            AudioMgr.PlayCycle(audio);
        }else{
            AudioMgr.PlayOnce(audio);
        }
    }

    static stopScene(url:string){
        let audio: SoundDefine = {
            url: folder_scene + url,
            num: 1,
            group: AudioGroup.Scene
        };
        this.Stop(audio)
    }

}

export enum AudioGroup {
    Music = 0, // 背景音乐
    Sound = 1, // 普通音效
    Skill = 2, // 技能音效
    Scene = 3, // 环境音效
}

/**
 * 通用点击音效
 */
export const Audio_CommonClick: SoundDefine = {
    url: folder_sound + "common_click",
    num: 1,
    group: AudioGroup.Sound
}

//登录背景音效
export const LoginSundBGM: SoundDefine = {
    url: folder_bgm + "login_bgm",
    num: 1,
    group: AudioGroup.Music
};

//场景音效id
export enum SceneBgmId {
    /**家园1 */
    SceneBgm_1 = 1,
    /**家园2 */
    SceneBgm_2 = 2,
    /**家园3 */
    SceneBgm_3 = 3,//家园3
    /**战斗场景 */
    SceneBgm_4 = 4,
    /**钓鱼场景 */
    SceneBgm_5 = 5,
    /**商城场景*/
    SceneBgm_6 = 6,
    /**掠夺战场景 */
    SceneBgm_7 = 7,
}
/**钓鱼音效id */
export enum FishSoundId {
    Fish_1 = 1,//点击开始不同的湖面，的哗啦啦的潺潺波纹声音
    Fish_2,//甩杆到湖水的音效
    Fish_3,//点击钓鱼/强化后（饲料消耗的反馈声音）
    Fish_4,//暴风雪来临倒计时
    Fish_5,//暴雪风来临的风暴+结冰声音
    Fish_6,//点击提杆的反馈声音
    Fish_7,//钓鱼鱼上钩的声音
    Fish_8,//钓鱼鱼未上钩的声音
    Fish_9,//钓鱼成功的反馈
    Fish_10,//钓鱼失败的反馈，伴有冰冻的声音
}
//钓鱼音效
export const FishSoundInfo:{[key: string]: string} = BeforeGameUtils.toHashMapObj(
    FishSoundId.Fish_1, "fish_1",
    FishSoundId.Fish_2, "fish_2",
    FishSoundId.Fish_3, "fish_3",
    FishSoundId.Fish_4, "fish_4",
    FishSoundId.Fish_5, "fish_5",
    FishSoundId.Fish_6, "fish_6",
    FishSoundId.Fish_7, "fish_7",
    FishSoundId.Fish_8, "fish_8",
    FishSoundId.Fish_9, "fish_9",
    FishSoundId.Fish_10, "fish_10",
);
/**抢夺音效id */
export enum LootSoundId {
    Loot_1 = 1,//保护罩的提示音
    Loot_2,//点击搜索按钮（通用按钮）+搜索动画音效
    Loot_3,//搜索成功的反馈提示
    Loot_4,//点击抢夺的战争提示音效 
}
//抢夺音效
export const LootSoundInfo:{[key: string]: string} = BeforeGameUtils.toHashMapObj(
    LootSoundId.Loot_1, "loot_1",
    LootSoundId.Loot_2, "loot_2",
    LootSoundId.Loot_3, "loot_3",
    LootSoundId.Loot_4, "loot_4",
);
/**
 * 主界面按钮
 */
export const Audio_BottomClick: SoundDefine = {
    url: folder_sound + "bottom_click",
    num: 1,
    group: AudioGroup.Sound
}

/**主界面伸缩按钮 */
export const Audio_ArrowClick: SoundDefine = {
    url: folder_sound + "arrow_click",
    num: 1,
    group: AudioGroup.Sound
}

/**删除通用 */
export const Audio_CommonDelete: SoundDefine = {
    url: folder_sound + "common_delete",
    num: 1,
    group: AudioGroup.Sound
}

/**建造通用 */
export const Audio_CommonBuilding: SoundDefine = {
    url: folder_sound + "common_building",
    num: 1,
    group: AudioGroup.Sound
}

/**工作通用 */
export const Audio_CommonWork: SoundDefine = {
    url: folder_sound + "common_work",
    num: 1,
    group: AudioGroup.Sound
}

/**完成建筑 */
export const Audio_BuildingSucceed: SoundDefine = {
    url: folder_sound + "building_succeed",
    num: 1,
    group: AudioGroup.Sound
}

/**查看邮件 */
export const Audio_OpenMail: SoundDefine = {
    url: folder_sound + "open_mail",
    num: 1,
    group: AudioGroup.Sound
}

/**开宝箱 */
export const Audio_BoxOpen: SoundDefine = {
    url: folder_sound + "box_open",
    num: 1,
    group: AudioGroup.Sound
}

/**获得奖励 */
export const Audio_GetReward: SoundDefine = {
    url: folder_sound + "get_reward",
    num: 1,
    group: AudioGroup.Sound
}

/**打开繁育 */
export const Audio_BuildingFanyu: SoundDefine = {
    url: folder_sound + "building_fan_yu",
    num: 1,
    group: AudioGroup.Sound
}

/**繁育成功 */
export const Audio_FanyuSucc: SoundDefine = {
    url: folder_sound + "fan_yu_succ",
    num: 1,
    group: AudioGroup.Sound
}

/**繁育失败 */
export const Audio_FanyuFail: SoundDefine = {
    url: folder_sound + "fan_yu_fail",
    num: 1,
    group: AudioGroup.Sound
}

/**繁育失败 */
export const Audio_SoldierRecruit: SoundDefine = {
    url: folder_sound + "soldier_recruit_click",
    num: 1,
    group: AudioGroup.Sound
}


