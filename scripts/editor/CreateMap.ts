import { _decorator, AssetManager, Button, Component, EditBox, ImageAsset, instantiate, Label, Node, Prefab, Tween, tween, Vec3 } from 'cc';
import { Item } from './Item';
import { SceneEditor } from './SceneEditor';
import { EvtPass } from '../utils/Utils';
import LocalStorage from '../utils/LocalStorage';
import { ResMgr } from '../manager/ResMgr';
import { CfgMgr } from '../manager/CfgMgr';
import Logger from '../utils/Logger';
const { ccclass, property } = _decorator;

@ccclass('CreateMap')
export class CreateMap extends Component {
    @property({ type: EditBox, displayName: '横切图 数量' })
    HEditBox: EditBox = null;
    @property({ type: EditBox, displayName: '竖切图 数量' })
    SEditBox: EditBox = null;
    @property({ type: EditBox, displayName: '单个切图宽高' })
    KEditBox: EditBox = null;

    @property({ type: EditBox, displayName: '单格子宽' })
    cellKEditBox: EditBox = null;
    @property({ type: EditBox, displayName: '单格子高' })
    cellGEditBox: EditBox = null;

    @property({ type: Prefab, displayName: 'mapItem' })
    mapItem: Prefab = null;

    @property({ type: Node, displayName: "地图" })
    private content: Node = null;

    @property({ type: Label, displayName: "地图名字" })
    private mapName: Label = null;
    scorle: Node;
    isMove: boolean = false;
    selecter: any;

    start() {
        let sure = this.node.getChildByName('sure');
        sure.on(Button.EventType.CLICK, this.onClick, this)
        let cancel = this.node.getChildByName('cancel');
        cancel.on(Button.EventType.CLICK, this.hide, this)
        let mapName = this.node.getChildByName('mapName');
        mapName.on(Button.EventType.CLICK, this.showMap, this)

        this.scorle = this.node.getChildByPath('mapName/ScrollView');

    }

    /**
     * 点击确定
     */
    async onClick() {
        let data = {
            h: this.HEditBox.string,
            s: this.SEditBox.string,
            k: this.KEditBox.string,
            cellK: this.cellKEditBox.string || 64,
            cellG: this.cellGEditBox.string || 32,
            name: this.mapName.string
        }
        Logger.log("onclick", Number(data.h) && Number(data.k) && Number(data.s) && data.name.length > 0 && Number(data.cellK) && Number(data.cellG));
        if (Number(data.h) && Number(data.k) && Number(data.s) && data.name.length > 0 && Number(data.cellK) && Number(data.cellG)) {

            let ab = AssetManager.instance.getBundle("res");
            let files = ab.getDirWithPath("home/" + this.selecter.Style);
            for (let i = files.length - 1; i >= 0; i--) {
                let file = files[i];
                if (file.ctor != ImageAsset) files.splice(i, 1);
            }
            files.sort((a, b) => {
                if (!a['fileName']) a['fileName'] = a.path.split("/").pop();
                if (!b['fileName']) b['fileName'] = b.path.split("/").pop();
                return Number(a['fileName'].replace(/.*\//, "").replace(/[^0-9]/g, "")) - Number(b['fileName'].replace(/.*\//, "").replace(/[^0-9]/g, ""));
            });
            let imgs = [];
            for (let file of files) {
                let name = file['fileName'];
                imgs.push("home/" + this.selecter.Style + "/" + name);
            }
            // let info = {
            //     size: data.k,
            //     col: data.h,
            //     tiles: imgs,
            //     name: data.name,
            // }
            // EventMgr.instance.dispatch('CreateMap', info);

            let cfg = CfgMgr.Get("homeland_building");
            let list = [];
            for (let k in cfg) {
                let obj = cfg[k];
                if (obj.HomeId == this.selecter.HomeId) {
                    list.push(obj);
                }
            }
            SceneEditor.ins.CreateNew(this.selecter, list);
            let col = Number(data.h);
            let urls: string[] = [];
            for (let i = 0; i < imgs.length;) {
                urls.unshift(...imgs.slice(i, i + col));
                i += col;
            }
            Logger.log("===", urls);
            SceneEditor.ins.ResetTile(Number(data.k)*.666, col, urls, Number(data.cellK), Number(data.cellG));
            this.hide();
        } else {
            Logger.log('输入不合法，请检查')
        }
    }

    /**
     * 数据排序
     * @param data 
     * @returns 
     */
    sortMap(data) {
        let map = new Map();
        for (let i = 0; i < data.length; i++) {
            let info: string = data[i];
            let arr = info.split('_')[1].split('.');
            let key = Number(arr[0]);
            map.set(key, info);
        }
        let newMap = this.mapComparingByKey(map, true);
        let arr = [];
        newMap.forEach(function (value, key) {
            arr.push(value);
        });
        return arr;
    }

    /**
     * map按key排序
     * @param map 
     * @param isUp 是否升序
     * @returns 
     */
    mapComparingByKey(map: Map<number, any>, isUp: boolean) {
        const arrMap = Array.from(map.entries());
        arrMap.sort((a, b) => {
            //0下标对应key
            if (isUp) {
                return a[0] - b[0];
            } else {
                return b[0] - a[0];
            }
        });
        const newMap = new Map(arrMap);
        return newMap;
    }

    /**
     * 显示节点
     */
    show() {
        this.node.active = true;
        this.getInfo();
        this.HEditBox.string = LocalStorage.GetString('HEditBox') || '';
        this.SEditBox.string = LocalStorage.GetString('SEditBox') || '';
        this.KEditBox.string = LocalStorage.GetString('KEditBox') || '';
        this.cellKEditBox.string = LocalStorage.GetString('cellKEditBox') || '';
        this.cellGEditBox.string = LocalStorage.GetString('cellGEditBox') || '';
    }

    /**
     * 显示或者关闭地图类型选择框
     * @returns 
     */
    showMap() {
        if (this.isMove) return;
        this.isMove = true;
        if (this.scorle.scale.y == 0) {
            tween(this.scorle).to(0.3, { scale: new Vec3(1, 1, 1) }).call(() => {
                this.isMove = false;
            }).start();
        } else {
            tween(this.scorle).to(0.3, { scale: new Vec3(1, 0, 1) }).call(() => {
                this.isMove = false;
            }).start();
        }
    }

    /**
     * 获取地图信息
     */
    async getInfo() {
        let cfg = CfgMgr.Get("homeland_init");
        let lst = [];
        for (let k in cfg) lst.push(cfg[k]);
        this.updateContent(lst)
    }

    /**
     * 更新content列表
     * @param data 
     */
    updateContent(data) {
        for (let index = 0; index < data.length; index++) {
            let info = data[index];
            let node = instantiate(this.mapItem);
            node.getComponent(Item).show(info, (info, str) => {
                Logger.log('info', info)
                this.mapName.string = str;
                this.selecter = info;
                this.scorle.scale = new Vec3(1, 0, 1);
                this.isMove = false;
            })
            this.content.addChild(node);
        }
    }

    editboxEnd(event) {
        let name = event.node.name;
        switch (name) {
            case "HEditBox":
                LocalStorage.SetString('HEditBox', this.HEditBox.string)
                break;
            case "SEditBox":
                LocalStorage.SetString('SEditBox', this.SEditBox.string)
                break;
            case "KEditBox":
                LocalStorage.SetString('KEditBox', this.KEditBox.string)
                break;
            case "cellKEditBox":
                LocalStorage.SetString('cellKEditBox', this.cellKEditBox.string)
                break;
            case "cellGEditBox":
                LocalStorage.SetString('cellGEditBox', this.cellGEditBox.string)
                break;
            default:
                break;
        }
    }

    /**
     * 隐藏节点
     */
    hide() {
        this.content.removeAllChildren();
        this.node.active = false;
        this.HEditBox.string = '';
        this.KEditBox.string = '';
        this.mapName.string = '';
        this.selecter = undefined;
        Tween.stopAllByTarget(this.node);
        this.scorle.scale = new Vec3(1, 0, 1);
    }

    update(deltaTime: number) {

    }
}


