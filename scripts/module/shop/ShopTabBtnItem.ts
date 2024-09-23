import { Button, Component, Label, Node } from "cc";
import { ConsumeItem } from "../common/ConsumeItem";
import { StdShopGroup } from "../../manager/CfgMgr";

export class ShopTabBtnItem extends Component {
    private defCont:Node;
    private defTabNameLab:Label;
    private selectCont:Node;
    private selectNameLab:Label;
    private isInit:boolean = false;
    private data:StdShopGroup;
    protected onLoad(): void {
        this.defCont = this.node.getChildByPath("defCont");
        this.defTabNameLab = this.node.getChildByPath("defCont/defTabNameLab").getComponent(Label);
        this.selectCont = this.node.getChildByPath("selectCont");
        this.selectNameLab = this.node.getChildByPath("selectCont/selectTabNameLab").getComponent(Label);
        this.isInit = true;
        this.updateShow();
    }
    
    SetData(data:StdShopGroup) {
        this.data = data;
        this.updateShow();
        
    }

    private updateShow() {
        if(!this.isInit || !this.data) return;
        this.defTabNameLab.string = this.data.ShopName;
        this.selectNameLab.string = this.data.ShopName;
    }
}