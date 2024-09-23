import { Component } from "cc";
import { FishRoundState } from "../../manager/CfgMgr";

export class GuildContBase extends Component {
    protected isInit: boolean;
    protected data:any; 
    protected onLoad(): void {
        this.isInit = true;
        this.initShow();
    }
    onShow(data:any = null):void{
        this.data = data;
        this.node.active = true;
        this.initShow();
    }
    onHide():void{
        this.node.active = false;
    }
    protected initShow(): void {
        if (!this.isInit) return;
        this.updateCont();
    }
    protected updateCont():void{

    }
}