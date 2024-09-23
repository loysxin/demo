import { Label, RichText, Sprite, SpriteFrame, path } from "cc";
import { Panel } from "../../GameRoot";
import { SPlayerDataSkill } from "../roleModule/PlayerData";
import { CfgMgr, StdActiveSkill } from "../../manager/CfgMgr";
import { ResMgr, folder_icon, folder_quality, folder_skill } from "../../manager/ResMgr";


export class ActiveSkillTipsPanel extends Panel {
    protected prefab: string = "prefabs/panel/ActiveSkillTipsPanel";
    private bg:Sprite;
    private icon:Sprite;
    private nameLab:Label;
    private lvLab:Label;
    private skillDescLab:RichText;
    private nextLvLab:Label;
    private nextSkillDescLab:RichText;
    protected onLoad() {
        this.bg = this.find("cont/bg").getComponent(Sprite);
        this.icon = this.find("cont/Mask/icon").getComponent(Sprite);
        this.nameLab = this.find("cont/nameLab").getComponent(Label);
        this.lvLab = this.find("cont/lvLab").getComponent(Label);
        this.skillDescLab = this.find("cont/skillDescLab").getComponent(RichText);
        this.nextLvLab = this.find("cont/nextLvLab").getComponent(Label);
        this.nextSkillDescLab = this.find("cont/nextSkillDescLab").getComponent(RichText);
        this.CloseBy("mask");
        
    }
    protected onShow(): void {
        
    }
    public async flush(data: SPlayerDataSkill): Promise<void> {
        if (!this.$hasLoad) await this.initSub;
        let stdSkill:StdActiveSkill = CfgMgr.GetActiveSkill(data.skill_id, data.level);
        if(!stdSkill) return;
        this.nameLab.string = stdSkill.Name;
        this.lvLab.string = `Lv.${data.level}`;
        this.skillDescLab.string = stdSkill.Text;
        this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_quality, "a_skill_bg_" + stdSkill.Quality, "spriteFrame"), SpriteFrame);
        this.icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_skill, stdSkill.icon.toString(), "spriteFrame"), SpriteFrame);

        let nextStdSkill:StdActiveSkill = CfgMgr.GetActiveSkill(data.skill_id, data.level + 1);
        if(nextStdSkill){
            this.nextLvLab.node.active = true;
            this.nextSkillDescLab.node.active = true;
            this.nextLvLab.string =  `Lv.${data.level + 1}`;
            this.nextSkillDescLab.string = nextStdSkill.Text;
        }else{
            this.nextLvLab.node.active = false;
            this.nextSkillDescLab.node.active = false;
        }
    }
    protected onHide(...args: any[]): void {

    }
}