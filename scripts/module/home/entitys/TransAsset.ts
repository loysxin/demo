import { Node, Vec2, sp } from "cc";
import { GameObj } from "../../../GameRoot";
import { LikeNode, map } from "../MapData";
import { Mathf } from "../../../utils/Utils";
import { BuildingType } from "../HomeStruct";
import { HomeScene } from "../HomeScene";
import { FrameAni } from "../../../utils/FrameAni";
import { HeroMove } from "./HeroMove";
import Logger from "../../../utils/Logger";
import { EventMgr, Evt_Building_Child_Action, Evt_Map_Moving, Evt_Map_StopMove } from "../../../manager/EventMgr";
import PlayerData from "../../roleModule/PlayerData";
import { CfgMgr } from "../../../manager/CfgMgr";
import { GameSet } from "../../GameSet";

let assets_loop = 0;
let pools = {};

export class TransAsset extends GameObj {
    protected $prefab: string;
    protected body: sp.Skeleton;
    protected moveCtrl: HeroMove;
    protected lastSpeed: any;
    static pause: boolean = false;

    constructor() {
        super();
        this.moveCtrl = new HeroMove(this);
    }

    get $$static() {
        return true;
    }

    protected onLoad(): void {
        this.body = this.find("ske", sp.Skeleton);
        this.layer = GameSet.Scenelayer;
        EventMgr.on(Evt_Map_Moving, this.pauseAllSke, this);
        EventMgr.on(Evt_Map_StopMove, this.resumeAllSke, this);
    }

    private pauseAllSke() {
        this.body.paused = true;
        TransAsset.pause = true;
    }
    private resumeAllSke() {
        this.body.paused = false;
        TransAsset.pause = false;
    }

    Init(node: LikeNode) {
        this.moveCtrl.Init(node, 1);
    }

    PathTo(path: LikeNode[], speed = 1) {
        this.moveCtrl.PathTo(path, speed);

        let nowSpeed = this.moveCtrl.nowSpeed;
        if (!this.body) {
            if (nowSpeed.y > 0) {
                this.Play("Walk_Back");
            } else {
                this.Play("Walk");
            }
            this.setScale(nowSpeed.x < 0 ? 1 : -1, 1);
        }
    }

    async Play(action: string) {
        if (!this.$hasLoad) await this.loadSub;
        if (this.body.getCurrent(0).animation.name == action) return;
        this.body.setAnimation(0, action, true);
    }

    protected update(dt: number): void {
        if (TransAsset.pause) return;
        this.moveCtrl.Update(dt);
        if (!this.moveCtrl.isMoving) {
            let list: any[] = pools[this.$prefab];
            if (!list) {
                list = [];
                pools[this.$prefab] = list;
            }
            if (list.indexOf(this) == -1) {
                list.push(this);
            } else {
                console.error("TransAsset.pool");
            }
            this.parent && this.parent.removeChild(this);
            let std = CfgMgr.GetBuildingDefine(PlayerData.RunHomeId, BuildingType.ji_di)[0];
            if (this.lastSpeed) {
                // console.log("TransAssetTo---", this.lastSpeed.x > 0, this.lastSpeed.y > 0);
                if (this.lastSpeed.x > 0 && this.lastSpeed.y > 0) {
                    EventMgr.emit(Evt_Building_Child_Action, std.BuildingId, "seedlight", false);
                } else if (this.lastSpeed.x < 0 && this.lastSpeed.y > 0) {
                    EventMgr.emit(Evt_Building_Child_Action, std.BuildingId, "soillight", false);
                } else if (this.lastSpeed.x < 0 && this.lastSpeed.y < 0) {
                    EventMgr.emit(Evt_Building_Child_Action, std.BuildingId, "woodlight", false);
                } else if (this.lastSpeed.x > 0 && this.lastSpeed.y < 0) {
                    EventMgr.emit(Evt_Building_Child_Action, std.BuildingId, "waterlight", false);
                }
            }
            // EventMgr.emit(Evt_Building_Child_Action,std.BuildingId,"")
            return;
        }
        this.lastSpeed = this.moveCtrl.nowSpeed;
        if (this.lastSpeed.y > 0) {
            this.Play("Walk_Back");
        } else {
            this.Play("Walk");
        }
        this.setScale(this.lastSpeed.x < 0 ? 1 : -1, 1);
    }
}

export function TransAssetTo(type: number, ids: number[]) {
    if (TransAsset.pause) return false;
    let path = [];
    for (let id of ids) {
        path.push(map.GetGrid(id));
    }
    let url: string;
    switch (type) {
        case BuildingType.cai_kuang:
            url = "prefabs/home/buildings/Rock";
            break;

        case BuildingType.hua_fang:
            url = "prefabs/home/buildings/Seed";
            break;

        case BuildingType.cai_shui:
            url = "prefabs/home/buildings/Water";
            break;

        case BuildingType.cai_mu:
            url = "prefabs/home/buildings/Mutou";
            break;
    }
    // Logger.log("TransAssetTo", url);
    let list = pools[url];
    if (!list) {
        list = [];
        pools[url] = list;
    }
    let target: TransAsset;
    if (list.length) {
        target = list.pop();
    } else {
        assets_loop++;
        target = TransAsset.Create(url);
    }
    target.Init(path[0]);
    target.name = url.split("/").pop();
    HomeScene.ins.AddEntity(target);
    target.PathTo(path, 64);
    return true;
}