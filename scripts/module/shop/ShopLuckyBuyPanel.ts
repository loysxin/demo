import { Button, RichText } from "cc";
import { Panel } from "../../GameRoot";
import { ConsumeItem } from "../common/ConsumeItem";
import { StdLuckyShop } from "../../manager/CfgMgr";
import { ItemUtil } from "../../utils/ItemUtils";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";

export class ShopLuckyBuyPanel extends Panel {
    protected prefab: string = "prefabs/panel/shop/ShopLuckyBuyPanel";
    private tipsLab:RichText;
    private buyBtn:Button;
    private buyConsumeItem:ConsumeItem;
    private std:StdLuckyShop;
    private offsetCont:number;
    private count:number;
    private newItemNum:number[];
    protected onLoad() {
        this.tipsLab = this.find("tipsLab").getComponent(RichText);
        this.buyBtn = this.find("buyBtn", Button);
        this.buyConsumeItem = this.find("buyBtn/buyConsumeItem").addComponent(ConsumeItem);
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
        this.buyBtn.node.on(Button.EventType.CLICK, this.onBtnBuyClick, this);
    }
    protected onShow(): void {
        
    }
    protected onHide(...args: any[]): void {
        
    }
    
    public flush(std:StdLuckyShop, count:number, offsetCont:number): void {
        this.std = std;
        this.count = count;
        this.offsetCont = offsetCont;
        this.newItemNum = [];
        if(this.std.shopStd.ConvertToConsumeCost){
            for (const val of this.std.shopStd.ConvertToConsumeCost) {
                this.newItemNum.push(val * this.offsetCont);
            }
        }
        let item = ItemUtil.CreateThing(this.std.shopStd.ConsumeX1Type[0], this.std.shopStd.ConsumeX1ItemId[0], this.std.shopStd.ConsumeX1Cost[0]);
        let consume = ItemUtil.CreateThing(this.std.shopStd.ConvertToConsumeType[0], this.std.shopStd.ConvertToConsumeItemId[0], this.newItemNum[0]);
        let tipsStr:string = `<color=#AD4800><size=48>${item.resData.name}</size></color>数量不足\n是否消耗<color=#36B13A>${consume.resData.count + consume.resData.name}</color>购买<color=#AD4800><size=48>${this.offsetCont}个${item.resData.name}</size></color>`;
        this.tipsLab.string = tipsStr;
        
        this.buyConsumeItem.SetData(consume);
    }
    onBtnBuyClick(btn: Button) {
        if(!ItemUtil.CheckThingConsumes(this.std.shopStd.ConvertToConsumeType, this.std.shopStd.ConvertToConsumeItemId, this.newItemNum, true)){
            return;
        }
        Session.Send({type: MsgTypeSend.ShopDoLucky, data:{shop_index_id:this.std.shopId, count:this.count, convert_count:this.offsetCont}});
        this.Hide();
    }
    
}