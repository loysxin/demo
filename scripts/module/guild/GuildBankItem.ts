import { Color, Component, Label,  path,  Sprite, SpriteFrame, Node} from "cc";
import { ConsumeItem } from "../common/ConsumeItem";
import { CfgMgr, GuildPostType, GuildSavingsType, GuildType, StdGuildBank } from "../../manager/CfgMgr";
import { ResMgr } from "../../manager/ResMgr";
import { ItemUtil } from "../../utils/ItemUtils";
import { AutoScroller } from "../../utils/AutoScroller";
import PlayerData, { SThing } from "../roleModule/PlayerData";
import { formatNumber } from "../../utils/Utils";

export class GuildBankItem extends Component {
    private bg:Sprite;
    private typeIcon:Sprite;
    private savingsTitleLab:Label;
    private consumeList:AutoScroller;
    private timeTitleLab:Label;
    private timeLab:Label;
    private presidentTitleLab:Label;
    private officerTitleLab:Label;
    private vicePresidentTitleLab:Label;
    private memberTitleLab:Label;
    private presidentLab:Label;
    private officerLab:Label;
    private vicePresidentLab:Label;
    private memberLab:Label;
    private isInit:boolean = false;
    private data:StdGuildBank;
    
    protected onLoad(): void {
        this.bg = this.node.getChildByName("bg").getComponent(Sprite);
        this.typeIcon = this.node.getChildByName("typeIcon").getComponent(Sprite);
        this.savingsTitleLab = this.node.getChildByName("savingsTitleLab").getComponent(Label);
        this.consumeList = this.node.getChildByName("consumeList").getComponent(AutoScroller);
        this.consumeList.SetHandle(this.updateConsumeItem.bind(this));
        this.timeTitleLab = this.node.getChildByName("timeTitleLab").getComponent(Label);
        this.timeLab = this.node.getChildByName("timeLab").getComponent(Label); 
        this.presidentTitleLab = this.node.getChildByName("presidentTitleLab").getComponent(Label);
        this.officerTitleLab = this.node.getChildByName("officerTitleLab").getComponent(Label);
        this.vicePresidentTitleLab = this.node.getChildByName("vicePresidentTitleLab").getComponent(Label);
        this.memberTitleLab = this.node.getChildByName("memberTitleLab").getComponent(Label);
        this.presidentLab = this.node.getChildByName("presidentLab").getComponent(Label);
        this.officerLab = this.node.getChildByName("officerLab").getComponent(Label);
        this.vicePresidentLab = this.node.getChildByName("vicePresidentLab").getComponent(Label);
        this.memberLab = this.node.getChildByName("memberLab").getComponent(Label);
        this.isInit = true;
        
        this.updateShow();
    }
    
    SetData(data:StdGuildBank) {
        this.data = data;
        this.updateShow();
    }
    
    private updateShow():void{
        if(!this.isInit || !this.data) return;
        let url = path.join("sheets/guild", this.data.TypeBg, "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            this.bg.spriteFrame = res;
        });
        url = path.join("sheets/guild", this.data.TypeIcon, "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            this.typeIcon.spriteFrame = res;
        });
        
        let itemList = ItemUtil.GetSThingList(this.data.CostType,this.data.CostId,this.data.CostNum);
        this.consumeList.UpdateDatas(itemList);
        let colorList:string[] = CfgMgr.GetGuildSavingsTypeColor(this.data.SavingsType);
        let titleColor:Color = new Color().fromHEX(colorList[0]);
        let valColor:Color = new Color().fromHEX(colorList[1]);
        this.savingsTitleLab.color = titleColor;
        this.timeTitleLab.color = titleColor;
        this.presidentTitleLab.color = titleColor;
        this.officerTitleLab.color = titleColor;
        this.vicePresidentTitleLab.color = titleColor;
        this.memberTitleLab.color = titleColor;
        this.timeLab.color = valColor;
        
        this.presidentLab.color = valColor;
        this.officerLab.color = valColor;
        this.vicePresidentLab.color = valColor;
        this.memberLab.color = valColor;

        this.timeLab.string = `${this.data.Duration}天`;
        
        let presidentRate:number = CfgMgr.GetGuildSavingsRate(this.data.DonateId, PlayerData.MyGuild.type, GuildPostType.President);
        let vicePresidentRate:number = CfgMgr.GetGuildSavingsRate(this.data.DonateId, PlayerData.MyGuild.type, GuildPostType.VicePresident);
        let officerRate:number = CfgMgr.GetGuildSavingsRate(this.data.DonateId, PlayerData.MyGuild.type, GuildPostType.Officer);
        let memberRate:number = CfgMgr.GetGuildSavingsRate(this.data.DonateId, PlayerData.MyGuild.type, GuildPostType.Member);
        
        this.presidentLab.string = `${formatNumber(presidentRate,2)}%`;
        this.officerLab.string = `${formatNumber(officerRate,2)}%`;
        this.vicePresidentLab.string = `${formatNumber(vicePresidentRate,2)}%`;
        this.memberLab.string = `${formatNumber(memberRate,2)}%`;
    }
    private updateConsumeItem(item: Node, data: SThing, index:number):void{
        let consumeItem:ConsumeItem = item.getComponent(ConsumeItem) || item.addComponent(ConsumeItem);
        let numLab:Label = item.getChildByName("numLab").getComponent(Label);
        let colorList:string[] = CfgMgr.GetGuildSavingsTypeColor(this.data.SavingsType);
        let valColor:Color = new Color().fromHEX(colorList[1]);
        numLab.color = valColor;
        consumeItem.SetData(data);
    }
    
}