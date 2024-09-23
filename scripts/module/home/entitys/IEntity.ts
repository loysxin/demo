import { Node, sp } from "cc";
import { Dir, LikeNode } from "../MapData";

/**实体 */
export interface IEntity {
    readonly uid: number;
    readonly imgBody: Node;
    readonly skeBody: sp.Skeleton;
    readonly isBack: boolean;
    readonly isLeft: boolean;

    readonly moveCtrl: IMove;
    readonly AI: IAI;

    Init(node: LikeNode, speed?: number): void;

    Attack1(lr?: number, isBack?: boolean, duration?: number): void;
    Dead(): void;
    Idle(lr?: number, isBack?: boolean): void;
    Ingather_Rock(): void;
    Ingather_Seed(): void;
    Ingather_Water(): void;
    Ingather_Wood(): void;
    Run(lr?: number, isBack?: boolean): void;
    Skill1(lr?: number, isBack?: boolean, duration?: number): void;
    Transport_Rock(): void;
    Transport_Seed(): void;
    Transport_Water(): void;
    Transport_Wood(): void;
    Walk(lr?: number, isBack?: boolean): void;
    Win(): void;
    Lie(): void;
    RemoveMyself(): void;
}

export interface IFrame {
    Update(frame: number): void;
}

/**移动 */
export interface IMove extends IFrame {
    readonly nowSpeed: { x: number, y: number };
    readonly isMoving: boolean;
    Init(node: LikeNode, ...params: any[]): void;
    StepTo(dir: Dir): void;
    PathTo(path: LikeNode[], speed?: number): void;
    MoveTo(x: number, y: number): void;
    Stop(): void;
    Pause(value: boolean): void;
    GetCurr(): LikeNode;
}

/**ai控制 */
export interface IAI extends IFrame {
    Xunluo(path: number[]): void;
    Working(nodes?: { x: number, y: number }[]): void;
    Rest(): void;
}
