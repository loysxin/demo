import { Component, Tween, sp } from "cc";
import { HeroMove } from "./HeroMove";
import { Second, abss, randomI } from "../../../utils/Utils";
import { BuildingType } from "../HomeStruct";
import PlayerData, { FightState, SPlayerDataRole } from "../../roleModule/PlayerData";
import { CfgMgr } from "../../../manager/CfgMgr";
import { ResMgr } from "../../../manager/ResMgr";
import { EventMgr, Evt_Map_Moving, Evt_Map_StopMove } from "../../../manager/EventMgr";

export class Worker extends Component {
    private ske: sp.Skeleton;
    private moveCtrl: HeroMove;
    private workAction: string;
    private isWorking: boolean;
    private path: { x: number, y: number }[];
    private actPoint: { x: number, y: number, lr: number }[];
    private body: string;
    private target: any;
    private pause = false;

    protected onLoad(): void {
        this.ske = this.getComponent(sp.Skeleton);
        this.ske.setCompleteListener(this.onActionEnd.bind(this));
        this.ske.setAnimation(0, "Idle", true);
        this.moveCtrl = new HeroMove(this.node);
        this.node.on("move_end", this.onMoveEnd, this);
        this.node.name = "woker";
        let p = { x: this.node.position.x, y: this.node.position.y };
        this.moveCtrl.Init(p, 32);
        this.path = [p];
        this.actPoint = [];
        let scale = this.node.getScale().x;
        let children = this.node.children;
        for (let child of children) {
            if (child.name.indexOf("p") == 0) {
                this.path.push({ x: child.position.x * scale + p.x, y: child.position.y * scale + p.y });
            } else if (child.name.indexOf("w") == 0) {
                let lr = child.getScale().x > 0 ? 1 : -1;
                this.actPoint.push({ x: child.position.x * scale + p.x, y: child.position.y * scale + p.y, lr: child.getScale().x });
            }
            child.active = false;
        }

        EventMgr.on(Evt_Map_Moving, this.pauseAllSke, this);
        EventMgr.on(Evt_Map_StopMove, this.resumeAllSke, this);
    }

    private pauseAllSke() {
        this.ske.paused = true;
        this.pause = true;
    }
    private resumeAllSke() {
        this.ske.paused = false;
        this.pause = false;
    }


    onActionEnd(x?: sp.spine.TrackEntry) {
        if (this.moveCtrl.isMoving) return;
        if (this.isWorking) {
            let rand = Math.random();
            if (this.actPoint.length && this.actPoint.indexOf(this.target) != -1) {
                if (this.ske.getCurrent(0) && this.ske.getCurrent(0).animation.name != this.workAction) {
                    let scale = Math.abs(this.node.getScale().y);
                    this.node.setScale(this.target.lr * scale, scale);
                }
                this.play(this.workAction);
            } else if (rand < 0.5 || this.path.length <= 1) {
                if (this.actPoint.length) {
                    this.target = this.actPoint[randomI(0, this.actPoint.length - 1)];
                    this.moveCtrl.MoveTo(this.target.x, this.target.y);
                    this.Walk();
                } else {
                    if (this.ske.getCurrent(0) && this.ske.getCurrent(0).animation.name != this.workAction) {
                        let scale = Math.abs(this.node.getScale().y);
                        if (Math.random() < 0.5) {
                            this.node.setScale(scale, scale);
                        } else {
                            this.node.setScale(-scale, scale);
                        }
                    }
                    this.play(this.workAction);
                }
            } else if (rand < 0.8) {
                this.Idle();
            } else {
                let p = this.path[randomI(0, this.path.length - 1)];
                this.moveCtrl.MoveTo(p.x, p.y);
                this.Walk();
            }
        } else {
            this.Lie();
        }
    }

    Init(type: number) {
        switch (type) {
            case BuildingType.cai_kuang:
                this.workAction = "Ingather_Rock";
                break;
            case BuildingType.cai_mu:
                this.workAction = "Ingather_Wood";
                break;
            case BuildingType.cai_shui:
                this.workAction = "Ingather_Water";
                break;
            case BuildingType.hua_fang:
                this.workAction = "Ingather_Seed";
                break;
        }
    }

    /**
     * 开始工作
     * @param index 工人序号
     * @returns 
     */
    async Work(index: number, roleInfo: SPlayerDataRole) {
        let config = CfgMgr.GetRole()[roleInfo.type];
        if (this.isWorking && this.body == config.Prefab) return;
        this.isWorking = true;
        // console.log("Work", this.body, config.Prefab);
        if (this.body != config.Prefab) {
            this.body = config.Prefab;
            let res = `spine/role/${this.body}/${this.body}`;
            this.ske.skeletonData = await ResMgr.LoadResAbSub(res, sp.SkeletonData);
            this.ske.setAnimation(0, "Idle", false);
            Tween.stopAllByTarget(this);
        }
        if (index) await Second(index);
        this.onActionEnd();
    }

    private play(action: string, loop = false) {
        this.ske.setAnimation(0, action, loop);
    }

    protected onMoveEnd() {
        this.onActionEnd();
    }
    protected update(dt: number): void {
        if (PlayerData.fightState != FightState.Home || this.pause) return;
        this.moveCtrl.Update(dt);
    }

    Idle(): void {
        if (this.moveCtrl.nowSpeed.y > 0) {
            this.play("Idle_Back");
        } else {
            this.play("Idle");
        }
    }
    Lie(): void {
        this.isWorking = false;
        this.play("Lie", true);
    }
    Walk() {
        let speed = this.moveCtrl.nowSpeed;
        let scale = this.ske.node.getScale();
        if (this.moveCtrl.nowSpeed.x <= 0) {
            this.node.setScale(abss(scale.x), scale.y);
        } else {
            this.node.setScale(-abss(scale.x), scale.y);
        }
        if (speed.y > 0) {
            this.play("Walk_Back", true);
        } else {
            this.play("Walk", true);
        }
    }
}