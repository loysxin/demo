import { Component, Label, Node, Sprite, SpriteFrame, Toggle, path, sp } from "cc";

export class FanyuUpItem extends Component {

    protected onLoad(): void {
    
    }

    async setData(data) {
    //    let add = this.node.getChildByPath("bg/add").getComponent(Sprite);
       let icon = this.node.getChildByPath("bg/icon").getComponent(Sprite);
       let num = this.node.getChildByPath("lbl_bg/num").getComponent(Label);
       let playerName = this.node.getChildByName("playerName").getComponent(Label);
        if (data) {
           icon.node.active = true;
           num.string = "+" + data.sussNum * 100 + "%";
           playerName.string = data.info.name;
        } else {
           icon.node.active = false;
           num.string = "+0%";
           playerName.string = "";
        }

    }




}