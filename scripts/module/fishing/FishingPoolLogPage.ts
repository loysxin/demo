import { Component, Node } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import { FishingRankSettlementRecordInfo, SFishingLogData } from "../roleModule/PlayerData";
import { EventMgr, Evt_FishLogDataUpdate } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { FishingPoolLogItem } from "./FishingPoolLogItem";

export class FishingPoolLogPage extends Component {
    private poolList:AutoScroller;
    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;
    private logData:SFishingLogData;
    protected onLoad(): void {
        this.poolList = this.node.getChildByName("poolList").getComponent(AutoScroller);
        this.poolList.SetHandle(this.updatePoolItem.bind(this));
        this.hasLoad = true;
        this.complete?.();   
        EventMgr.on(Evt_FishLogDataUpdate, this.onFishDataLogUpdate, this);
    }

    protected get loadSub() {
        if (this.$loadSub) return this.$loadSub;
        let thisObj = this;
        this.$loadSub = new Promise((resolve, reject) => {
            thisObj.complete = resolve;
        });
    }
    onShow():void{
        this.node.active = true;
        if(!this.logData){
            this.updateCont();
            Session.Send({type: MsgTypeSend.FishingRecordQuery, data:{query_type:5, page_index:1, page_size:50}});
        }else{
            this.updateCont();
        }
    }
    onHide():void{
        this.node.active = false;
        this.logData = null;
    }
    private onFishDataLogUpdate(logData:SFishingLogData):void{
        if(!this.node.activeInHierarchy) return;
        this.logData = logData;
        this.updateCont();
    }
    private updateCont():void{
        let list:FishingRankSettlementRecordInfo[] = [];
        if(this.logData && this.logData.rank_settlement_record && this.logData.rank_settlement_record.length){
            list = this.logData.rank_settlement_record;
        }
        this.poolList.UpdateDatas(list);
    }
    protected updatePoolItem(item: Node, data: FishingRankSettlementRecordInfo) {
        let logItem = item.getComponent(FishingPoolLogItem);
        if (!logItem) logItem = item.addComponent(FishingPoolLogItem);
        logItem.SetData(data);
    }
    
}