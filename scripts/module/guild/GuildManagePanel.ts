import { Button, EditBox, Label, Slider, Sprite, Toggle, Node, UITransform, path, SpriteFrame } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { SGuild, SThing } from "../roleModule/PlayerData";
import { AutoScroller } from "../../utils/AutoScroller";
import { ConsumeItem } from "../common/ConsumeItem";
import { CfgMgr, StdGuildComm, StdGuildLogo } from "../../manager/CfgMgr";
import { ItemUtil } from "../../utils/ItemUtils";
import { MsgPanel } from "../common/MsgPanel";
import { Session } from "../../net/Session";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_GuildChange } from "../../manager/EventMgr";

export class GuildManagePanel extends Panel {
    protected prefab: string = "prefabs/panel/guild/GuildManagePanel";
    private logo:Sprite;
    private inputName: EditBox;
    private logoList:AutoScroller;
    private needApply:Toggle;
    private noApply:Toggle;
    private applyLab:Label;
    private leftBtn:Button;
    private slider:Slider;
    private sliderBar:Node;
    private rightBtn:Button;
    private numLab:Label;
    private inputNotice:EditBox;
    private btn:Button;
    private consumeItem:ConsumeItem;
    private logoDatas:StdGuildLogo[];
    private selectLogoData:StdGuildLogo;
    private stdGuildComm:StdGuildComm;
    private maxLv:number;
    private curLv:number = 1;
    private data:SGuild;
    private applyState:number;
    protected onLoad(): void {
        this.logo = this.find("logo", Sprite);
        this.inputName = this.find("inputName").getComponent(EditBox);
        this.logoList = this.find("logoList").getComponent(AutoScroller);
        this.applyLab = this.find("ToggleGroup/applyLab").getComponent(Label);
        this.needApply = this.find("ToggleGroup/Toggle1").getComponent(Toggle);
        this.noApply  = this.find("ToggleGroup/Toggle2").getComponent(Toggle);
        this.leftBtn = this.find("sliderCont/leftBtn").getComponent(Button);
        this.slider = this.find("sliderCont/slider").getComponent(Slider);
        this.sliderBar = this.find("sliderCont/slider/sliderBar");
        this.rightBtn = this.find("sliderCont/rightBtn").getComponent(Button);
        this.numLab = this.find("sliderCont/numLab").getComponent(Label);
        this.inputNotice = this.find("inputNotice").getComponent(EditBox);
        this.btn = this.find("btn").getComponent(Button);
        this.consumeItem = this.find("consumeItem").addComponent(ConsumeItem);
        this.logoList.SetHandle(this.updateLogoItem.bind(this));
        this.logoList.node.on('select', this.onLogoSelect, this);
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
        //输入框焦点bug
        this.scheduleOnce(()=>{
            this.inputName.node.hasChangedFlags = this.inputName.node.hasChangedFlags + 1;
            this.inputName.update();
            this.inputNotice.node.hasChangedFlags = this.inputNotice.node.hasChangedFlags + 1;
            this.inputNotice.update();
            
        });
        this.logoDatas = CfgMgr.GetGuildLogoList();
        
        this.stdGuildComm = CfgMgr.GetGuildComm();
        let consumeList:SThing[] = ItemUtil.GetSThingList(this.stdGuildComm.RenameCostType, this.stdGuildComm.RenameCostID, this.stdGuildComm.RenameCostCount);
        this.consumeItem.SetData(consumeList[0]);
        this.maxLv = CfgMgr.GetHomeMaxLv();

        this.needApply.node.on(Toggle.EventType.TOGGLE, this.onToggleChange, this);
        this.noApply.node.on(Toggle.EventType.TOGGLE, this.onToggleChange, this);
        this.slider.node.on('slide', this.onSlide, this);
        this.leftBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.rightBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
    }
    public flush(): void{
        this.data = PlayerData.MyGuild;
        this.updateShow();
    }
    
    protected onShow(): void {
        EventMgr.on(Evt_GuildChange, this.onGuildChange, this);
    }

    protected onHide(...args: any[]): void {
        EventMgr.on(Evt_GuildChange, this.onGuildChange, this);
    }
    private onGuildChange():void{
        if(!PlayerData.MyGuild){
            this.Hide();
            return;
        }
    }
    private updateShow():void{
        this.inputName.string = this.data.name;
        this.inputNotice.string = this.data.announcement.content;
        this.slider.progress = this.data.join_criteria.min_home_level / this.maxLv;
        this.selectLogoData = this.logoDatas.find((std:StdGuildLogo)=>{return std.ID == Number(this.data.logo)});
        if(this.data.join_criteria.no_criteria > 0){
            this.needApply.isChecked = true;
            this.applyState = 1;
        }else{
            this.noApply.isChecked = true;
            this.applyState = 0;
        }
        this.curLv = this.data.join_criteria.min_home_level;
        this.changeSlidePro(2);
        this.updateCurrLogo();
        this.logoList.UpdateDatas(this.logoDatas);
    }
    private onToggleChange(toggle:Toggle):void{
        if(this.needApply.isChecked){
            this.applyLab.string = "需要验证";
            this.applyState = 1;
        }else{
            this.applyLab.string = "不需要验证";
            this.applyState = 0;
        } 
    }
    private onSlide(event: Slider) {
        let tempNum:number = Math.ceil(event.progress * this.maxLv);
        if(tempNum > this.maxLv) tempNum = this.maxLv;
        this.curLv = tempNum;
        this.changeSlidePro(2);
        
    }
    private onBtnClick(btn:Button):void{
        let isChange:boolean = false;
        switch(btn){
            case this.btn:
                let guildName:string = this.inputName.string;
                if(this.data.name != guildName){
                    isChange = true;
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
                    
                    if (!ItemUtil.CheckThingConsumes(this.stdGuildComm.RenameCostType, this.stdGuildComm.RenameCostID, this.stdGuildComm.RenameCostCount, true)) {
                        return;
                    }
                }
                let notice:string = this.inputNotice.string;
                if(notice != this.data.announcement.content){
                    isChange = true;
                    if(notice.length > this.stdGuildComm.AnnouncementMaxLen){
                        MsgPanel.Show(`公告内容不得大于${this.stdGuildComm.AnnouncementMaxLen}个字符`);
                        return;
                    }
                }
                if(Number(this.data.logo) != this.selectLogoData.ID){
                    isChange = true;
                }
                if(this.data.join_criteria.min_home_level != this.curLv){
                    isChange = true;
                }
                if(this.data.join_criteria.no_criteria != this.applyState){
                    isChange = true;
                }
                if(!isChange){
                    MsgPanel.Show("公会信息未发生任何改变");
                    return;
                }
                Session.Send({ type: MsgTypeSend.GuildCreate, 
                    data: {
                        name: guildName,
                        logo: this.selectLogoData.ID.toString(),
                        announcement:{content:notice},
                        join_criteria:{min_home_level:this.curLv, no_criteria:this.needApply.isChecked ? 1 : 0},
                    } 
                });
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
            if(this.curLv > 1){
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
   
    private resetSelect():void{
        let children:Node[] = this.logoList.node.getChildByPath("view/content").children;
        for (let i = 0; i < children.length; i++) {
            let node:Node = children[i];
            node.getChildByName("select").active = false;
        }
    }
    private updateLogoItem(item: Node, data: StdGuildLogo, index:number):void{
        item.getChildByName("select").active = data.ID == this.selectLogoData.ID;
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
        this.updateCurrLogo();
    }
    private updateCurrLogo():void{
        let url = path.join(folder_icon, `guildLogo/${this.selectLogoData.Logo}`, "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            this.logo.spriteFrame = res;
        });
    }
}