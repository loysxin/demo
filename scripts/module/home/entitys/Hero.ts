import { Node, game, sp } from "cc";
import { GameObj } from "../../../GameRoot";
import { IAI, IEntity, IMove } from "./IEntity";
import { HeroMove } from "./HeroMove";
import { HeroAI } from "./HeroAI";
import { LikeNode } from "../MapData";
import { abss } from "../../../utils/Utils";
import Logger from "../../../utils/Logger";
import { EventMgr, Evt_Map_Moving, Evt_Map_StopMove } from "../../../manager/EventMgr";

export class Hero extends GameObj implements IEntity {

    protected $prefab: string;
    protected $uid: number;
    protected $imgBody: Node;
    protected $skeBody: sp.Skeleton;
    protected $moveCtrl: IMove;
    protected $ai: IAI;
    protected isRunning: boolean = false;
    protected actTime: number;
    protected pause = false;

    protected onLoad(): void {
        this.$imgBody = this.find("imgBody");
        this.$skeBody = this.find("skeBody", sp.Skeleton);

        EventMgr.on(Evt_Map_Moving, this.pauseAllSke, this);
        EventMgr.on(Evt_Map_StopMove, this.resumeAllSke, this);
    }

    private pauseAllSke() {
        this.$skeBody.paused = true;
        this.pause = true;
        this.$moveCtrl?.Pause(true);
    }
    private resumeAllSke() {
        this.$skeBody.paused = false;
        this.pause = false;
        this.$moveCtrl?.Pause(false);
    }


    /**初始化 */
    async Init(node: LikeNode, speed: number = 1) {
        // Logger.log("Init", node.idx, speed);
        this.$moveCtrl = new HeroMove(this);
        this.$ai = new HeroAI(this);

        this.setPosition(node.x, node.y);
        this.$moveCtrl.Init(node, speed);

        if (!this.$hasLoad) await this.loadSub;
        this.Idle();
    }

    get uid() { return this.$uid; }
    get imgBody() { return this.$imgBody; }
    get skeBody() { return this.$skeBody; }
    get moveCtrl() { return this.$moveCtrl; }
    get AI() { return this.$ai; }
    get isBack() {
        if (!this.currentAction) return false;
        return this.currentAction.indexOf("_Back") != -1;
    }
    get isLeft() {
        if (!this.$skeBody) return true;
        return this.$skeBody.node.getScale().x >= 0;
    }
    private currentAction: string;
    async play(action: string, loop = true) {
        this.currentAction = action;
        if (!this.$hasLoad) await this.loadSub;
        let scale = this.skeBody.node.getScale();
        if (this.$moveCtrl.nowSpeed.x) {
            if (this.$moveCtrl.nowSpeed.x <= 0) {
                this.skeBody.node.setScale(abss(scale.x), scale.y);
            } else {
                this.skeBody.node.setScale(-abss(scale.x), scale.y);
            }
        }
        if (this.$skeBody.getCurrent(0)?.animation.name == action && this.$skeBody.getCurrent(0)?.loop) return;
        // Logger.log("setAnimation", action);
        this.$skeBody.setAnimation(0, action, loop);
    }

    Attack1(lr?: number, isBack?: boolean, duration?: number): void {
        let loop = false;
        if (duration) {
            this.actTime = game.totalTime + duration * 1000;
            loop = true;
        }
        if (this.isBack) {
            this.play("Attack1_Back", loop);
        } else {
            this.play("Attack1", loop);
        }

    }
    Dead(): void {
        this.play("Dead");
    }
    async Idle(lr?: number, isBack?: boolean) {
        if (!this.$hasLoad) await this.loadSub;
        if (isBack || this.isBack) {
            this.play("Idle_Back");
        } else {
            this.play("Idle");
        }
        if (lr != undefined) {
            let scale = this.skeBody.node.getScale();
            this.skeBody.node.setScale(abss(scale.x) * lr, scale.y);
        }
    }
    Ingather_Rock(): void {
        this.play("Ingather_Rock");
    }
    Ingather_Seed(): void {
        this.play("Ingather_Seed");
    }
    Ingather_Water(): void {
        this.play("Ingather_Water");
    }
    Ingather_Wood(): void {
        this.play("Ingather_Wood");
    }
    Run() {
        this.isRunning = true;
        let speed = this.$moveCtrl.nowSpeed;
        if (speed.y > 0) {
            this.play("Run_Back");
        } else {
            this.play("Run");
        }
    }
    Skill1(lr?: number, isBack?: boolean, duration?: number): void {
        let loop = false;
        if (duration) {
            this.actTime = game.totalTime + duration * 1000;
            loop = true;
        }
        if (this.isBack) {
            this.play("Skill1_Back", loop);
        } else {
            this.play("Skill1", loop);
        }
    }
    Transport_Rock(): void {
        this.play("Transport_Rock");
    }
    Transport_Seed(): void {
        this.play("Transport_Seed");
    }
    Transport_Water(): void {
        this.play("Transport_Water");
    }
    Transport_Wood(): void {
        this.play("Transport_Wood");
    }
    Walk() {
        this.isRunning = false;
        let speed = this.$moveCtrl.nowSpeed;
        if (speed.y > 0) {
            this.play("Walk_Back", true);
        } else {
            this.play("Walk", true);
        }
    }
    Win(): void {
        this.play("Win");
    }
    Lie(): void {
        this.play("Lie");
    }

    public RemoveMyself(): void {
        this.removeSelf();
    }

    protected update(dt: number): void {
        if (this.pause) {
            return;
        }
        if (this.$moveCtrl.isMoving) {
            if (this.isRunning) {
                this.Run();
            } else {
                this.Walk();
            }
        }
        if (this.actTime && this.actTime <= game.totalTime) {
            this.actTime = undefined;
            this.Idle();
        }
    }
}
