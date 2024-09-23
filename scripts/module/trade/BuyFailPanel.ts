import { Button, Label } from "cc";
import { Panel } from "../../GameRoot";
import { TradePanel } from "./TradePanel";
import { SOrderData } from "../roleModule/PlayerData";
import { BuyPanel } from "./BuyPanel";
import { RoleMsgPanel } from "./RoleMsgPanel";

export class BuyFailPanel extends Panel {
    protected prefab: string = "prefabs/panel/Trade/BuyFailPanel";
    private updateBtn: Button;
    
    private tittle:Label;
    private lbl:Label;
    protected onLoad() {
        this.CloseBy("mask");
        this.CloseBy("spriteFrame/Close");   
        this.updateBtn = this.find("spriteFrame/updateBtn", Button);     
        this.tittle = this.find("spriteFrame/tittle", Label);   
        this.lbl = this.find("spriteFrame/lbl", Label);    
        this.updateBtn.node.on("click", this.onUpdate, this);
    }

    protected onShow(): void {
    }

    async flush(err_type:number, data: SOrderData) {
        let str = ""
        let tittle = ""
        if(err_type == 117){
            tittle = "物品不足"
            str = "由于他人抢购，货物不足，请重新选择想要购买的物品数量！";
        }else{
            tittle = "订单不足"
            str = "由于别人已抢先出售，订单数量不足，请重新选择想要出售的订单";
        }
        this.tittle.string = tittle
        this.lbl.string = str;
    }

    private onUpdate() {
        BuyPanel.Hide();
        RoleMsgPanel.Hide();
        TradePanel.ins.SendSessionView();
        this.Hide()
    }
    
    protected onHide(...args: any[]): void {
        // TradePanel.ins.sendSessionView();
    }

}