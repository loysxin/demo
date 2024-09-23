import { Button, Component, Label, SpriteFrame, UITransform} from "cc";
import { HeadItem } from "../common/HeadItem";
export class GuildAuditItem extends Component {
    private head:HeadItem;
    private consentBtn:Button;
    private refuseBtn:Button;
    private nameLab: Label;
    private lvLab: Label;
    private fightLab:Label;
    private isInit:boolean = false;
    private data:any;
    protected onLoad(): void {
        this.head = this.node.getChildByName("head").getComponent(HeadItem);
        this.consentBtn = this.node.getChildByName("consentBtn").getComponent(Button);
        this.refuseBtn = this.node.getChildByName("refuseBtn").getComponent(Button);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.lvLab = this.node.getChildByName("lvLab").getComponent(Label);
        this.fightLab = this.node.getChildByName("fightLab").getComponent(Label);
        this.consentBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.refuseBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.isInit = true;
        
        this.updateShow();
    }
    
    SetData(data:any,) {
        this.data = data;
        this.updateShow();
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.consentBtn:
                break;
            case this.refuseBtn:
                break;
        }
    }
    private updateShow():void{
        if(!this.isInit || !this.data) return;
       
    }
}