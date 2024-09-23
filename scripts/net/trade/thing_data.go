package protocol

const (
	ThingTypeItem      int = 1 // 道具
	ThingTypeCurrency  int = 2 // 彩虹体
	ThingTypeGold      int = 3 // 金币
	ThingTypeEquipment int = 4 // 装备
	ThingTypeRole      int = 5 // 角色
	ThingTypeResource  int = 6 // 资源
)

const (
	ResourceTypeWood  int = 1
	ResourceTypeWater int = 2
	ResourceTypeRock  int = 3
	ResourceTypeSeed  int = 4
)

type Thing struct {
	Type     int             `bson:"type" json:"type"`
	Currency *ThingCurrency  `bson:"currency,omitempty" json:"currency,omitempty"`
	Gold     *ThingGold      `bson:"gold,omitempty" json:"gold,omitempty"`
	Resource *ThingResource  `bson:"resource,omitempty" json:"resource,omitempty"`
	Item     *ThingItem      `bson:"item,omitempty" json:"item,omitempty"`
	Role     *PlayerDataRole `bson:"role,omitempty" json:"role,omitempty"`
}

type Things struct {
	Data []*Thing `bson:"data" json:"data"`
}

func (t *Things) AddThing(thing *Thing) {
	if t.Data == nil {
		t.Data = make([]*Thing, 0)
	}
	t.Data = append(t.Data, thing)
}

type ThingCurrency struct {
	Value int64 `bson:"value" json:"value"`
}

type ThingGold struct {
	Value int64 `bson:"value" json:"value"`
}

type ThingResource struct {
	Wood  int `bson:"wood" json:"wood"`
	Water int `bson:"water" json:"water"`
	Rock  int `bson:"rock" json:"rock"`
	Seed  int `bson:"seed" json:"seed"`
}

type ThingItem struct {
	ID    int `bson:"id" json:"id"`
	Count int `bson:"count" json:"count"`
}

func NewThingCurrency(value int64) *Thing {
	return &Thing{
		Type: ThingTypeCurrency,
		Currency: &ThingCurrency{
			Value: value,
		},
	}
}

func NewThingGold(value int64) *Thing {
	return &Thing{
		Type: ThingTypeGold,
		Gold: &ThingGold{
			Value: value,
		},
	}
}

func NewThingResource(wood, water, rock, seed int) *Thing {
	return &Thing{
		Type: ThingTypeResource,
		Resource: &ThingResource{
			Wood:  wood,
			Water: water,
			Rock:  rock,
			Seed:  seed,
		},
	}
}

func NewThingItem(id, count int) *Thing {
	return &Thing{
		Type: ThingTypeItem,
		Item: &ThingItem{
			ID:    id,
			Count: count,
		},
	}
}

func NewThingRole(id string, roleType, level, quality, experience, soldierNum int) *Thing {
	return &Thing{
		Type: ThingTypeRole,
		Role: &PlayerDataRole{
			ID:         id,
			Type:       roleType,
			Level:      level,
			Quality:    quality,
			Experience: experience,
			SoldierNum: soldierNum,
		},
	}
}

func NewThingByValues(thingType, id, count int) *Thing {
	switch thingType {
	case ThingTypeItem:
		return NewThingItem(id, count)
	case ThingTypeCurrency:
		return NewThingCurrency(int64(count))
	case ThingTypeGold:
		return NewThingGold(int64(count))
	case ThingTypeEquipment:
		// TODO: 实现 NewThingEquipment 方法
		return nil
	case ThingTypeRole:
		// TODO: 实现 NewThingRole 方法,需要更多参数
		return nil
	case ThingTypeResource:
		switch id {
		case 1:
			return NewThingResource(count, 0, 0, 0)
		case 2:
			return NewThingResource(0, count, 0, 0)
		case 3:
			return NewThingResource(0, 0, count, 0)
		case 4:
			return NewThingResource(0, 0, 0, count)
		default:
			// 无效的资源 ID
			return nil
		}
	default:
		// 无效的类型
		return nil
	}
}
