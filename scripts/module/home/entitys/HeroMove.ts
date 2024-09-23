import { Node, Vec2 } from "cc";
import { IMove } from "./IEntity";
import { Dir, LikeNode, map } from "../MapData";
import { Mathf } from '../../../utils/Utils';

export class HeroMove implements IMove {
    private node: Node;
    private speed = 0;
    private curr: LikeNode;
    private next: LikeNode;
    private path: LikeNode[];
    private pause: boolean = false;
    private sublen: number;
    private leng: number;
    private rad: number;

    constructor(node: Node) {
        this.node = node;
    }

    get nowSpeed(): { x: number, y: number } {
        if (!this.next) return Vec2.ZERO;
        return { x: this.speed * Math.cos(this.rad), y: this.speed * Math.sin(this.rad) };
    }
    get isMoving(): boolean {
        if ((this.path && this.path.length) || this.next) return true;
        return false;
    }
    Init(node: LikeNode, speed?: number): void {
        this.curr = node;
        if (speed != undefined) this.speed = speed;
        this.sublen = 0;
        this.node.setPosition(node.x, node.y);
    }
    StepTo(dir: Dir): void {
        let node = map.GetDir(this.curr, dir);
        this.path.length = 0;
        if (this.next == node) return;//目标点相同
        if (this.next) {
            this.path.push(this.next, node);
        } else {
            this.next = node;
            this.sublen = 0;
            this.rad = Math.atan2(this.next.y - this.curr.y, this.next.x - this.curr.x);
            this.leng = Mathf.distance(this.curr.x, this.curr.y, this.next.x, this.next.y);
        }
    }
    PathTo(path: LikeNode[], speed?: number): void {
        if (speed != undefined) this.speed = speed;
        this.path = path.concat();
        if (!this.path.length) return;
        if (this.next && this.next != this.path[0]) {
            this.path.unshift(this.next);//将当前尚未移动结束的目标点加入路径
        } else {
            this.next = this.path[0];
        }
        this.rad = Math.atan2(this.next.y - this.curr.y, this.next.x - this.curr.x);
        this.leng = Mathf.distance(this.curr.x, this.curr.y, this.next.x, this.next.y);
        // Logger.log("PathTo", this.rad, this.leng);
    }
    MoveTo(x: number, y: number, speed?: number): void {
        if (speed != undefined) this.speed = speed;
        this.path = [{ x: x, y: y }];
        this.next = this.path[0];
        this.rad = Math.atan2(this.next.y - this.curr.y, this.next.x - this.curr.x);
        this.leng = Mathf.distance(this.curr.x, this.curr.y, this.next.x, this.next.y);
    }
    Stop(): void {
        this.path.length = 0;
    }
    Pause(value: boolean): void {
        this.pause = value;
    }
    GetCurr(): LikeNode {
        return this.curr;
    }

    Update(dt: number): void {
        if (this.pause || !this.next) return;
        let ds = this.speed * dt;
        this.sublen += ds;
        // Logger.log("move", this.sublen, this.leng, this.rad, Math.cos(this.rad), Math.sin(this.rad));
        while (this.sublen >= this.leng) {
            this.sublen -= this.leng;
            this.curr = this.next;
            this.path.shift();
            if (this.path.length) {
                this.next = this.path[0];
                this.rad = Math.atan2(this.next.y - this.curr.y, this.next.x - this.curr.x);
                this.leng = Mathf.distance(this.curr.x, this.curr.y, this.next.x, this.next.y);
                // Logger.log("next===========", this.next.y, this.curr.y, this.rad, Math.sin(this.rad), this.leng);
            } else {
                this.sublen = 0;
                this.next = undefined;
                this.node.setPosition(this.curr.x, this.curr.y);
                this.node.emit("move_end");
                return;
            }
        }
        this.node.setPosition(this.curr.x + this.sublen * Math.cos(this.rad), this.curr.y + this.sublen * Math.sin(this.rad));
    }
}
