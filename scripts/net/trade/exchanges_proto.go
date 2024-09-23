package protocol

const (
	ExchangesQueryTypeGlobal    = 0
	ExchangesQueryTypePlayerID  = 1
	ExchangesQueryTypeItemType  = 2
	ExchangesQueryTypeThingType = 3
	ExchangesQueryTypeRoleType  = 4

	ExchangesQueryTypeSortOpenTime   = 0
	ExchangesQueryTypeSortUnitPrice  = 1
	ExchangesQueryTypeSortTotalPrice = 2
	ExchangesQueryTypeSortUnitCount  = 3
)

type ExchangesIdentifierHead struct {
	OrderID *string `json:"order_id"`
}

type ExchangesRoleThingExtend struct {
	Attr []int `json:"attr"`
}

// 交易订单
type ExchangesOrder struct {
	OrderID     string  `json:"order_id"`
	ViewID      string  `json:"view_id"` // view_id 会被同一个订单流程下的多个订单共享, 只有主动挂买卖单才会有view_id
	FromOrderID string  `json:"from_order_id"`
	OrderType   string  `json:"order_type"` // 买单或卖单
	UnitValue   float64 `json:"unit_value"` // 如果是买单，则此项目为预付款单价，如果是卖单，则此项为出售单价。
	UnitCount   int     `json:"unit_count"`
	Nonce       int     `json:"nonce"`
	PlayerID    string  `json:"player_id"`
	PlayerName  string  `json:"player_name"`
	OpenTime    int64   `json:"open_time"`
	CloseTime   int64   `json:"close_time"`
	Things      *Things `json:"things"`
}

// 客户端到服务的请求

// 请求卖单
type ExchangesCreateSellOrder struct {
	UnitValue  float64 `json:"unit_value"` // 单价
	UnitCount  int     `json:"unit_count"`
	SellThings *Things `json:"sell_things"`
	GM         bool    `json:"gm"`
}

type ExchangesCreateSellOrderRet struct {
	Code  int             `json:"code"`
	Order *ExchangesOrder `json:"order"`
}

// 请求买单
type ExchangesCreateBuyOrder struct {
	UnitValue     float64 `json:"unit_value"` // 单价
	UnitCount     int     `json:"unit_count"`
	RequestThings *Things `json:"request_things"`
	GM            bool    `json:"gm"`
}

type ExchangesCreateBuyOrderRet struct {
	Code  int             `json:"code"`
	Order *ExchangesOrder `json:"order"`
}

// 请求完成交易
type ExchangesTrade struct {
	OrderID       string  `json:"order_id"`
	PaymentThings *Things `json:"payment_things"`
	GM            bool    `json:"gm"`
}

type ExchangesTradeRet struct {
	Code  int             `json:"code"`
	Order *ExchangesOrder `json:"order"`
}

// 撤单
type ExchangesCancelOrder struct {
	OrderID string `json:"order_id"`
}

type ExchangesCancelOrderRet struct {
	Code  int             `json:"code"`
	Order *ExchangesOrder `json:"order"`
}

type ExchangesQueryArgs struct {
	PlayerID          *string `json:"player_id"`
	ThingType         int     `json:"thing_type"`
	SortType          int     `json:"sort_type"`
	ItemSelection     []int   `json:"item_selection"`
	RoleSelection     []int   `json:"role_selection"`
	SelectionTimeLock int64   `json:"selection_time_lock"`
	Reverse           bool    `json:"reverse"`
}

// 查询
type ExchangesQueryView struct {
	QueryType int                 `json:"query_type"`
	QueryArgs *ExchangesQueryArgs `json:"query_args"`
	PageIndex int                 `json:"page_index"`
	PageSize  int                 `json:"page_size"`
	OrderType string              `json:"order_type"`
}

type ExchangesQueryViewRet struct {
	Code           int                 `json:"code"`
	QueryType      int                 `json:"query_type"`
	QueryArgs      *ExchangesQueryArgs `json:"query_args"`
	PageIndex      int                 `json:"page_index"`
	PageSize       int                 `json:"page_size"`
	PageLastIndex  int                 `json:"page_last_index"`
	OrderList      []*ExchangesOrder   `json:"order_list"`
	OrderStateList []string            `json:"order_state_list"`
}

// 直接根据交易 ID 查询
type ExchangesQueryOrderIDList struct {
	OrderIDList []string `json:"order_id_list"`
}

type ExchangesQueryOrderIDListRet struct {
	Code           int               `json:"code"`
	OrderList      []*ExchangesOrder `json:"order_list"`
	OrderStateList []string          `json:"order_state_list"`
}

// 直接根据View ID 查询
type ExchangesQueryViewIDList struct {
	ViewIDList []string `json:"view_id_list"`
}

type ExchangesQueryViewIDListRet struct {
	Code           int               `json:"code"`
	OrderList      []*ExchangesOrder `json:"order_list"`
	OrderStateList []string          `json:"order_state_list"`
}

// 计算费用
type ExchangesCalcFee struct {
	UnitValue float64 `json:"unit_value"` // 单价
	UnitCount int     `json:"unit_count"`
	OrderType string  `json:"order_type"` // 买单或卖单
	Things    *Things `json:"things"`
}

type ExchangesCalcFeeRet struct {
	Code int     `json:"code"`
	Fee  float64 `json:"fee"`
}
