import { Button, Label, Node, path, RichText,sp,Sprite, SpriteFrame, Tween, tween, Vec3} from "cc";
import { FishingContBase } from "./FishingContBase";
import PlayerData, { SFishingItem, SFishingRoundInfo, SFishingSettlementData } from "../roleModule/PlayerData";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { CfgMgr, StdFishItem, StdLake } from "../../manager/CfgMgr";
import { AudioMgr, FishSoundId, FishSoundInfo } from "../../manager/AudioMgr";
import { formatNumber } from "../../utils/Utils";

export class FishingResultCont extends FishingContBase {
    private tipsCont:Node;
    private bottomBg:Sprite;
    private roleModel:sp.Skeleton;
    private tipsGetCont:Node;
    private tipsLab:Label;
    private nonTipsLab:Label;
    private tipsFishIcon:Sprite;
    private icedCont:Node;
    private icedTipsGetCont:Node;
    private icedTipsLab:Label;
    private icedNonTipsLab:Label;
    private icedTipsFishIcon:Sprite;
    private winCont:Node;
    private weightLab:Label;
    private winFeedLab:Label;
    private winLakeLab:Label;
    private fishItem:Node;
    private winEffect:sp.Skeleton;
    private fishIcon:Sprite;
    private fishNumLab:Label;
    private fishNameLab:Label;
    private vitItem:Node;
    private winVitNumLab:Label;

    private failCont:Node;
    private failLakeLab:Label;
    private vitLabLab:Label;
    private failFeedLab:Label;
    private billItem:Node;
    private billNumLab:Label;
    protected onLoad(): void {
        this.bottomBg = this.node.getChildByName("bottomBg").getComponent(Sprite);
        this.roleModel = this.node.getChildByPath("topCont/roleModel").getComponent(sp.Skeleton);
        this.tipsCont = this.node.getChildByName("tipsCont");
        this.tipsGetCont = this.node.getChildByPath("tipsCont/getCont");
        this.tipsLab = this.node.getChildByPath("tipsCont/getCont/tipsLab").getComponent(Label);
        this.tipsFishIcon = this.node.getChildByPath("tipsCont/getCont/fishIcon").getComponent(Sprite);
        this.nonTipsLab = this.node.getChildByPath("tipsCont/nonTipsLab").getComponent(Label);
        
        this.icedCont = this.node.getChildByName("icedCont");
        this.icedTipsGetCont = this.node.getChildByPath("icedCont/getCont");
        this.icedTipsLab = this.node.getChildByPath("icedCont/getCont/tipsLab").getComponent(Label);
        this.icedTipsFishIcon = this.node.getChildByPath("icedCont/getCont/fishIcon").getComponent(Sprite);
        this.icedNonTipsLab = this.node.getChildByPath("icedCont/nonTipsLab").getComponent(Label);
        this.winCont = this.node.getChildByName("winCont");
        this.weightLab = this.node.getChildByPath("winCont/weightLab").getComponent(Label);
        this.winFeedLab = this.node.getChildByPath("winCont/feedLab").getComponent(Label);
        this.winLakeLab = this.node.getChildByPath("winCont/lakeLab").getComponent(Label);
        this.fishItem = this.node.getChildByPath("winCont/fishItem");
        this.fishIcon = this.node.getChildByPath("winCont/fishItem/icon").getComponent(Sprite);
        this.fishNumLab = this.node.getChildByPath("winCont/fishItem/numLab").getComponent(Label);
        this.fishNameLab = this.node.getChildByPath("winCont/fishItem/nameLab").getComponent(Label);
        this.winEffect = this.node.getChildByPath("winCont/winEffect").getComponent(sp.Skeleton);
        this.vitItem = this.node.getChildByPath("winCont/vitItem");
        this.winVitNumLab = this.node.getChildByPath("winCont/vitItem/numLab").getComponent(Label);

        this.failCont = this.node.getChildByName("failCont");
        this.failLakeLab = this.node.getChildByPath("failCont/lakeLab").getComponent(Label);
        this.vitLabLab = this.node.getChildByPath("failCont/vitLab").getComponent(Label);
        this.failFeedLab = this.node.getChildByPath("failCont/feedLab").getComponent(Label);
        this.billItem = this.node.getChildByPath("failCont/billItem");
        this.billNumLab = this.node.getChildByPath("failCont/billItem/numLab").getComponent(Label);

        
        this.isInit = true;
        this.initShow();
        
    }
    
    private onBtnClick():void{
        
    }
    private updateResult():void{
        let bottomUrl:string = "generalBottomBg";
        if(PlayerData.CurFishRoundInfo && PlayerData.CurFishRoundInfo.kill_type > 1){
            bottomUrl = "hellBottomBg";
        }
        bottomUrl = path.join("sheets/fishing", bottomUrl, "spriteFrame");
        ResMgr.LoadResAbSub(bottomUrl, SpriteFrame, res => {
            this.bottomBg.spriteFrame = res;
        });
        if(!PlayerData.fishData) return; 
        let data:SFishingSettlementData = PlayerData.fishData.settlement;
        if(!data)return;
        let stdLake:StdLake = CfgMgr.GetStdLake(PlayerData.fishData.player.lake_id);
        this.winLakeLab.string = stdLake.Lakesname;
        this.failLakeLab.string = stdLake.Lakesname;
        this.roleModel.node.active = true;
        this.tipsFishIcon.node.active = false;
        this.icedTipsFishIcon.node.active = false;
        //成功
        if(!data.is_miss){
            AudioMgr.playSound(FishSoundInfo[FishSoundId.Fish_9], false);
            console.log(`播放钓鱼音效---->` + FishSoundInfo[FishSoundId.Fish_9]);
            this.icedTipsGetCont.active = true;
            this.icedNonTipsLab.node.active = false;
            this.tipsGetCont.active = true;
            this.nonTipsLab.node.active = false;
            this.winCont.active = true;
            this.winEffect.node.active = true;
            this.winEffect.setAnimation(0, "result_1", false);
            this.winEffect.setCompleteListener(()=>{
                this.winEffect.node.active = false;
            });
            this.fishItem.setScale(0.5, 0.5);
            this.vitItem.setScale(0.5, 0.5);
            tween(this.fishItem)
            .to(0.3, { scale: new Vec3(1, 1, 0) }, {
                easing: "backOut",                                         
            })
            .start();

            tween(this.vitItem)
            .to(0.3, { scale: new Vec3(1, 1, 0) }, {
                easing: "backOut",                                         
            })
            .start();
            let fishItemData:SFishingItem = data.fish_items[0];
            let stdFishItem:StdFishItem = CfgMgr.GetFishItem(fishItemData.fish_id);
            let url = path.join(folder_icon, `fish/${stdFishItem.Icon}`, "spriteFrame");
            ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                this.fishIcon.node.active = true;
                this.fishIcon.spriteFrame = res;
            });
            ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                this.tipsFishIcon.node.active = true;
                this.tipsFishIcon.spriteFrame = res;
            });
            ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                this.icedTipsFishIcon.node.active = true;
                this.icedTipsFishIcon.spriteFrame = res;
            });
            this.fishNameLab.string = stdFishItem.Fishsname;
            this.fishNumLab.string = "1";
            this.weightLab.string = formatNumber(fishItemData.weight, 2);
            this.winFeedLab.string = formatNumber(fishItemData.weight, 2);
            this.winVitNumLab.string = data.fatigue_get.toString();
            this.icedTipsLab.string = `${stdFishItem.Fishsname}`;
            this.tipsLab.string = `${stdFishItem.Fishsname}`;
            this.roleModel.setAnimation(0, "Win", true);
        }else{
            //失败
            this.failCont.active = true;
            this.billItem.setScale(0.5, 0.5);
            tween(this.billItem)
            .to(0.3, { scale: new Vec3(1, 1, 0) }, {
                easing: "backOut",                                         
            })
            .start();
            this.vitLabLab.string = data.fatigue_lose.toString();
            this.failFeedLab.string = data.cost_lose.toString();
            this.billNumLab.string = data.fish_score_get.toString();
            this.icedTipsGetCont.active = false;
            this.icedNonTipsLab.node.active = true;
            this.tipsGetCont.active = false;
            this.nonTipsLab.node.active = true;
            this.roleModel.setAnimation(0, PlayerData.FishMyLakeIsIced ? "icelost" : "lost", true);
        }
    }
    protected updateCont(): void {
        this.winCont.active = false;
        this.failCont.active = false;
        this.tipsCont.active = false;
        this.icedCont.active = false;
        this.roleModel.node.active = false;
        
        Tween.stopAllByTarget(this.fishItem); 
        Tween.stopAllByTarget(this.vitItem); 
        Tween.stopAllByTarget(this.billItem); 
        this.fishItem.setScale(1, 1);
        this.vitItem.setScale(1, 1);
        this.billItem.setScale(1, 1);
        let isIced:boolean = PlayerData.FishMyLakeIsIced;
        if(isIced){
            this.icedCont.active = true;
        }else{
            this.tipsCont.active = true;
        }
        this.updateResult()
    }
}