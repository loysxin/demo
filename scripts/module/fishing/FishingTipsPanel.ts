import { Button, Label, PageView } from "cc";
import { Panel } from "../../GameRoot";

export class FishingTipsPanel extends Panel {
    protected prefab: string = "prefabs/panel/fishing/FishingTipsPanel";
    private pageView:PageView;
    private leftBtn:Button;
    private rightBtn:Button;
    private numLab:Label;
    private curNum:number;
    private maxNum:number;
    protected onLoad(): void {
        this.pageView = this.find("PageView").getComponent(PageView);
        this.numLab = this.find("numLab", Label);
        this.leftBtn = this.find("leftBtn", Button);
        this.rightBtn = this.find("rightBtn", Button);
        this.leftBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.rightBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.CloseBy("mask");
        this.CloseBy("closeBtn");
        
        this.pageView.node.on(PageView.EventType.PAGE_TURNING, this.onPageChange, this);
    }
    public flush(...args: any[]): void {
        this.curNum = 1;
        this.maxNum = this.pageView.getPages().length;
        this.toPage(this.curNum);
    }

    protected onShow(): void {
    }

    protected onHide(...args: any[]): void {
    }
    private onPageChange():void{
        this.curNum = this.pageView.getCurrentPageIndex() + 1;
        this.toPage(this.curNum);
    }
    private onBtnClick(btn:Button):void{
        switch (btn) {
            case this.leftBtn:
                if(this.curNum > 1) this.curNum --;
                break;
            case this.rightBtn:
                if(this.curNum < this.maxNum) this.curNum ++;
                break;
        }
        this.toPage(this.curNum);
    }
    private toPage(page:number):void{
        this.numLab.string = `${this.curNum}/${this.maxNum}`;
        console.log(this.pageView.getPages().length)
        this.pageView.scrollToPage(page - 1);
    }
    
}