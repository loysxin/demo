type BenefitPush struct {
	BenefitCard protocol.PlayerBenefitCard `json:"benefit_card"`
	AllEquities map[int]bool               `json:"all_equities"`
}


type PlayerBenefitCard struct {
	Cards map[int]int64 bson:"cards" json:"cards"
	ClaimedToday bool bson:"claimed_today" json:"claimed_today"
}

//获取奖励协议
type ClaimDailyBenefitRequest struct {
}

type ClaimDailyBenefitResponse struct {
        PveTimes int `json:"pveTimes"`
}

//跳过广告
type UseRightsAdRequest struct {
	AdType int    `json:"ad_type"`
	Params string `json:"params"`
}

type UseRightsAdResponse struct {
	AdType int `json:"ad_type"`
}