import { IEntity } from "../../module/home/entitys/IEntity"
import { LikeNode } from "../../module/home/MapData";
import { SBattleSoldier } from "../../module/roleModule/PlayerData";

export type Deployment =
    {
        ID: string,
        Role: IEntity,
        Index: number,
        Type: number,
        MaxCount: number,
        SoldierType: number[],
        BattlePower: number,
        IsAssist: boolean,
        pos: LikeNode,
        LeaderShip: number,
        Soldiers?: SBattleSoldier[],
    }


export type SliderValue = {
    id: number, // 士兵ID
    count: number,
    max: number,
    index: number,
    kucun: number,
}
