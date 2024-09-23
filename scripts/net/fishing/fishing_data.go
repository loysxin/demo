package protocol

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type FishingGlobalData struct {
	Round int `json:"round" bson:"round"` // 当前回合
}

type FishingRoundLakeRecordData struct {
	LakeID   int                  `json:"lake_id" bson:"lake_id"`     // 湖泊ID
	IsFrozen bool                 `json:"is_frozen" bson:"is_frozen"` // 是否冰冻
	Cost     int                  `json:"cost" bson:"cost"`           // 总投入
	Players  []primitive.ObjectID `json:"players" bson:"players"`     // 玩家记录
}

type FishingRoundRecordData struct {
	ID        primitive.ObjectID           `bson:"_id,omitempty" json:"_id,omitempty"`
	Round     int                          `json:"round" bson:"round"` // 回合
	StartTime int64                        `json:"start_time" bson:"start_time"`
	EndTime   int64                        `json:"end_time" bson:"end_time"`
	Lake      []FishingRoundLakeRecordData `json:"lake" bson:"lake"` // 湖泊
}

// 玩家回合记录
type FishingPlayerRoundRecordData struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	PlayerID     string             `bson:"player_id" json:"player_id"`
	StartTime    int64              `json:"start_time" bson:"start_time"`
	EndTime      int64              `json:"end_time" bson:"end_time"`
	RoundCost    int                `json:"round_cost" bson:"round_cost"`         // 投杆花费
	FatigueCost  int                `json:"fatigue_cost" bson:"fatigue_cost"`     // 疲劳花费
	FatigueGet   int                `json:"fatigue_get" bson:"fatigue_get"`       // 疲劳回复
	LakeId       int                `json:"lake_id" bson:"lake_id"`               // 湖泊
	FrozenLakeId int                `json:"frozen_lake_id" bson:"frozen_lake_id"` // 冰冻的湖泊
	FishItems    []*FishingItem     `json:"fish_item" bson:"fish_item"`           // 获得的鱼
	FishScoreGet int                `json:"fish_score_get" bson:"fish_score_get"` // 获得的积分
}

type FishingPlayerData struct {
	ID                    primitive.ObjectID           `bson:"_id,omitempty" json:"_id,omitempty"`
	PlayerID              string                       `bson:"player_id" json:"player_id"`
	FishItems             []*FishingItem               `bson:"fish_items" json:"fish_items"`
	FishScore             int                          `bson:"fish_score" json:"fish_score"` // 积分
	Fatigue               int                          `json:"fatigue"`                      // 疲劳
	FatigueLastUpdateTime int64                        `json:"fatigue_last_update_time"`     // 疲劳下次更新时间
	DailyCost             int                          `json:"daily_cost"`                   // 今日投入
	DailyCostUpdateTime   int64                        `json:"daily_cost_update_time"`       // 今日投入更新时间
	Initialized           bool                         `bson:"initialized" json:"initialized"`
	LastReward            *FishingPlayerSettlementData `bson:"last_reward" json:"last_reward"`                   // 上次结算奖励
	LastRewardHasRead     bool                         `bson:"last_reward_has_read" json:"last_reward_has_read"` // 上次奖励是否已读
}

type FishingItem struct {
	ID     int     `json:"id"`     // 商品ID
	Weight float64 `json:"weight"` // 重量
}

type FishingShopItemData struct {
	ID    int            `json:"id"` // 商品ID
	Item  PlayerDataItem `json:"item"`
	Price float64        `json:"price"` // 价格
	Count int            `json:"count"` // 该商品剩余数量
}

// 奖励信息 (存储在玩家身上)
type FishingPlayerSettlementData struct {
	Round        int
	FatigueGet   int // 疲劳值
	FishScoreGet int // 钓鱼积分
	CostGet      int // 奖励投入
	FishItems    []*FishingItem
}

// 玩家钓鱼数据
type FishingPlayerStateData struct {
	Fatigue    int `json:"fatigue"`     // 疲劳
	FatigueMax int `json:"fatigue_max"` // 疲劳上限
	LakeID     int `json:"lake_id"`     // 当前已投入的湖泊
	RoundCost  int `json:"round_cost"`  // 本回合已投入
	DailyCost  int `json:"daily_cost"`  // 今日已投入
}

// 湖泊数据
type FishingLakeData struct {
	LakeID      int  `json:"lake_id"`
	Cost        int  `json:"cost"`         // 已投
	IsFrozen    bool `json:"is_frozen"`    // 是否冰冻
	PlayerCount int  `json:"player_count"` // 当前湖泊玩家数
}

type FishingSessionInfo struct {
	StartTime int64 `json:"start_time"`
	EndTime   int64 `json:"end_time"`
	IsOpen    bool  `json:"is_open"`
}

type FishingRoundInfo struct {
	Round        int   `json:"round"`
	StartTime    int64 `json:"start_time"`
	EndTime      int64 `json:"end_time"`
	IsOpen       bool  `json:"is_open"`       // 已开启
	IsFrozen     bool  `json:"is_frozen"`     // 已冰冻
	IsSettlement bool  `json:"is_settlement"` // 已结算
}

// 钓鱼状态数据
type FishingStateData struct {
	Round       int                     `json:"round"` //当前回合数
	Player      *FishingPlayerStateData `json:"player"`
	Lakes       []*FishingLakeData      `json:"lakes"`
	SessionInfo *FishingSessionInfo     `json:"session_info"` //当前场次信息
	RoundInfo   []*FishingRoundInfo     `json:"round_info"`   //最近的回合信息(包括当前回合和下一回合)
}
