import { _decorator, Component, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CollectProgress')
export class CollectProgress extends Component {
    @property({ type: Sprite, displayName: "收集进度条" })
    progress: Sprite = null;

    @property({ type: Sprite, displayName: "收集的物品" })
    item: Sprite = null;

    onLoad() {
        this.progress = this.node.getChildByName('progress').getComponent(Sprite);
        this.item = this.node.getChildByName('item').getComponent(Sprite);
        this.progress.fillRange = 1;
    }

    init() {

    }

    update(deltaTime: number) {

    }
}


