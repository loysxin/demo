import { Button, Component, EditBox, EventHandler, EventTouch, Input, Label, Layout, Node, ScrollView, Sprite, SpriteFrame, Toggle, find, instantiate, path, sp, tween, view } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { SFriendSortType} from "../roleModule/PlayerData";
import { Second } from "../../utils/Utils";

export class CurrencyIncomSortPanel extends Panel {
    protected prefab: string = "prefabs/panel/currencyIncomInfo/CurrencyIncomSortPanel";
    
    private content:Node;
    private currency_type:number = 2
    private callBcak:Function;
    private sort_type:number;
    private pageSize:number = 15;
    protected onLoad() {
        this.CloseBy("mask");
        this.CloseBy("panel/closeBtn");
        this.content = this.find("panel/sortList/content")
    }
  
    protected onShow(): void {
        
    }

    async flush(sort_type:number, currency_type:number, page_size:number, callback:Function) {
        Second(0)
        this.sort_type = sort_type;
        this.currency_type = currency_type;
        this.pageSize = page_size
        this.callBcak = callback;
        this.content.children[this.sort_type].getComponent(Toggle).isChecked = true;
    }

    private onSend(type){
        if(this.sort_type == type){
            return;
        }else{
            this.sort_type = type;
            let data = {
                type:MsgTypeSend.QueryThingRecordsRequest,
                data:{count_filter:this.sort_type, type1:this.currency_type, page_size:this.pageSize, page:1,}
            }
            Session.Send(data);
        }
    }
 
    protected onHide(...args: any[]): void {
        let select_type = 0;
        let children = this.content.children
        for (let index = 0; index < children.length; index++) {
            const element = children[index];
            if(element.getComponent(Toggle).isChecked){
                select_type = index;
                break;
            }
        } 
        if(this.callBcak && this.sort_type != select_type){
            this.callBcak(select_type);
            this.callBcak = undefined; 
        }
       this.onSend(select_type);
    }
  
}