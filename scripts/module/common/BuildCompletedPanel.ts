import { _decorator, Component, Input, Label, Node, Sprite, SpriteFrame, tween, UITransform, v3, view } from 'cc';
import { Panel } from '../../GameRoot';
import { ResMgr } from '../../manager/ResMgr';
import { CfgMgr } from '../../manager/CfgMgr';
import { GetBuildingIcon } from './BaseUI';
import { BuildingType } from '../home/HomeStruct';
const { ccclass, property } = _decorator;

@ccclass('BuildCompletedPanel')
export class BuildCompletedPanel extends Panel {
    protected prefab: string = "prefabs/ui/BuildCompletedPanel";
    protected type: number;
    protected homeId: number;
    protected callBack: Function;
    protected mask: Node;
    protected btn: Node;
    protected desc: Node;
    protected spriteSplash: Node;
    protected effcet: Node;
    protected title: Node;
    protected buildId: any;
    protected icon: Sprite;

    protected onLoad(): void {
        this.btn = this.find('btn');
        this.mask = this.find('mask');
        this.desc = this.find('desc');
        this.spriteSplash = this.find('SpriteSplash');
        this.title = this.find('title');
        this.effcet = this.find('bgEffect');
        this.icon = this.find("buildingIcon", Sprite);
    }
    protected onShow() {
    }

    public async flush(homeId: number, buildType: number, callBack: Function, buildingId: number) {
        this.homeId = homeId;
        this.type = buildType;
        this.callBack = callBack;
        this.buildId = buildingId;

        let stddefine = CfgMgr.GetBuildingUnLock(this.buildId);
        this.node.getChildByName('lab').getComponent(Label).string = stddefine.Desc;
        this.node.getChildByPath('desc/name').getComponent(Label).string = stddefine.remark
        this.btn.on(Input.EventType.TOUCH_END, this.close, this)
        this.mask.on(Input.EventType.TOUCH_END, this.close, this)
        this.icon.spriteFrame = await ResMgr.LoadResAbSub(GetBuildingIcon(this.buildId, 1), SpriteFrame);
        if (buildType == BuildingType.fang_yu_ta) {
            this.icon.node.setScale(2.2, 2.2, 1);
        } else if (buildType == BuildingType.cheng_qiang) {
            this.icon.node.setScale(1, 1, 1);
        } else {
            this.icon.node.setScale(.6, .6, 1);
        }
        this.showUI(true);
    }
    protected onHide(...args: any[]): void {

    }

    close() {
        this.Hide();
        this.callBack && this.callBack();
    }

    showUI(v: boolean) {
        this.btn.active = v;
        this.mask.active = v;
        this.desc.active = v;
        this.spriteSplash.active = v;
        this.title.active = v;
        this.effcet.active = v;
    }
}


