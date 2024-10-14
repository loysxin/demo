import { Component, Label, Sprite, Node, RichText, path, SpriteFrame} from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import { SFishingItem, SFishingLogItemData, SThing } from "../roleModule/PlayerData";
import { DateUtils } from "../../utils/DateUtils";
import { CfgMgr, FuncValueType, StdFishItem, StdLake, ThingType } from "../../manager/CfgMgr";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { AwardItem } from "../common/AwardItem";
import { ItemUtil } from "../../utils/ItemUtils";
import { formatNumber } from "../../utils/Utils";

export class FishingLogItem extends Component {
    private phaseLab: RichText;
    private timeLab: Label;
    private fishLakeNameLab: Label;
    private icedLakeNameLab: Label;
    private fishItemCont: Node;
    private fishNoneLab:Label;
    private fishIcon:Sprite;
    private fishName:Label;
    private fishWeightLab:Label;
    private fishPriceLab:Label;
    private awardList:AutoScroller;
    private consumeNumLab:Label;
    private winFlag:Node;
    private loseFlag:Node;
    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;
    
    protected onLoad(): void {
        this.phaseLab = this.node.getChildByName("phaseLab").getComponent(RichText);
        this.timeLab = this.node.getChildByName("timeLab").getComponent(Label);
        this.fishLakeNameLab = this.node.getChildByName("fishLakeNameLab").getComponent(Label);
        this.icedLakeNameLab = this.node.getChildByName("icedLakeNameLab").getComponent(Label);
        this.fishItemCont = this.node.getChildByName("fishItemCont");
        this.fishIcon = this.node.getChildByPath("fishItemCont/icon").getComponent(Sprite);
        this.fishWeightLab = this.node.getChildByPath("fishItemCont/weightLab").getComponent(Label);
        this.fishName = this.node.getChildByPath("fishItemCont/nameLab").getComponent(Label);
        this.fishPriceLab = this.node.getChildByPath("fishItemCont/priceLab").getComponent(Label);
        this.fishNoneLab = this.node.getChildByName("fishNoneLab").getComponent(Label);
        this.awardList = this.node.getChildByName("awardList").getComponent(AutoScroller);
        this.consumeNumLab = this.node.getChildByPath("consumeCont/numLab").getComponent(Label);
        this.winFlag = this.node.getChildByName("winFlag");
        this.loseFlag = this.node.getChildByName("loseFlag");
        this.awardList.SetHandle(this.updateItem.bind(this));
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
    
    async SetData(data:SFishingLogItemData) {
        if (!this.hasLoad) await this.loadSub;
        console.log(`第${data.round}期 钓鱼记录时间戳 ${data.start_time}`);
        let stdLake:StdLake = CfgMgr.GetStdLake(data.lake_id);
        
        
        let dates:string[] = DateUtils.TimestampToDate(data.start_time * 1000, true);
        this.timeLab.string = `${dates[0]}-${dates[1]}-${dates[2]}  ${dates[3]}:${dates[4]}:${dates[5]}`;
        this.fishLakeNameLab.string = `钓鱼湖泊：${stdLake.Lakesname}`;
        let nameStr:string = "";
        let icedStdLake:StdLake;
        if(!data.frozen_lake_ids || data.frozen_lake_ids.length < 1){
            data.frozen_lake_ids = [];
            data.frozen_lake_ids.push(data.frozen_lake_id);
        } 
        for (let index = 0; index < data.frozen_lake_ids.length; index++) {
            icedStdLake = CfgMgr.GetStdLake(data.frozen_lake_ids[index])
            nameStr += icedStdLake.Lakesname;
            if(index < data.frozen_lake_ids.length -1 ){
                nameStr += " ";
            }
        }
        if(data.frozen_lake_ids && data.frozen_lake_ids.length > 1){
            this.phaseLab.string = `<size=30>第<size=40>${data.round}</size>期   地狱模式</size>`;
        }else{
            this.phaseLab.string = `<size=30>第<size=40>${data.round}</size>期</size>`;
        }
        
        this.icedLakeNameLab.string = nameStr;
        this.winFlag.active = false;
        this.loseFlag.active = false;
        this.consumeNumLab.string = data.cost.toString();
        if(data.fish_item && data.fish_item.length > 0){
            let fishData:SFishingItem = data.fish_item[0];
            let stdFishItem:StdFishItem = CfgMgr.GetFishItem(fishData.fish_id);
            let weightStr:string = formatNumber(fishData.weight, 2);
            this.winFlag.active = this.fishItemCont.active = true;
            
            this.fishName.string = stdFishItem.Fishsname;
            this.fishWeightLab.string = weightStr;
            this.fishPriceLab.string = weightStr;
            let url = path.join(folder_icon, `fish/${stdFishItem.Icon}`, "spriteFrame");
            ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                this.fishIcon.spriteFrame = res;
            });
            this.fishNoneLab.node.active = false;
            let awardList:SThing[] = [];
            //awardList[0] = ItemUtil.CreateThing(ThingType.ThingTypeItem, CfgMgr.GetFishCommon.CostItemID, data.cost_get);
            awardList[0] = ItemUtil.CreateThing(ThingType.ThingTypesFuncValue, FuncValueType.strength, data.fatigue_get);
            //awardList[2] = ItemUtil.CreateThing(ThingType.ThingTypeItem, CfgMgr.GetFishCommon.ScoreItemId, data.fatigue_get);
            this.awardList.UpdateDatas(awardList);
        }else{
            this.fishItemCont.active = false;
            this.loseFlag.active = this.fishNoneLab.node.active = true;
            let awardList:SThing[] = [];
            awardList[0] = ItemUtil.CreateThing(ThingType.ThingTypeItem, CfgMgr.GetFishCommon.ScoreItemId, data.fish_score_get);
            this.awardList.UpdateDatas(awardList);
        }
        
        
    }

    private updateItem(item: Node, data:SThing) {
        let awardItem = item.getComponent(AwardItem);
        if (!awardItem) awardItem = item.addComponent(AwardItem);
        awardItem.SetData({itemData:data});
    }
}