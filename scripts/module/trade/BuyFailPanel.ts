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
        this.tittle.string = "订单不足"
        this.lbl.string = "订单不足，已被他人抢购，请查看其他订单";
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