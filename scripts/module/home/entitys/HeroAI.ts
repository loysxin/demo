import { IAI, IEntity } from "./IEntity";
import { LikeNode, map } from "../MapData";
import Logger from "../../../utils/Logger";

export class HeroAI implements IAI {
    private node: IEntity;
    constructor(node: IEntity) {
        this.node = node;
    }

    Update(frame: number): void {
        if (!this.node.moveCtrl.isMoving) {
            this.xunluo();
        }
    }

    private way: LikeNode[];
    Xunluo(path: number[]) {
        // Logger.log("Xunluo", path);
        if (!path || !path.length) return;
        this.way = [];
        for (let idx of path) {
            this.way.push(map.GetGrid(idx));
        }
    }

    xunluo() {
        let node = this.node.moveCtrl.GetCurr();
        if (node.idx == this.way[0].idx) {
            this.node.moveCtrl.PathTo(this.way, 64);
        } else if (node.idx == this.way[this.way.length - 1].idx) {
            this.node.moveCtrl.PathTo(this.way.reverse(), 64);
        } else {
            this.node.moveCtrl.PathTo([node, this.way[0]], 64);
        }
        this.node.Walk();
    }

    private isWorking: boolean = false;
    private workNodes: { x: number; y: number; }[];
    Working(nodes?: { x: number; y: number; }[]): void {
        if (nodes) this.workNodes = nodes;
        this.isWorking = true;
    }
    Rest(): void {

    }

    
}