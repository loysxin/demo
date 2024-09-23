import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_CurrencyIncomInfoUpdate } from "../../manager/EventMgr";
import { Session } from "../../net/Session";

export class CurrencyIncomModule {
    constructor() {
        Session.on(MsgTypeRet.QueryThingRecordsRet, this.queryThingRecords, this);
    }

    /**获取货币流水 */
    private queryThingRecords(data:{records:{player_id:string,type1:number,type2:number,count:number,source:number,data:string,time:number}[]}) {
        console.log(data)
        EventMgr.emit(Evt_CurrencyIncomInfoUpdate,data.records);
    }

  
}