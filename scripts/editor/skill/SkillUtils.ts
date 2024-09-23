import { AssetManager, EditBox, Input, Label, Node, path } from "cc";
import { Selector } from "./Selector";
import { SkillAffect, SkillBox, SkillBullet, SkillCfg, SkillEffect, SkillShake, SkillSound } from "../../module/home/SkillStruct";
import { FrameType } from "./SkillSetter";
import { SkillEditPath } from "./SkillEditPath";
import { SkillEditDraw } from "./SkillEditDraw";
import Logger from "../../utils/Logger";

export class SkillUitls {

    static actions = [
        "Attack1",
        "Dead",
        "Idle",
        "Ingather_Rock",
        "Ingather_Seed",
        "Ingather_Water",
        "Ingather_Wood",
        "Run",
        "Skill1",
        "Transport_Rock",
        "Transport_Seed",
        "Transport_Water",
        "Transport_Wood",
        "Walk",
        "Win",
        "Lie"
    ];

    static FormatItem(node: Node, data: SkillEffect | SkillAffect | SkillBox | SkillBullet | SkillShake | SkillSound, name: string) {
        if (node.getComponent(Selector)) {
            let selector = node.getComponent(Selector);
            if (data['SkillId']) {
                if (name == "Prefab") {
                    selector.Init(this.actions, this.updateItem);
                    selector.node.on("select", value => {
                        data['Prefab'] = value;
                    }, this);
                }
            } else {
                switch (data.ObjType) {
                    case FrameType.Effect:
                    case FrameType.Bullet:
                        if (name == "Res") {
                            let ab = AssetManager.instance.getBundle("res");
                            let files = ab.getDirWithPath("spine/effect");
                            let paths = [];
                            for (let file of files) {
                                let res = path.basename(file.path);
                                if (res != "texture" && res != "spriteFrame") {
                                    if (paths.indexOf(res) == -1) paths.push(res);
                                }
                            }
                            selector.Init(paths, this.updateItem);
                            selector.node.on("select", value => {
                                data["Res"] = value;
                            }, this);
                        }
                        break;
                }
            }
        } else {
            node.on(Input.EventType.TOUCH_END, () => {
                switch (data.ObjType) {
                    case FrameType.Bullet:
                        let skillBullet: SkillBullet = data as SkillBullet;
                        if (name == "Path") {
                            SkillEditPath.Show(skillBullet.Path, value => {
                                if (value.length >= 3) {
                                    skillBullet.PathType = 1;
                                }else if (value.length == 1) {
                                    skillBullet.PathType = 2;
                                } else {
                                    skillBullet.PathType = 0;
                                }
                                skillBullet.Path = value;
                                Logger.log("SkillEditPath", skillBullet);
                            });
                        } else if (name == "HitBound") {
                            SkillEditDraw.Show(skillBullet.HitBound, value => {
                                skillBullet.HitBound = value;
                            })
                        }
                        break;
                    case FrameType.Box:
                        let skillBox: SkillBox = data as SkillBox;
                        if (name == "RangePara") {
                            SkillEditDraw.Show(skillBox.RangePara, value => {
                                skillBox.RangePara = value;
                            })
                        }
                        break;
                }
            }, this);
        }
    }

    private static updateItem(item: Node, data: string) {
        if (item.getComponent(Label)) {
            item.getComponent(Label).string = data;
        } else if (item.getComponent(EditBox)) {
            item.getComponent(EditBox).string = data;
        }
    }
}