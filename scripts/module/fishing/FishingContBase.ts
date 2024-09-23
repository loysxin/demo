import { Component } from "cc";
import { FishRoundState } from "../../manager/CfgMgr";

export class FishingContBase extends Component {
    protected curRoundState:FishRoundState;
    protected isInit: boolean;
    onShow(state:number):void{
        this.node.active = true;
        this.curRoundState = state;
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