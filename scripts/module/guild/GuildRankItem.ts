import { Button, Component, Label, Sprite } from "cc";

export class GuildRankItem extends Component {
    private logo:Sprite;
    private lvLab: Label;
    private nameLab: Label;
    private memberLab: Label;
    private noticeLab:Label;
    private presidentNameLab:Label;
    private condLab:Label;
    private applyBtn:Button;
    private applyBtnLab:Label;
    private checkBtn:Button;
    private isInit:boolean = false;
    private data:any;
    protected onLoad(): void {
        this.logo = this.node.getChildByName("logo").getComponent(Sprite);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.lvLab = this.node.getChildByName("lvLab").getComponent(Label);
        this.memberLab = this.node.getChildByName("memberLab").getComponent(Label);
        this.noticeLab = this.node.getChildByName("noticeLab").getComponent(Label);
        this.presidentNameLab = this.node.getChildByName("presidentNameLab").getComponent(Label);
        this.condLab = this.node.getChildByName("presidentNameLab").getComponent(Label);
        this.applyBtn = this.node.getChildByName("applyBtn").getComponent(Button);
        this.applyBtnLab = this.node.getChildByPath("applyBtn/applyBtnLab").getComponent(Label);
        this.checkBtn = this.node.getChildByName("checkBtn").getComponent(Button);
        
        this.applyBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.checkBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        
        this.isInit = true;
        this.updateShow();
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.applyBtn:
                break;
            case this.checkBtn:
                break;
        }
    }
    SetData(data:any,) {
        this.data = data;
        this.updateShow();
    }
    private updateShow():void{
        if(!this.isInit || !this.data) return;
        
    }
}