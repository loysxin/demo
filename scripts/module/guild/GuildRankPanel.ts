import { Panel } from "../../GameRoot";
import { EventMgr, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import { GuildRankPage } from "./GuildRankPage";

export class GuildRankPanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildRankPanel";
    private rankPage:GuildRankPage;
    protected onLoad(): void {
        this.rankPage = this.find("rankPage").addComponent(GuildRankPage);
        this.CloseBy("backBtn");
    }
    public flush(): void{
        this.rankPage.onShow();
    }
    
    protected onShow(): void {
        this.rankPage.onHide();
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
    }

    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }
    
}