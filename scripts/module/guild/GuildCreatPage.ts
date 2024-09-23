import { EditBox, Slider, Node, Button, Label, Sprite, path, SpriteFrame, UITransform, Toggle } from "cc";
import { GuildContBase } from "./GuildContBase";
import { AutoScroller } from "../../utils/AutoScroller";
import { ConsumeItem } from "../common/ConsumeItem";
import { CfgMgr, StdGuildComm, StdGuildLogo } from "../../manager/CfgMgr";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { ItemUtil } from "../../utils/ItemUtils";
import { SThing } from "../roleModule/PlayerData";
import { MsgPanel } from "../common/MsgPanel";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";

/**
 * 公会创建页
 */
export class GuildCreatPage extends GuildContBase {
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
    private condLab:Label;
    private consumeItem:ConsumeItem;
    private logoDatas:StdGuildLogo[];
    private selectLogoData:StdGuildLogo;
    private stdGuildComm:StdGuildComm;
    private maxLv:number;
    private curLv:number = 1;
    protected onLoad(): void {
        this.inputName = this.node.getChildByName("inputName").getComponent(EditBox);
        this.logoList = this.node.getChildByName("logoList").getComponent(AutoScroller);
        this.applyLab = this.node.getChildByPath("ToggleGroup/applyLab").getComponent(Label);
        this.needApply = this.node.getChildByPath("ToggleGroup/Toggle1").getComponent(Toggle);
        this.noApply  = this.node.getChildByPath("ToggleGroup/Toggle2").getComponent(Toggle);
        this.leftBtn = this.node.getChildByPath("sliderCont/leftBtn").getComponent(Button);
        this.slider = this.node.getChildByPath("sliderCont/slider").getComponent(Slider);
        this.sliderBar = this.node.getChildByPath("sliderCont/slider/sliderBar");
        this.rightBtn = this.node.getChildByPath("sliderCont/rightBtn").getComponent(Button);
        this.numLab = this.node.getChildByPath("sliderCont/numLab").getComponent(Label);
        this.condLab = this.node.getChildByName("condLab").getComponent(Label);
        this.inputNotice = this.node.getChildByName("inputNotice").getComponent(EditBox);
        this.btn = this.node.getChildByName("btn").getComponent(Button);
        this.consumeItem = this.node.getChildByPath("btn/ConsumeItem").addComponent(ConsumeItem);
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
        let consumeList:SThing[] = ItemUtil.GetSThingList(this.stdGuildComm.CreateCostType, this.stdGuildComm.CreateCostID, this.stdGuildComm.CreateCostCount);
        this.consumeItem.SetData(consumeList[0]);
        this.maxLv = CfgMgr.GetHomeMaxLv();

        this.needApply.node.on(Toggle.EventType.TOGGLE, this.onToggleChange, this);
        this.noApply.node.on(Toggle.EventType.TOGGLE, this.onToggleChange, this);
        this.slider.node.on('slide', this.onSlide, this);
        this.leftBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.rightBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
    }
    onShow(): void {
        super.onShow();
    }
    onHide(): void {
        super.onHide();
    }
    private onToggleChange(toggle:Toggle):void{
        this.applyLab.string = this.needApply.isChecked ? "不需要验证" : "需要验证";
    }
    private onSlide(event: Slider) {
        let tempNum:number = Math.ceil(event.progress * this.maxLv);
        if(tempNum > this.maxLv) tempNum = this.maxLv;
        this.curLv = tempNum;
        this.changeSlidePro(2);
        
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.btn:
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
                if (!ItemUtil.CheckThingConsumes(this.stdGuildComm.CreateCostType, this.stdGuildComm.CreateCostID, this.stdGuildComm.CreateCostCount, true)) {
                    //return;
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