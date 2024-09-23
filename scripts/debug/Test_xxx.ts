import { _decorator, assetManager, Camera, Component, EventKeyboard, EventMouse, EventTouch, find, Graphics, input, Input, instantiate, JsonAsset, Label, math, Node, ResolutionPolicy, resources, sp, Sprite, SpriteFrame, Tween, tween, UITransform, v3, View } from 'cc';
import * as fgui from 'fairygui-cc';
import { ResMgr } from '../manager/ResMgr';

const { ccclass, property } = _decorator;

@ccclass('Test_xxx')
export class Test_xxx extends Component {

    @property(Node)
    layout: Node;

    private canvas: Node;

    protected onLoad(): void {

    }

    protected async start() {
        // 加载ab包
        await ResMgr.PrevLoad();
        let node = this.node.parent.getChildByName("ani");
        // let item = instantiate(node);
        // this.node.parent.addChild(item);
        // item.active = true;
        // let ske = item.getComponent(sp.Skeleton);

        // ske.setAnimation(0, "animation", false);

        this.node.parent.active = false;
        let item2 = instantiate(node);
        this.node.parent.addChild(item2);
        item2.active = true;
        let ske2 = item2.getComponent(sp.Skeleton);
        console.log(ske2.skeletonData)
        console.log(ske2._skeleton)

        ske2.setAnimation(0, "animation", false);
        this.node.parent.active = true;

    }


}
