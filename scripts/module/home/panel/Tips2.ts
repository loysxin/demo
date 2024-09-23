import { RichText, ScrollView, UITransform, Node, Widget} from "cc";
import { Panel } from "../../../GameRoot";
import { CfgMgr } from "../../../manager/CfgMgr";

export class Tips2 extends Panel {
    protected prefab: string = "prefabs/ui/Tips2";
    private ScrollView: ScrollView

    private label: RichText;
    private scroll_max_height = 670;
    protected onLoad(): void {
        this.label = this.find("frame/ScrollView/view/content/label", RichText);
        this.ScrollView = this.find("frame/ScrollView", ScrollView);
        this.CloseBy("frame/topCont/close");
        this.CloseBy("mask");
    }

    protected onShow(): void {

    }
    public flush(id: number): void {
        let str: string = CfgMgr.GetLanguageById(id)
        let result = str.replace(/\\n/g, '\n');
        this.label.string = result;
        let listUi:UITransform = this.ScrollView.getComponent(UITransform);
        let labH:number = this.label.node.getComponent(UITransform).height;
        listUi.height = labH >= this.scroll_max_height ? this.scroll_max_height : labH;
        let view:Node = this.find("frame/ScrollView/view");
        let viewWidget:Widget = view.getComponent(Widget);
        viewWidget.updateAlignment();
        this.ScrollView.scrollToTop(0.01);
    }
    protected onHide(...args: any[]): void {

    }

    private onLabSizeChange():void{
        console.log("-------->" + this.label.node.getComponent(UITransform).height)
    }
}