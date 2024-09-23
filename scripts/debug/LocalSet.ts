import { Camera, Canvas, NodeActivator, find, game } from "cc";
import { SceneCamera } from "../module/SceneCamera";
import { HomeLogic } from "../module/home/HomeLogic";
import { Session } from "../net/Session";

export class LocalSet {
    constructor() {
        window['Shake'] = SceneCamera.Shake.bind(SceneCamera);
        window['ResetHome'] = (homeId: number) => {
            HomeLogic.ins.EnterMyHomeScene(homeId);
        }
        window["restart"] = () => {
            game.restart();
        }
        window["hideScene"] = () => {
            let camera = find("SceneCanvas/HomeScene/Camera").getComponent(Camera);
            camera.enabled = false;
        }
        window["closeSession"] = () => {
            Session.Close(true);
        }

        // 测试
        // let ticks: { [uuid: string]: number } = {};
        // let func = NodeActivator.prototype.activateNode.bind(NodeActivator.prototype);
        // NodeActivator.prototype.activateNode = function (node, isActive) {
        //     let tick = ticks[node.uuid] || 0;
        //     if (tick - game.totalTime <= 100) console.log(node.getPathInHierarchy());
        //     func(node, isActive);
        // }
    }
}

