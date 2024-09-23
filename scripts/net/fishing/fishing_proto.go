package protocol

const (
	FishingErrorRoundNotOpen            = 100 // 回合未开启
	FishingErrorInvalidLakeID           = 101 //  无效的湖泊ID
	FishingErrorRoundStateError         = 102 //  回合状态错误
	FishingErrorNotSelectLake           = 103 //  未选择湖泊
	FishingErrorConvertMount            = 104 //  无效的兑换数量
	FishingErrorInsufficientCurrency    = 105 //  彩虹币不足
	FishingErrorInsufficientFatigue     = 106 //  疲劳值不足
	FishingErrorCostExceedingRoundLimit = 107 // 投入超出回合限制
	FishingErrorCostExceedingDailyLimit = 108 // 投入超出每日限制

	FishingCoreRoundSelect = 0 // 选择阶段
	FishingCoreRoundFrozen = 1 // 冰冻阶段
	FishingCoreRoundSettle = 2 // 结算阶段
)

// 请求

// 获取玩家自己的相关信息
type FishingGetPlayerData struct {
}

type FishingGetPlayerDataRet struct {
	Code      int               `json:"code"`
	State     *FishingStateData `json:"state"`
	FishItems []*FishingItem    `bson:"fish_items" json:"fish_items"`
}

// -------------- 玩法相关 --------------

// 加入游戏以正确获取广播消息, 未来2个回合都可以获取到广播
type FishingJoin struct {
}

type FishingJoinRet struct {
	Code int `json:"code"`
}

// 选择湖泊
type FishingSelectLake struct {
	Round  int `json:"round"`
	LakeID int `json:"lake_id"`
}

type FishingSelectLakeRet struct {
	Code   int `json:"code"`
	LakeID int `json:"lake_id"`
}

// 投杆
type FishingRod struct {
	Cost int `json:"cost"` // 花费鱼饵道具数量
}

type FishingRodRet struct {
	Code      int `json:"code"`
	RoundCost int `json:"value"`   // 本回合已投数量
	Fatigue   int `json:"fatigue"` // 疲劳值
}

// 拉杆
type FishingTieRod struct {
	IsHit bool `json:"is_hit"`
}

type FishingTieRodRet struct {
	Code int `json:"code"`
}

// 回合推送
type FishingRoundPush struct {
	Type  string            `json:"type"` // Update / NewRound / Frozen / Settlement
	State *FishingStateData `json:"state"`
}

// -------------- 商店相关 --------------

// 获取钓鱼商店
type FishingGetShop struct {
	ID int `json:"id"`
}

type FishingGetShopRet struct {
	Code            int                   `json:"code"`
	Items           []FishingShopItemData `json:"items"`
	NextRefreshTime int64                 `json:"next_refresh_time"` // 下次刷新时间
}

// 购买商品
type FishingBuyItem struct {
	BuyItems []FishingShopItemData `json:"buy_items"` // 购买的商品, 只传 ID 和 Count 就行了
}

type FishingBuyItemRet struct {
	Code int `json:"code"`
}

// 出售商品
type FishingSellItem struct {
	Items []PlayerDataItem `json:"items"` // 出售的商品
}

type FishingSellItemRet struct {
	Code int `json:"code"`
}

// 兑换鱼饵
type FishingConvertItem struct {
	Count int `json:"Count"` // 兑换的次数
}

type FishingConvertItemRet struct {
	Code         int              `json:"code"`
	ConvertItems []PlayerDataItem `json:"convert_items"`
}

// 获取最后一次奖励的信息
type FishingGetLastSettlement struct {
}

type FishingGetLastSettlementRet struct {
	Code       int                          `json:"code"`
	Settlement *FishingPlayerSettlementData `json:"settlement"`
	HasRead    bool                         `json:"has_read"`
}
