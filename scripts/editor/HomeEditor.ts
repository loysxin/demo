import { __private, _decorator, Button, Camera, Component, find, instantiate, Node, Prefab, ResolutionPolicy, View } from 'cc';
import { GameRoot } from '../GameRoot';
import { ResMgr } from '../manager/ResMgr';
import { CreateMap } from './CreateMap';
import { BuildMap } from './BuildMap';
import { SceneCamera } from '../module/SceneCamera';
import { SceneEditor } from './SceneEditor';
import { GridEditor } from './GridEditor';
import { Node_Wall } from '../module/home/HomeStruct';
import { CfgMgr } from '../manager/CfgMgr';
import { Tips } from '../module/login/Tips';
import Logger from '../utils/Logger';
const { ccclass, property } = _decorator;

@ccclass('HomeEditor')
export class HomeEditor extends Component {

    @property({ type: Prefab, displayName: '创建地图' })
    createMap: Prefab = null;

    @property({ type: Prefab, displayName: '导入地图' })
    buildMap: Prefab = null;

    protected async onLoad(): Promise<void> {
        // View.instance.setDesignResolutionSize(1080, 1920, ResolutionPolicy.SHOW_ALL);

        // 创建游戏显示框架
        new GameRoot(find("UICanvas"));

        let canvas = find("SceneCanvas");
        let camera = find("SceneCanvas/Camera").getComponent(Camera);
        SceneCamera.Init(camera, canvas);

        let children = this.node.getChildByName("navBar").children;
        for (let child of children) {
            child.on(Button.EventType.CLICK, this.onClick, this);
        }
    }

    async start() {
        // 加载ab包
        await ResMgr.PrevLoad();
        await SceneEditor.load();
        await CfgMgr.Load();

        let navBar = find('UICanvas/navBar');
        navBar.setSiblingIndex(0);

        SceneEditor.Show();
        SceneEditor.addCamera(SceneCamera.instance.node);
    }

    onClick(event: Event) {
        let target = event.target;
        // Logger.log(target)
        //@ts-ignore
        switch (target.name) {
            case 'create':
                Logger.log('create')
                this.showCreateMap();
                break;
            case 'load':
                Logger.log('load')
                this.showBuildMap(1);
                break;
            case 'building':
                Logger.log('building');
                this.showBuildMap(2);
                break;
            case 'grid':
                SceneEditor.ins.UnSelectBuilding();
                if (!GridEditor.ins.node.active) {
                    GridEditor.ins.StartDraw(Node_Wall);
                } else {
                    GridEditor.ins.StopDraw();
                }
                break;
            case 'addPatrol':
                SceneEditor.ins.AddPatrol();
                break;
            case 'editorPatrol':
                SceneEditor.ins.SetPatrolEditor();
                break;
            case 'atkBtn':
                SceneEditor.ins.SetAtk();
                break;
            case 'defBtn':
                SceneEditor.ins.SetDef();
                break;
            case 'camera':
                SceneEditor.ins.SetCam();
                break;
            case 'mapBtn':
                SceneEditor.ins.SetMap();
                break;
            case 'save':
                Logger.log("保存");
                SceneEditor.ins.Save();
                break;
        }
    }

    showCreateMap() {
        let panel: Node = null;
        if (this.node.getChildByName('Panel_Lay').getChildByName('CreateMap')) {
            panel = this.node.getChildByName('Panel_Lay').getChildByName('CreateMap');
        } else {
            panel = instantiate(this.createMap);
            this.node.getChildByName('Panel_Lay').addChild(panel);
        }
        panel.getComponent(CreateMap).show();
    }

    showBuildMap(type) {
        let panel: Node = null;
        if (this.node.getChildByName('Panel_Lay').getChildByName('BuildMap')) {
            panel = this.node.getChildByName('Panel_Lay').getChildByName('BuildMap');
        } else {
            panel = instantiate(this.buildMap);
            this.node.getChildByName('Panel_Lay').addChild(panel);
        }
        panel && panel.getComponent(BuildMap).Show(type);

    }

    update(deltaTime: number) {

    }

    Upload() {

    }
}
