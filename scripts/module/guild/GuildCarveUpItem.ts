import { Button, Component, Label, Slider, Sprite, Node, UITransform} from "cc";
import { ConsumeItem } from "../common/ConsumeItem";
import { HeadItem } from "../common/HeadItem";
import { SGuildMember } from "../roleModule/PlayerData";
export class GuildCarveUpItem extends Component {
    private head:HeadItem;
    private nameLab: Label;
    private postIcon:Sprite;
    private leftBtn:Button;
    private slider:Slider;
    private sliderBar:Node;
    private rightBtn:Button;
    private consumeItem:ConsumeItem;
    private btn:Button;
    private isInit:boolean = false;
    private data:any;
    private maxNum:number;
    private curNum:number = 1;
    protected onLoad(): void {
        this.head = this.node.getChildByName("head").addComponent(HeadItem);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.postIcon = this.node.getChildByName("postIcon").getComponent(Sprite);
        this.leftBtn = this.node.getChildByPath("sliderCont/leftBtn").getComponent(Button);
        this.slider = this.node.getChildByPath("sliderCont/slider").getComponent(Slider);
        this.sliderBar = this.node.getChildByPath("sliderCont/slider/sliderBar");
        this.rightBtn = this.node.getChildByPath("sliderCont/rightBtn").getComponent(Button);
        this.consumeItem = this.node.getChildByName("consumeItem").addComponent(ConsumeItem);
        this.slider.node.on('slide', this.onSlide, this);
        this.btn = this.node.getChildByName("btn").getComponent(Button);
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.leftBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.rightBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.isInit = true;
        
        this.updateShow();
    }
    
    SetData(data:SGuildMember) {
        this.data = data;
        this.updateShow();
    }
    private onBtnClick(btn:Button):void{
        
    }
    private onSlide(event: Slider) {
        let tempNum:number = Math.ceil(event.progress * this.maxNum);
        if(tempNum > this.maxNum) tempNum = this.maxNum;
        this.curNum = tempNum;
        this.changeSlidePro(2);
        
    }
    private changeSlidePro(type:number):void{
        if(type == 0){
            if(this.curNum > 1){
                this.curNum --;
            }else{
                return;
            }
        }else if(type == 1){
            if(this.curNum < this.maxNum){
                this.curNum ++;
            }else{
                return;
            }
        }
        this.slider.progress = this.maxNum < 1 ? 0 : this.curNum / this.maxNum;
        this.updateItemCount();
        let barTrans = this.sliderBar.getComponent(UITransform);
        let sliderTrans = this.slider.getComponent(UITransform);
        barTrans.setContentSize(this.slider.progress * sliderTrans.width, barTrans.height);
    }
    private updateItemCount():void{

    }
    private updateShow():void{
        if(!this.isInit || !this.data) return;
       
    }
}