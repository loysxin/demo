import { Node, Vec2, game } from "cc";
import { IEntity, IMove } from "./IEntity";
import { Dir, LikeNode, map } from "../MapData";
import { Lerp, Mathf } from '../../../utils/Utils';
import { EffectToward, SkillEffect } from "../SkillStruct";

export class EffectMove implements IMove {
    private node: Node;
    private entity: IEntity;
    private cfg: SkillEffect;
    private current: LikeNode;
    private target: LikeNode;
    private speed: number;
    private moveTick: number;

    constructor(node: Node) {
        this.node = node;
        this.entity = <unknown>node as IEntity;
    }

    StepTo(dir: Dir): void { }
    PathTo(path: LikeNode[], speed?: number): void { }
    Stop(): void { }
    Pause(value: boolean): void { }
    GetCurr(): LikeNode { return this.node.position; }

    get nowSpeed(): { x: number, y: number } { return { x: 0, y: 0 }; }
    get isMoving(): boolean { return this.moveTick != undefined; }
    Init(node: LikeNode, cfg: SkillEffect): void {
        this.current = node;
        this.node.setPosition(node.x, node.y);
        this.cfg = cfg;
        switch (cfg.Toward) {
            case EffectToward.none:
                this.entity.Attack1();
                break;
            case EffectToward.face:
                
                break;
            case EffectToward.move:
                break;
        }
    }
    MoveTo(x: number, y: number, speed?: number): void {
        this.target = { x: x, y: y };
        this.speed = speed;
        this.moveTick = game.totalTime / 1000;
    }
    Update(dt: number): void {
        let t = (game.totalTime / 1000 - this.moveTick) / this.speed;
        if (t >= 1) {
            this.node.setPosition(this.target.x, this.target.y);
            this.moveTick = undefined;
        } else {
            Lerp(this.node, this.current, this.target, t);
        }
    }

}
