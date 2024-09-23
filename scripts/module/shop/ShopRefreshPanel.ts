import { Button, RichText, RichTextComponent } from "cc";
import { Panel } from "../../GameRoot";
import { StdShop } from "../../manager/CfgMgr";
import { SThing } from "../roleModule/PlayerData";
import { ItemUtil } from "../../utils/ItemUtils";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";

export class ShopRefreshPanel extends Panel {
    protected prefab: string = "prefabs/panel/shop/ShopRefreshPanel";
    private okBtn:Button;
    private noBtn:Button;
    private contLab:RichText;
    private stdShop:StdShop;
    private shopId:number;
    protected onLoad() {
        this.contLab = this.find("contLab", RichTextComponent);
        this.okBtn = this.find("okBtn", Button);
        this.noBtn = this.find("noBtn", Button);
        
        this.okBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.noBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
    }
    protected onShow(): void {
        
    }
    protected onHide(...args: any[]): void {
        
    }
    
    public async flush(stdShop:StdShop, shopId:number): Promise<void> {
        this.stdShop = stdShop;
        this.shopId = shopId;
        let things:SThing[] = ItemUtil.GetSThingList(this.stdShop.RefreshThingType, this.stdShop.RefreshThingId, this.stdShop.RefreshThingCount);
        let itemName:string = "";
        for (let index = 0; index < things.length; index++) {
            let item = things[index];
            itemName += `<color=#AD4800><size=48>${item.resData.name} * ${item.resData.count}</size></color>`;
            if(index < things.length - 1){
                itemName += "、";
            }   
        }
        this.contLab.string = `是否消耗${itemName}马上刷新商店?`;
        
    }
    onBtnClick(btn: Button) {
        switch (btn) {
            case this.okBtn:
                if(!ItemUtil.CheckThingConsumes(this.stdShop.RefreshThingType, this.stdShop.RefreshThingId, this.stdShop.RefreshThingCount, true)){
                    return;
                }
                Session.Send({type: MsgTypeSend.ShopManualRefresh, data:{shop_index_id:this.shopId}});
                break;
            case this.noBtn:
               
                break;
        }
        this.Hide();
    }
    
}