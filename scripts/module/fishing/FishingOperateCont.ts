import { Button, Component, Label, Node, Rect, RichText, sp, Tween, tween, UITransform, Vec3 } from "cc";
import { FishingContBase } from "./FishingContBase";
import PlayerData, { SFishingRoundInfo } from "../roleModule/PlayerData";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { CfgMgr } from "../../manager/CfgMgr";
import { randomf } from "../../utils/Utils";
import { SetNodeGray } from "../common/BaseUI";
import { AudioMgr, FishSoundId, FishSoundInfo } from "../../manager/AudioMgr";

export class FishingOperateCont extends FishingContBase {
    private timeLab:Label;
    private tipsLab:RichText;
    private btn:Button;
    private fishBody:sp.Skeleton;
    private bar:Node;
    private cursor:Node;
    private cursorBox:Node;
    private cursorBoxTrans:UITransform;
    private proBarTrans:UITransform;
    private barTrans:UITransform;
    private isClick:boolean = false;
    protected onLoad(): void {
        this.tipsLab = this.node.getChildByPath("tipsCont/tipsLab").getComponent(RichText);
        this.timeLab = this.node.getChildByName("timeLab").getComponent(Label);
        this.fishBody = this.node.getChildByPath("topCont/fishBody").getComponent(sp.Skeleton);
        this.btn = this.node.getChildByName("btn").getComponent(Button);
        let proBar = this.node.getChildByName("proBar");
        this.cursor = this.node.getChildByPath("proBar/cursor");
        this.cursorBox = this.node.getChildByPath("proBar/cursor/cursorBox");
        this.bar = this.node.getChildByPath("proBar/bar");
        this.proBarTrans = proBar.getComponent(UITransform);
        this.barTrans = this.bar.getComponent(UITransform);
        this.cursorBoxTrans = this.cursorBox.getComponent(UITransform);
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.isInit = true;
        this.initShow();

    }
    protected update(dt: number): void {
        let curRoundInfo:SFishingRoundInfo = PlayerData.CurFishRoundInfo;
        if(!curRoundInfo) return;
        let residueTime:number = Math.floor(curRoundInfo.settlement_time - PlayerData.GetServerTime());
        if(residueTime < 1)this.onBtnClick();
        this.timeLab.string = Math.max(residueTime, 0).toString();
    }
    private onBtnClick():void{
        if(this.isClick) return;
        this.isClick = true;
        AudioMgr.playSound(FishSoundInfo[FishSoundId.Fish_6], false);
        console.log(`播放钓鱼音效---->` + FishSoundInfo[FishSoundId.Fish_6]);
        Tween.stopAllByTarget(this.cursor);
        let barBox:Rect = this.barTrans.getBoundingBoxToWorld();
        let cursorBoxBox:Rect = this.cursorBoxTrans.getBoundingBoxToWorld();
        let isIntersect: boolean = barBox.intersects(cursorBoxBox);
        SetNodeGray(this.btn.node, true, true);
        SetNodeGray(this.bar, true, true);
        Session.Send({type: MsgTypeSend.FishingTieRod, data:{is_hit:isIntersect}});
    }
    onShow(state: number): void {
        this.isClick = false;
        Tween.stopAllByTarget(this.cursor);
        super.onShow(state);
    }
    onHide():void{
        super.onHide();
        Tween.stopAllByTarget(this.cursor);
    }
    UpdateTips(str:string):void{
        this.tipsLab.string = str;
    }
    protected updateCont(): void {
        SetNodeGray(this.btn.node, true, true);
        SetNodeGray(this.bar, true, true);
        let curRoundInfo:SFishingRoundInfo = PlayerData.CurFishRoundInfo;
        if(!curRoundInfo) return;
        if(PlayerData.fishData && PlayerData.fishData.player && PlayerData.fishData.player.is_hit){
            return;
        }
        if(PlayerData.GetServerTime() >= curRoundInfo.settlement_time){
            Tween.stopAllByTarget(this.cursor);
            return;
        }
        SetNodeGray(this.btn.node, false, true);
        SetNodeGray(this.bar, false, true);
        let lakeData = PlayerData.GetLakeData(PlayerData.fishData.player.lake_id);
        let rote:number = lakeData && lakeData.is_frozen ? CfgMgr.GetFishCommon.FrozenOperateRote : CfgMgr.GetFishCommon.OperateRote;
        let barW:number = this.proBarTrans.contentSize.width * rote;
        this.barTrans.width = barW;
        let startRandomX:number = -((this.proBarTrans.contentSize.width - this.barTrans.width) / 2);
        let barPos = new Vec3(randomf(startRandomX, Math.abs(startRandomX)), 0, 0);
        this.bar.position = barPos;
        this.UpdateTips("有鱼上钩了！\n点击 <color=#31AD00>提杆</color> 到绿色区域");
        let startX:number = -this.proBarTrans.contentSize.width / 2;
        let endX:number = Math.abs(startX);
        let oleY:number = this.cursor.position.y;
        let speed:number = CfgMgr.GetFishCommon.FishTagSpeed;
        this.cursor.position = new Vec3(startX, oleY, 0);
        tween(this.cursor)
        .to(speed, { position: new Vec3(endX, oleY, 0) })
        .to(speed, { position: new Vec3(startX, oleY, 0) })
        .union()
        .repeatForever()
        .start()
    }
    
}