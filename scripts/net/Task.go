type CompleteTaskRequest struct {
	TaskID int `json:"task_id"`
}

type CompleteTaskResponse struct {
	Task *protocol.PlayerDataTask `json:"task"`
}
type TaskDataChangedPush struct {
	Task *protocol.PlayerDataTask `json:"task"`
}

type PlayerDataTask struct {
	ID            int   `bson:"id" json:"id"`
	Value         int   `bson:"v" json:"v"`
	Status        int   `bson:"s" json:"s"`
	LastResetTime int64 `bson:"lrt" json:"lrt"`
}

type MarqueePush struct {
	Type    int `json:"type"`
	Content string `json:"content"`
	Icon    string `json:"icon"`
	Speed   int    `json:"speed"`
}