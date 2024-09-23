import { Component, Label, Node, Button, Size, UITransform, Vec3} from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import PlayerData, { SFishingLogData, SFishingLogItemData } from "../roleModule/PlayerData";
import { FishingLogItem } from "./FishingLogItem";
import { ClickTipsPanel } from "../common/ClickTipsPanel";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_FishLogDataUpdate } from "../../manager/EventMgr";
import { ToFixed, formatNumber } from "../../utils/Utils";

export class FishingLogPage extends Component {
    private rainbowNumLab:Label;
    private downBtnCont:Node;
    private downBtnArrow:Node;
    private downBtn:Button;
    private downBtnTitle:Label;
    private allBtn:Button;
    private winBtn:Button;
    private failBtn:Button;
    private logList:AutoScroller;
    protected $loadSub:Promise<any>;
    protected complete:Function;
    protected hasLoad = false;
    private logData:SFishingLogData;
    private curSotr:number;
    protected onLoad(): void {
        this.rainbowNumLab = this.node.getChildByPath("rainbowCont/rainbowNumLab").getComponent(Label);
        this.downBtnCont = this.node.getChildByName("downBtnCont");
        this.allBtn = this.node.getChildByPath("downBtnCont/allBtn").getComponent(Button);
        this.winBtn = this.node.getChildByPath("downBtnCont/winBtn").getComponent(Button);
        this.failBtn = this.node.getChildByPath("downBtnCont/failBtn").getComponent(Button);
        this.downBtn = this.node.getChildByName("downBtn").getComponent(Button);
        this.downBtnTitle = this.node.getChildByPath("downBtn/downBtnTitle").getComponent(Label);
        this.downBtnArrow = this.node.getChildByPath("downBtn/downBtnArrow");
        this.logList = this.node.getChildByName("logList").getComponent(AutoScroller);
        this.logList.SetHandle(this.updateLogItem.bind(this));

        this.allBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.winBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.failBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.downBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        EventMgr.on(Evt_FishLogDataUpdate, this.onFishDataLogUpdate, this);

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
    private onFishDataLogUpdate(logData:SFishingLogData):void{
        if(!this.node.activeInHierarchy) return;
        this.logData = logData;
        this.sortLogData(this.curSotr);
    }
    async onShow():Promise<void>{
        this.node.active = true;
        if (!this.hasLoad) await this.loadSub;
        this.rainbowNumLab.string =  ToFixed(PlayerData.roleInfo.currency, 2) + "";
        
        this.curSotr = 0;
        this.downBtnArrow.angle = 0;
        if(!this.logData){
            this.logList.UpdateDatas([]);
            Session.Send({type: MsgTypeSend.FishingRecordQuery, data:{query_type:1, query_args:{}, page_index:1, page_size:50}});
        }else{
            this.sortLogData(this.curSotr);
        }
        

    }
    onHide():void{
        this.node.active = false;
        this.logData = null;
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.allBtn:
                this.sortLogData(0);
                ClickTipsPanel.Hide();
                break;
            case this.winBtn:
                this.sortLogData(1);
                ClickTipsPanel.Hide();
                break;
                case this.failBtn:
                    this.sortLogData(2);
                    ClickTipsPanel.Hide();
                break;
            case this.downBtn:
                
                let btnNode:Node = this.downBtn.node;
                let btnSize:Size = btnNode.getComponent(UITransform).contentSize;
                let showPos:Vec3 = btnNode.worldPosition.clone();
                showPos.y = showPos.y - btnSize.height / 2 - this.downBtnCont.getComponent(UITransform).height / 2 + 6;
                this.downBtnArrow.angle = 0;
                ClickTipsPanel.Show(this.downBtnCont, this.node, this.downBtn, showPos, 0, ()=>{
                    this.downBtnArrow.angle = -180;
                });
                break;
            
        }
    }
    private sortLogData(type:number):void{
        this.curSotr = type;
        let logDatas:SFishingLogItemData[] = [];
        switch(type){
            case 0:
                this.downBtnTitle.string = "全部";
                if(this.logData && this.logData.player_records){
                    logDatas = this.logData.player_records;
                }
                break;
            case 1:
                this.downBtnTitle.string = "成功";
                if(this.logData && this.logData.player_records){
                    for (let log of this.logData.player_records) {
                        if(log.fish_item && log.fish_item.length > 0){
                            logDatas.push(log);
                        }
                    }
                }
                break;
            case 2:
                this.downBtnTitle.string = "失败";
                if(this.logData && this.logData.player_records){
                    for (let log of this.logData.player_records) {
                        if(!log.fish_item || log.fish_item.length < 1){
                            logDatas.push(log);
                        }
                    }
                }
                break;
        }
        logDatas.sort((a:SFishingLogItemData, b:SFishingLogItemData)=>{
            return b.round - a.round;
        })
        this.logList.UpdateDatas(logDatas);
    }
    
    protected updateLogItem(item: Node, data: SFishingLogItemData) {
        let logItem = item.getComponent(FishingLogItem);
        if (!logItem) logItem = item.addComponent(FishingLogItem);
        logItem.SetData(data);
    }
}