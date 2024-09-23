import { Node, Toggle} from "cc";
import { GuildContBase } from "./GuildContBase";
import { AutoScroller } from "../../utils/AutoScroller";
import { GuildRankItem } from "./GuildRankItem";

enum GuildRankTabType {
    Page_DianTang,//殿堂级
    Page_RongYao,//荣耀级
    Page_Level,//等级
};
/**
 * 公会排行
 */
export class GuildRankPage extends GuildContBase {
    private navBtns:Node[];
    private noneListCont:Node;
    private rankList:AutoScroller;

    private page:GuildRankTabType;
    protected onLoad(): void {
        this.noneListCont = this.node.getChildByName("noneListCont");
        this.rankList = this.node.getChildByName("rankList").getComponent(AutoScroller);
        this.rankList.SetHandle(this.updateRankItem.bind(this));
        this.navBtns = this.node.getChildByPath("navBar/view/content").children.concat();
        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }
        this.page = GuildRankTabType.Page_DianTang;
        super.onLoad();
    }
    onShow(): void {
        super.onShow();
        
        this.navBtns[this.page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[this.page].getComponent(Toggle));
    }
    onHide(): void {
        super.onHide();
    }
    
    protected updateCont(): void {
        
    }
    private onPage(t: Toggle):void{
        
        if (!t.isChecked) return;
        let page = this.navBtns.indexOf(t.node);
        if (page < 0 || page == this.page) return;
        this.page = page;
        switch (page) {
            case GuildRankTabType.Page_DianTang: 
                
                break;
            case GuildRankTabType.Page_RongYao:
               
                break;
            case GuildRankTabType.Page_Level: 
                
                break;
        }
        
    }
    protected updateRankItem(item: Node, data: any) {
        let rankItem = item.getComponent(GuildRankItem);
        if (!rankItem) rankItem = item.addComponent(GuildRankItem);
        rankItem.SetData(data);
    }
}