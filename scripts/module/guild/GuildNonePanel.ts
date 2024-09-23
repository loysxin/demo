import { Node, Toggle } from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import { GuildCreatPage } from "./GuildCreatPage";
import { GuildJoinPage } from "./GuildJoinPage";
import { GuildRankPage } from "./GuildRankPage";

enum GuildNoneTabType {
    Page_GuildCreat,//创建公会
    Page_GuildJoin,//加入公会
    Page_GuildRank,//公会排行
};
export class GuildNonePanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildNonePanel";
    private creatPage:GuildCreatPage;
    private joinPage:GuildJoinPage;
    private rankPage:GuildRankPage;
    private navBtns:Node[];
    private page:GuildNoneTabType;
    protected onLoad(): void {
        this.creatPage = this.find("creatPage").addComponent(GuildCreatPage);
        this.joinPage = this.find("joinPage").addComponent(GuildJoinPage);
        this.rankPage = this.find("rankPage").addComponent(GuildRankPage);
        this.navBtns = this.find("navBar/view/content").children.concat();
        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }
        this.CloseBy("backBtn");
    }
    public flush(page:GuildNoneTabType): void{
        this.page = undefined;
        if(page == undefined){
            page = GuildNoneTabType.Page_GuildCreat;
        }
        this.navBtns[page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[page].getComponent(Toggle));
    }
    
    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
    }

    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }
    
    private onPage(t: Toggle):void{
        
        if (!t.isChecked) return;
        let page = this.navBtns.indexOf(t.node);
        if (page < 0 || page == this.page) return;
        this.page = page;
        this.creatPage.onHide();
        this.joinPage.onHide();
        this.rankPage.onHide();
        switch (page) {
            case GuildNoneTabType.Page_GuildCreat: 
                this.creatPage.onShow();
                break;
            case GuildNoneTabType.Page_GuildJoin:
                this.joinPage.onShow();
                break;
            case GuildNoneTabType.Page_GuildRank: 
                this.rankPage.onShow();
                break;
        }
        
    }
    
}