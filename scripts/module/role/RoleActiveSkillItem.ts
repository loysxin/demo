import { Button, Component, Label, RichText, Sprite, SpriteFrame, path } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import { SPlayerDataSkill } from "../roleModule/PlayerData";
import { ResMgr, folder_icon, folder_item, folder_quality, folder_skill } from "../../manager/ResMgr";
import { CfgMgr, StdActiveSkill } from "../../manager/CfgMgr";


export class RoleActiveSkillItem extends Component {
    private bg:Sprite;
    private icon:Sprite;
    private nameLab:Label;
    private lvLab:Label;
    private skillDescLab:RichText;
    private data: SPlayerDataSkill;
    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;

    protected onLoad(): void {
        this.bg = this.node.getChildByName("bg").getComponent(Sprite);
        this.icon = this.node.getChildByPath("Mask/icon").getComponent(Sprite);
        this.nameLab = this.node.getChildByPath("titleCont/nameLab").getComponent(Label);
        this.lvLab = this.node.getChildByPath("titleCont/lvLab").getComponent(Label);
        this.skillDescLab = this.node.getChildByName("skillDescLab").getComponent(RichText);
        this.hasLoad = true;
        this.complete?.();
    }
    protected get loadSub() {
        if (this.$loadSub) return this.$loadSub;
        let thisObj = this;
        this.$loadSub = new Promise((resolve, reject) => {
            thisObj.complete = resolve;
        });
    }

    async SetData(data: SPlayerDataSkill) {
        if (!this.hasLoad) await this.loadSub;
        this.data = data;
        this.initShow();

    }

    private async initShow():Promise<void> {
        let stdSkill:StdActiveSkill = CfgMgr.GetActiveSkill(this.data.skill_id, this.data.level);
        if(!stdSkill) return;
        this.nameLab.string = stdSkill.Name;
        this.lvLab.string = ` Lv.${this.data.level}`;
        this.skillDescLab.string = stdSkill.Text;
        this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_quality, "a_skill_bg_" + stdSkill.Quality, "spriteFrame"), SpriteFrame);
        this.icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_skill, stdSkill.icon.toString(), "spriteFrame"), SpriteFrame);
    }
}