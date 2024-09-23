import { Prefab, instantiate, v3, Node, Vec3 } from "cc";
import { ResMgr } from "../manager/ResMgr";
import { BuildProgress } from "./home/panel/BuildProgress";
import { CollectProgress } from "./home/panel/CollectProgress";

export class LoadRes {
    public static building = [];
    public static async LoadBuildProgress(parent: Node, pos: Vec3, time: number, callBack: Function) {
        let prefabUrl: string = 'prefabs/home/BuildProgress';
        let build: Prefab = await ResMgr.GetResources(prefabUrl);
        let buildNode = instantiate(build);
        buildNode.parent = parent;
        let buildProgress = buildNode.addComponent(BuildProgress);
        buildProgress.init(pos, time, callBack);
        this.building.push(buildProgress);
    }

    public static closeBuildProgress() {
        for (let i = 0; i < this.building.length; i++) {
            this.building[i].closeTime();
        }
        this.building = [];
    }

    public static async LoadCollectProgress(parent: Node, callBack: Function) {
        let prefabUrl: string = 'prefabs/home/CollectProgress';
        let collect: Prefab = await ResMgr.GetResources(prefabUrl);
        let collectNode = instantiate(collect);
        collectNode.parent = parent;
        let collectProgress = collectNode.addComponent(CollectProgress);
        collectProgress.init();
    }
}


