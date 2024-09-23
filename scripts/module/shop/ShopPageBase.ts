import { Component } from "cc";
import { StdShopGroup } from "../../manager/CfgMgr";
import { EventMgr, Evt_ShopUpdate } from "../../manager/EventMgr";

export class ShopBasePage extends Component {
    protected data:StdShopGroup;
    protected shopId:number;
    protected isInit:boolean = false;
    protected onLoad(): void {
        this.isInit = true;
        this.initShow();
        this.initOnShow();
        EventMgr.on(Evt_ShopUpdate, this.onShopUpdate, this);
    }

    protected initShow():void{
        if(!this.isInit || !this.data) return;
        this.UpdateShow();
    }
    
    onShow():void{
        this.node.active = true;
        this.initShow();
        this.initOnShow();
    }
    
    onHide():void{
        this.node.active = false;
    }

    SetData(data:StdShopGroup):void{
        this.data = data;
        this.initShow();
    }

    protected onShopUpdate():void{
        if(!this.node.activeInHierarchy) return;
        this.initShow();
    }

    protected UpdateShow():void{
        
    }

    protected initOnShow():void{
        if(!this.isInit) return;
        this.updateOnShow();
    }

    protected updateOnShow():void{
        
    }
}