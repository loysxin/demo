import { _decorator, Component, EditBox, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SkillCfgLine')
export class SkillCfgLine extends Component {
    private params: EditBox[];
    protected onLoad(): void {
        this.params = [];
        let layout = this.node.getChildByName("layout");
        let children = layout.children;
        for (let child of children) {
            // child.on("editing-did-ended", this.onInput, this);
            let input = child.getComponent(EditBox);
            this.params.push(input);
        }
    }
    start() {

    }

    update(deltaTime: number) {

    }
}


