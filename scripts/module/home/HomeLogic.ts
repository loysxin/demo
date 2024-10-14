import { Color, Mask, Node, Sprite, SpriteFrame, UITransform, find, game, sp } from "cc";
import { IEntity } from "./entitys/IEntity";
import { Building } from "./entitys/Building";
import { BuildingType } from "./HomeStruct";
import { Hero } from "./entitys/Hero";
import { HomeScene } from "./HomeScene";
import { MapData, map } from "./MapData";
import { TransAssetTo } from "./entitys/TransAsset";
import { Second, randomI } from "../../utils/Utils";
import PlayerData, { FightState, PlayerDataMap, SPlayerDataBuilding, SPlayerDataRole } from "../roleModule/PlayerData";
import { CfgMgr, StdHomeId, StdRole } from "../../manager/CfgMgr";
import { GameSet } from "../GameSet";
import { SceneCamera } from "../SceneCamera";
import { EventMgr, Evt_Building_Child_Action, Evt_Change_Scene_Bgm, Evt_FlushWorker, Evt_Map_Tile_Complete, Evt_Tween_To } from "../../manager/EventMgr";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
// import { RemoveQipao, SetQipao } from "../production/ProductionUtils";
import { ChangeScenePanel } from "./ChangeScenePanel";
import { GetGameData, SaveGameData } from "../../net/MsgProxy";
import { folder_bgm, folder_sound, ResMgr } from "../../manager/ResMgr";
import { AudioGroup, AudioMgr, Audio_BuildingFanyu, SceneBgmId, SoundDefine } from "../../manager/AudioMgr";
import { BeforeGameUtils } from "../../utils/BeforeGameUtils";

export class HomeLogic {

    private static _ins: HomeLogic;
    static get ins() { return this._ins; }

    /** 传送资源数量和间隔 */
    private assetNum: { [type: number]: { num: number, tick: number } } = {
        [BuildingType.cai_kuang]: { num: 1, tick: 0 },
        [BuildingType.cai_mu]: { num: 1, tick: 0 },
        [BuildingType.cai_shui]: { num: 1, tick: 0 },
        [BuildingType.hua_fang]: { num: 1, tick: 0 }
    };

    private hasinit = false;
    private loop = 0;
    private roles: IEntity[];
    private patrols: IEntity[];
    private curBgmId: number;//当前音效id
    //场景背景音
    private sceneBGMInfo: { [key: string]: SoundDefine } = BeforeGameUtils.toHashMapObj(
        SceneBgmId.SceneBgm_1, { url: folder_bgm + "scene_bgm_1", num: 1, group: AudioGroup.Music },
        SceneBgmId.SceneBgm_2, { url: folder_bgm + "scene_bgm_2", num: 1, group: AudioGroup.Music },
        SceneBgmId.SceneBgm_3, { url: folder_bgm + "scene_bgm_3", num: 1, group: AudioGroup.Music },
        SceneBgmId.SceneBgm_4, { url: folder_bgm + "scene_bgm_4", num: 1, group: AudioGroup.Music },
        SceneBgmId.SceneBgm_5, { url: folder_bgm + "scene_bgm_5", num: 1, group: AudioGroup.Music },
        SceneBgmId.SceneBgm_6, { url: folder_bgm + "scene_bgm_6", num: 1, group: AudioGroup.Music },
        SceneBgmId.SceneBgm_7, { url: folder_bgm + "scene_bgm_7", num: 1, group: AudioGroup.Music },
    );
    //家园背景音
    private homeBGMInfo: { [key: string]: number } = BeforeGameUtils.toHashMapObj(
        StdHomeId.Home_101, SceneBgmId.SceneBgm_1,
        StdHomeId.Home_201, SceneBgmId.SceneBgm_2,
        StdHomeId.Home_301, SceneBgmId.SceneBgm_3,
    );
    constructor() {
        if (HomeLogic._ins) throw "error";
        HomeLogic._ins = this;
        this.roles = [];
        this.patrols = [];

        EventMgr.on(Evt_FlushWorker, this.onFlushMyWoker, this);
        EventMgr.on(Evt_Change_Scene_Bgm, this.onChangeBgm, this);
        EventMgr.on(Evt_Tween_To, this.onTweenTo, this);
    }
    private onChangeBgm(id?: number): void {
        this.playSceneSound(id);
    }

    private async onTweenTo(buildingId: number) {
        let building = await HomeScene.ins.GetBuilding(buildingId)
        if (building) {
            building.TweenTo();
        }
    }

    /**家园主循环 */
    Update(dt: number): void {
        if (!this.hasinit) return;
        // if (++this.loop > 100) return;
        // Logger.log("Update", this.roles.length);
        for (let role of this.roles) {
            role.moveCtrl.Update(dt);
        }
        for (let role of this.roles) {
            role.AI.Update(dt);
        }

        for (let role of this.patrols) {
            role.moveCtrl.Update(dt);
        }
        for (let role of this.patrols) {
            role.AI.Update(dt);
        }
        this.updateTrans(dt);
    }

    /**巡逻 */
    StartXunluo() {
        let cfg = HomeScene.ins.GetHomeCfg();
        const rand = [
            "prefabs/hero/role_001_ngr",
            "prefabs/hero/role_002_slr"
        ]
        for (let way of cfg.patrols) {
            let url = rand[randomI(0, 1)];
            let npc: IEntity = Hero.Create(url);
            npc['name'] = url.split("/").pop();
            npc.Init(map.GetGrid(way[0]));
            HomeScene.ins.AddEntity(<unknown>npc as Node);
            this.patrols.push(npc);
            npc.AI.Xunluo(way);
        }
    }

    /**轮训传送带 */
    private updateTrans(dt: number) {
        if (PlayerData.fightState != FightState.Home) return;
        let tick = game.totalTime;
        let cfg = HomeScene.ins.GetHomeCfg();
        for (let buildcfg of cfg.buildings) {
            let workerNum = PlayerData.GetWorkerNum(buildcfg.buildingId);
            if (workerNum) { //&& HomeScene.ins.CheckBuildingShowing(buildcfg.buildingId)) {
                let data = this.assetNum[buildcfg.type];
                if (data && buildcfg.trans && buildcfg.trans.length) {
                    if (tick - data.tick >= 20000 / data.num / workerNum) {
                        data.tick = tick;
                        if (TransAssetTo(buildcfg.type, buildcfg.trans)) {
                            EventMgr.emit(Evt_Building_Child_Action, buildcfg.buildingId, "seedlight", false);
                        }
                    }
                }
            }
        }
    }

    async EnterSkillScene() {
        HomeScene.Show();
        let cfg = CfgMgr.GetHomeLandInit(101);

        let sbulidings = PlayerData.GetBuildings(101) || {};
        await HomeScene.ins.Init(cfg, sbulidings);
        PlayerData.fightState = FightState.Home;

        this.hasinit = true;

        GameSet.RegisterUpdate(HomeLogic.ins.Update, HomeLogic.ins);
    }


    /**
     * 进入自己的家园
     * @param homeId 
     */
    async EnterMyHomeScene(homeId?: number, playEffect = true) {
        if (homeId == undefined) {
            let home = PlayerData.roleInfo.homelands[0];
            homeId = home.id;
        }
        if (!PlayerData.GetHomeLand(homeId)) return;
        PlayerData.RunHomeId = homeId;
        GameSet.intoGame = true;

        PlayerData.fightState = FightState.None;
        if (PlayerData.RunHomeId && PlayerData.RunHomeId != homeId && playEffect && !ChangeScenePanel.Showing) {
            await ChangeScenePanel.PlayEffect(Evt_Map_Tile_Complete);
        }

        HomeScene.Show();
        while (this.roles.length) {
            let role = this.roles.pop();
            if (role["receive"]) {
                role["receive"]();
            } else {
                role['destroy']();
            }
        }
        console.log("EnterMyHomeScene", homeId);
        let cfg = CfgMgr.GetHomeLandInit(homeId);
        if (cfg && PlayerData.roleInfo && homeId != GetGameData(PlayerDataMap.PrevHomeId)) {
            SaveGameData(PlayerDataMap.PrevHomeId, homeId);
        }

        // 移除巡逻
        while (this.patrols.length) {
            let role = this.patrols.pop();
            if (role["receive"]) {
                role["receive"]();
            } else {
                role['destroy']();
            }
        }

        // 使用家园建筑数据列表初始化家园
        let sbulidings = PlayerData.GetBuildings(homeId) || {};
        await HomeScene.ins.Init(cfg, sbulidings);
        PlayerData.fightState = FightState.Home;

        this.hasinit = true;

        // 刷新建筑状态
        // for (let k in sbulidings) {
        //     HomeScene.ins.FlushBuilding(sbulidings[k]);
        // }

        HomeLogic.ins.StartXunluo();
        GameSet.RegisterUpdate(HomeLogic.ins.Update, HomeLogic.ins);
        HomeScene.ins.VisibleBarAndLab(true);
        HomeScene.ins.VisibleSceneTouch(true);

        this.onFlushMyWoker();
        let bgmId: number = this.homeBGMInfo[homeId];
        this.playSceneSound(bgmId);
    }

    /**
     * 刷新家园工人数量
     * @param buildingId 
     */
    onFlushMyWoker() {
        const workbuildings = [BuildingType.cai_kuang, BuildingType.cai_mu, BuildingType.cai_shui, BuildingType.hua_fang];
        for (let type of workbuildings) {
            let buildings = PlayerData.GetBuildingByType(type, PlayerData.RunHomeId) || [];
            for (let building of buildings) {
                let stdlv = CfgMgr.GetBuildingLv(building.id, building.level);
                if (stdlv) {
                    let total = stdlv.WorkingRolesNum;
                    HomeScene.ins.FlushWoker(building.id, building.workerIdArr, total);
                }
            }
        }
        let buildings = PlayerData.GetBuildingByType(BuildingType.cheng_qiang, PlayerData.RunHomeId) || [];
        for (let building of buildings) {
            let stdlv = CfgMgr.GetBuildingLv(building.id, building.level);
            if (stdlv) {
                let total = stdlv.DefenseRolesNum;
                let roles = PlayerData.roleInfo.roles;
                let ls = PlayerData.roleInfo.defense_lineup || [];
                let defList: SPlayerDataRole[] = []
                for (let defense of ls) {
                    if (defense) {
                        for (let role of roles) {
                            if (role.id == defense.role_id) {
                                defList.push(role);
                            }
                        }
                    }
                }
                HomeScene.ins.FlushWoker(building.id, defList, total);
            }
        }
    }

    /**
     * 刷新建筑
     * @param sbuilding
     */
    FlushMyBuilding(sbuilding: SPlayerDataBuilding) {
        if (PlayerData.fightState == FightState.Home) {
            HomeScene.ins.FlushBuilding(sbuilding);
            this.onFlushMyWoker();
        }
    }

    /**
     * 资源变更
     * @param wood 
     * @param rock 
     * @param water 
     * @param seed 
     */
    AddMyResource(wood: number, rock: number, water: number, seed: number) {
        if (PlayerData.fightState == FightState.Home) {
            HomeScene.ins.AddResource(wood, rock, water, seed);
        }
    }

    /**
     * 进入战斗场景
     * @param homeId 
     * @param sbuildings 
     */
    async EnterPvpScene(homeId: number, type: FightState, sbuildings?: any) {
        console.log("EnterBattleScene", type);
        PlayerData.fightState = FightState.PvP;
        HomeScene.Show();
        HomeScene.ins.VisibleBarAndLab(false);
        HomeScene.ins.VisibleSceneTouch(false);
        while (this.roles.length) {
            let role = this.roles.pop();
            if (role["receive"]) {
                role["receive"]();
            } else {
                role['destroy']();
            }
        }

        while (this.patrols.length) {
            let role = this.patrols.pop();
            if (role["receive"]) {
                role["receive"]();
            } else {
                role['destroy']();
            }
        }
        await ChangeScenePanel.PlayEffect(Evt_Map_Tile_Complete);

        let cfg = CfgMgr.GetHomeLandInit(homeId);
        let datas: { [buildingId: number]: SPlayerDataBuilding } = {};
        for (const key in sbuildings) {
            let info = sbuildings[key];
            let data: SPlayerDataBuilding = {
                id: info.id,
                is_upgrading: info.is_upgrading,
                level: info.level,
                upgrade_time: info.upgrade_time
            };
            datas[data.id] = data;
        }
        await HomeScene.ins.Init(cfg, datas);
        this.hasinit = true;
        GameSet.UpRegisterUpdate(HomeLogic.ins.Update, HomeLogic.ins);
        let node = map.GetGrid(HomeScene.ins.GetHomeCfg().camera);
        SceneCamera.Zoom(1);
        SceneCamera.LookAt(node.x, node.y * 0.7);

        this.playSceneSound(SceneBgmId.SceneBgm_4);

    }

    async EnterPveScene(mapId) {
        PlayerData.fightState = FightState.PvE;
        HomeScene.ins.VisibleBarAndLab(false);
        HomeScene.ins.VisibleSceneTouch(false);
        console.log("EnterBattleScene", PlayerData.fightState);
        while (this.roles.length) {
            let role = this.roles.pop();
            if (role["receive"]) {
                role["receive"]();
            } else {
                role['destroy']();
            }
        }

        while (this.patrols.length) {
            let role = this.patrols.pop();
            if (role["receive"]) {
                role["receive"]();
            } else {
                role['destroy']();
            }
        }
        HomeScene.ins.VisibleAllBuildings(false);
        SceneCamera.Zoom(1);
        GameSet.UpRegisterUpdate(HomeLogic.ins.Update, HomeLogic.ins);
        let node = map.GetGrid(HomeScene.ins.GetHomeCfg().camera);
        SceneCamera.LookAt(node.x, node.y * 0.7);

        let mask = new Node();
        mask.addComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>("sheets/common/di/spriteFrame", SpriteFrame);
        mask.setPosition(node.x, node.y + 1160);
        mask.layer = GameSet.Scenelayer;
        mask.setScale(1.5, 1.5, 1);
        // mask.getComponent(UITransform).setContentSize(1320, 1160);
        HomeScene.ins.AddPveMap(mask);

        const mapIds = [`${mapId}_01`, `${mapId}_02`];

        // 遍历 mapIds 数组，为每个 mapId 创建一个 pveMap 节点
        for (let i = 0; i < mapIds.length; i++) {
            let pveMap = new Node();
            pveMap.layer = GameSet.Scenelayer;
            pveMap.setPosition(node.x, node.y - (i - 0.5) * 1160); //向上偏移图片大小像素
            let sprite = pveMap.addComponent(Sprite);
            sprite.spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(`pve/battle_map/${mapIds[i]}/spriteFrame`, SpriteFrame);
            HomeScene.ins.AddPveMap(pveMap);
        }

        this.playSceneSound(SceneBgmId.SceneBgm_4);


        // let pveMap = new Node();
        // pveMap.layer = GameSet.Scenelayer;
        // pveMap.setPosition(node.x, node.y);
        // let sprite = pveMap.addComponent(Sprite);
        // sprite.spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(`pve/battle_map/${mapId}/spriteFrame`, SpriteFrame);
        // HomeScene.ins.AddPveMap(pveMap);
    }

    ExitPveScene() {
        PlayerData.fightState = FightState.Home;
        HomeScene.ins.RemovePveMap();
        HomeScene.ins.VisibleAllBuildings(true);

        HomeLogic.ins.StartXunluo();
        GameSet.RegisterUpdate(HomeLogic.ins.Update, HomeLogic.ins);
        HomeScene.ins.VisibleBarAndLab(true);
        HomeScene.ins.VisibleSceneTouch(true);
        HomeScene.ins.Camera2JiDiPos();
        SceneCamera.Move(0, 0);
        this.onFlushMyWoker();
        this.playSceneSound();
    }




    async EnterPvPReplayScene(homeId: number, sbuildings?: any) {
        PlayerData.fightState = FightState.Replay;
        HomeScene.Show();
        HomeScene.ins.VisibleBarAndLab(false);
        HomeScene.ins.VisibleSceneTouch(false);
        while (this.roles.length) {
            let role = this.roles.pop();
            if (role["receive"]) {
                role["receive"]();
            } else {
                role['destroy']();
            }
        }

        while (this.patrols.length) {
            let role = this.patrols.pop();
            if (role["receive"]) {
                role["receive"]();
            } else {
                role['destroy']();
            }
        }
        await ChangeScenePanel.PlayEffect(Evt_Map_Tile_Complete);

        let cfg = CfgMgr.GetHomeLandInit(homeId);
        let datas: { [buildingId: number]: SPlayerDataBuilding } = {};
        for (const key in sbuildings) {
            let info = sbuildings[key];
            let data: SPlayerDataBuilding = {
                id: info.id,
                is_upgrading: info.is_upgrading,
                level: info.level,
                upgrade_time: info.upgrade_time
            };
            datas[data.id] = data;
        }
        await HomeScene.ins.Init(cfg, datas);
        this.hasinit = true;
        GameSet.UpRegisterUpdate(HomeLogic.ins.Update, HomeLogic.ins);
        let node = map.GetGrid(HomeScene.ins.GetHomeCfg().camera);
        SceneCamera.LookAt(node.x, node.y);
        this.playSceneSound(SceneBgmId.SceneBgm_4);

        HomeScene.ins.VisibleBuilding(BuildingType.cheng_qiang, false);
        HomeScene.ins.VisibleBuilding(BuildingType.fang_yu_ta, false);
        HomeScene.ins.VisibleBuilding(BuildingType.ji_di, false);
    }

    //进入繁育界面
    GoToFanyuScene() {
        let stopAudioData: SoundDefine;
        stopAudioData = this.sceneBGMInfo[this.curBgmId];
        if (stopAudioData) AudioMgr.Stop(stopAudioData);
    }

    //退出繁育界面
    ExistFanyuScene() {
        AudioMgr.Stop(Audio_BuildingFanyu)
        this.playSceneSound();
    }


    private playSceneSound(id?: number): void {
        let stopId: number;
        let stopAudioData: SoundDefine;
        let playId: number;
        if (id > 0) {
            if (this.curBgmId == id) {
                return;
            }
            stopId = this.curBgmId;
            playId = id;
        } else {
            stopId = this.curBgmId;
            playId = this.homeBGMInfo[PlayerData.RunHomeId];
        }
        stopAudioData = this.sceneBGMInfo[stopId];
        if (stopAudioData) AudioMgr.Stop(stopAudioData);
        let audioData: SoundDefine = this.sceneBGMInfo[playId];
        AudioMgr.PlayCycle(audioData);
        console.log(`播放背景音效---->` + audioData.url);
        this.curBgmId = playId;
    }

}
