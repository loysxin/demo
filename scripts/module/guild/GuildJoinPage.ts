import { EditBox, Slider, Node, Button, Label } from "cc";
import { GuildContBase } from "./GuildContBase";
import { AutoScroller } from "../../utils/AutoScroller";
import { GuildJoinItem } from "./GuildJoinItem";
import { SGuild } from "../roleModule/PlayerData";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_GuildSearch } from "../../manager/EventMgr";
import { MsgPanel } from "../common/MsgPanel";

/**
 * 加入公会页
 */
export class GuildJoinPage extends GuildContBase {
    private inputName:EditBox;
    private seekBtn:Button;
    private refreshBtn:Button;
    private guildList:AutoScroller;
    private noneListCont:Node;
    private defDatas:SGuild[];
    private seekDatas:SGuild[];
    protected onLoad(): void {
        this.inputName = this.node.getChildByPath("seekCont/inputName").getComponent(EditBox);
        this.seekBtn = this.node.getChildByPath("seekCont/seekBtn").getComponent(Button);
        this.refreshBtn = this.node.getChildByPath("seekCont/refreshBtn").getComponent(Button);
        this.guildList = this.node.getChildByName("guildList").getComponent(AutoScroller);
        this.noneListCont = this.node.getChildByName("noneListCont");
        this.guildList.SetHandle(this.updateGuildJoinItem.bind(this));
        this.refreshBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.seekBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        //输入框焦点bug
        this.scheduleOnce(()=>{
            this.inputName.node.hasChangedFlags = this.inputName.node.hasChangedFlags + 1;
            this.inputName.update();
        })
        super.onLoad();
        EventMgr.on(Evt_GuildSearch, this.onGuildGetList, this);
    }
    onShow(): void {
        super.onShow();
        this.getGuildList();
    }
    onHide(): void {
        super.onHide();
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.refreshBtn:
                Session.Send({type: MsgTypeSend.GuildRecommendedList, data:{count:10}});
                break;
            case this.seekBtn:
                let seekStr:string = this.inputName.string;
                if(seekStr == ""){
                    MsgPanel.Show("请先输入要搜索的公会名称或id");
                    return;
                }
                let reg = new RegExp(/^[+-]?\d+(\.\d+)?$/);
                if(reg.test(seekStr)){
                    Session.Send({type: MsgTypeSend.GuildSearchByID, data:{guild_id_list:[seekStr]}});
                }else{
                    Session.Send({type: MsgTypeSend.GuildSearchByName, data:{count:10, name:seekStr}});
                }
                break;
        }
    }
    protected updateCont(): void {
        this.updateGuildList(true);
    }
    private updateGuildList(isDef:boolean):void{
        let datas:SGuild[] = [];
        if(isDef){
            datas = this.defDatas;
        }else{
            datas = this.seekDatas;
        }
        if(datas && datas.length > 0){
            this.guildList.UpdateDatas(datas);
            this.noneListCont.active = false;
        }else{
            this.guildList.UpdateDatas([]);
            this.noneListCont.active = true;
        }
    }
    private onGuildGetList(datas:SGuild[], isDef:boolean):void{
        if(isDef){
            this.defDatas = datas;
        }else{
            this.seekDatas = datas;
        }
        this.updateGuildList(isDef);
       
    }
    private getGuildList():void{
        if(!this.defDatas || this.defDatas.length < 1){
            Session.Send({type: MsgTypeSend.GuildRecommendedList, data:{count:10}});
        }
    }
    protected updateGuildJoinItem(item: Node, data: SGuild) {
        let joinItem = item.getComponent(GuildJoinItem);
        if (!joinItem) joinItem = item.addComponent(GuildJoinItem);
        joinItem.SetData(data);
    }
    
}