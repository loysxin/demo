//基础信息
type GetMatchPlayerDataRequest struct {
        PlayerID string `json:"player_id"`
}

type GetMatchPlayerDataResponse struct {
        MatchPlayerData *MatchPlayerData `json:"match_player_data"`
}
//获取赛季信息
type GetCurrentSeasonInfoRequest struct {
        PlayerID string `json:"player_id"`
}

type GetCurrentSeasonInfoResponse struct {
        SeasonID  int     `json:"season_id"`
        Status    string  `json:"status"`
        IsSettled bool    `json:"is_settled"`
        Currency  float64 `json:"currency"`
        Wood      int     `json:"wood"`
        Water     int     `json:"water"`
        Rock      int     `json:"rock"`
        Seed      int     `json:"seed"`
        StartTime int64   `json:"start_time"`
        EndTime   int64   `json:"end_time"`
        Score     int     `json:"score"`
        Rank      int     `json:"rank"`
}
//获取上赛季信息
type GetLastSeasonInfoRequest struct {
}

type GetLastSeasonInfoResponse struct {
        SeasonID int     `json:"seasonId"`
        Currency float64 `json:"currency"`
        Wood     int     `json:"wood"`
        Water    int     `json:"water"`
        Rock     int     `json:"rock"`
        Seed     int     `json:"seed"`
        Rank     int     `json:"rank"`
}

//匹配
type MatchmakingRequest struct {
}
type MatchedPlayer struct {
        PlayerID      string `json:"player_id"`
        Level         int    `json:"level"`
        PlayerName    string `json:"player_name"`
        PlayerIconURL string `json:"player_icon_url"`
        BattlePower   int    `json:"battle_power"`
        Score         int    `json:"score"`
        AreEnemies    bool   `json:"are_enemies"`
}

type MatchmakingResponse struct {
        Matches []*MatchedPlayer `json:"matches"`
}
//记录
type QueryPlunderRecordRequest struct {
        PlayerID string `json:"player_id"`
        Page     int    `json:"page"`
        PageSize int    `json:"page_size"`
}

type QueryPlunderRecordResponse struct {
        PlunderRecordData []*PlunderRecord `json:"plunder_record_data"`
        OpponentInfoList  []*OpponentInfo  `json:"opponent_info_list"`
        TotalCount        int              `json:"total_count"`
}

type OpponentInfo struct {
        PlayerID    string `json:"player_id"`
        Name        string `json:"name"`
        IconURL     string `json:"icon_url"`
        BattlePower string `json:"battle_power"`
}
//获取玩家信息
type GetPlayerBattleDataRequest struct {
        PlayerID string `json:"player_id"`
}

type GetPlayerBattleDataResponse struct {
        BattleData          *protocol.PlayerBattleData `json:"battle_data"`
        SnatchableResources int                        `json:"snatchable_resources"`
}
//攻打
type PlunderRequest struct {
        PlayerID   string `json:"player_id"`
        HomelandID int    `json:"homeland_id"`
        SeasonID   int    `json:"season_id"`
        CostType   int    `json:"cost_type"`
        
        IsRevenge       bool   `json:"is_revenge"`
        RevengeBattleID string `json:"revenge_battle_id"`
}

type PlunderResponse struct {
        PlayerID   string `json:"player_id"`
        HomelandID int    `json:"homeland_id"`
}
//复仇
type RevengePlunderRequest struct {
        PlayerID        string `json:"player_id"`
        HomelandID      string `json:"homeland_id"`
        SeasonID        string `json:"season_id"`
        CostType        string `json:"cost_type"`
        RevengeBattleID string `json:"revenge_battle_id"`
}

type RevengePlunderResponse struct {
        PlayerID   string `json:"player_id"`
        HomelandID string `json:"homeland_id"`
        BattleID   string `json:"battle_id"`
}
//购买次数
type BuyPlunderTimesRequest struct {
}

type BuyPlunderTimesResponse struct {
        MatchCount int `json:"match_count"`
}

type MatchPlayerData struct {
        PlayerID string `bson:"player_id" json:"player_id"`

        MatchCount       int `bson:"match_count" json:"match_count"`
        PaidRefreshCount int `bson:"paid_refresh_count" json:"paid_refresh_count"`

        RemainingDefenseCount int `bson:"remaining_defense_count" json:"remaining_defense_count"`

        MatchDuration  int   `bson:"match_duration" json:"match_duration"`
        MatchCDEndTime int64 `bson:"match_cd_end_time" json:"match_cd_end_time"`

        HasShield     bool  `bson:"has_shield" json:"has_shield"`
        ShieldEndTime int64 `bson:"shield_end_time" json:"shield_end_time"`

        Score          int   `json:"score" bson:"score"`
        DefenseEndTime int64 `bson:"defense_end_time" json:"defense_end_time"`
}

type PlunderRecord struct {
	PlunderData *protocol.BattlePlunderData `json:"plunder_data" bson:"plunder_data"`
	Score       int                         `json:"score" bson:"score"`
	HasRevenged bool                        `json:"has_revenged" bson:"has_revenged"`
}

type BattlePlunderData struct {
	BattleID           string             `bson:"battle_id" json:"battle_id"`
	AttackerPlayerID   string             `bson:"attacker_player_id" json:"attacker_player_id"`
	DefenderPlayerID   string             `bson:"defender_player_id" json:"defender_player_id"`
	AttackerBattleData PlayerBattleData   `bson:"attacker_battle_data" json:"attacker_battle_data"`
	DefenderBattleData PlayerBattleData   `bson:"defender_battle_data" json:"defender_battle_data"`
	CreateTime         int64              `bson:"create_time" json:"create_time"`
	StartTime          int64              `bson:"start_time" json:"start_time"`
	Status             string             `bson:"status" json:"status"`
	Process            *BattleProcessData `bson:"process" json:"process"`
	Result             *BattleResultData  `bson:"result" json:"result"`

	IsRevenge       bool   `bson:"is_revenge" json:"is_revenge"`
	RevengeBattleID string `bson:"revenge_battle_id" json:"revenge_battle_id"`
}