import { Component, Sprite, Node, path, SpriteFrame } from "cc";
import { StdHead, StdHeadType } from "../../manager/CfgMgr";
import { folder_head, folder_head_round, ResMgr } from "../../manager/ResMgr";

export class UserHeadItem extends Component {
    private headBg:Node;
    private frameBg:Node;
    private icon:Sprite;
    private frame:Sprite;
    private lock:Node;
    private select:Node;
    private limt:Node;
    private isInit:boolean = false;
    private std:StdHead;
    protected onLoad(): void {
        this.headBg = this.node.getChildByName("headBg");
        this.frameBg = this.node.getChildByName("frameBg");
        this.icon = this.node.getChildByPath("Mask/icon").getComponent(Sprite);
        this.frame = this.node.getChildByName("frame").getComponent(Sprite);
        this.lock = this.node.getChildByName("lock");
        this.select = this.node.getChildByName("select");
        this.select.active = false;
        this.limt = this.node.getChildByName("limit");
        
        this.isInit = true;
        this.updateShow();
    }
    
    SetData(data:StdHead) {
        this.std = data;
        this.updateShow();
    }
    
    private updateShow():void {
        if(!this.isInit || !this.std) return;
        let headUrl:string;
        if(this.std.HeadType == StdHeadType.Head){
            this.headBg.active = true;
            this.frameBg.active = false;
            this.frame.node.active = false;
            headUrl = path.join(folder_head_round, this.std.IconRes, "spriteFrame");
        }else if(this.std.HeadType == StdHeadType.HeadFrame){
            
            this.headBg.active = false;
            this.frameBg.active = true;
            this.frame.node.active = true;
            headUrl = path.join(folder_head_round, "01", "spriteFrame");
            let frameUrl = path.join(folder_head, `frame/${this.std.IconRes}`, "spriteFrame");
            ResMgr.LoadResAbSub(frameUrl, SpriteFrame, res => {
                this.frame.spriteFrame = res;
            });
        } 
        ResMgr.LoadResAbSub(headUrl, SpriteFrame, res => {
            this.icon.spriteFrame = res;
        });
        this.limt.active = this.std.LimitTime > 0;
        if(this.std.ConditionId && this.std.ConditionId.length){
            this.lock.active = true;
        }else{
            this.lock.active = false;
        }
    }
}