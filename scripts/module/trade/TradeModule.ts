import { MsgTypeRet } from "../../MsgType";
import { CfgMgr, StdCommonType, ThingType } from "../../manager/CfgMgr";
import { Session } from "../../net/Session";
import { MsgPanel } from "../common/MsgPanel";
import { RewardTips } from "../common/RewardTips";
import { Tips } from "../login/Tips";
import { SPlayerDataItem, SPlayerDataRole, SOonViewData, SOrderData, SSerchData, SOrderThings, SThing } from "../roleModule/PlayerData";
import { BuyFailPanel } from "./BuyFailPanel";
import { BuyPanel } from "./BuyPanel";
import { RoleMsgPanel } from "./RoleMsgPanel";
import { TradeCreateOrderPanel } from "./TradeCreateOrderPanel";
import { TradePanel } from "./TradePanel";

// "出售订单已满" = 100,
// "订单未开放",
// "不可以购买自己的订单",
// "仅能取消自己的订单"=103,
// "订单已过期",
// ""= 105,
// "无效的附件内容"=106,
// "订单可用数量不足",

export class TradeModule {
    constructor() {
        Session.on(MsgTypeRet.ExchangesQueryViewRet, this.onViewRet, this);
        Session.on(MsgTypeRet.ExchangesCancelOrderRet, this.onCanelOrder, this);
        Session.on(MsgTypeRet.ExchangesCreateSellOrderRet, this.onSelllOrder, this);
        Session.on(MsgTypeRet.ExchangesCreateBuyOrderRet, this.onBuyOrder, this);
        Session.on(MsgTypeRet.ExchangesTradeRet, this.onExchangesTradeRet, this)

        Session.on(MsgTypeRet.ExchangesQueryViewIDListRet, this.onSerchRet, this);
    }

    private onViewRet(data: SOonViewData) {
        if (data.code == 0) {//请求数据成功
            TradePanel.ins.onGetViewData(data);
        } else {
            if (data.code == 111) {
                console.log("购买速度过快");

            } else {
                Tips.Show(`请求数据错误！`)
            }
        }
    }
    /**下架订单 */
    private onCanelOrder(data: SOonViewData) {
        if (data.code == 0) {//请求数据成功
            Tips.Show(`下架成功！`)
        } else {
            Tips.Show(`下架失败`);
            // if(data.code == 101){
            //     Tips.Show(`下架失败`);
            // }else{
            //     Tips.Show(`下架失败，code${data.code}`)
            // }
        }
        TradePanel.ins.SendSessionView();
    }
    private onSelllOrder(data) {
        if (data.code == 0) {
            TradePanel.ins.SendSessionView();
            MsgPanel.Show("商品上架成功")
            TradeCreateOrderPanel.Hide();
        } else if (data.code == 100) {
            Tips.Show("订单已满")
            TradeCreateOrderPanel.Hide();
        }
    }

    private onBuyOrder(data) {
        if (data.code == 0) {
            TradePanel.ins.SendSessionView();
            MsgPanel.Show("求购信息已发出")
            TradeCreateOrderPanel.Hide();
        }
    }

    private onExchangesTradeRet(reward_data: { code: number, order: SOrderData, payment_things: SOrderThings }) {
        if (reward_data.code == 0) {
            if (reward_data.order.order_type == "sell") {         
                if (reward_data.order.things.data[0].item) {
                    BuyPanel.Hide();
                } else if (reward_data.order.things.data[0].role) {
                    RoleMsgPanel.Hide();
                } else if (reward_data.order.things.data[0].resource) {
                    BuyPanel.Hide();
                }
                MsgPanel.Show("购买成功，请到邮件领取商品")
            } else {  
                if (reward_data.order.things.data[0].item) {
                    BuyPanel.Hide();
                } else if(reward_data.order.things.data[0].resource) {
                    BuyPanel.Hide();
                } else if(reward_data.order.things.data[0].role) {
                    RoleMsgPanel.Hide();
                }
                MsgPanel.Show("出售成功，请到邮件领取彩")
            }
            TradePanel.ins.SendSortOrSerch();
        } else if(reward_data.code == 101){  
            BuyFailPanel.Show(reward_data.code);
            TradePanel.ins.SendSessionView();  
        }
        BuyPanel.Hide();
    }

    private onSerchRet(data: SSerchData) {
        TradePanel.ins.onGetSerchData(data)
    }
}