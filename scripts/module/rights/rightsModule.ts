import { MsgTypeRet } from "../../MsgType";
import { CfgMgr } from "../../manager/CfgMgr";
import { EventMgr, Evt_RightsGetReward } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { ItemUtil } from "../../utils/ItemUtils";
import { RewardTips } from "../common/RewardTips";
import PlayerData, { SBenefit, SThing } from "../roleModule/PlayerData";


export class rightsModule {
    constructor() {
        Session.on(MsgTypeRet.BenefitPush, this.onBenefitPush, this);
        Session.on(MsgTypeRet.ClaimDailyBenefitRet, this.onClaimDailyBenefit, this);    
    }

    private onBenefitPush(data:SBenefit){
        // console.log("权益" ,  data)
        PlayerData.rightsData = data;
        EventMgr.emit(Evt_RightsGetReward);
    }

    private onClaimDailyBenefit(data:{pveTimes:number}){
        if(data && data.pveTimes){
            PlayerData.pveData.times = data.pveTimes;
        }
        if(data && !PlayerData.rightsData.benefit_card.claimed_today){
            let itemDataList: SThing[] = []
            let car_cfg = CfgMgr.getEquityCardById(1001);
            for (let index = 0; index < car_cfg.Equity_list.length; index++) {
                const element = car_cfg.Equity_list[index];
                let list_cfg = CfgMgr.getEquityListById(element);
                if(list_cfg.Equity_Type == 2){
                    itemDataList = ItemUtil.GetSThingList(list_cfg.RewardType, list_cfg.RewardID, list_cfg.RewardNumber);
                }
            }
            RewardTips.Show(itemDataList)
            PlayerData.rightsData.benefit_card.claimed_today = true;
            EventMgr.emit(Evt_RightsGetReward);
        }
    }
       


}