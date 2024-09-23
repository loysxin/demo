import { Component, Node, NodeEventType, __private, isValid } from "cc";

/** 事件回调函数类型 */
export type EventHandler = (...params) => void;

/**
 * 事件派发与监听
 */
export class EventMgr {
    private static _instance: EventMgr;
    private static dispatcher: Node = new Node();

    /** 添加监听 */
    static on(type: string | NodeEventType, callback: __private._types_globals__AnyFunction, target?: unknown, useCapture?: any): void {
        this.dispatcher.on(type, callback, target, useCapture);
    }

    /** 派发监听 */
    static emit(type: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any): void {
        this.dispatcher.emit(type, arg0, arg1, arg2, arg3, arg4);
    }

    /** 是否已存在监听 */
    static hasEventListener(type: string, callback?: __private._types_globals__AnyFunction, target?: unknown): any {
        this.dispatcher.hasEventListener(type, callback, target);
    }

    /** 执行单次监听，派发后移除监听 */
    static once(type: string, callback: __private._types_globals__AnyFunction, target?: unknown, useCapture?: any): void {
        this.dispatcher.once(type, callback, target, useCapture);
    }

    /** 移除监听 */
    static off(type: string, callback?: __private._types_globals__AnyFunction, target?: unknown, useCapture?: any): void {
        this.dispatcher.off(type, callback, target, useCapture);
    }

    /** 根据Target移除监听 */
    static removeByTarget(target: string | unknown): void {
        this.dispatcher.targetOff(target);
    }

    static passls = {};
    static ins = new Node();
    static onChannel(type: string, listener: Function, thisObj: any) {
        if (this.passls[type]) throw "事件通道每个事件只允许注册一个侦听接口";
        this.passls[type] = [listener, thisObj];
        this.ins.on(type, listener, thisObj);
    }
    static offChannel(type: string) {
        let obj = this.passls[type];
        this.ins.off(type, obj[0], obj[1]);
        delete this.passls[type];
    }
    static emitChannel(type: string, ...datas: any[]) {
        this.ins.emit(type, ...datas);
    }
}

/**
 * 打开ui引导入口
 * @param type 
 * @param args 
 */
export function Goto(type: any, ...args: any[]) {
    EventMgr.emit('ui_guide', type, ...args);
}

/**指引步骤 */
export const Evt_Guide_Step = "Evt_Guide_Step";
export const Evt_Guide_Close = "Evt_Guide_Close";

/**隐藏场景 */
export const Evt_Hide_Scene = "Evt_Hide_Scene";
/**显示场景 */
export const Evt_Show_Scene = "Evt_Show_Scene";

/**隐藏场景 */
export const Evt_Hide_Home_Ui = "Evt_Hide_Home_Ui";
/**显示场景 */
export const Evt_Show_Home_Ui = "Evt_Show_Home_Ui";

/**重新登录 */
export const Evt_ReLogin = "Evt_ReLogin";

/**重新连接 */
export const Evt_ReConnect = "Evt_ReConnect";

/**重连成功 */
export const Evt_ReConnect_Success = "Evt_ReConnect_Success";

/**刘海屏 */
export const Evt_Layout_Status_Bar = "Evt_Layout_Status_Bar";

/**彩虹体数量变更 */
export const Evt_Currency_Updtae = "Evt_Currency_Updtae";
/**资源数量变更 */
export const Evt_Res_Update = "Evt_Res_Update";
export const Evt_Collect_Update = "Evt_Collect_Update";
/**添加状态栏到场景 */
export const Evt_Add_Entity_Bar = "Evt_Add_Entity_Bar";

/**地图切块加载完毕 */
export const Evt_Map_Tile_Complete = "Evt_Map_Tile_Complete";

/**地图移动 */
export const Evt_Map_Moving = "Evt_Map_Moving";
/**地图停止移动 */
export const Evt_Map_StopMove = "Evt_Map_StopMove";

/**建筑动作 */
export const Evt_Building_Action = "Evt_Building_Action";

/**建筑动作 */
export const Evt_Building_Child_Action = "Evt_Building_Child_Action";

/**建筑准备完毕 */
export const Evt_Building_Complete = "Evt_Building_Complete";

/**生产更新 */
export const Evt_Production_Update = "Event_Production_Update";
/**生产加速 */
export const Evt_Production_JiaSu = "Evt_Production_JiaSu";

/**播放建筑提升特效 */
export const Evt_Building_Effect = "Evt_Building_Effect";

/**建筑升级成功 */
export const Evt_Building_Upgrade_Complete = "Evt_Building_Upgrade_Complete";

/**建筑升级中 */
export const Evt_Building_Upgrade = "Evt_Building_Upgrade";

/**道具变更 */
export const Evt_Item_Change = "Evt_Item_Change";

/**兵营推送 */
export const Evt_Soldier_Push = "Evt_Soldier_Push";
/**兵营加速 */
export const Evt_Soldier_JiaSu = "Evt_Soldier_JiaSu";

/**新增邮件 */
export const Evt_Mail_Add = "Evt_Mail_Add";

/**邮件更新 */
export const Evt_Mail_Update = "Evt_Mail_Update";

/**读取邮件 */
export const Evt_ReadMail = "Evt_ReadMail";

/**删除邮件 */
export const Evt_DelMail = "Evt_ReadMail";

/**提取附件 */
export const Evt_ClaimMailAttachments = "Evt_ClaimMailAttachments";

/**提取附件 */
export const Evt_SendMail = "Evt_SendMail";

/**刷新工人 */
export const Evt_FlushWorker = "Evt_FlushWorker";

/**防守 */
export const Evt_Defense = "Evt_Defense";
/**角色上阵*/
export const Evt_RoleAttack = "Evt_RoleAttack";
/**合成 */
export const Evt_Compose = "Evt_Compose";

/**角色升级 */
export const Evt_Role_Upgrade = "Evt_Role_Upgrade";

/**角色删除 */
export const Evt_Role_Del = "Evt_Role_Del";

/**角色数据变更*/
export const Evt_Role_Update = "Evt_Role_Update";

/**家园解锁 */
export const Evt_HomeLand_Unlock = "Evt_HomeLand_Unlock";

/**进入家园 */
export const Evt_EnterHome = "Evt_EnterHome";

/**获得奖励 */
export const Evt_GetReward = "Evt_GetReward";

/**被动技能更新 */
export const Evt_Passive_Skill_Update = "Evt_Passive_Skill_Update";

/**前端保存数据更新 */
export const Evt_ConfigData_Update = "Evt_ConfigData_Update";

/**刷新获取收益详情 */
export const Evt_GetIncommons = "Evt_GetIncommons";

/**刷新获取上线好友信息 */
export const Evt_GetUPLineInfo = "Evt_GetUPLineInfo";

/**刷新获取下线好友信息 */
export const Evt_GetDownLineInfo = "Evt_GetDownLineInfo"

/**刷新获取好友联系信息 */
export const Evt_GetContactInfo = "Evt_GetContactInfo"

/**刷新收益记录信息 */
export const Evt_GetIncomeRecords = "Evt_GetIncomeRecords"

/**刷新繁育协助列表信息 */
export const Evt_GetRandomDownline = "Evt_GetRandomDownline"

/**关闭好友绑定界面 */
export const Evt_CloseFriendBindOrUnbindPanel = "Evt_CloseFriendBindOrUnbindPanel"

/**刷新好友协作界面 */
export const Evt_SetAssistRole = "Evt_SetAssistRole"

/**刷新好友角色助战界面 */
export const Evt_UpdateFriendAssistRole = "Evt_UpdateFriendAssistRole"

/**任务信息更改 */
export const Evt_TaskChange = "Evt_TaskChange"
/**任务领取奖励 */
export const Evt_TaskGetReward = "Evt_TaskGetReward"
/**钓鱼数据更新 */
export const Evt_FishDataUpdate = "Evt_FishDataUpdate"
/**钓鱼日志数据更新 */
export const Evt_FishLogDataUpdate = "Evt_FishLogDataUpdate"
/**钓鱼商店数据更新 */
export const Evt_FishShopDataUpdate = "Evt_FishShopDataUpdate"
/**卖鱼鱼商店数据更新 */
export const Evt_SellFishUpdate = "Evt_SellFishUpdate"
/**钓鱼排行榜数据更新 */
export const Evt_FishRankUpdate = "Evt_FishRankUpdate"
/**钓鱼鱼库数据更新 */
export const Evt_FishItemUpdate = "Evt_FishItemUpdate"
/**是否展示奖励 */
export const Evt_OpenBoxGetRewardPanel = "Evt_OpenBoxGetRewardPanel"

/**掠夺角色信息 */
export const Evt_LootPlayerData = "Evt_LootPlayerData"
/**掠夺赛季信息 */
export const Evt_LootSeasonData = "Evt_LootSeasonData"
/**掠夺 */
export const Evt_LootPlunder = "Evt_LootPlunder"
/**掠夺记录 */
export const Evt_LootPlunderRecord = "Evt_LootPlunderRecord"
/**掠夺获取玩家战斗信息 */
export const Evt_LootGetPlayerBattleData = "Evt_LootGetPlayerBattleData"
/**pve地图加载完成 */
export const Evt_PveMaploadFinish = "Evt_PveMaploadFinish"
/**pvp匹配完成 */
export const Evt_PvpSerchFinsh = "Evt_PvpSerchFinsh"
/**pvp购买次数 */
export const Evt_BuyPlunderTimes = "Evt_BuyPlunderTimes"
/** 出战英雄变动 */
export const Evt_HeroDeployed = "Evt_HeroDeployed";
/**pvp匹配成功 */
export const Evt_Matching = "Evt_Matching"
/**pvp匹配成功 */
export const Evt_Matching2 = "Evt_Matching2"
/**玩家总战力变更 */
export const Evt_FightChange = "Evt_FightChange";
/**小兵分配事件 */
export const Evt_SoldierAssignment = "Evt_SoldierAssignment";
/**商城刷新 */
export const Evt_ShopUpdate = "Evt_ShopUpdate";
/**商城抽奖获得 */
export const Evt_ShopLuckyGet = "Evt_ShopLuckyGet";
/**频道信息更新 */
export const Evt_ChannelMsgUpdate = "Evt_ChannelMsgUpdate";
/**跨天事件 */
export const Evt_NextDay = "Evt_NextDay";
/**却换背景音*/
export const Evt_Change_Scene_Bgm = "Evt_Change_Scene_Bgm";
/**广告次数刷新 */
export const Evt_AdvisterUpdate = "Evt_AdvisterUpdate";

/**移动镜头 */
export const Evt_Tween_To = "Evt_Tween_To";

/**货币流水 */
export const Evt_CurrencyIncomInfoUpdate = "Evt_CurrencyIncomInfoUpdate";

/**用户本地储存信息改变*/
export const Evt_UserDataChange = "Evt_UserDataChange";
/**任务宝箱显示*/
export const Evt_TaskShowBoxTips = "Evt_TaskShowBoxTips";
/**本次登录红点改变*/
export const Evt_LoginRedPointUpdate = "Evt_LoginRedPointUpdate";
/**用户信息改变*/
export const Evt_UserInfoChange = "Evt_UserInfoChange";
/**公会数据更新*/
export const Evt_GuildChange = "Evt_GuildChange";
/**公会搜素数据返回*/
export const Evt_GuildSearch = "Evt_GuildSearch";
/**公会管理菜单弹出*/
export const Evt_GuildMenuShow = "Evt_GuildMenuShow";
/**权益卡领取奖励返回*/
export const Evt_RightsGetReward = "Evt_RightsGetReward";
