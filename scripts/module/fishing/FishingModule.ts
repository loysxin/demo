import { MessagId, ThingType } from "../../manager/CfgMgr";
import { EventMgr, Evt_FishDataUpdate, Evt_FishItemUpdate, Evt_FishLogDataUpdate, Evt_FishRankUpdate, Evt_FishShopDataUpdate, Evt_SellFishUpdate} from "../../manager/EventMgr";
import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { BeforeGameUtils } from "../../utils/BeforeGameUtils";
import { ItemUtil } from "../../utils/ItemUtils";
import TimerMgr from "../../utils/TimerMgr";
import { formatNumber } from "../../utils/Utils";
import { MsgPanel } from "../common/MsgPanel";
import { RewardTips } from "../common/RewardTips";
import PlayerData, { SFishingItem, SFishingLogData, SFishingRankQueryRet, SFishingSettlementData, SFishingShopGetContentRet, SFishingStateData, SPlayerDataItem, SThing } from "../roleModule/PlayerData";
/**错误码类型*/
export enum FishErrorCodeType {
    FishingErrorRoundNotOpen            = 100, // 回合未开启
	FishingErrorInvalidLakeID           = 101, //  无效的湖泊ID
	FishingErrorRoundStateError         = 102, //  回合状态错误
	FishingErrorNotSelectLake           = 103, //  未选择湖泊
	FishingErrorConvertMount            = 104, //  无效的兑换数量
	FishingErrorInsufficientCurrency    = 105, //  彩虹币不足
	FishingErrorInsufficientFatigue     = 106, //  疲劳值不足
	FishingErrorCostExceedingRoundLimit = 107, // 投入超出回合限制
	FishingErrorCostExceedingDailyLimit = 108, // 投入超出每日限制
	FishingErrorBadArg                  = 109, // 参数错误
    FishingErrorFishBagMax              = 110, // 鱼类背包已满
	FishingErrorNoCost                  = 111, // 未投入任何鱼饵
	FishingErrorFishItemNotFound        = 112, // 鱼类商品未找到
	FishingErrorShopItemNotFound        = 113, // 商店商品未找到
	FishingErrorShopItemInvalidBuyCount = 114, // 无效的购买数量
	FishingErrorInsufficientScore       = 115, // 钓鱼积分不足
    FishingErrorLevelNotEnough          = 116 // 等级不足
}
export class FishingModule{
    private errorStr:{[key: string]: string} = BeforeGameUtils.toHashMapObj(
        FishErrorCodeType.FishingErrorRoundNotOpen, "回合未开启",
        FishErrorCodeType.FishingErrorInvalidLakeID, "无效的湖泊ID",
        FishErrorCodeType.FishingErrorRoundStateError, "回合状态错误",
        FishErrorCodeType.FishingErrorNotSelectLake, "未选择湖泊",
        FishErrorCodeType.FishingErrorConvertMount, "无效的兑换数量",
        FishErrorCodeType.FishingErrorInsufficientCurrency, "彩虹币不足",
        FishErrorCodeType.FishingErrorInsufficientFatigue, "疲劳值不足",
        FishErrorCodeType.FishingErrorCostExceedingRoundLimit, "投入超出回合限制",
        FishErrorCodeType.FishingErrorCostExceedingDailyLimit, "投入超出每日限制",
        FishErrorCodeType.FishingErrorBadArg, "参数错误",
        FishErrorCodeType.FishingErrorFishBagMax, "鱼类背包已满",
        FishErrorCodeType.FishingErrorNoCost, "未投入任何鱼饵",
        FishErrorCodeType.FishingErrorFishItemNotFound, "鱼类商品未找到",
        FishErrorCodeType.FishingErrorShopItemNotFound, "商店商品未找到",
        FishErrorCodeType.FishingErrorShopItemInvalidBuyCount, "无效的购买数量",
        FishErrorCodeType.FishingErrorInsufficientScore, "钓鱼积分不足",
        FishErrorCodeType.FishingErrorLevelNotEnough, "等级不足",
        
    );
    constructor() {
        Session.on(MsgTypeRet.FishingGetPlayerDataRet, this.onPlayerDataUpdate, this);
        Session.on(MsgTypeRet.FishingRoundPush, this.onRoundDataUpdate, this);
        Session.on(MsgTypeRet.FishingSelectLakeRet, this.onSelectLakeUpdate, this);
        Session.on(MsgTypeRet.FishingRodRet, this.onFishFeedUpdate, this);
        Session.on(MsgTypeRet.FishingRecordQueryRet, this.onLogUpdate, this);
        Session.on(MsgTypeRet.FishingShopGetContentRet, this.onShopUpdate, this);
        Session.on(MsgTypeRet.FishingShopBuyItemRet, this.onShopUpdate, this);
        Session.on(MsgTypeRet.FishingSellFishItemRet, this.onSellFishUpdate, this);
        Session.on(MsgTypeRet.FishingRankQueryRet, this.onRankUpdate, this);
        Session.on(MsgTypeRet.FishingItemPush, this.onFishItemUpdate, this);
        Session.on(MsgTypeRet.FishingConvertItemRet, this.onConvertItem, this);
        
        
        
        
    }
    onPlayerDataUpdate(data: {code:number, state: SFishingStateData, fish_items:SFishingItem[]}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.fishData = data.state;
        PlayerData.fishItems = data.fish_items;
        EventMgr.emit(Evt_FishDataUpdate);
    }
    onRoundDataUpdate(data:{type:number, state: SFishingStateData}):void{
        console.log("回合数据推送类型---->" + data.type + "----->" + "回合是否开启" + data.state.round_info.is_open + "回合时长--->" + (data.state.round_info.end_time - data.state.round_info.start_time));
        console.log("回合开始时间---->" + data.state.round_info.start_time + "回合冰封时间---->" + data.state.round_info.frozen_time + "回合结算时间---->" + data.state.round_info.settlement_time + "  回合结束时间----->" + data.state.round_info.end_time);
        console.log("当前服务器时间---->" + PlayerData.GetServerTime());
        console.log("kill_type---->" + data.state.round_info.kill_type);
        let oldRound = PlayerData.CurFishRoundInfo;
        if(oldRound && oldRound.round != data.state.round_info.round){
            Session.Send({type: MsgTypeSend.FishingJoin, data:{}});
        }
        PlayerData.fishData = data.state;
        EventMgr.emit(Evt_FishDataUpdate);
    }
    onSelectLakeUpdate(data:{code:number, lake_id:number, state:SFishingStateData}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.fishData = data.state;
        EventMgr.emit(Evt_FishDataUpdate);
    }
    onFishFeedUpdate(data:{code: number, state: SFishingStateData}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.fishData = data.state;
        EventMgr.emit(Evt_FishDataUpdate);
    }
    onLogUpdate(data:SFishingLogData):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        EventMgr.emit(Evt_FishLogDataUpdate, data);
    }
    private onShopUpdate(data:SFishingShopGetContentRet):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.fishShop = data;
        //TimerMgr.Register(this.SendShopRefresh, this, data.refresh_time);
        EventMgr.emit(Evt_FishShopDataUpdate);
        if(data.new_item){
            RewardTips.Show([data.new_item]);
        }
    }
    private SendShopRefresh():void{
        Session.Send({type: MsgTypeSend.FishingShopGetContent, data:{}});
    }
   
    private onSellFishUpdate(data:{code:number}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        EventMgr.emit(Evt_SellFishUpdate, data);
    }
    private onRankUpdate(data:SFishingRankQueryRet):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        EventMgr.emit(Evt_FishRankUpdate, data);
    }
    private onFishItemUpdate(data:{type:string, fish_items:SFishingItem[]}):void{
        if(data.type == "add"){
            PlayerData.FishItemAdd(data.fish_items);
        }else if(data.type == "remove"){
            PlayerData.FishItemRemove(data.fish_items);
            if(data.fish_items && data.fish_items.length){
                let num:number = 0;
                for (let fishItem of data.fish_items) {
                    num += fishItem.weight;
                }
                
                let newItem:SThing = ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, num);
                RewardTips.Show([newItem]);
                PlayerData.AddChannelMsg(MessagId.Messag_26, formatNumber(num, 2), newItem.resData.name);
            }
        }
        EventMgr.emit(Evt_FishItemUpdate, data.type);
        
    }
    private onConvertItem(data:{code:number, convert_items:SPlayerDataItem[]}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        }else{
            if(data.convert_items.length){
                MsgPanel.Show("兑换成功");
            }else{
                MsgPanel.Show("兑换失败");
            }
        } 
    }
    private showErrorCode(code:number):void{
        let errorStr:string = this.errorStr[code];
        if(errorStr){
            MsgPanel.Show(errorStr);
        }
    }
}