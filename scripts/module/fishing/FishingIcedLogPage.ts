import { Color, Component, Label, Node} from "cc";
import { EventMgr, Evt_FishLogDataUpdate } from "../../manager/EventMgr";
import { SFishingFrozenLogData, SFishingLogData } from "../roleModule/PlayerData";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { AutoScroller } from "../../utils/AutoScroller";
import { CfgMgr, StdLake } from "../../manager/CfgMgr";

export class FishingIcedLogPage extends Component {
    private oneHundredList:AutoScroller;
    private twentyList:AutoScroller;
    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;
    private logData:SFishingLogData;
    private icedLake:{[key:string]:{lakeId:number, num:number, isTop:boolean}};
    protected onLoad(): void {
        this.oneHundredList = this.node.getChildByName("oneHundredList").getComponent(AutoScroller);
        this.twentyList = this.node.getChildByName("twentyList").getComponent(AutoScroller);
        this.oneHundredList.SetHandle(this.updateOneHundItem.bind(this));
        this.twentyList.SetHandle(this.updateTwentyItem.bind(this));
        
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
    async onShow():Promise<void>{
        this.node.active = true;
        if (!this.hasLoad) await this.loadSub;
        if(!this.logData){
            this.icedLake = {};
            this.updateCont();
            Session.Send({type: MsgTypeSend.FishingRecordQuery, data:{query_type:4, page_index:1, page_size:100}});
        }else{
            this.updateCont();
        }
    }
    onHide():void{
        this.node.active = false;
        this.logData = null;
        this.icedLake = {};
    }
    private onFishDataLogUpdate(logData:SFishingLogData):void{
        if(!this.node.activeInHierarchy) return;
        this.logData = logData;
        this.icedLake = {};
        if(this.logData && this.logData.frozen_lake_record && this.logData.frozen_lake_record.length){
            let lakeInfo:{lakeId:number, num:number, isTop:boolean};
            let topId:number = 0;
            let topNum:number = 0;
            for (const log of this.logData.frozen_lake_record) {
                lakeInfo = this.icedLake[log.lake_id];
                if(!lakeInfo){
                    lakeInfo = {lakeId:log.lake_id, num:0, isTop:false};
                    this.icedLake[log.lake_id] = lakeInfo;
                }
                lakeInfo.num++;
                if(topId > 0){
                    if(topNum < lakeInfo.num)
                    {
                        topId = lakeInfo.lakeId;
                        topNum = lakeInfo.num;
                    }
                }else{
                    topId = lakeInfo.lakeId;
                    topNum = lakeInfo.num;
                }
            }
            if(this.icedLake[topId]) this.icedLake[topId].isTop = true;
        }
        
        this.updateCont();
    }
    private updateCont():void{
        this.oneHundredList.UpdateDatas(CfgMgr.GetLakeList());
        let logList:SFishingFrozenLogData[] = [];
        if(this.logData && this.logData.frozen_lake_record && this.logData.frozen_lake_record.length){
            logList = this.logData.frozen_lake_record;
        }
        this.twentyList.UpdateDatas(logList);
    }
    protected updateOneHundItem(item: Node, stdLake: StdLake) {
        let lakeNameLab:Label = item.getChildByName("lakeNameLab").getComponent(Label);
        let numLab:Label = item.getChildByName("numLab").getComponent(Label);
        lakeNameLab.string = stdLake.Lakesname;
        let lakeInfo:{lakeId:number, num:number, isTop:boolean} = this.icedLake[stdLake.LakesId];
        if(lakeInfo){
            numLab.color = new Color().fromHEX(lakeInfo.isTop ? "#DC7816" : "#3D7A97");
            numLab.string = lakeInfo.num.toString();
        }else{
            numLab.color = new Color().fromHEX("#3D7A97");
            numLab.string = "0";
        }
        
    }
    protected updateTwentyItem(item: Node, data: SFishingFrozenLogData) {
        let phaseLab:Label = item.getChildByName("phaseLab").getComponent(Label);
        let lakeNameLab:Label = item.getChildByName("lakeNameLab").getComponent(Label);
        let stdLake:StdLake = CfgMgr.GetStdLake(data.lake_id);
        lakeNameLab.string = stdLake.Lakesname;
        phaseLab.string = `${data.round}期`;
    }
}