import { Label, Node } from "cc";
import { Panel } from "../GameRoot";
import { CfgMgr, StdGuide } from "../manager/CfgMgr";
import { ComboBox } from "../utils/ComboBox";
import { EventMgr } from "../manager/EventMgr";

export class GMPanel extends Panel {
    protected prefab: string = "debug/GMPanel";

    protected onLoad(): void {
        this.CloseBy("Sprite/closeBtn");
        let cfgGuid = CfgMgr.Get("guide");
        let guides: StdGuide[] = [];
        for (let k in cfgGuid) {
            guides.push(cfgGuid[k]);
        }
        guides.sort((a, b) => { return a.ID - b.ID; });
        let comboBox = this.find("Sprite/ComboBox1", ComboBox);
        comboBox.Init(guides, (item: Node, data: StdGuide) => {
            item.getChildByName("label").getComponent(Label).string = data.ID + "";
        })
        comboBox.node.on("select", this.onSelectGuide, this);
    }

    protected onSelectGuide(data: string) {
        EventMgr.emit("gm_guide", data)
    }

    protected onShow(): void {

    }

    public flush(...args: any[]): void {

    }

    protected onHide(...args: any[]): void {

    }
}