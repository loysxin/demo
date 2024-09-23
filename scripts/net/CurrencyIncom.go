type PlayerThingRecordData struct {
	PlayerID string  `bson:"player_id" json:"player_id"`
	Type1    int     `bson:"type1" json:"type1"`
	Type2    int     `bson:"type2" json:"type2"`
	Count    float64 `bson:"count" json:"count"`
	Source   int     `bson:"source" json:"source"`
	Data     string  `bson:"data" json:"data"`
	Time     int64   `bson:"time" json:"time"`
} 

type QueryThingRecordsRequest struct {
	CountFilter int `json:"count_filter"` //0所有  1 大于0 2小于0
	Type1       int `json:"type1"`
	PageSize    int `json:"page_size"`
	Page        int `json:"page"`
}

type QueryThingRecordsResponse struct {
	Records []PlayerThingRecordData `json:"records"`
}