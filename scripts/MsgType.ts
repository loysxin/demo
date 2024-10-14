
export const MsgTypeSend = {
    /**心跳 */
    Ping: '0_Ping',
    /**请求token */
    VerifyToken: '0_VerifyToken',
    /**请求玩家数据 */
    GetPlayerData: '1_GetPlayerData',
    /**请求建筑升级 */
    BuildingUpgrade: '1_BuildingUpgrade',
    /**请求建筑解锁 */
    BuildingUnlock: '1_BuildingUnlock',
    /**角色移除 */
    BuildingRemoveRole: '1_BuildingRemoveRole',
    /**角色增加 */
    BuildingAssignRole: '1_BuildingAssignRole',
    /**建筑完成 */
    BuildingUpgradeComplete: '1_BuildingUpgradeComplete',
    /**请求合成次数 */
    ResourceExchange: '1_ResourceExchange',
    /**请求获取广告数据 */
    GetAllDailyAdCounts: "4_GetAllDailyAdCounts",
    /**请求掠夺列表 */
    Matchmaking: '5_Matchmaking',
    /**请求掠夺赛季信息列表 */
    GetCurrentSeasonInfo: '5_GetCurrentSeasonInfo',
    /**请求掠夺战玩家数据 */
    GetMatchPlayerData: '5_GetMatchPlayerData',
    /**请求掠夺战玩家记录 */
    QueryPlunderRecord: '5_QueryPlunderRecord',
    /**请求掠夺战玩家战斗过程记录 */
    QueryPlunderReplay: '5_QueryPlunderReplay',
    /**请求玩家战斗数据 */
    GetPlayerBattleData: '5_GetPlayerBattleData',
    /**开始掠夺 */
    Plunder: '5_Plunder',
    /**开始复仇 */
    RevengePlunder: '5_RevengePlunder',
    /**购买次数 */
    BuyPlunderTimes: '5_BuyPlunderTimes',
    /**开始Pve */
    PvE: '1_PvE',
    /**购买PVE次数 */
    BuyPvETimes: "1_BuyPvETimes",
    /**设置玩家布阵信息 */
    SetAttackRoles: '1_SetAttackRoles',
    /**生产 */
    ItemProduction: '1_ItemProduction',
    /**获取生产 */
    ItemProductionFinish: '1_ItemProductionFinish',
    /**战斗进度 */
    BattleProgress: '9_BattleProgress',
    /**一键驻守 */
    SetDefenseRoles: '1_SetDefenseRoles',
    /**生产士兵请求 */
    SoldierProduction: '1_SoldierProduction',
    /**碎片道具合成 */
    SynthesizeRoleRequest: '1_SynthesizeRole',
    /**请求邮件列表 */
    GetPlayerMails: '6_GetPlayerMails',
    /**请求读取邮件 */
    ReadMail: '6_ReadMail',
    /**领取附件 */
    ClaimMailAttachments: '6_ClaimMailAttachments',
    /**请求删除邮件 */
    DeleteMail: '6_DeleteMail',
    /**删除所有邮件 */
    DeleteAllMails: '6_DeleteAllMails',
    /**请求领取所有附件 */
    ClaimAllMailAttachments: '6_ClaimAllMailAttachments',
    /**邮件获取玩家信息 */
    GetPlayerInfo: '6_GetPlayerInfo',
    /**邮件赠送彩钻 */
    SendCurrencyMail: '6_SendCurrencyMail',
    /**角色升级和突破请求 */
    UpgradeRole: '1_UpgradeRole',
    /**繁育请求 */
    MergeRoleRequest: '1_MergeRole',
    /**保存前端数据 */
    SetConfigDataRequest: "1_SetConfigData",
    /**解锁家园 */
    HomelandUnlockRequest: "1_HomelandUnlock",
    /**打开宝箱请求 */
    OpenBoxRequest: "1_OpenBox",
    /**创建卖单请求 */
    ExchangesCreateSellOrder: "10_ExchangesCreateSellOrder",
    /**创建买单请求 */
    ExchangesCreateBuyOrder: "10_ExchangesCreateBuyOrder",
    /**请求完成交易 */
    ExchangesTrade: "10_ExchangesTrade",
    /**下架订单 */
    ExchangesCancelOrder: "10_ExchangesCancelOrder",
    /**查询交易 */
    ExchangesQueryView: "10_ExchangesQueryView",
    /**直接根据交易 ID 查询订单 */
    ExchangesQueryOrderIDList: "10_ExchangesQueryOrderIDList",
    /**直接根据ViewID 查询订单 */
    ExchangesQueryViewIDList: "10_ExchangesQueryViewIDList",
    /**请求通用加速*/
    BoostRequest: "1_Boost",
    //请求被动技能升级
    UpgradePassiveSkill: "1_UpgradePassiveSkill",
    /**当前玩家上线以及收益信息 */
    GetAgentInfoRequest: "8_GetAgentInfo",
    /**获取好友收益列表 */
    GetIncomesRequest: "8_GetIncomes",
    /**领取收益 */
    IncomeRequest: "8_Income",
    /**获取下线(好友列表) */
    GetDownlinesRequest: "8_GetDownlines",
    /**获取上线好友信息 */
    GetUplineInfoRequest: "8_GetUplineInfo",
    /**绑定上线 */
    BindUplineRequest: "8_BindUpline",
    /**"解绑上线 */
    UnbinduplineRequest: "8_UnbindUpline",
    /**获取好友联系方式 */
    GetContactInfoRequest: "8_GetContactInfo",
    /**设置助战角色请求 */
    SetAssistRoleRequest: "8_SetAssistRole",
    /**获取助战角色 */
    GetAssistRolesRequest: "8_GetAssistRoles",
    /**设置助战角色金额 */
    SetAssistRoleUsageFeeRequest: "8_SetAssistRoleUsageFee",
    /**解锁新位置 */
    UnlockAssistRoleSlotRequest: "8_UnlockAssistRoleSlot",
    /**领取助战奖励 */
    CollectAssistIncomeRequest: "8_CollectAssistIncome",
    /**查看收益记录 */
    GetIncomeRecordsRequest: "8_GetIncomeRecords",
    /**查看好友助战角色信息 */
    GetAssistRoleByIDRequest: "8_GetAssistRoleByID",
    /** 加入游戏以正确获取广播消息, 未来2个回合都可以获取到广播*/
    FishingJoin: "11_FishingJoin",
    /**请求获取当前钓鱼活动状态 */
    FishingGetPlayerData: "11_FishingGetPlayerData",
    /**请求选择湖泊 */
    FishingSelectLake: "11_FishingSelectLake",
    /**请求兑换鱼料 */
    FishingConvertItem: "11_FishingConvertItem",
    /**请求投放鱼料*/
    FishingRod: "11_FishingRod",
    /**请求拉杆 */
    FishingTieRod: "11_FishingTieRod",
    /**请求钓鱼结算 */
    FishingGetLastSettlement: "11_FishingGetLastSettlement",
    /**请求钓鱼日志 */
    FishingRecordQuery: "11_FishingRecordQuery",
    /**请求钓鱼商店信息 */
    FishingShopGetContent: "11_FishingShopGetContent",
    /**请求钓鱼商店购买 */
    FishingShopBuyItem: "11_FishingShopBuyItem",
    /**请求卖鱼 */
    FishingSellFishItem: "11_FishingSellFishItem",
    /**请求钓鱼排行榜 */
    FishingRankQuery: "11_FishingRankQuery",
    /**请求完成任务 */
    CompleteTask: "1_CompleteTask",
    /**请求所有商店数据 */
    ShopGetIndex: "12_ShopGetIndex",
    /**商店请求购买*/
    ShopBuyItem: "12_ShopBuyItem",
    /**请求刷新商店 */
    ShopManualRefresh: "12_ShopManualRefresh",
    /**请求抽奖商城抽奖 */
    ShopDoLucky: "12_ShopDoLucky",
    /**请求抽奖商城道具兑换 */
    ShopConvertLuckyItem: "12_ShopConvertLuckyItem",
    /**请求使用道具 */
    UseItem: "1_UseItem",
    /**请求货币流水详情 */
    QueryThingRecordsRequest: "1_QueryThingRecords",
    /**请求创建公会 */
    GuildCreate:"13_GuildCreate",
    /**获取自己公会数据 */
    GuildGetSelf:"13_GuildGetSelf",
    /**获取公会事件数据 */
    GuildGetSelfEvent:"13_GuildGetSelfEvent",
    /**获取公会推荐列表 */
    GuildRecommendedList:"13_GuildRecommendedList",
    /**搜索公会名 */
    GuildSearchByName:"13_GuildSearchByName",
    /**搜索公会id*/
    GuildSearchByID:"13_GuildSearchByID",
    /**加入公会 */
    GuildJoin:"13_GuildJoin",
    /**退出公会 */
    GuildLeave:"13_GuildLeave",
    /**公会踢人 */
    GuildKick:"13_GuildKick",
    /** 修改成员职位*/
    GuildChangeMemberRole:"13_GuildChangeMemberRole",
    /** 会长转让*/
    GuildChangeMemberLeader:"13_GuildChangeMemberLeader",
    /**修改公会公告 */
    GuildChangeAnnouncement:"13_GuildChangeAnnouncement",
    /**修改公会logo */
    GuildChangeLogo:"13_GuildChangeLogo",
    /**修改公会名称 */
    GuildChangeName:"13_GuildChangeName",
    /**修改公会加入条件 */
    GuildChangeJoinCriteria:"13_GuildChangeJoinCriteria",
    /**公会心情留言 */
    GuildChangeSelfMessage:"13_GuildChangeSelfMessage",
    /**获取公会申请记录 */
    GuildGetSelfApplications:"13_GuildGetSelfApplications",
    /**获取申请加入者列表 */
    GuildGetApplications:"13_GuildGetApplications",
    /**审批申请者*/
    GuildApprovalApplications:"13_GuildApprovalApplications",
    /**请求公会排行榜数据*/
    GuildGetRankingList:"13_GuildGetRankingList",
    /**请求公会银行数据 */
    GuildBankGetDepositInfos:"13_GuildBankGetDepositInfos",
    /**请求公会银行储蓄 */
    GuildBankDeposit:"13_GuildBankDeposit",
    /**公会银行储蓄查询 */
    GuildBankGetDonateDeposits:"13_GuildBankGetDonateDeposits",
    /**权益领取*/
    ClaimDailyBenefitRequest:"1_ClaimDailyBenefit",
    /**使用广告权益 */
    UseRightsAdRequest:"4_UseRightsAd",
    /**查看玩家 */
    GetPlayerViewInfo:"8_GetPlayerViewInfo",
    /**领取熔铸石 */
    CollectFusionStonesRequest:"1_CollectFusionStones"
}

export const MsgTypeRet = {
    VerifyTokenRet: 'VerifyTokenRet',
    GetPlayerDataRet: 'GetPlayerDataRet',
    BuildingUpgradeRet: 'BuildingUpgradeRet',
    BuildingUnlockRet: 'BuildingUnlockRet',
    ResourceChangePush: 'ResourceChangePush',//资源更新推送
    BuildingRemoveRoleRet: 'BuildingRemoveRoleRet',
    BuildingAssignRoleRet: 'BuildingAssignRoleRet',
    BuildingUpgradeCompleteRet: 'BuildingUpgradeCompleteRet',
    ResourceExchangeRet: 'ResourceExchangeRet',
    MatchmakingRet: 'MatchmakingRet',//掠夺列表返回
    GetCurrentSeasonInfoRet: 'GetCurrentSeasonInfoRet',//掠夺赛季返回
    GetMatchPlayerDataRet: 'GetMatchPlayerDataRet',//掠夺玩家信息返回
    QueryBattlePlunderRecordRet: 'QueryBattlePlunderRecordRet',//掠夺记录信息返回
    QueryPlunderReplayRet: 'QueryPlunderReplayRet', //掠夺战斗回放返回
    GetPlayerBattleDataRet: 'GetPlayerBattleDataRet',//掠夺战斗信息返回
    PlunderRet: 'PlunderRet',//掠夺返回
    RevengePlunderRet: 'RevengePlunderRet',//复仇返回
    BuyPlunderTimesRet: 'BuyPlunderTimesRet',//购买次数返回
    PvERet: 'PvERet',
    SetAttackRolesRet: 'SetAttackRolesRet',
    BattleStartPush: 'BattleStartPush',//开始战斗推送
    PingRet: 'PingRet',
    ItemProductionRet: 'ItemProductionRet',
    ItemProductionFinishRet: 'ItemProductionFinishRet',
    ItemChangePush: 'ItemChangePush',
    BattleProgressRet: 'BattleProgressRet',
    SetDefenseRolesRet: 'SetDefenseRolesRet',
    CurrencyChangePush: 'CurrencyChangePush', //货币变化
    SoldierProductionRet: 'SoldierProductionRet',//生产士兵响应
    SoldierProductionPush: 'SoldierProductionPush', //生产士兵推送信息
    SynthesizeRoleRet: 'SynthesizeRoleRet',//道具合成结果
    NewMailPush: 'NewMailPush',//新邮件推送
    GetPlayerMailsRet: 'GetPlayerMailsRet',//获取玩家邮件列表
    ReadMailRet: 'ReadMailRet',//获取邮件列表
    ClaimMailAttachmentsRet: 'ClaimMailAttachmentsRet',//领取附件
    DeleteMailRet: 'DeleteMailRet',//删除邮件
    DeleteAllMailsRet: 'DeleteAllMailsRet',//删除所有邮件
    ClaimAllMailAttachmentsRet: 'ClaimAllMailAttachmentsRet',//领取所有附件
    GetPlayerInfoRet: 'GetPlayerInfoRet',//邮件玩家信息返回
    SendCurrencyMailRet: 'SendCurrencyMailRet',//邮件赠送金币返回
    UpgradeRoleRet: 'UpgradeRoleRet',//角色升级和突破结果
    MergeRoleRet: 'MergeRoleRet',//繁育结果
    TotalBattlePowerChangePush: "TotalBattlePowerChangePush",//玩家战力推送
    RoleConsumePush: "RoleConsumePush",//角色消耗推送
    AddRolePush: "AddRolePush",//角色添加推送
    HomelandCollectDurationChangePush: "HomelandCollectDurationChangePush",//家园资源收集推送
    SettlePvEPush: "SettlePvEPush", //pve结算推送
    SettlePvPPush: "SettlePvPPush", //pvp结算推送
    SetConfigDataRet: "SetConfigDataRet",//保存前端数据返回
    HomelandUnlockRet: "HomelandUnlockRet",//解锁家园返回
    OpenBoxRet: "OpenBoxRet",//打开宝箱返回
    ExchangesCreateSellOrderRet: "ExchangesCreateSellOrderRet",//创建卖单返回
    ExchangesCreateBuyOrderRet: "ExchangesCreateBuyOrderRet",//创建买单返回
    ExchangesTradeRet: "ExchangesTradeRet",//请求完成交易
    ExchangesCancelOrderRet: "ExchangesCancelOrderRet",//下架订单返回
    ExchangesQueryViewRet: "ExchangesQueryViewRet",//查询交易返回
    ExchangesQueryOrderIDListRet: "ExchangesQueryOrderIDListRet",//查询交易ID返回
    ExchangesQueryViewIDListRet: "ExchangesQueryViewIDListRet",//查询ViewID返回
    BoostRet: "BoostRet",//通用加速返回
    UpgradePassiveSkillRet: "UpgradePassiveSkillRet",//被动技能升级返回
    GetAgentInfoRet: "GetAgentInfoRet",//当前玩家上线以及收益信息
    GetIncomesRet: "GetIncomesRet",//获取好友收益返回
    IncomeRet: "IncomeRet",//领取收益返回
    GetDownlinesRet: "GetDownlinesRet",//获取下线返回
    GetUplineInfoRet: "GetUplineInfoRet",//获取上线好友信息返回
    BindUplineRet: "BindUplineRet",//绑定上线返回
    UnbindUplineRet: "UnbindUplineRet",//解绑绑上线返回
    GetContactInfoRet: "GetContactInfoRet",//获取好友联系方式返回
    SetAssistRoleRet: "SetAssistRoleRet",//角色助战返回
    GetAssistRolesRet: "GetAssistRolesRet",//获取助战角色列表返回
    UnlockAssistRoleSlotRet: "UnlockAssistRoleSlotRet",//角色助战解锁空位返回
    CollectAssistIncomeRet: "CollectAssistIncomeRet",//领取奖励
    SetAssistRoleUsageFeeRet: "SetAssistRoleUsageFeeRet",//设置助战费用
    GetIncomeRecordsRet: "GetIncomeRecordsRet",//查看收益记录返回
    GetAssistRoleByIDRet: "GetAssistRoleByIDRet",
    BindUplineResponse: "BindUplineResponse",//绑定上线返回
    FishingJoinRet: "FishingJoinRet",
    FishingGetPlayerDataRet: "FishingGetPlayerDataRet",//返回玩家自己的钓鱼相关状态
    FishingRoundPush: "FishingRoundPush",//回合数据推送
    FishingSelectLakeRet: "FishingSelectLakeRet",//选择湖泊返回
    FishingConvertItemRet: "FishingConvertItemRet",//兑换鱼料返回
    FishingRodRet: "FishingRodRet",//返回投鱼料
    FishingTieRodRet: "FishingTieRodRet",//返回拉杆
    FishingGetLastSettlementRet: "FishingGetLastSettlementRet",//钓鱼结算返回
    FishingRecordQueryRet: "FishingRecordQueryRet",//回合记录返回
    FishingShopGetContentRet: "FishingShopGetContentRet",//钓鱼商店数据返回
    FishingShopBuyItemRet: "FishingShopBuyItemRet",//钓鱼商店购买返回
    FishingSellFishItemRet: "FishingSellFishItemRet",//卖鱼返回
    FishingRankQueryRet: "FishingRankQueryRet",//钓鱼排行榜返回
    FishingItemPush: "FishingItemPush",//钓鱼鱼库更新
    CompleteTaskRet: "CompleteTaskRet",//返回完成任务
    TaskDataChangedPush: "TaskDataChangedPush",//任务状态推送
    SoldiersPush: "SoldiersPush", //小兵数量更新推送
    BuyPvETimesRet: "BuyPvETimesRet", //pve购买次数推送
    ShopGetIndexRet: "ShopGetIndexRet", //返回所有类型商店数据
    ShopBuyItemRet: "ShopBuyItemRet",//返回商品购买
    ShopManualRefreshRet: "ShopManualRefreshRet",//刷新商店返回
    ShopDoLuckyRet: "ShopDoLuckyRet",//抽奖商城抽奖返回
    ShopConvertLuckyItemRet: "ShopConvertLuckyItemRet",//抽奖商城兑换材料返回
    MarqueePush: "MarqueePush",//跑马灯推送
    DailyRefreshPush: "DailyRefreshPush",//跨天
    SystemMessagePush: "SystemMessagePush",//系统消息
    GetAllDailyAdCountsRet: "GetAllDailyAdCountsRet",//获取广告数据返回
    AdCountChangePush: "AdCountChangePush",//广告数据变更
    UseItemRet: "UseItemRet",//使用道具
    QueryThingRecordsRet: "QueryThingRecordsRet",//货币流水详情
    KickoutPush:"KickoutPush",//踢下线
    GuildCreateRet:"GuildCreateRet",//公会创建返回
    GuildGetSelfRet:"GuildGetSelfRet",//公会数据返回
    GuildGetSelfEventRet:"GuildGetSelfEventRet",//公会事件返回
    GuildRecommendedListRet:"GuildRecommendedListRet",//返回公会推荐列表
    GuildSearchByIDRet:"GuildSearchByIDRet",//搜索公会id返回
    GuildSearchByNameRet:"GuildSearchByNameRet",//搜索公会名字返回
    GuildJoinRet:"GuildJoinRet",//加入公会返回
    GuildLeaveRet:"GuildLeaveRet",//推出公会返回
    GuildKickRet:"GuildKickRet",//公会主动踢人返回
    GuildKickPush:"GuildKickPush",//公会被踢出返回
    GuildChangeMemberRoleRet:"GuildChangeMemberRoleRet",//修改成员身份
    GuildChangeMemberLeaderRet:"GuildChangeMemberLeaderRet", //会长转让
    GuildChangeAnnouncementRet:"GuildChangeAnnouncementRet",//修改公告响应
    GuildChangeLogoRet:"GuildChangeLogoRet",//修改logo响应
    GuildChangeNameRet:"GuildChangeNameRet",//修改公会名称响应
    GuildChangeJoinCriteriaRet:"GuildChangeJoinCriteriaRet",//修改公会加入条件响应
    GuildChangeSelfMessageRet:"GuildChangeSelfMessageRet",//修改公会心情留言返回
    GuildGetSelfApplicationsRet:"GuildGetSelfApplicationsRet",//申请公会记录列表返回
    GuildApprovalApplicationsRet:"GuildApprovalApplicationsRet",//审批响应
    GuildGetApplicationsRet:"GuildGetApplicationsRet",//公会待申请列表返回
    GuildBankGetDepositInfosRet:"GuildBankGetDepositInfosRet",//公会银行数据返回
    GuildBankDepositRet:"GuildBankDepositRet",//公会银行储蓄返回
    GuildBankGetDonateDepositsRet:"GuildBankGetDonateDepositsRet",//公会银行储蓄查询
    GuildGetRankingListRet:"GuildGetRankingListRet",//公会排行榜数据下发
    GuildMemberChangePush:"GuildMemberChangePush",//公会成员更新
    GuildJoinPush:"GuildJoinPush",//加入公会通知
    GuildInfoChangePush:"GuildInfoChangePush",//公会基础信息变更
    BenefitPush:"BenefitPush",//权益推送
    ClaimDailyBenefitRet:"ClaimDailyBenefitRet",//权益领取返回
    UseRightsAdRet:"UseRightsAdRet",//使用广告权益返回
    GetPlayerViewInfoRet:"GetPlayerViewInfoRet",//查看玩家数据返回
    CollectFusionStonesRet:"CollectFusionStonesRet",//领取熔铸石返回
    FusionStoneDataPush:"FusionStoneDataPush",//采集熔铸石推送
    
}
