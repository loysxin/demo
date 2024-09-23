import { Component, Label } from "cc";
import { AwardItem } from "../common/AwardItem";
import { ConsumeItem } from "../common/ConsumeItem";
import { SFishingShopItem, SThing } from "../roleModule/PlayerData";
import { ItemUtil } from "../../utils/ItemUtils";
import { CfgMgr, StdFishShop, ThingType } from "../../manager/CfgMgr";

export class FishingShopItem extends Component {
    private awardItem: AwardItem;
    private rainbowItem: ConsumeItem;
    private yuPiaoItem: ConsumeItem;
    private buyNumLab: Label;
    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;
    private data:SFishingShopItem;
    protected onLoad(): void {
        this.awardItem = this.node.getChildByName("AwardItem").addComponent(AwardItem);
        this.buyNumLab = this.node.getChildByName("buyNumLab").getComponent(Label);
        this.rainbowItem = this.node.getChildByPath("priceCont/rainbowItem").addComponent(ConsumeItem);
        this.yuPiaoItem = this.node.getChildByPath("priceCont/yuPiaoItem").addComponent(ConsumeItem);
        this.hasLoad = true;
        this.complete?.();
    }

    protected get loadSub() {
        if (this.$loadSub) return this.$loadSub;
        let thisObj = this;
        this.$loadSub = new Promise((resolve, reject) => {
            thisObj.complete = resolve;
        });
    }
    
    async SetData(data:SFishingShopItem) {
        this.data = data;
        if (!this.hasLoad) await this.loadSub;
        this.awardItem.SetData({itemData:this.data.item});
        let stdShop:StdFishShop = CfgMgr.GetFishShopItem(this.data.id);
        if(stdShop.BuyCountMax > 0){
            this.buyNumLab.string = `限购：${this.data.available_amount} / ${stdShop.BuyCountMax}`;
        }else{
            this.buyNumLab.string = "";
        }
        let thing:SThing;
        thing = ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, this.data.currency_price);
        this.rainbowItem.SetData(thing);

        thing = ItemUtil.CreateThing(ThingType.ThingTypeItem, CfgMgr.GetFishCommon.ScoreItemId, this.data.fish_score_price);
        this.yuPiaoItem.SetData(thing);
    }
}