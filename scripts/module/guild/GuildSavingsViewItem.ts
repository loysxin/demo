import { Component, Label, path, Sprite, SpriteFrame} from "cc";
import { HeadItem } from "../common/HeadItem";
import PlayerData, { SDeposit, SGuildMember, SPlayerViewInfo, SThing } from "../roleModule/PlayerData";
import { CfgMgr, StdGuildRole } from "../../manager/CfgMgr";
import { ResMgr } from "../../manager/ResMgr";
import { ConsumeItem } from "../common/ConsumeItem";
import { ItemUtil } from "../../utils/ItemUtils";
import { DateUtils } from "../../utils/DateUtils";

export class GuildSavingsViewItem extends Component {
    private head:HeadItem;
    private nameLab: Label;
    private postIcon:Sprite;
    private principalItem:ConsumeItem;
    private timeLab:Label;
    private isInit:boolean = false;
    private data:SDeposit;
    protected onLoad(): void {
        this.head = this.node.getChildByName("HeadItem").addComponent(HeadItem);
        this.postIcon = this.node.getChildByName("postIcon").getComponent(Sprite);
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.principalItem = this.node.getChildByName("principalItem").addComponent(ConsumeItem);
        this.timeLab = this.node.getChildByName("timeLab").getComponent(Label);
        this.isInit = true;
        this.updateShow();
    }
    
    SetData(data:SDeposit) {
        this.data = data;
        this.updateShow();
    }
    
    private updateShow():void{
        if(!this.isInit || !this.data) return;
        let viewInfo:SPlayerViewInfo = {player_id: this.data.user_id};
        this.head.SetData(viewInfo);
        this.nameLab.string = this.data.user_name;
        let dates:string[] = DateUtils.TimestampToDate(this.data.expiration_time * 1000, true);
        this.timeLab.string = `到期：${dates[0]}-${dates[1]}-${dates[2]}  ${dates[3]}:${dates[4]}:${dates[5]}`;
        let itemData:SThing = ItemUtil.CreateThing(this.data.cost_type,0, this.data.amount);
        this.principalItem.SetData(itemData);
        let memberData:SGuildMember = PlayerData.MyGuild ? PlayerData.MyGuild.members[this.data.user_id] : null;
        if(memberData){
            this.nameLab.string = memberData.name;
            let stdGuildRole:StdGuildRole = CfgMgr.GetGuildRole(memberData.role);
            if(stdGuildRole.PostIcon && stdGuildRole.PostIcon != ""){
                this.postIcon.node.active = true;
                let url = path.join("sheets/guild", stdGuildRole.PostIcon, "spriteFrame");
                ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                    this.postIcon.spriteFrame = res;
                });
            }else{
                this.postIcon.node.active = false;
            }
        }
        
    }
}