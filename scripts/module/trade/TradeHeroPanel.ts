import { Color, Input, Label, Node, Slider, Sprite, SpriteFrame, Toggle, Tween, UIOpacity, UITransform, find, game, path, sp, tween, v3 } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { CountPower, SPlayerDataRole, SPlayerDataSkill } from "../roleModule/PlayerData";
import { ResMgr, folder_attr, folder_icon, folder_item, folder_quality, folder_skill, skill_quality_color } from "../../manager/ResMgr";
import { Attr, AttrFight, AttrType, CardQuality, CfgMgr, StdCommonType, StdPassiveLevel, StdRoleQuality } from "../../manager/CfgMgr";
import { AutoScroller } from "../../utils/AutoScroller";
import { AttrSub, FormatAttr, FormatRoleAttr, FormatRoleFightAttr, GetAttrValueByIndex } from "../common/BaseUI";
import { SpriteLabel } from "../../utils/SpriteLabel";

export class TradeHeroPanel extends Panel {
    protected prefab: string = "prefabs/panel/Trade/TradeHeroPanel";

    private role: SPlayerDataRole;
    private body: sp.Skeleton;
    private midScroller: AutoScroller;
    private skillLayout: AutoScroller;
    private Power: Node;
    private PowerLabel: SpriteLabel;
    private light: Sprite;
    private level:Label;

    protected onLoad() {
        this.body = this.find("body", sp.Skeleton);
        this.midScroller = this.find(`midLayout`, AutoScroller);
        this.skillLayout = this.find(`skillLayout`, AutoScroller);
        this.Power = this.find(`Power`);
        this.level = this.find("level", Label);
        this.PowerLabel = this.Power.getChildByName(`label`).addComponent(SpriteLabel);
        this.light = this.find("light", Sprite);
        this.CloseBy("close");
        this.node.on(Input.EventType.TOUCH_START,this.Hide,this);

        this.midScroller.SetHandle(this.updateItem.bind(this));
        this.skillLayout.SetHandle(this.onUpdateSkill.bind(this));
    }

    static ShowMerge(role: SPlayerDataRole) {
        this.Show(role);
    }

    async flush(role: SPlayerDataRole) {
        this.role = role;
        this.level.string = "Lv." + role.level;
        let prefab = CfgMgr.GetRole()[role.type].Prefab;
        this.body.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/role_p", prefab, prefab), sp.SkeletonData);
        this.body.setAnimation(0, `Idle`, true);

        const ls: number[] = [5,7,9,11];
        let spr = ["mucai", "shui", "shitou", "zhongzi"]
        let datas = [];
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
        console.log(datas);

        let datas2: AttrSub[] = [];
        let AttrFightData = FormatRoleFightAttr(role)
        let attr_data_list = [];
        let id = [AttrFight.AttackVal, AttrFight.HPMax]
        for (let i = 0; i < id.length; i++) {
            for (let index = 0; index < AttrFightData.length; index++) {
                const element = AttrFightData[index];
                if(element.id == id[i]){
                    attr_data_list.push(element)
                }      
            }  
        }

         // 附加属性
         let data1: AttrSub = {
            icon: null,
            name: "兵力数量",
            value: GetAttrValueByIndex(role, Attr.LeaderShip),
            next: 0,
            per: ""
        }
        datas2.push(data1);

        let data2: AttrSub = {
            icon: null,
            name: "攻击力",
            value: attr_data_list[0].value,
            next: 0,
            per: ""
        }
        datas2.push(data2);

        // let data3: AttrSub = {
        //     icon: null,
        //     name: "生命值",
        //     value: attr_data_list[1].value,
        //     next: 0,
        //     per: ""
        // }
        // datas2.push(data3); 
        datas2 = datas2.concat(datas)
      
        this.midScroller.UpdateDatas(datas2);
        this.skillLayout.UpdateDatas(role.passive_skills);

        let battlePower = CountPower(this.role.type, this.role.quality, this.role);
        this.PowerLabel.font = "sheets/common/number/font2";
        this.PowerLabel.string = `${battlePower}`;

        let light = path.join("sheets/fanyu", CardQuality[role.quality], "spriteFrame");
        this.light.spriteFrame = await ResMgr.LoadResAbSub(light, SpriteFrame);
    }

    protected async updateItem(item: Node, data: any) {
        let name = item.getChildByName("name")?.getComponent(Label);
        let now = item.getChildByName("nowValue")?.getComponent(Label);
        let icon = item.getChildByName("iconJP")?.getComponent(Sprite);
        if(data.icon){
            icon.node.active = true;
            icon.spriteFrame = await ResMgr.LoadResAbSub(data.icon, SpriteFrame);
        }else{
            icon.node.active = false;
        }
        if (name) name.string = data.name;
        now.string = data.value + data.per;
    }

    private onUpdateSkill(item: Node, data: SPlayerDataSkill) {
        if (data) {
            let stdSkill: StdPassiveLevel = CfgMgr.GetPassiveSkill(data.skill_id, data.level);
            let bg = find(`bg`, item).getComponent(Sprite);
            let icon = find(`Mask/icon`, item).getComponent(Sprite);
            let name = find(`skill_name`, item).getComponent(Label);
            let skillLV = find(`lvCont/lvLab`, item).getComponent(Label);
            if (stdSkill) {
                name.string = `${stdSkill.Name}`;
                skillLV.string = `${stdSkill.Level}`;
                name.color = new Color().fromHEX(skill_quality_color[stdSkill.RareLevel]);
                let iconUrl: string = path.join(folder_skill, stdSkill.Icon.toString(), "spriteFrame");
                ResMgr.LoadResAbSub(iconUrl, SpriteFrame, res => {
                    icon.spriteFrame = res;
                });

                let qualityUrl: string = path.join(folder_quality, "p_skill_bg_" + stdSkill.RareLevel.toString(), "spriteFrame");
                ResMgr.LoadResAbSub(qualityUrl, SpriteFrame, res => {
                    bg.spriteFrame = res;
                });
            }
        }
    }

    protected onShow(): void {
    }
    protected onHide(...args: any[]): void {
    }
}
