//当前玩家上线以及收益信息
type GetAgentInfoRequest struct {
	// 可以为空，如果为空则获取当前玩家的代理信息
	PlayerID string `json:"player_id,omitempty"`
}

type GetAgentInfoResponse struct {
	UplineID          string                     `json:"upline_id"`
	TotalIncome       float64                    `json:"total_income"`
	DailyIncome       float64                    `json:"daily_income"`
	AssistRolesSlots  int                        `json:"assist_roles_slots"`
	TotalAssistIncome float64                    `json:"total_assist_income"`
	AssistRoles       []*RoleAssistData          `json:"assist_roles"`
	RoleDataList      []*protocol.PlayerDataRole `json:"role_data_list"`
}

type RoleAssistData struct {
	RoleID           string  `bson:"role_id" json:"role_id"`
	PlayerID         string  `bson:"player_id" json:"player_id"`
	Slot             int     `bson:"slot" json:"slot"`
	UsageFee         float64 `bson:"usage_fee" json:"usage_fee"`
	BattlePower      int     `bson:"battle_power" json:"battle_power"`
	DailyAssistCount int     `bson:"daily_assist_count" json:"daily_assist_count"`
	DailyIncome      float64 `bson:"daily_income" json:"daily_income"`
}

//领取收益
type IncomeRequest struct {
}

type IncomeResponse struct {
	Amount int64 `json:"amount"`
}

//获取好友收益列表
type GetIncomesRequest struct {
}

type IncomesInfo struct {
	PlayerID string `json:"player_id"`
	Name     string `json:"name"`
	IconURL  string `json:"icon_url"`
	Amount   int64  `json:"amount"`
}

type GetIncomesResponse struct {
	TotalDownlines int           `json:"total_downlines"`//好友数量
	TotalUnclaimed int64         `json:"total_unclaimed"` // 新添加的字段
	Incomes        []IncomesInfo `json:"incomes"`//收益列表
}

//获取下线好友
type GetDownlinesRequest struct {
	Page           int    `json:"page"`
	PageSize       int    `json:"page_size"`
	SortType       int    `json:"sort_type"`
	SearchPlayerID string `json:"search_player_id"`
	IncludeRole    bool   `json:"include_role"`
}


//好友排序
const (
	SortDailyOutputDesc = 1
	SortDailyOutputAsc  = 2
	SortTotalOutputDesc = 3
	SortTotalOutputAsc  = 4
	SortBindTimeDesc    = 5
	SortBindTimeAsc     = 6
)

type DownlineInfo struct {
	PlayerID    string `json:"player_id"`
	Name        string `json:"name"`
	IconURL     string `json:"icon_url"`
	AvatarURL   string `json:"avatar_url"`
	Level       int    `json:"level"`
	TotalOutput int64  `json:"total_output"`
	DailyOutput int64  `json:"daily_output"`
	Role        *protocol.PlayerDataRole `json:"role,omitempty"` // 可选字段，只有在需要时才会填充
	IsUpline    bool    `json:"is_upline"`
	DailyActivity float64 `json:"daily_activity"`
}


type GetDownlinesResponse struct {
	TotalCount int            `json:"total_count"`
	Downlines  []DownlineInfo `json:"downlines"`
	Page           int            `json:"page"`
	PageSize       int            `json:"page_size"`
	SortType       int            `json:"sort_type"`
	SearchPlayerID string         `json:"search_player_id"`
	IncludeRole    bool           `json:"include_role"`
}

//查看收益记录列表
type GetIncomeRecordsRequest struct {
	Page     int `json:"page"`
	PageSize int `json:"page_size"`
}

type IncomeRecordInfo struct {
	PlayerID  string `json:"player_id"`
	Name      string `json:"name"`
	Amount    int64  `json:"amount"`
	Timestamp int64  `json:"timestamp"`
}

type GetIncomeRecordsResponse struct {
	IncomeRecords []IncomeRecordInfo `json:"income_records"`
	Total         int64              `json:"total"`
}

//获取上线
type GetUplineInfoRequest struct {
}

type UplineInfo struct {
	PlayerID              string `json:"player_id"`
	Name                  string `json:"name"`
	IconURL               string `json:"icon_url"`
	Level                 int    `json:"level"`
	BattlePower           int    `json:"battle_power"`
	AssistRoleBattlePower int    `json:"assist_role_battle_power"`
	IsOnline              bool   `json:"is_online"`
	LastOfflineTime       int64  `json:"last_offline_time"`
}

type GetUplineInfoResponse struct {
	HasUpline bool       `json:"has_upline"`
	Upline    UplineInfo `json:"upline"`
}

//绑定上线
type BindUplineRequest struct {
	UplineID string `json:"upline_id"`
}

type BindUplineResponse struct {
	UplineID string `json:"upline_id"`
}

//获取好友联系方式
type GetContactInfoRequest struct {
	PlayerID string `json:"player_id"`
}

type GetContactInfoResponse struct {
	PlayerID string `json:"player_id"`
	Name     string `json:"name"`
	WeChatID string `json:"wechat_id"`
	QQID     string `json:"qq_id"`
}

//设置助战角色请求
type SetAssistRoleResponse struct {
	RoleID       string  `json:"role_id"`
	Slot         int     `json:"slot"`
	Fee          float64 `json:"fee"`
	CanceledRole string  `json:"canceled_role"`
}

type SetAssistRoleResponse struct {
	RoleID string  `json:"role_id"`
	Slot   int     `json:"slot"`
	Fee    float64 `json:"fee"`
}


//获取助战角色
type GetAssistRolesRequest struct {
	Page     int `json:"page"`
	PageSize int `json:"pageSize"`
}


type AssistRoleInfo struct {
	PlayerID         string  `json:"player_id"`
	PlayerName       string  `json:"player_name"`
	UsageFee         float64 `json:"usage_fee"`
	RoleID           string  `json:"role_id"`
	Type             int     `json:"type"`
	Level            int     `json:"level"`
	Quality          int     `json:"quality"`
	BattlePower      int     `json:"battle_power"`
	DailyAssistCount int     `json:"daily_assist_count"`
}

type GetAssistRolesResponse struct {
	AssistRoles []AssistRoleInfo `json:"assistRoles"`
}


//设置助战角色金额
type SetAssistRoleUsageFeeRequest struct {
	RoleID   string  `json:"role_id"`
	UsageFee float64 `json:"usage_fee"`
}


//解锁新位置
type UnlockAssistRoleSlotRequest struct {
	NewSlotCount int `json:"new_slot_count"`
}

type UnlockAssistRoleSlotResponse struct {
	NewSlotCount int `json:"new_slot_count"`
}


//领取助战收益
type CollectAssistIncomeRequest struct {
	Amount float64 `json:"amount"`
}

type CollectAssistIncomeResponse struct {
	CollectedAmount float64 `json:"collected_amount"`
}

//角色助战信息
type GetAssistRoleByIDRequest struct {
	RoleID string `json:"role_id"`
}

type GetAssistRoleByIDResponse struct {
	AssistRole *protocol.BattleDataRole `json:"assist_role"`
}

type BattleDataRole struct {
	ID               string             `bson:"id" json:"id"`
	Type             int                `bson:"type" json:"type"`
	Level            int                `bson:"level" json:"level"`
	Quality          int                `bson:"quality" json:"quality"`
	Experience       int                `bson:"experience" json:"experience"`
	BuildingID       int                `bson:"building_id" json:"building_id"`
	ActiveSkills     []*PlayerDataSkill `bson:"active_skills" json:"active_skills"`
	PassiveSkills    []*PlayerDataSkill `bson:"passive_skills" json:"passive_skills"`
	BattleAttributes *BattleAttributes  `bson:"battle_attributes" json:"battle_attributes"`
} 
type BattleAttributes struct {
	Values      [BattleAttrMax]float64 `bson:"values" json:"values"`
	BattlePower int                    `bson:"battle_power" json:"battle_power"`
}