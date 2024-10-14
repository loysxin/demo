import { Node, Toggle} from "cc";
import { GuildContBase } from "./GuildContBase";
import { AutoScroller } from "../../utils/AutoScroller";
import { GuildRankItem } from "./GuildRankItem";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_GuildRankUpdate } from "../../manager/EventMgr";
import { SGuild } from "../roleModule/PlayerData";

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
    private rankDataMap:{[key:string]:SGuild[]};
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
        this.noneListCont.active = true;
        this.rankList.UpdateDatas([]);
        this.rankDataMap = null;
        EventMgr.on(Evt_GuildRankUpdate, this.onRankUpdate, this);
        Session.Send({ type: MsgTypeSend.GuildGetRankingList, 
            data: {
                count: 100,
            } 
        });
        this.navBtns[this.page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[this.page].getComponent(Toggle));
    }
    onHide(): void {
        super.onHide();
        EventMgr.off(Evt_GuildRankUpdate, this.onRankUpdate, this);
    }
    private onRankUpdate(rankMap:{[key:string]:SGuild[]}):void{
        this.rankDataMap = rankMap;
        this.updateSelect();
    }
    
    private onPage(t: Toggle):void{
        
        if (!t.isChecked) return;
        let page = this.navBtns.indexOf(t.node);
        if (page < 0 || page == this.page) return;
        this.page = page;
        this.updateSelect();
        
    }
    private updateSelect():void{
        let list:SGuild[] = [];
        let key:string = (this.page + 1).toString();
        if(this.rankDataMap && this.rankDataMap[key]){
            list = this.rankDataMap[key]||[];
        }
        this.noneListCont.active = list.length < 1;
        this.rankList.UpdateDatas(list);
    }
    protected updateRankItem(item: Node, data: SGuild, index:number) {
        let rankItem = item.getComponent(GuildRankItem);
        if (!rankItem) rankItem = item.addComponent(GuildRankItem);
        rankItem.SetData(data, index);
    }
}