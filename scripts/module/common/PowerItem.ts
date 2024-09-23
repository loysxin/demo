import { Tween, Vec3, sp, tween } from "cc";
import { Panel } from "../../GameRoot";
import { CountPower, SPlayerDataRole } from "../roleModule/PlayerData";
import { SpriteLabel } from "../../utils/SpriteLabel";

export class PowerItem extends Panel {
    protected prefab: string = "prefabs/panel/PowerItem";
    private role: SPlayerDataRole;
    private zdl: sp.Skeleton;

    protected onLoad() {
        this.zdl = this.find("ui_zdl", sp.Skeleton);
    }

    async flush(role: SPlayerDataRole, pos: Vec3 = new Vec3(0, 0, 0), beforRole?: SPlayerDataRole) {
        this.role = role;
        this.zdl.node.setPosition(pos);
        this.showPower(beforRole)
    }

    private showPower(beforRole?: SPlayerDataRole) {
        Tween.stopAllByTarget(this.zdl.node);
        this.zdl.node.active = true;
        this.zdl.node.getChildByName(`label`).addComponent(SpriteLabel);
        let label = this.zdl.node.getChildByName(`label`).getComponent(SpriteLabel);
        label.font = "sheets/common/number/font2";
        label.string = ``;
        let num = 0;
        if (beforRole) {
            num = beforRole.battle_power;
        }
        let battlePower = this.role.battle_power;
        if (!battlePower) {
            battlePower = CountPower(this.role.battle_power, this.role.quality, this.role);
        }
        let add = Math.floor(battlePower / 50);
        tween(this.zdl.node)
            .repeat(50,
                tween()
                    .delay(.02)
                    .call(() => {
                        num += add;
                        if (num > battlePower) {
                            num = battlePower;
                        }
                        label.string = `${num}`;
                    })
            )
            .call(() => { label.string = `${battlePower}`; })
            .start();
        this.zdl.setAnimation(0, `animation`, false);
        this.zdl.setCompleteListener(() => {
            this.Hide();
        })
        this.scheduleOnce(() => {
            this.Hide();
        }, 3)

    }

    protected onShow(): void {

    }

    protected onHide(...args: any[]): void {
        this.unscheduleAllCallbacks();
    }
}
