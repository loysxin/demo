import { EditBox, Slider, Node, Button, Label, Sprite, path, SpriteFrame, UITransform, Toggle, RichText } from "cc";
import { GuildContBase } from "./GuildContBase";
import { AutoScroller } from "../../utils/AutoScroller";
import { ConsumeItem } from "../common/ConsumeItem";
import { CfgMgr, StdGuildComm, StdGuildLogo } from "../../manager/CfgMgr";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { ItemUtil } from "../../utils/ItemUtils";
import PlayerData, { SGuildAnnouncement, SGuildJoinCriteria, SPlayerDataBuilding, SThing } from "../roleModule/PlayerData";
import { MsgPanel } from "../common/MsgPanel";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { GuildCreatPanel } from "./GuildCreatPanel";
import { SetNodeGray } from "../common/BaseUI";
import { BuildingType } from "../home/HomeStruct";

/**
 * 公会创建页
 */
export class GuildCreatPage extends GuildContBase {
    private inputName: EditBox;
    private logoList:AutoScroller;
    private needApplyBtn:Button;
    private noApplyBtn:Button;
    private applyLab:Label;
    private leftBtn:Button;
    private slider:Slider;
    private sliderBar:Node;
    private rightBtn:Button;
    private numLab:Label;
    private inputNotice:EditBox;
    private btn:Button;
    private condLab:RichText;
    private logoDatas:StdGuildLogo[];
    private selectLogoData:StdGuildLogo;
    private stdGuildComm:StdGuildComm;
    private maxLv:number;
    private curLv:number = 1;
    private applyState:number = 0;
    protected onLoad(): void {
        this.inputName = this.node.getChildByName("inputName").getComponent(EditBox);
        this.logoList = this.node.getChildByName("logoList").getComponent(AutoScroller);
        this.applyLab = this.node.getChildByPath("ToggleGroup/applyLab").getComponent(Label);
        this.needApplyBtn = this.node.getChildByPath("ToggleGroup/needApplyBtn").getComponent(Button);
        this.noApplyBtn  = this.node.getChildByPath("ToggleGroup/noApplyBtn").getComponent(Button);
        this.leftBtn = this.node.getChildByPath("sliderCont/leftBtn").getComponent(Button);
        this.slider = this.node.getChildByPath("sliderCont/slider").getComponent(Slider);
        this.sliderBar = this.node.getChildByPath("sliderCont/slider/sliderBar");
        this.rightBtn = this.node.getChildByPath("sliderCont/rightBtn").getComponent(Button);
        this.numLab = this.node.getChildByPath("sliderCont/numLab").getComponent(Label);
        this.condLab = this.node.getChildByName("condLab").getComponent(RichText);
        this.inputNotice = this.node.getChildByName("inputNotice").getComponent(EditBox);
        this.btn = this.node.getChildByName("btn").getComponent(Button);
        this.logoList.SetHandle(this.updateLogoItem.bind(this));
        this.logoList.node.on('select', this.onLogoSelect, this);
        this.logoList.SelectFirst();
        super.onLoad();
        
        //输入框焦点bug
        this.scheduleOnce(()=>{
            this.inputName.node.hasChangedFlags = this.inputName.node.hasChangedFlags + 1;
            this.inputName.update();
            this.inputNotice.node.hasChangedFlags = this.inputNotice.node.hasChangedFlags + 1;
            this.inputNotice.update();
            
        });
        this.logoDatas = CfgMgr.GetGuildLogoList();
        this.logoList.UpdateDatas(this.logoDatas);
        this.stdGuildComm = CfgMgr.GetGuildComm();
        
        this.maxLv = CfgMgr.GetHomeMaxLv();

        this.needApplyBtn.node.on(Button.EventType.CLICK, this.onToggleChange, this);
        this.noApplyBtn.node.on(Button.EventType.CLICK, this.onToggleChange, this);
        this.slider.node.on('slide', this.onSlide, this);
        this.leftBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.rightBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);

        this.condLab.string = `生命树等级<color=#CA1D1D>${CfgMgr.GetGuildComm().CreateGuildMinHomeLevel}级</color>可创建公会`;
    }
    onShow(): void {
        super.onShow();
        this.onToggleChange(this.noApplyBtn);
    }
    onHide(): void {
        super.onHide();
    }
    private onToggleChange(btn:Button):void{
        if(this.needApplyBtn == btn){
            this.applyState = 1;
            SetNodeGray(this.needApplyBtn.node, true);
            SetNodeGray(this.noApplyBtn.node, false);
            
        }else{
            this.applyState = 0;
            SetNodeGray(this.needApplyBtn.node, false);
            SetNodeGray(this.noApplyBtn.node, true);
        }
        this.applyLab.string = this.applyState == 1 ? "需要验证" : "不需要验证";
    }
    private onSlide(event: Slider) {
        let tempNum:number = Math.ceil(event.progress * this.maxLv);
        if(tempNum > this.maxLv) tempNum = this.maxLv;
        this.curLv = Math.max(tempNum, 1);
        this.changeSlidePro(2);
        
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.btn:
                let homeBuilds:SPlayerDataBuilding[] = PlayerData.GetBuildingByType(BuildingType.ji_di, 101);
                if(homeBuilds[0].level < CfgMgr.GetGuildComm().CreateGuildMinHomeLevel){
                    MsgPanel.Show("家园等级不足");
                    return;
                }
                let guildName:string = this.inputName.string;
                if(guildName == ""){
                    MsgPanel.Show("公会名称不能为空");
                    return;
                }
                if(guildName.length < this.stdGuildComm.NameMinLen){
                    MsgPanel.Show(`公会名称不得小于${this.stdGuildComm.NameMinLen}个字符`);
                    return;
                }
                if(guildName.length > this.stdGuildComm.NameMaxLen){
                    MsgPanel.Show(`公会名称不得大于${this.stdGuildComm.NameMaxLen}个字符`);
                    return;
                }
                let notice:string = this.inputNotice.string;
                if(notice.length > this.stdGuildComm.AnnouncementMaxLen){
                    MsgPanel.Show(`公告内容不得大于${this.stdGuildComm.AnnouncementMaxLen}个字符`);
                    return;
                }
                let announcement: SGuildAnnouncement = {content:notice};
                let join_criteria:SGuildJoinCriteria = {min_home_level:this.curLv, need_applications:this.applyState};
                GuildCreatPanel.Show(guildName, this.selectLogoData.ID, announcement, join_criteria);
                break;
            case this.leftBtn:
                this.changeSlidePro(0);
                break;
            case this.rightBtn:
                this.changeSlidePro(1);
                break;
        }
    }
    private changeSlidePro(type:number):void{
        if(type == 0){
            if(this.curLv > 2){
                this.curLv --;
            }else{
                return;
            }
        }else if(type == 1){
            if(this.curLv < this.maxLv){
                this.curLv ++;
            }else{
                return;
            }
        }
        this.slider.progress = this.maxLv < 1 ? 0 : this.curLv / this.maxLv;
        this.numLab.string = this.curLv.toString();
        let barTrans = this.sliderBar.getComponent(UITransform);
        let sliderTrans = this.slider.getComponent(UITransform);
        barTrans.setContentSize(this.slider.progress * sliderTrans.width, barTrans.height);
    }
    protected updateCont(): void {
        this.changeSlidePro(2);
        this.onToggleChange(null);
    }
    private resetSelect():void{
        let children:Node[] = this.logoList.node.getChildByPath("view/content").children;
        for (let i = 0; i < children.length; i++) {
            let node:Node = children[i];
            node.getChildByName("select").active = false;
        }
    }
    private updateLogoItem(item: Node, data: StdGuildLogo, index:number):void{
        item.getChildByName("select").active = false;
        let icon:Sprite = item.getChildByName("icon").getComponent(Sprite);
        let url = path.join(folder_icon, `guildLogo/${data.Logo}`, "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            icon.spriteFrame = res;
        });
    }
    private onLogoSelect(index: number, item: Node):void{
        this.resetSelect();
        if(item){
            let select:Node = item.getChildByName("select");
            select.active = true;
        }
        this.selectLogoData = this.logoDatas[index];
        
    }
}