import { Button, Label, Sprite, Toggle, Node, path, SpriteFrame } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { SPlayerData } from "../roleModule/PlayerData";
import LocalStorage from "../../utils/LocalStorage";
import { MsgPanel } from "../common/MsgPanel";
import { UserEditInfoPanel } from "./UserEditInfoPanel";
import { EventMgr, Evt_UserDataChange } from "../../manager/EventMgr";
import { CopyToClip } from "../../Platform";
import { AutoScroller } from "../../utils/AutoScroller";
import { UserHeadItem } from "./UserHeadItem";
import { CfgMgr, StdHead, StdHeadType } from "../../manager/CfgMgr";
import { folder_head, folder_head_round, folder_icon, ResMgr } from "../../manager/ResMgr";
import { DateUtils } from "../../utils/DateUtils";
import { AttrSub, FormatAttr } from "../common/BaseUI";
enum HeadabType {
    Page_Head,//头像页签
    Page_Frame,//头像框页签
};
export class UserHeadPanel extends Panel {
    protected prefab: string = "prefabs/panel/userInfo/UserHeadPanel";
    private headBg:Node;
    private frameBg:Node;
    private icon:Sprite;
    private frame:Sprite;
    private stateLab:Label;
    private nameLab:Label;
    private descLab:Label;
    private attrCont:Node;
    private attrList:AutoScroller;
    private timeLab:Label;
    private headList:AutoScroller;
    private btn:Button;
    private unlockCondLab:Label;
    private navBtns:Node[];
    private page:number;
    private curSelectIndex:number;
    private curSelectData:StdHead;
    private datas:StdHead[] = [];
    protected onLoad(): void {
        this.headBg = this.find("headCont/headBg");
        this.frameBg = this.find("headCont/frameBg");
        this.icon = this.find("headCont/Mask/icon", Sprite);
        this.frame = this.find("headCont/frame", Sprite);
        this.nameLab = this.find("infoCont/headNameCont/nameLab", Label);
        this.descLab = this.find("infoCont/descCont/descLab", Label);
        this.attrCont = this.find("infoCont/attrCont");
        this.attrList = this.find("infoCont/attrCont/attrList", AutoScroller);
        this.attrList.SetHandle(this.updateAttrItem.bind(this));
        this.timeLab = this.find("infoCont/timeCont/timeLab", Label);
        this.headList = this.find("headList", AutoScroller);
        this.headList.SetHandle(this.updateHeadItem.bind(this));
        this.headList.node.on('select', this.onSelect, this);
        this.btn = this.find("btn", Button);
        this.unlockCondLab = this.find("unlockCondLab", Label);

        this.navBtns = this.find("navBar/view/content").children.concat();
        this.CloseBy("mask");
        this.CloseBy("closeBtn");
        for (let btn of this.navBtns) {
            btn.on('toggle', this.onPage, this);
        }
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
    }
    async SetPage(page: number) {
        if (!this.$hasLoad) await this.initSub;
        if (!this.navBtns[page]) return;
        this.page = undefined;
        this.navBtns[page].getComponent(Toggle).isChecked = true;
        this.onPage(this.navBtns[page].getComponent(Toggle));
    }
    public flush(page:number): void {
        if(page == undefined){
            page = HeadabType.Page_Head;
        }
        this.page = undefined;
        this.SetPage(page);
    }
    
    protected onShow(): void {
        
    }

    protected onHide(...args: any[]): void {
       
    }
    protected update(dt: number): void {
        if(!this.curSelectData) return;
        if(this.curSelectData.LimitTime > 0){
            this.timeLab.string = "有效期：" + DateUtils.FormatTime(PlayerData.GetServerTime(), "%{d}天%{h}时%{m}分%{s}秒");
        }else{
            this.timeLab.string = "有效期：永久";
        }
    }
    private onPage(t: Toggle):void{
        if (!t.isChecked) return;
        let page = this.navBtns.indexOf(t.node);
        if (page < 0 || page == this.page) return;
        this.page = page;
        switch (page) {
            case HeadabType.Page_Head:
                this.headBg.active = true;
                this.frameBg.active = false;
                this.frame.node.active = false;
                this.datas = CfgMgr.GetHeadList(StdHeadType.Head);
                break;
            case HeadabType.Page_Frame:
                this.headBg.active = false;
                this.frameBg.active = true;
                this.frame.node.active = true;
                this.datas = CfgMgr.GetHeadList(StdHeadType.HeadFrame);
                break;
        }
        this.curSelectIndex = -1;
        this.headList.UpdateDatas(this.datas);
        this.headList.SelectFirst();
    }
   
    private onBtnClick(btn:Button):void{
        
    }

    private updateHeadItem(item: Node, data: StdHead) {
        let headItem = item.getComponent(UserHeadItem);
        if (!headItem) headItem = item.addComponent(UserHeadItem);
        headItem.SetData(data);
    }
    private updateAttrItem(item: Node, data: AttrSub):void{
        let nameLab:Label = item.getChildByName("nameLab").getComponent(Label);
        nameLab.string = data.name + "：";
        let valLab:Label = item.getChildByName("valueLab").getComponent(Label);
        valLab.string = "+" + data.value + data.per;
    }
    private onSelect(index: number, item: Node) {
        if(this.curSelectIndex == index) return;
        this.resetSelect();
        let select:Node = item.getChildByName("select");
        select.active = true;
        this.curSelectIndex = index;
        this.updateSelect(this.datas[index]);
    }
    private updateSelect(stdHead:StdHead):void{
        this.curSelectData = stdHead;
        let headUrl:string;
        if(stdHead.HeadType == StdHeadType.Head){
            headUrl = path.join(folder_head_round, stdHead.IconRes, "spriteFrame");
        }else if(stdHead.HeadType == StdHeadType.HeadFrame){
            headUrl = path.join(folder_head_round, "01", "spriteFrame");
            let frameUrl = path.join(folder_head, `frame/${stdHead.IconRes}`, "spriteFrame");
            ResMgr.LoadResAbSub(frameUrl, SpriteFrame, res => {
                this.frame.spriteFrame = res;
            });
        } 
        ResMgr.LoadResAbSub(headUrl, SpriteFrame, res => {
            this.icon.spriteFrame = res;
        });
        this.nameLab.string = stdHead.HeadName;
        this.descLab.string = stdHead.HeadDesc;
        let fightAttrs:AttrSub[] = [];
        let attrs:AttrSub[] = [];
        let totlaAttrs:AttrSub[] = [];
        let forAttr = (attrList: number[], valList: number[], attrs:AttrSub[]) => {
            for (let i = 0; i < attrList.length; i++) {
                let type = attrList[i];
                let val = valList && i < valList.length ? valList[i] : 0;
                let attrSub = FormatAttr(type, true);
                attrSub.value = val;
                attrs.push(attrSub);
               
            }
        };
        if (stdHead.Attr.length) {
            forAttr(stdHead.Attr, stdHead.AttrValue, attrs);
        }
        if (stdHead.AttrFight.length) {
            forAttr(stdHead.AttrFight, stdHead.AttrFightValue, fightAttrs);
        }
        
        totlaAttrs = fightAttrs.concat(attrs);
        this.attrCont.active = totlaAttrs.length > 0;
        this.attrList.UpdateDatas(totlaAttrs);
    }
    private resetSelect():void{
        let children:Node[] = this.headList.node.getChildByPath("view/content").children;
        for (let i = 0; i < children.length; i++) {
            let node:Node = children[i];
            node.getChildByName("select").active = false;
        }
    }
}