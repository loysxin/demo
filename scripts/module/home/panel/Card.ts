import { Button, Component, Label, Node, ScrollView, Sprite, SpriteFrame, Toggle, UITransform, path, sp } from "cc";
import { AutoScroller } from "../../../utils/AutoScroller";
import PlayerData, { CountPower, SAssistRoleInfo, SPlayerDataRole } from "../../roleModule/PlayerData";
import { ResMgr, folder_common, folder_icon, folder_item, folder_quality } from "../../../manager/ResMgr";
import { Attr, AttrFight, CardQuality, CfgMgr, OneOffRedPointId, StdCommonType } from "../../../manager/CfgMgr";
import { AttrSub, FormatAttr, FormatRoleAttr, GetAttrValue, GetAttrValueByIndex, UpdateAttrItem } from "../../common/BaseUI";
import { countDown2, maxx } from "../../../utils/Utils";
import { EventMgr, Evt_FlushWorker, Evt_LoginRedPointUpdate, Evt_Passive_Skill_Update, Evt_Role_Upgrade, Evt_RoleAttack } from "../../../manager/EventMgr";
import { TradeHeroPanel } from "../../trade/TradeHeroPanel";
import { MsgTypeRet, MsgTypeSend } from "../../../MsgType";
import { Session } from "../../../net/Session";
import { BattleReadyLogic } from "../../../battle/Ready/BattleReadyLogic";

/**用途枚举 */
export enum CardType {
    Merge,
    Work,
    Fight,
    Friend,//好友
    Trade,//交易所
    Assist,//助战角色出战
    defend,//家园驻守
    Role,//角色展示

}

export class Card extends Component {
    private bgEffect:sp.Skeleton;
    private frame: Sprite;
    private pillarBg:Sprite;
    private typeIcon: Sprite;
    private quality: Sprite;
    private level: Label;
    private body: sp.Skeleton;
    private power: Node;
    private stateCont: Node;
    private toggle: Toggle;
    private skillScroller: AutoScroller;
    private attrScroller: AutoScroller;
    private role_name: Label;
    private tipsBtn: Button;
    private assistInfo: Node;
    private assist_count:Label;
    private assist_cost:Label;
    private redPoint:Node;
    private cd_node: Node;
    private lbl_time: Label;
    private roleInfoCallBack:Function;

    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;
    private role: SPlayerDataRole;
    private is_assist:boolean;
    private friendData:SAssistRoleInfo;
    private showType:CardType;
    private timedata:number;
    private is_ji_di:boolean;
    protected onLoad(): void {
        this.frame = this.node.getChildByName("bg").getComponent(Sprite);
        this.bgEffect = this.node.getChildByName("bgEffect").getComponent(sp.Skeleton);
        this.pillarBg = this.node.getChildByName("pillarBg").getComponent(Sprite);
        this.typeIcon = this.node.getChildByName("type").getComponent(Sprite);
        this.quality = this.node.getChildByName("quality").getComponent(Sprite);
        this.level = this.node.getChildByName("level").getComponent(Label);
        this.body = this.node.getChildByName("body").getComponent(sp.Skeleton);
        this.stateCont = this.node.getChildByName("stateCont");
        this.power = this.node.getChildByName("power");
        this.role_name = this.node.getChildByName("role_name").getComponent(Label);
        this.tipsBtn = this.node.getChildByName("tipsBtn").getComponent(Button);
        this.assistInfo = this.node.getChildByName("assistInfo");
        this.assist_count = this.node.getChildByPath("assistInfo/count/assist_count").getComponent(Label);
        this.assist_cost = this.node.getChildByPath("assistInfo/cost/assist_cost").getComponent(Label);
        this.cd_node = this.node.getChildByName("cd_node");
        this.lbl_time = this.node.getChildByPath("cd_node/lbl_time").getComponent(Label);
        
        this.toggle = this.node.getComponent(Toggle);
        this.skillScroller = this.node.getChildByName("skills").getComponent(AutoScroller);
        this.attrScroller = this.node.getChildByName("layout").getComponent(AutoScroller);
        let add = this.node.getChildByName("add");
        add.active = false;
        this.redPoint = this.node.getChildByName("red_point");
        this.redPoint.active = false;
        this.skillScroller.SetHandle(this.updateSkill.bind(this));
        this.attrScroller.SetHandle(UpdateAttrItem.bind(this));
        this.tipsBtn.node.on("click", this.onTipsBtn, this);
        this.hasLoad = true;
        this.complete?.();
        EventMgr.on(Evt_FlushWorker, this.onUpdateWorker, this);
        EventMgr.on(Evt_RoleAttack, this.onUpdateAttack, this);
        EventMgr.on(Evt_Role_Upgrade, this.onRoleUpgrade, this);
        EventMgr.on(Evt_Passive_Skill_Update, this.onUpdateSkill, this);
        EventMgr.on(Evt_LoginRedPointUpdate, this.onLoginRedPointUpdate, this);
    }

    protected get loadSub() {
        if (this.$loadSub) return this.$loadSub;
        let thisObj = this;
        this.$loadSub = new Promise((resolve, reject) => {
            thisObj.complete = resolve;
        });
    }

    private updateSkill(item: Node, data: any) {

    }
    private onUpdateWorker(): void {
        if(!this.node.activeInHierarchy || !this.role) return;
        this.updateRoleState();
    }
    private onUpdateAttack(): void {
        if(!this.node.activeInHierarchy || !this.role) return;
        this.updateRoleState();
    }
    private onRoleUpgrade():void{
        if(!this.node.activeInHierarchy || !this.role) return;
        this.updateRedPoint();
    }
    private onUpdateSkill():void{
        if(!this.node.activeInHierarchy || !this.role) return;
        this.updateRedPoint();
    }
    private onLoginRedPointUpdate(id:number):void{
        if(!this.node.activeInHierarchy || id != OneOffRedPointId.OffRedPoint_RolePassiveSkill) return;
        this.updateRedPoint();
    }
    private updateRoleState(): void {
        if (!this.role.id) return;
        
        let stateList: number[] = PlayerData.GetRoleStateList(this.role);
        for (let node of this.stateCont.children) {
            node.active = false;
            for (let state of stateList) {
                if (node.name == `state_${state}`) {
                    node.active = true;
                }
            }
        }
    }

    /**
     * 设置角色数据
     * @param data 
     */
    async SetData(data: { role: SPlayerDataRole, select: boolean }, type: CardType = CardType.Role, is_assist?:boolean, friend?:SAssistRoleInfo, role_info_call_back?:Function, is_ji_di?:boolean) {
        if (!this.hasLoad) await this.loadSub;
        this.showType = type;
        this.roleInfoCallBack = role_info_call_back;
        this.is_assist = is_assist;
        this.is_ji_di = is_ji_di;
        if(friend){
            this.friendData = friend;
        }
        this.assistInfo.active = is_assist;
        this.tipsBtn.node.active = false;
        this.body.node.active = true;
        this.typeIcon.node.active = true;
        this.quality.node.active = true;
        this.stateCont.active = false;
        this.cd_node.active = false;
        this.node.getChildByName(`state`).active = false;
        this.power.active = false;
        this.role_name.node.active = false;
        this.role = data.role;
        let std = CfgMgr.GetRole()[this.role.type];
        let stdquality = CfgMgr.GetRoleQuality(this.role.type, this.role.quality);
        let stdlv = CfgMgr.GetRoleLevel(this.role.type, this.role.level);
        this.node.getChildByName(`ui_breed_Selected`).active = false;

        this.node.name = "role_" + this.role.type;
        let pillarId:number = 0;
        if (stdquality) {
            this.frame.grayscale = false;
            this.frame.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[stdquality.QualityType] + "_card", "spriteFrame"), SpriteFrame);
        } else {
            this.frame.grayscale = true;
        }
        this.typeIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "pos" + std.PositionType, "spriteFrame"), SpriteFrame);
        if (this.role.quality) {
            this.quality.node.active = true;
            this.quality.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_quality, CardQuality[this.role.quality], "spriteFrame"), SpriteFrame);
        } else {
            this.quality.node.active = false;
        }
        this.level.string = "Lv." + this.role.level;
        let prefab = std.Prefab;
        let scale = std.Scale || 1;
        this.body.node.setScale(0.3 * scale, 0.3 * scale);
        this.body.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/role", prefab, prefab), sp.SkeletonData);
        this.body.setAnimation(0, "Idle", true);
        this.bgEffect.node.active = false;
        this.toggle.isChecked = data.select;

        if (this.showType == CardType.Fight) {
            // 战斗
            this.power.active = true;
            let value = CountPower(this.role.type, this.role.level, this.role).toString();
            this.power.getChildByName("value").getComponent(Label).string = value + "";
            this.skillScroller.node.active = false;
            this.attrScroller.node.active = false;
            this.stateCont.active = true;
            this.updateRoleState();
        } else if (this.showType == CardType.Merge) {
            // 繁育
            this.tipsBtn.node.active = true;
            this.power.active = false;
            this.attrScroller.node.active = false;
            this.skillScroller.node.active = true;
            this.node.getChildByName(`ui_breed_Selected`).active = data.select;
            this.stateCont.active = true;
            this.updateRoleState();
        } else if (this.showType == CardType.Work) {
            // 工作
            let datas = [];
            this.attrScroller.node.active = true;
            if(!this.is_ji_di){
                const ls: number[] = CfgMgr.GetCommon(StdCommonType.Home).ShowAttr;
                let spr = ["quanneng", "mucai", "shui", "shitou", "zhongzi"]
                let index = 0
                for (let id of ls) {
                    let data = FormatAttr(id, false);
                    let value = GetAttrValueByIndex(this.role as SPlayerDataRole, id);
                    if (value != 0) {
                        data.icon = path.join(folder_item, spr[index], "spriteFrame")
                        data.value = value;
                        datas.push(data);
                    }
                    index++;
                }
            }else{
                let data: AttrSub = { icon: path.join(folder_item, "qianghuashi", "spriteFrame"), name: "", value: 0, next: 0, per: "" };
                let cfg = CfgMgr.GetProduceCasting(this.role.type, this.role.quality);
                if(cfg){
                    data.value = cfg.produce_casting
                }
                datas.push(data);
            }
            this.attrScroller.UpdateDatas(datas);
            this.skillScroller.node.active = false;
            this.stateCont.active = true;
            this.updateRoleState();
        } else if (this.showType == CardType.Friend) {
            // 协助
            this.tipsBtn.node.active = true;
            this.power.active = true;
            this.role_name.node.active = true;
            let power = this.power.getChildByName("value").getComponent(Label)
            this.toggle.isChecked = false;
            let upbattle_role = BattleReadyLogic.ins.getUpBattleRole()               
            for (let index = 0; index < upbattle_role.length; index++) {
                const element = upbattle_role[index];
                if(data.role.id == element.ID){
                    this.toggle.isChecked = true;
                    break;
                }
            }
            if(!is_assist){
                let value = CountPower(this.role.type, this.role.level,this.role).toString();
                power.string = value + "";
                this.role_name.string = std.Name;              
            }else{
                if(friend){
                    this.assistInfo.active = true;
                    power.string  = friend.battle_power + ""
                    this.role_name.string = friend.player_name;
                    this.assist_cost.string = friend.usage_fee + "";
                    this.assist_count.string = friend.daily_assist_count + "";
                }
            }
            
            this.skillScroller.node.active = false;
            this.attrScroller.node.active = false;
        }else if (this.showType == CardType.defend) {
            // 繁育
            this.tipsBtn.node.active = true;
            this.power.active = true;
            let value = CountPower(this.role.type, this.role.level, this.role).toString();
            this.power.getChildByName("value").getComponent(Label).string = value + "";
            this.attrScroller.node.active = false;
            this.skillScroller.node.active = true;
            this.updateRoleState();
        }else if(this.showType == CardType.Role){
            if(std && std.RoleTypeQual > 0){
                this.bgEffect.node.active = true;
                pillarId = std.RoleTypeQual;
                let effectName:string = "ui_HeroBackground_0" + std.RoleTypeQual;
                this.bgEffect.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/effect", effectName, effectName), sp.SkeletonData);
                this.bgEffect.setAnimation(0, "animation", true);
            }
            this.power.active = true;
            let value = CountPower(this.role.type, this.role.level, this.role).toString();
            this.power.getChildByName("value").getComponent(Label).string = value + "";
            this.skillScroller.node.active = false;
            this.attrScroller.node.active = false;
            this.stateCont.active = true;
            this.updateRoleState();
        } 
        this.pillarBg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_common, "pillar_" + pillarId, "spriteFrame"), SpriteFrame);
        this.updateRedPoint();
        this.updateTime()
    }
    private updateRedPoint():void{
        this.redPoint.active = false;
        if(this.showType == CardType.Role){
            this.redPoint.active = PlayerData.CheckRoleIsCanUp(this.role.id) || PlayerData.CheckRolePassiveSkillIsCanUp(this.role.id);
        }
        
    }
    private onTipsBtn() {
        if(this.roleInfoCallBack){
            Session.on(MsgTypeRet.GetAssistRoleByIDRet, this.getAssistRoleInfo, this);
            if(this.is_assist){
                let data = {
                    type:MsgTypeSend.GetAssistRoleByIDRequest,
                    data:{role_id:this.friendData.role_id}
                }
                Session.Send(data);
            }else{
                this.roleInfoCallBack(this.role);
            }
            return;
        }
        TradeHeroPanel.Show(this.role);
    }

    private getAssistRoleInfo(data){
        if(data){
            let role: SPlayerDataRole;
            role = {
                id: data.assist_role.id,
                type: data.assist_role.type,
                level: data.assist_role.level,
                experience: data.assist_role.experience,
                soldier_num: 0,
                active_skills: data.assist_role.active_skills,
                passive_skills: data.assist_role.passive_skills,
                is_in_building: false,
                building_id: data.assist_role.building_id,
                battle_power: data.assist_role.battle_attributes.battle_power,
                quality: data.assist_role.quality,
                skills: [],
                is_assisting: false,
                is_in_attack_lineup: false,
                is_in_defense_lineup: false,
                trade_cd: 0,
            }
            this.roleInfoCallBack(role);
        }
    }

    private updateTime (){
        let is_show_time = this.role.trade_cd - PlayerData.GetServerTime();
        if(this.role.trade_cd > 0 && is_show_time > 0){
            this.cd_node.active = true;
            let seconds = this.role.trade_cd - PlayerData.GetServerTime();
            let time = countDown2(this.role.trade_cd);
            let lbl_time = this.node.getChildByPath("cd_node/lbl_time").getComponent(Label)
            if(time.d > 0){
                lbl_time.string = time.d + "天";
            }else{
                lbl_time.string = time.h + ":" + time.m + ":" + time.s;
            }
            if(this.timedata){
                clearInterval(this.timedata);
            }
            this.timedata = setInterval(() => {
                if (seconds > 0) {
                    seconds -= 1;
                    let time = countDown2(this.role.trade_cd);
                    if(time.d > 0){
                        lbl_time.string = time.d + "天";
                    }else{
                        lbl_time.string = time.h + ":" + time.m + ":" + time.s;
                    }
                } else {
                    this.cd_node.active = false;
                    clearInterval(this.timedata);
                }
              }, 1000);
        }
    }
}