import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { HomeLogic } from "./HomeLogic";
import { HomeUI } from "./panel/HomeUI";
import PlayerData, { BoostType, FightState, NoticeData, PlayerDataMap, SAdvister, SBattleRole, SBoostStruct, SPlayerDataBuilding, SPlayerDataHomeland, SPlayerDataItemProduction, SPlayerDataRole, SThing } from "../roleModule/PlayerData";
import { Evt_Building_Upgrade, Evt_Building_Upgrade_Complete, EventMgr, Evt_FlushWorker, Evt_Production_Update, Evt_Defense, Evt_HomeLand_Unlock, Evt_Soldier_JiaSu, Evt_Currency_Updtae, Evt_Res_Update, Evt_ConfigData_Update, Evt_RoleAttack, Evt_Hide_Scene, Evt_Show_Scene, Evt_Show_Home_Ui, Evt_Hide_Home_Ui, Evt_Production_JiaSu, Evt_NextDay, Evt_AdvisterUpdate, Evt_Collect_Update } from "../../manager/EventMgr";
import Logger from "../../utils/Logger";
import { BuildCompletedPanel } from "../common/BuildCompletedPanel";
import { BuildingType, CanSet } from "./HomeStruct";
import { AdvisterId, CfgMgr, MessagId, StdAdvister, StdDefineBuilding, StdTask, SysMessagType } from "../../manager/CfgMgr";
import { ProductionModule } from "../production/ProductionModule";
import { ProductionPanel } from "../production/ProductionPanel";
import { GetGameData, InitGameData, SyncGameData } from "../../net/MsgProxy";
import { HomeScene } from "./HomeScene";
import { LoginPanel } from "../login/LoginPanel";
import { SceneCamera } from "../SceneCamera";
import { MarqueePanel } from "./panel/MarqueePanel";
import { Http, SendGetAllNotice } from "../../net/Http";
import { NoticePanel } from "../notice/NoticePanel";
import TimerMgr from "../../utils/TimerMgr";
import { GameSet } from "../GameSet";
import { ServerPanel } from "../login/ServerPanel";
import { Second } from "../../utils/Utils";
import { MsgPanel } from "../common/MsgPanel";
import { ItemUtil } from "../../utils/ItemUtils";
import { RewardTips } from "../common/RewardTips";
import { DateUtils } from "../../utils/DateUtils";

let hide_scene: { [key: string]: string } = {};
let hide_home_ui: { [key: string]: string } = {};

export class HomeModule {
    private isNextDay: boolean = false;
    constructor() {
        new HomeLogic();
        Session.on(MsgTypeRet.DailyRefreshPush, this.onDailyRefreshPush, this);
        Session.on(MsgTypeRet.GetPlayerDataRet, this.onRoleData, this);
        Session.on(MsgTypeRet.BuildingUnlockRet, this.onBuildingUnLock, this);
        Session.on(MsgTypeRet.BuildingUpgradeRet, this.onBuildingUpgrade, this);
        Session.on(MsgTypeRet.ResourceChangePush, this.onResourceChange, this);
        Session.on(MsgTypeRet.CurrencyChangePush, this.onCurrencyChange, this);
        Session.on(MsgTypeRet.BuildingRemoveRoleRet, this.onBuildingRemoveRole, this);
        Session.on(MsgTypeRet.BuildingAssignRoleRet, this.onBuildingAssignRole, this);
        Session.on(MsgTypeRet.BuildingUpgradeCompleteRet, this.onBuildingUpgradeCompleteRet, this);
        Session.on(MsgTypeRet.SetDefenseRolesRet, this.onSetDefenseRolesRet, this);
        Session.on(MsgTypeRet.SetAttackRolesRet, this.onSetAttackRolesRet, this);
        //Session.on(MsgTypeRet.PvERet, this.onPvERet, this);
        Session.on(MsgTypeRet.HomelandUnlockRet, this.onHomeLandUnlock, this);
        Session.on(MsgTypeRet.BoostRet, this.onBoostResponse, this);
        Session.on(MsgTypeRet.RoleConsumePush, this.onUseRole, this);
        Session.on(MsgTypeRet.AddRolePush, this.onAddRole, this);
        Session.on(MsgTypeRet.HomelandCollectDurationChangePush, this.onHomelandCollectChangePush, this);
        Session.on(MsgTypeRet.SoldiersPush, this.onSoldiersPush, this);
        Session.on(MsgTypeRet.MarqueePush, this.onMarquee, this);
        Session.on(MsgTypeRet.SystemMessagePush, this.onSystemMessagePush, this);
        Session.on(MsgTypeRet.GetAllDailyAdCountsRet, this.onAdvisterInit, this);
        Session.on(MsgTypeRet.AdCountChangePush, this.onAdvisterPush, this);
        EventMgr.on(Evt_Show_Scene, this.onShowScene, this);
        EventMgr.on(Evt_Hide_Scene, this.onHideScene, this);
        EventMgr.on(Evt_Show_Home_Ui, this.onShowHomeUI, this);
        EventMgr.on(Evt_Hide_Home_Ui, this.onHideHomeUI, this);
    }

    protected onShowScene(key: string) {
        this.onShowHomeUI(key);
        if (!key) {
            hide_scene = {};
        } else {
            delete hide_scene[key];
        }
        for (let k in hide_scene) {
            console.log("hideScene", hide_scene[k]);
            return;
        }
        if (!PlayerData.RunHomeId) return;
        HomeScene.ins.Visible(true);
        SceneCamera.mask(false);

    }
    protected onHideScene(key: string, path?: string) {
        if (!PlayerData.RunHomeId) return;
        HomeScene.ins.Visible(false);
        SceneCamera.mask(true);
        hide_scene[key] = path || key;
        this.onHideHomeUI(key, path);
    }
    protected onShowHomeUI(key: string) {
        if (!key) {
            hide_home_ui = {};
        } else {
            delete hide_home_ui[key];
        }
        for (let k in hide_home_ui) {
            console.log("hideHomeUI", hide_home_ui[k]);
            return;
        }
        HomeUI.Visible(true);
    }
    protected onHideHomeUI(key: string, path?: string) {
        if (!PlayerData.RunHomeId) return;
        HomeUI.Visible(false);
        hide_home_ui[key] = path || key;
    }

    onDailyRefreshPush() {
        this.isNextDay = true;
        let data = {
            type: MsgTypeSend.GetPlayerData,
            data: {}
        }
        Session.Send(data);
    }

    onRoleData(data: any) {
        
        LoginPanel.Hide();
        ServerPanel.Hide();
        PlayerData.SetPlayerInfo(data);
        PlayerData.ResetChannelMsg();
        PlayerData.ResetOneOffRedPoint();
        let result = InitGameData(data.config_data);
        if (!GameSet.Reconnect && PlayerData.fightState == FightState.None) this.EnterGame();
        if (result) EventMgr.emit(Evt_ConfigData_Update);
        //获取广告数据
        Session.Send({ type: MsgTypeSend.GetAllDailyAdCounts, data: {} });
        if (GameSet.Reconnect) return;
        if (this.isNextDay) {
            EventMgr.emit(Evt_NextDay);
            this.isNextDay = false;
            let taskMap = PlayerData.roleInfo.tasks;
            for (const key in taskMap) {
                let id: number = Number(key);
                let std: StdTask = CfgMgr.GetTaskById(id);
                console.log("跨天任务更新---->id = " + std.TaskId + "任务类型---->" + std.TaskType)
            }
        }
        //获取邮件
        let sendData = {
            type: MsgTypeSend.GetPlayerMails,
            data: {
                read_flag: 0,        // 邮件读取状态筛选条件: 0-所有邮件, 1-已读邮件, 2-未读邮件
                page: 1,             // 邮件列表的页码,用于分页
                page_size: 99999, // 每页的邮件数量,用于分页
            }
        }
        Session.Send(sendData);
        //获取掠夺数据
        Session.Send({ type: MsgTypeSend.GetMatchPlayerData, data: { player_id: PlayerData.roleInfo.player_id } });
        Session.Send({ type: MsgTypeSend.GetCurrentSeasonInfo, data: { player_id: PlayerData.roleInfo.player_id } });
        //请求钓鱼数据
        Session.Send({ type: MsgTypeSend.FishingGetPlayerData, data: {} });
        Session.Send({ type: MsgTypeSend.FishingShopGetContent, data: {} });
        //获取公会数据
        Session.Send({ type: MsgTypeSend.GuildGetSelf, data: {} });
        this.sendNotice();

    }
    /**
     * 请求公告数据
     */
    private async sendNotice(): Promise<void> {
        let noticeDatas = await Http.Send(SendGetAllNotice, {});
        if (!noticeDatas) return;
        let list: NoticeData[] = noticeDatas["data"] || [];

        if (PlayerData.SetNoticeDatas(list)) {
            NoticePanel.Show(true);
        }


    }
    onBuildingUnLock(data) {
        Logger.log("接收到建筑解锁", data);
        data.upgrade_time += 1;
        let sbuilding = PlayerData.UnLockBuilding(data.building_id, data.upgrade_time);

        HomeLogic.ins.FlushMyBuilding(sbuilding);
        EventMgr.emit(Evt_Building_Upgrade_Complete, data.building_id, data.upgrade_level);
        this.addBuildCreateTimeComplete(sbuilding);

    }
    /**
     * 增加建筑建造完成系统频道消息
     * @param data 建筑数据 
     * @returns 
     */
    private addBuildCreateTimeComplete(data: SPlayerDataBuilding): void {
        let std: StdDefineBuilding = CfgMgr.GetBuildingUnLock(data.id);
        if (!std) return;
        let funName: string = `OnBuildUnlockTimeComplete_${std.HomeId}_${data.id}`;
        let completeCb: Function = this[funName];
        if (!completeCb) {
            completeCb = () => {
                //console.log(std.remark + "建造完成")
                PlayerData.AddChannelMsg(MessagId.Messag_20, std.remark);
            };
            this[funName] = completeCb;

        }
        TimerMgr.Register(completeCb, this, data.upgrade_time);
    }
    /**建筑升级数据 */
    onBuildingUpgrade(data: { building_id: number, upgrade_level: number, upgrade_time: number }) {
        data.upgrade_time += 1;
        let sbuilding = PlayerData.UpGradeBuilding(data.building_id, data.upgrade_time);
        this.addBuildUpTimeComplete(sbuilding);
        EventMgr.emit(Evt_Building_Upgrade, sbuilding);
        HomeLogic.ins.FlushMyBuilding(sbuilding);
    }
    /**
     * 增加建筑升级完成系统频道消息
     * @param data 建筑数据 
     * @returns 
     */
    private addBuildUpTimeComplete(data: SPlayerDataBuilding): void {
        let std: StdDefineBuilding = CfgMgr.GetBuildingUnLock(data.id);
        if (!std) return;
        let funName: string = `OnBuildUpTimeComplete_${std.HomeId}_${data.id}`;
        let completeCb: Function = this[funName];
        if (!completeCb) {
            completeCb = () => {
                //console.log(std.remark + "建造完成")
                PlayerData.AddChannelMsg(MessagId.Messag_19, std.remark, data.level + 1);
            };
            this[funName] = completeCb;

        }
        TimerMgr.Register(completeCb, this, data.upgrade_time);
    }

    async EnterGame() {
        Logger.log("进入场景");
        HomeUI.ShowUI();
        let homeId = GetGameData(PlayerDataMap.PrevHomeId) || 101;
        HomeLogic.ins.EnterMyHomeScene(homeId);
    }
    Update() {
    }

    /**
     * 资源变更
     * @param data 
     */
    onResourceChange(data: { data: number, rock: number, seed: number, total_rock: number, total_seed: number, total_water: number, total_wood: number, water: number, wood: number }) {
        PlayerData.resources.rock = data.total_rock;
        PlayerData.resources.seed = data.total_seed;
        PlayerData.resources.water = data.total_water;
        PlayerData.resources.wood = data.total_wood;
        HomeUI.Flush();
        HomeLogic.ins.AddMyResource(data.wood, data.rock, data.water, data.seed);
        EventMgr.emit(Evt_Res_Update);
        PlayerData.UpdateSpecialItems();
    }

    protected currencyChangeOff = false;
    /**金币变更 */
    async onCurrencyChange(data: { type: number, value: number, change_value: number }) {
        switch (data.type) {
            case 0:
                PlayerData.roleInfo.currency = data.value;
                break;
            case 2:
                PlayerData.roleInfo.currency2 = data.value;
                break;
            case 3:
                PlayerData.roleInfo.currency3 = data.value;
                break;
        }
        PlayerData.UpdateSpecialItems(false);

        if (this.currencyChangeOff) return;
        this.currencyChangeOff = true;
        await Second(0.1);
        this.currencyChangeOff = false;
        HomeUI.Flush();
        EventMgr.emit(Evt_Currency_Updtae);
    }

    /**删除某个建筑的角色 */
    onBuildingRemoveRole(data: { role_id: number, building_id: number }) {
        PlayerData.RemoveBuildRoles(data);
        EventMgr.emit(Evt_FlushWorker, data.building_id);
    }

    /**增加某个建筑角色 */
    onBuildingAssignRole(data: { role_id: number, building_id: number }) {
        PlayerData.AddBuildRoles(data);
        EventMgr.emit(Evt_FlushWorker, data.building_id);
    }

    onBuildingUpgradeCompleteRet(data: { building_id: number, upgrade_level: number }) {
        // Logger.log('onBuildingUpgradeCompleteRet', data)
        if (PlayerData.checkBuilding(data.building_id)) { //已有建筑
            let sbuilding = PlayerData.UpGradeBuilding(data.building_id, 0, data.upgrade_level);
            HomeLogic.ins.FlushMyBuilding(sbuilding);
            EventMgr.emit(Evt_Building_Upgrade_Complete, data.building_id, data.upgrade_level);
        } else {
            this.onBuildingUnLock(data);
        }

    }

    onSetDefenseRolesRet(data: { lineup: SBattleRole[] }) {
        PlayerData.roleInfo.defense_lineup = data.lineup;
        EventMgr.emit(Evt_FlushWorker);
    }

    onSetAttackRolesRet(data) {
        PlayerData.roleInfo.attack_lineup = data.lineup;
        EventMgr.emit(Evt_RoleAttack);
    }

    onPvERet(data) {
        PlayerData.updataPveData(data);
    }

    /**家园解锁回调 */
    onHomeLandUnlock(json: { homeland: SPlayerDataHomeland }) {
        let data = json.homeland;
        let homelands = PlayerData.homelands;
        for (let i = 0; i < homelands.length; i++) {
            if (homelands[i].id == data.id) {
                homelands[i] = data;
                BuildCompletedPanel.Show(data.id, BuildingType.ji_di, () => {
                    HomeLogic.ins.EnterMyHomeScene(data.id);
                }, CfgMgr.GetBuildingDefine(data.id, BuildingType.ji_di)[0].BuildingId);
                EventMgr.emit(Evt_HomeLand_Unlock, data.id);
                return;
            }
        }
        homelands.push(data);
        BuildCompletedPanel.Show(data.id, BuildingType.ji_di, () => {
            HomeLogic.ins.EnterMyHomeScene(data.id);
        }, CfgMgr.GetBuildingDefine(data.id, BuildingType.ji_di)[0].BuildingId);
        EventMgr.emit(Evt_HomeLand_Unlock, data.id);
    }

    onBoostResponse(data: SBoostStruct): void {
        switch (data.boost_type) {
            case BoostType.BoostTypeBuildingUpgrade:
                let sbuilding = PlayerData.UpGradeBuilding(data.id, data.changed_time);
                this.addBuildUpTimeComplete(sbuilding);
                EventMgr.emit(Evt_Building_Upgrade, sbuilding);
                HomeLogic.ins.FlushMyBuilding(sbuilding);
                break;
            case BoostType.BoostTypeSoldierProduce:
                PlayerData.UpdateSoldierProdTime(data.id, data.changed_time);
                EventMgr.emit(Evt_Soldier_JiaSu, data.id, data.changed_time);
                break;
            case BoostType.BoostTypeItemProduction:
                let prodData: SPlayerDataItemProduction = PlayerData.GetProductionState(data.id);
                if (prodData) {
                    prodData.finish_time = data.changed_time;
                    PlayerData.UpdateItemProduction(prodData);
                    ProductionPanel.Flush();
                    EventMgr.emit(Evt_Production_JiaSu, prodData);
                    EventMgr.emit(Evt_Production_Update);
                }
                break;
            default:
                break;
        }
    }

    /**
     * 移除消耗的角色
     */
    protected onUseRole(data: { role_id: string }) {
        PlayerData.DelRole(data.role_id);
    }
    /**
     * 添加的角色
     */
    protected onAddRole(data: { role: SPlayerDataRole }) {
        PlayerData.AddRole(data.role);
    }

    /**
     * 资源变更
     * @param data 
     */
    protected onHomelandCollectChangePush(data: { homeland_id: number, rock: number, water: number, wood: number, seed: number, total_rock_collect_duration: number, total_seed_collect_duration: number, total_water_collect_duration: number, total_wood_collect_duration: number, }) {
        // PlayerData.resources.rock = data.total_rock;
        // PlayerData.resources.seed = data.total_seed;
        // PlayerData.resources.water = data.total_water;
        // PlayerData.resources.wood = data.total_wood;
        // HomeUI.Flush();
        // HomeLogic.ins.AddMyResource(data.wood, data.rock, data.water, data.seed);
        // EventMgr.emit(Evt_Res_Updtae);
        if (PlayerData.nowhomeLand) {
            PlayerData.nowhomeLand.total_wood_collect_duration = data.total_wood_collect_duration;
            PlayerData.nowhomeLand.total_rock_collect_duration = data.total_rock_collect_duration;
            PlayerData.nowhomeLand.total_seed_collect_duration = data.total_seed_collect_duration;
            PlayerData.nowhomeLand.total_water_collect_duration = data.total_water_collect_duration;

            TimerMgr.Register(this.CollectCompleteTime, this, PlayerData.nowhomeLand.total_wood_collect_duration + PlayerData.GetServerTime());
            EventMgr.emit(Evt_Collect_Update);
        }
    }
    /**
     * 添加采集时间完成系统频道消息
     */
    private CollectCompleteTime(): void {
        PlayerData.AddChannelMsg(MessagId.Messag_22);
    }
    protected onSoldiersPush(data) {
        if (data.soldiers)
            PlayerData.updateSoldiers(data.soldiers);
    }
    protected onMarquee(data) {
        PlayerData.TipsList.push(data);
        if (!MarqueePanel.Showing) MarqueePanel.ShowTop();
        if (data.type == SysMessagType.MarqueeAndChannel) {
            PlayerData.AddServerChannelMsg({ type: SysMessagType.Channel, content: data.content });
        }
    }
    private onSystemMessagePush(data: { type: string, content: string }): void {
        let newData: { type: number, content: string } = {
            type: Number(data.type),
            content: data.content,
        }
        if (newData.type == SysMessagType.Channel) {
            PlayerData.AddServerChannelMsg(newData);
        }

    }
    private onAdvisterInit(data: { ad_counts: { [key: string]: number } }): void {
        PlayerData.SetAdvisterData(data.ad_counts);
        EventMgr.emit(Evt_AdvisterUpdate);
    }
    private onAdvisterPush(data: { ad_type: number, new_count: number }): void {
        let std: StdAdvister = CfgMgr.GetAdvister(data.ad_type);
        console.log("广告完成----->" + data.ad_type);
        if(std){
            let awardList:SThing[];
            switch(std.Ad_ID){
                case AdvisterId.Advister_1:
                    MsgPanel.Show(`已获得采集时长${DateUtils.FormatTime(std.AcquisitionTime, "%{hh}:%{mm}:%{ss}")}`);
                    break;
                case AdvisterId.Advister_2:
                    break;
                case AdvisterId.Advister_3:
                    break;
                case AdvisterId.Advister_4:
                    awardList = ItemUtil.GetSThingList(std.RewardType, std.RewardID, std.RewardNumber);
                    break;
            }
            if(awardList && awardList.length){
                console.log("奖励展示----->");
                RewardTips.Show(awardList);
            }
        }
        PlayerData.UpdateAdvisterData(data.ad_type, data.new_count);
        EventMgr.emit(Evt_AdvisterUpdate);
    }
}
