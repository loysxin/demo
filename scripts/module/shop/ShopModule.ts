import { EventMgr, Evt_ShopLuckyGet, Evt_ShopUpdate } from "../../manager/EventMgr";
import { MsgTypeRet} from "../../MsgType";
import { Session } from "../../net/Session";
import { BeforeGameUtils } from "../../utils/BeforeGameUtils";
import { MsgPanel } from "../common/MsgPanel";
import { RewardTips } from "../common/RewardTips";
import PlayerData, { SShopIndexContent, SThings } from "../roleModule/PlayerData";

/**错误码类型*/
export enum ShopErrorCodeType {
    ErrorShopInvalidShopIndexID              = 100, // 无效的商店索引ID
	ErrorShopInvalidShopIndexType            = 101, // 无效的商店类型
	ErrorShopInvalidShopNotFindItem          = 102, // 无效的商店商品
	ErrorShopInvalidShopInsufficientBuyCount = 103, // 无效的商店购买数量
    ErrorShopShopLuckyFrequencyMax           = 104, // 已到达商店抽奖次数上限
	ErrorShopBuyItemHasExpired               = 105, // 商品已过期
	ErrorShopConsumeItemFailed               = 106, // 消耗道具失败
	ErrorShopCanNotManualRefresh             = 107, // 不允许手动刷新的商店
	ErrorShopHasExpired                      = 108, // 商店已过期
}
export class ShopModule{
    private errorStr:{[key: string]: string} = BeforeGameUtils.toHashMapObj(
        ShopErrorCodeType.ErrorShopInvalidShopIndexID, "无效的商店索引ID",
        ShopErrorCodeType.ErrorShopInvalidShopIndexType, "无效的商店类型",
        ShopErrorCodeType.ErrorShopInvalidShopNotFindItem, "无效的商店商品",
        ShopErrorCodeType.ErrorShopInvalidShopInsufficientBuyCount, "无效的商店购买数量",
        ShopErrorCodeType.ErrorShopShopLuckyFrequencyMax, "已到达商店抽奖次数上限",
        ShopErrorCodeType.ErrorShopBuyItemHasExpired, "商品已过期",
        ShopErrorCodeType.ErrorShopConsumeItemFailed, "消耗道具失败",
        ShopErrorCodeType.ErrorShopCanNotManualRefresh, "不允许手动刷新的商店",
        ShopErrorCodeType.ErrorShopHasExpired, "商店已过期",
    );
    constructor() {
        Session.on(MsgTypeRet.ShopGetIndexRet, this.onShopGetIndexRet, this);
        Session.on(MsgTypeRet.ShopBuyItemRet, this.onShopBuyItemRet, this);
        Session.on(MsgTypeRet.ShopManualRefreshRet, this.onShopRefreshRet, this);
        Session.on(MsgTypeRet.ShopDoLuckyRet, this.onShopDoLotteryRet, this);
        Session.on(MsgTypeRet.ShopConvertLuckyItemRet, this.onShopConvertLotteryItemRet, this);
        
        
    }
    onShopGetIndexRet(data: {code:number, shop_index_content: SShopIndexContent[]}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.SetShopData(data.shop_index_content);
        EventMgr.emit(Evt_ShopUpdate);
    }
    onShopBuyItemRet(data:{code:number, new_things:SThings, shop_index_content: SShopIndexContent}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.SetShopData([data.shop_index_content]);
        EventMgr.emit(Evt_ShopUpdate);
        if(data.new_things && data.new_things.data && data.new_things.data.length){
            RewardTips.Show(data.new_things.data);
        }
    }
    onShopRefreshRet(data:{code:number, shop_index_content: SShopIndexContent}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.SetShopData([data.shop_index_content]);
        EventMgr.emit(Evt_ShopUpdate);
    }
    onShopDoLotteryRet(data:{code:number, new_things:SThings, shop_index_content: SShopIndexContent}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.SetShopData([data.shop_index_content]);
        EventMgr.emit(Evt_ShopUpdate);
        if(data.new_things && data.new_things.data && data.new_things.data.length){
            EventMgr.emit(Evt_ShopLuckyGet, data.new_things.data, data.shop_index_content.lucky.lucky_id);
            
        }
    }
    onShopConvertLotteryItemRet(data:{code:number, new_things:SThings}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        EventMgr.emit(Evt_ShopUpdate);
        if(data.new_things && data.new_things.data && data.new_things.data.length){
            RewardTips.Show(data.new_things.data);
        }
    }
    private showErrorCode(code:number):void{
        let errorStr:string = this.errorStr[code];
        if(errorStr){
            MsgPanel.Show(errorStr);
        }
    }
}