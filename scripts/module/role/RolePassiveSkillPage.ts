import { Button, Component, Label, Node, PageView, instantiate } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import { RoleActiveSkillItem } from "./RoleActiveSkillItem";
import PlayerData, { SPlayerDataSkill } from "../roleModule/PlayerData";
import { RolePassiveSkillPageItem } from "./RolePassiveSkillPageItem";
import { CfgMgr } from "../../manager/CfgMgr";
import { Tips } from "../login/Tips";
import { EventMgr, Evt_Passive_Skill_Update, Evt_Role_Upgrade } from "../../manager/EventMgr";


export class RolePassiveSkillPage extends Component {
    private pageView:PageView;
    private pageItem:Node;
    private passiveSkillItem:Node;
    private leftBtn:Button;
    private numLab:Label;
    private rightBtn:Button;
    private isInit:boolean = false;
    private roleId:string;
    private curPage:number = 0;
    private maxPage:number = 0;
    private readonly maxSkillNum:number = 8;
    protected onLoad(): void {
        this.passiveSkillItem = this.node.getChildByName("passiveSkillItem");
        this.pageView = this.node.getChildByName("pageView").getComponent(PageView);
        this.pageItem = this.node.getChildByPath("pageView/view/content/passivePageCont");
        this.leftBtn = this.node.getChildByPath("pageNumCont/leftBtn").getComponent(Button);
        this.numLab = this.node.getChildByPath("pageNumCont/numLab").getComponent(Label);
        this.rightBtn = this.node.getChildByPath("pageNumCont/rightBtn").getComponent(Button);
        this.isInit = true;
        this.leftBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.rightBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.pageView.node.on('page-turning', this.onPage, this);
        this.initShow();
        EventMgr.on(Evt_Passive_Skill_Update, this.onUpdateSkill, this);
    }
    protected onDestroy(): void {
        EventMgr.off(Evt_Passive_Skill_Update, this.onUpdateSkill, this);
    }
    private onUpdateSkill(roleId:string):void{
        if(!this.enabled || !this.node.active || this.roleId != roleId) return;
        let roleData = PlayerData.GetRoleByPid(this.roleId);
        let stdRole = CfgMgr.GetRole()[roleData.type];
        let skillDataList = roleData.passive_skills ? roleData.passive_skills.concat() : [];
        let startIndex:number;
        let endIndex:number; 
        let dataIndexList:number[];
        let pageList:Node[] = this.pageView.getPages();
        for (let index = 0; index < this.maxPage; index++) {
            startIndex = index * this.maxSkillNum;
            endIndex = (index + 1) * this.maxSkillNum - 1;
            dataIndexList = [];
            for (startIndex; startIndex <= endIndex; startIndex++) {
                if(startIndex < skillDataList.length){
                    dataIndexList.push(startIndex);
                }else{
                    if(startIndex < stdRole.PassiveMAX){
                        dataIndexList.push(-1);
                    }else{
                        dataIndexList.push(-2);
                    }
                }
            }
            let pageNode:Node = pageList[index];
            let pageCom:RolePassiveSkillPageItem = pageNode.getComponent(RolePassiveSkillPageItem);
            pageCom.SetData(this.roleId, dataIndexList, this.passiveSkillItem);
        }
    }
    /**
     * 设置角色数据
     * @param roleId 
     */
    SetData(roleId: string) {
        this.roleId = roleId;
        this.curPage = 1;
        this.maxPage = 1;
        this.initShow();

    }
    private onPage(pageView: PageView) {
        this.curPage = pageView.curPageIdx + 1;
        this.updatePage();
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.leftBtn:
                if(this.curPage > 1){
                    this.curPage --;
                    this.updatePage();
                }
                break;
            case this.rightBtn:
                if(this.curPage < this.maxPage){
                    this.curPage ++;
                    this.updatePage();
                }
                break;
        }
        
    }
    private updatePage():void{
        this.numLab.string = `${this.curPage}/${this.maxPage}`;
        this.pageView.setCurrentPageIndex(this.curPage - 1);
    }
    private initShow():void {
        if (!this.isInit || !this.roleId) return;
        
        let roleData = PlayerData.GetRoleByPid(this.roleId);
        let stdRole = CfgMgr.GetRole()[roleData.type];
        let skillDataList = roleData.passive_skills ? roleData.passive_skills.concat() : [];
        
        this.maxPage = Math.ceil(stdRole.PassiveMAX / this.maxSkillNum);
        this.pageView.removeAllPages();
        let pageItem:Node;
        let pageCom:RolePassiveSkillPageItem;
        let startIndex:number;
        let endIndex:number;
        let dataList:number[];
        for (let index = 0; index < this.maxPage; index++) {
            startIndex = index * this.maxSkillNum;
            endIndex = (index + 1) * this.maxSkillNum - 1;
            dataList = [];
            for (startIndex; startIndex <= endIndex; startIndex++) {
                if(startIndex < skillDataList.length){
                    dataList.push(startIndex);
                }else{
                    if(startIndex < stdRole.PassiveMAX){
                        dataList.push(-1);
                    }else{
                        dataList.push(-2);
                    }
                    
                    
                }
            }
            pageItem = instantiate(this.pageItem);
            pageCom = pageItem.getComponent(RolePassiveSkillPageItem);
            if (!pageCom) pageCom = pageItem.addComponent(RolePassiveSkillPageItem);
            pageCom.SetData(this.roleId, dataList, this.passiveSkillItem);
            this.pageView.addPage(pageItem);
        }
        this.updatePage();
    }
}