import { Node } from "cc";

export interface IPointTo extends Node {
    Update(target: Node, msg: string[], angle: number, offset: number[], size: number[], ...param: any[]): void; // 更新指引
    Pause(value: boolean): void; // 暂停指引
    Receive(): void;
}