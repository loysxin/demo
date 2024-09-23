import { _decorator, AssetManager, Button, Component, ImageAsset, instantiate, JsonAsset, Label, Node, path, Prefab, Scene } from 'cc';
import { Item } from './Item';
import { SceneEditor } from './SceneEditor';
import { ResMgr } from '../manager/ResMgr';
import { CfgMgr, StdDefineBuilding } from '../manager/CfgMgr';
import { BuildingLayout, BuildingType } from '../module/home/HomeStruct';
import { SceneCamera } from '../module/SceneCamera';
import Logger from '../utils/Logger';
const { ccclass, property } = _decorator;

const LoadMap = 1;
const AddBuilding = 2;

@ccclass('BuildMap')
export class BuildMap extends Component {
    @property({ type: Node, displayName: "地图内容" })
    private content: Node = null;

    @property({ type: Node, displayName: "title" })
    private contentTitle: Node = null;

    @property({ type: Prefab, displayName: "Item" })
    private Item: Prefab = null;

    @property({ type: Prefab, displayName: "CItem" })
    private CItem: Prefab = null;


    selectInfo: string = '';
    type: number
    title: Node;
    homeId: number;
    protected onLoad(): void {
        this.title = this.node.getChildByName('title');
    }
    start() {
        let sure = this.node.getChildByName('sure');
        sure.on(Button.EventType.CLICK, this.onClick, this)
        let cancel = this.node.getChildByName('cancel');
        cancel.on(Button.EventType.CLICK, this.hide, this)
    }


    private getBuildStds(type?: number) {
        if (!this.homeId) return [];
        let results: StdDefineBuilding[] = [];
        let stds: StdDefineBuilding = CfgMgr.Get("homeland_building");
        for (let k in stds) {
            let std = stds[k];
            if (std.HomeId == this.homeId) {
                if (type == undefined || std.BuildingType == type) {
                    results.push(std);
                }
            }
        }
        return results;
    }

    /**
     * 显示节点
     * @param type 1:导入地图 2:放置建筑
     */
    async Show(type: number) {
        this.type = type;
        let ab = AssetManager.instance.getBundle("res");
        if (this.type == LoadMap) {
            let url = 'config/home';
            this.title.getComponent(Label).string = '地图列表';
            let files = ab.getDirWithPath(url);
            let jsons = [];
            for (let file of files) {
                if (file.ctor == JsonAsset) {
                    let jsonAsset = await ResMgr.LoadResAbSub(file.path, JsonAsset);
                    let json = jsonAsset.json;
                    jsons.push({ HomeId: json.homeId, Style: path.basename(file.path) });
                }
            }
            this.updateContent(jsons);
        } else {
            let url = 'home/buildings';
            this.title.getComponent(Label).string = '建筑列表';
            let files = ab.getDirWithPath(url);
            let types = [];
            for (let file of files) {
                if (file.ctor == ImageAsset && file.path.indexOf("_shadow") == -1) {
                    let dir = file.path.replace("home/buildings/", "").split("/")[0];
                    if (types.indexOf(dir) == -1) types.push(dir);
                }
            }
            this.contentTitle.removeAllChildren();
            for (let i = 0; i < types.length; i++) {
                let name = types[i];
                let item = instantiate(this.CItem);
                this.contentTitle.addChild(item);
                item.getChildByName('Label').getComponent(Label).string = name;
                item.active = true;
                item.on(Button.EventType.CLICK, async () => {
                    let files = ab.getDirWithPath('home/buildings/' + name + '/');
                    let urls = [];
                    for (let file of files) {
                        if (file.ctor == ImageAsset && file.path.indexOf("_shadow") == -1) {
                            urls.push(file.path);
                        }
                    }
                    Logger.log('获取资源路径', name, urls);
                    this.updateContent(urls);
                }, this)
            }
        }
        this.node.active = true;
    }

    /**
     * 更新content列表
     * @param datas 
     */
    private updateContent(datas) {
        this.content.removeAllChildren();
        for (let index = 0; index < datas.length; index++) {
            let info = datas[index];
            let node = instantiate(this.Item);
            let type = this.type;
            let thisObj = this;
            //监听点击事件
            node.getComponent(Item).show(info, (info) => {
                Logger.log('选择了', info)
                thisObj.selectInfo = info;
                if (type == LoadMap) {
                    thisObj.homeId = thisObj.selectInfo['HomeId'];
                    SceneEditor.ins.LoadMap(thisObj.selectInfo['Style']);
                } else {
                    let filename = path.basename(thisObj.selectInfo);
                    let folder = path.dirname(thisObj.selectInfo).split("/").pop();
                    let buildingType = BuildingType[folder];
                    let stds = thisObj.getBuildStds(buildingType);
                    let std: any;
                    for (let obj of stds) {
                        if (!SceneEditor.ins.HasBuilding(obj.BuildingId)) {
                            std = obj;
                            break;
                        }
                    }
                    Logger.log("addbuilding===", folder, buildingType, std, stds);
                    let p = SceneCamera.instance.node.position;
                    let cfg: BuildingLayout = {
                        buildingId: std ? std.BuildingId : 0,
                        type: BuildingType[folder],
                        name: std ? std.remark : "",
                        url: thisObj.selectInfo,
                        x: p.x,
                        y: p.y,
                        trans: []
                    }
                    Logger.log("updateContent", folder, cfg);
                    SceneEditor.ins.AddBuilding(thisObj.selectInfo, cfg);
                }
                thisObj.hide();
            })
            this.content.addChild(node);
        }
    }

    /**
     * 点击确定
     */
    private onClick() {
        if (this.selectInfo) {
            let event = '';
            event = this.type == 1 ? 'LoadMap' : 'BuildMap';
            this.hide();
        } else {
            Logger.log('请选择-----')
        }
    }

    /**
     * 隐藏节点
     */
    private hide() {
        this.content.removeAllChildren();
        this.contentTitle.removeAllChildren();
        this.selectInfo = undefined;
        this.node.active = false;
    }
}


