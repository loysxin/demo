import { Component, Label, sp, Vec3, Node, tween, UITransform } from "cc";
import PlayerData from "../roleModule/PlayerData";
import { DateUtils } from "../../utils/DateUtils";
import { FishingContBase } from "./FishingContBase";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";

export class FishingNoneCont extends FishingContBase {
    private cont:Node;
    private actTimeLab:Label;
    private isSend:boolean = false;
    protected onLoad(): void {
        this.cont = this.node.getChildByName("cont");
        this.actTimeLab = this.node.getChildByPath("cont/actTimeLab").getComponent(Label);
        //this.bodyModel = this.node.getChildByName("bodyModel").getComponent(sp.Skeleton);
        this.isInit = true;
        this.initShow();
    }
    onShow(state: number): void {
        this.isSend = false;
        super.onShow(state);
    }
    onHide(isEffect:boolean = false): void {
        if(isEffect){
            let trans = this.cont.getComponent(UITransform);
            tween(this.cont)
            .to(1, { position: new Vec3(0, trans.height, 0) })
            .call(()=>{
                super.onHide();
            })
            .start()
        }else{
            super.onHide();
        }
        
    }
    
    protected update(dt: number): void {
        if(PlayerData.fishData && PlayerData.fishData.session_info){
            let residueTime:number = Math.max(Math.floor(PlayerData.fishData.session_info.start_time - PlayerData.GetServerTime()), 0);
            this.actTimeLab.string = "开启剩余时间：" + DateUtils.FormatTime(residueTime, "%{hh}:%{mm}:%{ss}");
            if(residueTime <= 0 && !this.isSend){
                this.isSend = true;
                this.initSendData();
            }
        }else{
            this.actTimeLab.string = "活动未开启";
        }
    }
    private initSendData():void{
        Session.Send({type: MsgTypeSend.FishingJoin, data:{}});
        Session.Send({type: MsgTypeSend.FishingGetPlayerData, data:{}});
    }
    private onFishDataUpdate():void{
        //this.initShow();
    }
    
    protected updateCont(): void {
        this.cont.position = new Vec3(0, 0, 0);
    }
}