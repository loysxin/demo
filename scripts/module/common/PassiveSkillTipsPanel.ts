import { Label, RichText, Sprite, SpriteFrame, path } from "cc";
import { Panel } from "../../GameRoot";
import { SPlayerDataSkill } from "../roleModule/PlayerData";
import { CfgMgr, StdActiveSkill, StdPassiveLevel } from "../../manager/CfgMgr";
import { ResMgr, folder_icon, folder_quality, folder_skill } from "../../manager/ResMgr";


export class PassiveSkillTipsPanel extends Panel {
    protected prefab: string = "prefabs/panel/PassiveSkillTipsPanel";
    private bg: Sprite;
    private icon: Sprite;
    private nameLab: Label;
    private lvLab: Label;
    private skillDescLab: RichText;
    protected onLoad() {
        this.bg = this.find("cont/bg").getComponent(Sprite);
        this.icon = this.find("cont/Mask/icon").getComponent(Sprite);
        this.nameLab = this.find("cont/nameLab").getComponent(Label);
        this.lvLab = this.find("cont/lvLab").getComponent(Label);
        this.skillDescLab = this.find("cont/skillDescLab").getComponent(RichText);
        this.CloseBy("mask");

    }
    protected onShow(): void {

    }
    public async flush(data: SPlayerDataSkill): Promise<void> {
        if (!this.$hasLoad) await this.initSub;
        let stdSkill: StdPassiveLevel = CfgMgr.GetPassiveSkill(data.skill_id, data.level);
        if (!stdSkill) return;
        this.nameLab.string = stdSkill.Name;
        this.lvLab.string = `Lv.${data.level}`;
        this.skillDescLab.string = stdSkill.Desc;
        this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_quality, "a_skill_bg_" + stdSkill.RareLevel, "spriteFrame"), SpriteFrame);
        this.icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_skill, stdSkill.Icon.toString(), "spriteFrame"), SpriteFrame);
    }
    protected onHide(...args: any[]): void {

    }
}