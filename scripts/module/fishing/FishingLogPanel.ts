import { Node, Toggle } from "cc";
import { Panel } from "../../GameRoot";
import { FishingIcedLogPage } from "./FishingIcedLogPage";
import { FishingLogPage } from "./FishingLogPage";
import { FishingPoolLogPage } from "./FishingPoolLogPage";
import { EventMgr, Evt_FishLogDataUpdate } from "../../manager/EventMgr";
import { SFishingLogData } from "../roleModule/PlayerData";

export class FishingLogPanel extends Panel {
    protected prefab: string = "prefabs/panel/fishing/FishingLogPanel";
    private navBtns:Node[];
    private fishingLogPage:FishingLogPage;
    private icedLogPage:FishingIcedLogPage;
    private poolLogPage:FishingPoolLogPage;
    private noneListCont:Node;
    private page: number;
    protected onLoad(): void {
        this.noneListCont = this.find("noneListCont");
        this.navBtns = this.find("navBar/view/content").children.concat();
        this.fishingLogPage = this.find("fishingLogPage").addComponent(FishingLogPage);
        this.icedLogPage = this.find("fishingIcedLogPage").addComponent(FishingIcedLogPage);
        this.poolLogPage = this.find("fishingPoolLogPage").addComponent(FishingPoolLogPage);
        this.CloseBy("mask");
        this.CloseBy("closeBtn");
        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }
        EventMgr.on(Evt_FishLogDataUpdate, this.onFishDataLogUpdate, this);
    }
    public async flush(...args: any[]): Promise<void> {
        
        this.page = -1;
        this.SetPage(0);
        
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
    private onPage(t: Toggle):void{
        if (!t.isChecked) return;
        let page = this.navBtns.indexOf(t.node);
        if (page < 0 || page == this.page) return;
        this.page = page;
        this.fishingLogPage.onHide();
        this.icedLogPage.onHide();
        this.poolLogPage.onHide();
        switch (page) {
            case 0: //钓鱼记录
                this.fishingLogPage.onShow();
                break;
            case 1: //冰封记录
                this.icedLogPage.onShow();
                break;
            case 2: // 奖池记录
            this.poolLogPage.onShow();
                break;
        }
    }
    private onFishDataLogUpdate(logData:SFishingLogData):void{
        if(!this.node.activeInHierarchy) return;
        
        let isNone:boolean = false;
        switch (this.page) {
            case 0: //钓鱼记录
                isNone = !logData || !logData.player_records || logData.player_records.length < 1;
                break;
            case 1: //冰封记录
                isNone = !logData || !logData.frozen_lake_record || logData.frozen_lake_record.length < 1;
                break;
            case 2: // 奖池记录
            this.poolLogPage.onShow();
                isNone = !logData || !logData.rank_settlement_record || logData.rank_settlement_record.length < 1;
                break;
        }
        this.noneListCont.active = isNone;
    }
}