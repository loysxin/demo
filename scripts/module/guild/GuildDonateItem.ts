import { Button, Component, Label, Sprite, SpriteFrame, UITransform} from "cc";
import { ConsumeItem } from "../common/ConsumeItem";
export class GuildDonateItem extends Component {
    private nameLab: Label;
    private itemIcon:Sprite;
    private itemNumLab:Label;
    private consumeItem:ConsumeItem;
    private btn:Button;
    private isInit:boolean = false;
    private data:any;
    protected onLoad(): void {
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.itemIcon = this.node.getChildByName("itemIcon").getComponent(Sprite);
        this.itemNumLab = this.node.getChildByName("itemNumLab").getComponent(Label);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.consumeItem = this.node.getChildByName("consumeItem").addComponent(ConsumeItem);
        this.btn = this.node.getChildByName("btn").getComponent(Button);
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.isInit = true;
        
        this.updateShow();
    }
    
    SetData(data:any,) {
        this.data = data;
        this.updateShow();
    }
    private onBtnClick(btn:Button):void{
        
    }
    private updateShow():void{
        if(!this.isInit || !this.data) return;
       
    }
}