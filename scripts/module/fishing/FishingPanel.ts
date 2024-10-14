import { Node, Button, Label, Sprite, sp, game, Game, instantiate, v3, tween, Vec3, NodePool, path, SpriteFrame } from "cc";
import { Panel } from "../../GameRoot";
import { CfgMgr, ConditionType, FishRoundState, OneOffRedPointId} from "../../manager/CfgMgr";
import { FishingNoneCont } from "./FishingNoneCont";
import { FishingLakeCont } from "./FishingLakeCont";
import { FishingSelectLakeCont } from "./FishingSelectLakeCont";
import { FishingOperateCont } from "./FishingOperateCont";
import { FishingResultCont } from "./FishingResultCont";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { EventMgr, Evt_Change_Scene_Bgm, Evt_FishDataUpdate, Evt_Hide_Scene, Evt_Item_Change, Evt_Show_Scene } from "../../manager/EventMgr";
import PlayerData, { SFishingRoundInfo, SFishingSettlementData, SPlayerViewInfo } from "../roleModule/PlayerData";
import { FishingFeedBuyPanel } from "./FishingFeedBuyPanel";
import { formatNumber, randomf, randomI } from "../../utils/Utils";
import { FishingLogPanel } from "./FishingLogPanel";
import { FishingShopPanel } from "./FishingShopPanel";
import { FishingLuckyPoolPanel } from "./FishingLuckyPoolPanel";
import { AdaptBgTop } from "../common/BaseUI";
import { BezierTween3 } from "../../utils/Bezier";
import { FishingTipsPanel } from "./FishingTipsPanel";
import { AudioMgr, FishSoundId, FishSoundInfo, SceneBgmId } from "../../manager/AudioMgr";
import { HeadItem } from "../common/HeadItem";
import { ResMgr } from "../../manager/ResMgr";

export class FishingPanel extends Panel {
    protected prefab: string = "prefabs/panel/fishing/FishingPanel";
    private topBg:Sprite;
    private head:HeadItem;
    private feedValLab:Label;
    private addBtn:Button;
    private vitValLab:Label;
    private fishTicketLab:Label;
    private poolLab:Label;
    private poolBtn:Button;
    private poolValLab:Label;
    private logBtn:Button;
    private shopBtn:Button;
    private rankBtn:Button;
    private gbaBtn:Button;
    private lakeCont:FishingLakeCont;
    private noneCont:FishingNoneCont;
    private selectLakeCont:FishingSelectLakeCont;
    private operateCont:FishingOperateCont;
    private resultCont:FishingResultCont;
    private feedFlyTemp:Node;
    private icedModel:sp.Skeleton;
    private curRoundState:FishRoundState;
    private curRoundId:number;
    private isInit:boolean;
    private feedFlyPool:NodePool = new NodePool();
    private curFeedVal:number;
    
    protected onLoad(): void {
        this.topBg = this.find("topCont/topBg", Sprite); 
        this.head = this.find('topCont/HeadItem').addComponent(HeadItem);
        this.feedValLab = this.find("topCont/feedCont/feedValLab", Label);
        this.addBtn = this.find("topCont/feedCont/addBtn", Button);
        this.vitValLab = this.find("topCont/vitCont/vitLab", Label);
        this.fishTicketLab = this.find("topCont/fishTicketCont/fishTicketLab", Label);
        this.poolValLab = this.find("topCont/poolCont/poolLab", Label);
        this.poolBtn = this.find("topCont/poolCont", Button);
        this.logBtn = this.find("topCont/btnCont/logBtn", Button);
        this.shopBtn = this.find("topCont/btnCont/shopBtn", Button);
        this.rankBtn = this.find("topCont/btnCont/rankBtn", Button);
        this.gbaBtn = this.find("topCont/btnCont/gbaBtn", Button);
        this.icedModel = this.find("icedModel").getComponent(sp.Skeleton);
        let lakeCont:Node = this.find("lakeCont");
        this.lakeCont = lakeCont.addComponent(FishingLakeCont);

        let noneCont:Node = this.find("noneCont");
        this.noneCont = noneCont.addComponent(FishingNoneCont);

        let selectLakeCont:Node = this.find("selectLakeCont");
        this.selectLakeCont = selectLakeCont.addComponent(FishingSelectLakeCont);

        let operateCont:Node = this.find("operateCont");
        this.operateCont = operateCont.addComponent(FishingOperateCont);

        let resultCont:Node = this.find("resultCont");
        this.resultCont = resultCont.addComponent(FishingResultCont);

        this.feedFlyTemp = this.find("feedFlyTemp");

        this.addBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.shopBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.rankBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.logBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.gbaBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.poolBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.CloseBy("topCont/closeBtn");

        EventMgr.on(Evt_FishDataUpdate, this.onFishDataUpdate, this);
        EventMgr.on(Evt_Item_Change, this.onItemUpdate, this);
        
        game.on(Game.EVENT_SHOW, this.onShowGame, this);
        
    }
    public async flush(...args: any[]): Promise<void> {
        if (!this.$hasLoad) await this.initSub;
        AdaptBgTop(this.node.getChildByPath("topCont/bg"));
        this.icedModel.node.active = false;
        this.isInit = true;
        this.curRoundState = null;
        let data:SPlayerViewInfo = {
            player_id:PlayerData.roleInfo.player_id,
            name:PlayerData.roleInfo.name,
            _weChatNumber:PlayerData.roleInfo.weChatNum,
            _qqNumber:PlayerData.roleInfo.qqNum,
        };
        this.head.SetData(data);
        this.initSendData();
        this.onItemUpdate();
    }
    
    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
        EventMgr.emit(Evt_Change_Scene_Bgm, SceneBgmId.SceneBgm_5);   
        PlayerData.SetOneOffRedPoint(OneOffRedPointId.OffRedPoint_FishOpen);
    }

    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
        EventMgr.emit(Evt_Change_Scene_Bgm);
    }
    private flyFeed(num:number):void{
        let p1:Vec3 = new Vec3(this.selectLakeCont.downBtn.node.worldPosition.x,this.selectLakeCont.downBtn.node.worldPosition.y);
        let p2:Vec3 = new Vec3(this.lakeCont.feedCont.worldPosition.x, this.lakeCont.feedCont.worldPosition.y, 0);
        let c1:Vec3;
        let c2:Vec3;
        
        num = num > 4 ? 4 : num;
        for (let index = 0; index < num; index++) {
            let angle = randomf(index * 360 / num, (index + 1) * 360 / num);
            let r = randomf(100, 150);// 随机散开半径
            let rx = p1.x + r * Math.cos(angle);
            let ry = p1.y + r * Math.sin(angle);
            c1 = new Vec3(p1.x - randomI(200, 100), p1.y + randomI(400, 300), p1.z);
            c2 = new Vec3(p2.x - randomI(100, 50), p2.y - randomI(200, 100), p2.z);
            this.creatFlyNode(index * randomf(0.1, 0.05), new Vec3(rx, ry), c1, c2, p2);
        }
    }
    private creatFlyNode(delay:number, p1:Vec3, c1:Vec3, c2:Vec3, p2:Vec3):void{
        let feedNode: Node;
        if (this.feedFlyPool.size() > 0) {
            feedNode = this.feedFlyPool.get();
        } else {
            feedNode = instantiate(this.feedFlyTemp);   
        }
        this.node.addChild(feedNode);
        feedNode.active = true;
        feedNode.worldPosition = p1;
        BezierTween3(feedNode, 1, p1, c1, c2, p2, delay, () => {
            this.feedFlyPool.put(feedNode);
            this.lakeCont.PlayFeedEffect();
            AudioMgr.playSound(FishSoundInfo[FishSoundId.Fish_3], false);
            console.log(`播放钓鱼音效---->` + FishSoundInfo[FishSoundId.Fish_3]);
        });
    }
    private updateRoundState(isNewRound:boolean = false, isInit:boolean = false):void{
        let state:FishRoundState = PlayerData.GetFishRoundState;
        
        if(!isNewRound && this.curRoundState == state) return;
        this.icedModel.node.active = false;  
        this.unschedule(this.showRod);
        this.unschedule(this.showResult);
        let oldState:number = this.curRoundState;
        let isStart:boolean = oldState == FishRoundState.No && state != FishRoundState.No;
        this.curRoundState = state;
        switch(this.curRoundState){
            case FishRoundState.Select:
                console.log("回合状态---->已选择湖泊")
                this.lakeCont.onShow(FishRoundState.Select);
                this.selectLakeCont.onShow(FishRoundState.Select);
                this.noneCont.onHide();
                this.operateCont.onHide();
                this.resultCont.onHide();
                break;
            case FishRoundState.LiftRod:
                if(this.isInit){
                    this.showRod();
                }else{
                    
                    this.selectLakeCont.UpdateIcedTips("暴风雪快来了");
                    this.scheduleOnce(()=>{
                        this.selectLakeCont.UpdateIcedTips("暴风雪来了");
                    }, 2);
                    this.scheduleOnce(this.showRod, 9);
                    this.playIcedEffect();
                    
                }
                
                break;
            case FishRoundState.Settle:
                if(this.isInit){
                    this.lakeCont.onShow(FishRoundState.Settle);
                    this.resultCont.onShow(FishRoundState.Settle);
                    this.selectLakeCont.onHide();
                    this.noneCont.onHide();
                    this.operateCont.onHide();
                }else{
                    let data:SFishingSettlementData = PlayerData.fishData.settlement;
                    this.lakeCont.PlayRoleAnim("Charge");
                    if(data && !data.is_miss){
                        //this.operateCont.UpdateTips("棒极了");
                        this.selectLakeCont.UpdateIcedTips("棒极了");
                        AudioMgr.playSound(FishSoundInfo[FishSoundId.Fish_7], false);
                        console.log(`播放钓鱼音效---->` + FishSoundInfo[FishSoundId.Fish_7]);
                        this.lakeCont.PlayGetFishAnim(()=>{
                            if(this.curRoundState == FishRoundState.Settle){
                                this.lakeCont.PlayRoleAnim("Win");
                                this.scheduleOnce(this.showResult, 1);
                                
                            }
                        });
                    }else{
                        AudioMgr.playSound(FishSoundInfo[FishSoundId.Fish_8], false);
                        console.log(`播放钓鱼音效---->` + FishSoundInfo[FishSoundId.Fish_8]);
                        //this.operateCont.UpdateTips("鱼跑了");
                        this.selectLakeCont.UpdateIcedTips("鱼跑了");
                        this.lakeCont.PlayRoleAnim(PlayerData.FishMyLakeIsIced ? "icelost" : "lost");
                        this.scheduleOnce(this.showResult, 1);
                    }
                    
                }
                
                
                break;
            case FishRoundState.NoSelect:
                console.log("回合状态---->未选择湖泊")
                this.lakeCont.onShow(FishRoundState.NoSelect);
                this.selectLakeCont.onShow(FishRoundState.NoSelect);
                this.operateCont.onHide();
                this.noneCont.onHide(isStart);
                this.resultCont.onHide();
                break;
            case FishRoundState.NoFishing:
                console.log("回合状态---->未参加垂钓")
                this.lakeCont.onShow(FishRoundState.NoFishing);
                this.selectLakeCont.onShow(FishRoundState.NoFishing);
                this.operateCont.onHide();
                this.noneCont.onHide();
                this.resultCont.onHide();
                break;
            default:
                console.log("回合状态---->未开始")
                this.noneCont.onShow(FishRoundState.No);
                this.selectLakeCont.onShow(FishRoundState.No);
                this.lakeCont.onHide();
                this.operateCont.onHide();
                this.resultCont.onHide();
                break;
        }
    }
    private async playIcedEffect():Promise<void>{
        this.icedModel.node.active = true;
        this.icedModel.skeletonData = null;
        let icedEfeectName:string = "mg_icewarning";
        if(PlayerData.CurFishRoundInfo && PlayerData.CurFishRoundInfo.kill_type > 1){
            icedEfeectName = "mg_icewarning_hell";
        }
        this.icedModel.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/effect", icedEfeectName, "mg_icewarning"), sp.SkeletonData);
        this.icedModel.setAnimation(0, "warning", false);
        this.icedModel.setCompleteListener(() => {
            if(this.icedModel.animation == "blizzard"){
                this.icedModel.node.active = false;
            }else{
                this.selectLakeCont.PlayIcedEffect(true);
                this.icedModel.setAnimation(0, "blizzard", false);
            }
            
        });
    }
    private showRod():void{
        if(this.curRoundState != FishRoundState.LiftRod)return;
        this.lakeCont.onShow(FishRoundState.LiftRod);
        //this.operateCont.onShow(FishRoundState.LiftRod);
        //this.selectLakeCont.onHide();
        this.resultCont.onHide();
        this.noneCont.onHide();
        console.log("回合状态---->提杆");
    }
    private showResult():void{
        this.lakeCont.onShow(FishRoundState.Settle);
        this.resultCont.onShow(FishRoundState.Settle);
        this.selectLakeCont.onHide();
        this.noneCont.onHide();
        this.operateCont.onHide();
        console.log("回合状态---->结算")
    }
    private sendTime:number = 1;
    protected update(dt: number): void {
        if(this.curRoundState == FishRoundState.No){
            //防止未加入钓鱼就开着界面等活动开时，到时间主动请求加入
            if(PlayerData.fishData && PlayerData.fishData.session_info){
                if(PlayerData.GetServerTime() >= PlayerData.fishData.session_info.start_time){
                    if(this.sendTime > 0){
                        this.sendTime -= dt;
                    }
                    if(this.sendTime <= 0){
                        this.sendTime = 1;
                        this.initSendData();
                    }
                }
            }
        }else{
            this.sendTime = 1;
            let curRoundInfo:SFishingRoundInfo = PlayerData.CurFishRoundInfo;
            if(!curRoundInfo) return;
            let residueTime:number = Math.max(Math.floor(curRoundInfo.end_time - PlayerData.GetServerTime()), 0);
            if(residueTime <= 0 && PlayerData.fishData.session_info.start_time > PlayerData.GetServerTime()){
                this.updateRoundState(true);
            }
            
        }
    }
    private onShowGame():void{
        this.initSendData();
    }
    private onFishDataUpdate():void{
        if(!this.node.activeInHierarchy) return;
        let topUrl:string = "generalTopBg";
        if(PlayerData.CurFishRoundInfo && PlayerData.CurFishRoundInfo.kill_type > 1){
            topUrl = "hellTopBg";
        }
        topUrl = path.join("sheets/fishing", topUrl, "spriteFrame");
        ResMgr.LoadResAbSub(topUrl, SpriteFrame, res => {
            this.topBg.spriteFrame = res;
        });
        let newRoundId:number = 0;
        let newFeedVal:number = PlayerData.fishData && PlayerData.fishData.player ? PlayerData.fishData.player.round_cost : 0;
        if(newFeedVal > 0){
            let addVal = newFeedVal - this.curFeedVal;
            if(addVal) this.flyFeed(addVal);
        }
        this.curFeedVal = newFeedVal;
        if(PlayerData.fishData && PlayerData.fishData.player){
            newRoundId = PlayerData.fishData.round;
            let set:number = CfgMgr.GetFishConvertNum(CfgMgr.GetFishCommon.CostItemID);
            this.poolValLab.string = formatNumber(PlayerData.fishData.rank_reward_pool/set, 2);
            this.vitValLab.string = PlayerData.fishData.player.fatigue.toString();
            
        }else{
            this.poolValLab.string = "0";
            this.vitValLab.string = "0";
            this.icedModel.node.active = false;
        }
        
        this.updateRoundState(newRoundId != this.curRoundId, this.isInit);
        this.isInit = false;
        this.curRoundId = newRoundId;
    }
    private onItemUpdate():void{
        if(!this.node.activeInHierarchy) return;
        let feedNum:number = PlayerData.GetItemCount(CfgMgr.GetFishCommon.CostItemID);
        this.feedValLab.string = feedNum.toString();
        let yuPiaoNum:number = PlayerData.GetItemCount(CfgMgr.GetFishCommon.ScoreItemId);
        this.fishTicketLab.string = yuPiaoNum.toString();
    }
    
    private initSendData():void{
        this.curRoundState = null;
        this.curRoundId = 0;
        Session.Send({type: MsgTypeSend.FishingJoin, data:{}});
        Session.Send({type: MsgTypeSend.FishingGetPlayerData, data:{}});
    }
    
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.addBtn:
                FishingFeedBuyPanel.Show();
                break;
            case this.shopBtn:
                FishingShopPanel.Show(1);
                break;
            case this.rankBtn:
            case this.poolBtn:
                FishingLuckyPoolPanel.Show();
                break;
            case this.logBtn:
                FishingLogPanel.Show();
                break;
            case this.gbaBtn:
                FishingTipsPanel.Show();
                break;
        }
    }
    
    
}