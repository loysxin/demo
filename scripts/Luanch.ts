import { _decorator, Component, find, Camera, UITransform, ViewGroup } from 'cc';
import { ResMgr } from './manager/ResMgr';
import { GameRoot } from './GameRoot';
import { App } from './App';
import { Platform } from './Platform';
import { SceneCamera } from './module/SceneCamera';
import { GameSet } from './module/GameSet';
import { SSettingData } from './module/roleModule/PlayerData';
import LocalStorage from './utils/LocalStorage';
import { AudioGroup, AudioMgr } from './manager/AudioMgr';
import { VideoPanel } from './VideoPanel';
import { HTML5 } from 'cc/env';
const { ccclass, property } = _decorator;


@ccclass('Luanch')
export class Luanch extends Component {
    private static instance: Luanch;

    protected onLoad(): void {

        console.log("Luanch onLoad");

        if (Luanch.instance) {
            Luanch.instance.destroy();
        }
        Luanch.instance = this;
        // profiler.hideStats();//隐藏左下角的调试信息

        let size = find("SceneCanvas/bg").getComponent(UITransform).contentSize;
        console.log("Cavas.size", GameSet.SceneCanvasWidth, GameSet.SceneCanvasHeight);
        if (GameSet.SceneCanvasWidth > size.width || GameSet.SceneCanvasHeight > size.height) {
            let scale = Math.max(GameSet.SceneCanvasWidth / size.width, GameSet.SceneCanvasHeight / size.height);
            find("SceneCanvas/bg").setScale(scale, scale);
        } else {
            find("SceneCanvas/bg").setScale(1, 1);
        }
        let data: SSettingData = LocalStorage.GetObject("Setting_Data");
        if (!data) {
            data = { bgmIsOpen: true, soundIsOpen: true };
            LocalStorage.SetObject("Setting_Data", data);
        }
        AudioMgr.All(!data.bgmIsOpen, AudioGroup.Music);
        AudioMgr.All(!data.soundIsOpen, AudioGroup.Sound);
        AudioMgr.All(!data.soundIsOpen, AudioGroup.Skill);
    }

    /**
     * 开始
     */
    async start() {

        console.log("Luanch start");

        // 加载ab包
        await ResMgr.PrevLoad();

        // 创建游戏显示框架
        new GameRoot(find("Canvas"));

        // 设置摄像机        
        let canvas = find("SceneCanvas");
        let camera = find("SceneCanvas/Camera").getComponent(Camera);
        SceneCamera.Init(camera, canvas);

        // 平台相关
        await Platform.Init();

        let video_complete = LocalStorage.GetString("video_complete");
        if (!video_complete || video_complete == "") {
            let success: Function;
            let p = new Promise((resolve, reject) => {
                success = resolve;
            });
            console.log("video Show");
            VideoPanel.ShowTop(success);
            await p;
            LocalStorage.SetString("video_complete", "true");
        }
        console.log("video Pass");

        // 实例化游戏app主题
        new App();
    }

    protected update(dt: number): void {
        GameSet.Update(dt);
    }
}
