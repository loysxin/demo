import { Label, Node, Toggle } from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_Currency_Updtae, Evt_Item_Change } from "../../manager/EventMgr";
import PlayerData from "../roleModule/PlayerData";
import { CfgMgr } from "../../manager/CfgMgr";
import { ToFixed, formatK, formatNumber } from "../../utils/Utils";
import { FishingShopPage } from "./FishingShopPage";
import { FishingSellPage } from "./FishingSellPage";

export class FishingShopPanel extends Panel {
    protected prefab: string = "prefabs/panel/fishing/FishingShopPanel";
    private navBtns:Node[];
    private rainbowNumLab:Label;
    private yuPiaoNumLab:Label;
    private fishingShopPage:FishingShopPage;
    private fishingSellPage:FishingSellPage;
    private page: number;
    protected onLoad(): void {
        this.rainbowNumLab = this.find("rainbowItem/numLab").getComponent(Label);
        this.yuPiaoNumLab = this.find("yuPiaoItem/numLab").getComponent(Label);
        this.navBtns = this.find("navBar/view/content").children.concat();
        this.fishingShopPage = this.find("shopPage").addComponent(FishingShopPage);
        this.fishingSellPage = this.find("sellPage").addComponent(FishingSellPage);
        this.CloseBy("mask");
        this.CloseBy("closeBtn");
        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }
    
        EventMgr.on(Evt_Item_Change, this.onItemUpdate, this);
        EventMgr.on(Evt_Currency_Updtae, this.onCurrencyUpdate, this);
    }
    public async flush(...args: any[]): Promise<void> {
        
        this.page = -1;
        this.SetPage(0);
        this.onCurrencyUpdate();
        this.onItemUpdate();
    }
    
    protected onShow(): void {
        
    }

    protected onHide(...args: any[]): void {

    }

    async SetPage(page: number) {
        if (!this.$hasLoad) await this.initSub;
        if (!this.navBtns[page]) return;
        this.page = undefined;
        this.navBtns[page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[page].getComponent(Toggle));
    }
    private onCurrencyUpdate():void{
        this.rainbowNumLab.string = ToFixed(PlayerData.roleInfo.currency, 2) + "";
    }
    private onItemUpdate():void{
        let yuPiaoNum:number = PlayerData.GetItemCount(CfgMgr.GetFishCommon.ScoreItemId);
        this.yuPiaoNumLab.string = yuPiaoNum.toString();

    }
    private onPage(t: Toggle):void{
        if (!t.isChecked) return;
        let page = this.navBtns.indexOf(t.node);
        if (page < 0 || page == this.page) return;
        this.page = page;
        this.fishingShopPage.onHide();
        this.fishingSellPage.onHide();
        switch (page) {
            case 0: //商店
                this.fishingShopPage.onShow();
                break;
            case 1: //出售
                this.fishingSellPage.onShow();
                break;
        }
    }
}