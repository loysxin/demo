import { Label, WebView } from "cc";
import { Panel } from "../../GameRoot";
import { BeforeGameUtils } from "../../utils/BeforeGameUtils";

export class SafeProtPanel extends Panel {
    protected prefab: string = "prefabs/ui/SafeProtPanel";
    private titleLab:Label;
    private webView:WebView;
    private urlInfo:{[key: string]: {title:string, url:string}} = BeforeGameUtils.toHashMapObj(
        1, {title:"隐私政策", url:"https://static.kp-meta.com/kpmeta/game/gamefi001/product/permission.htm"},
        2, {title:"许可及服务协议", url:"https://static.kp-meta.com/kpmeta/game/gamefi001/product/user.htm"},
        
    );
    protected onLoad() {
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
        this.titleLab = this.find("titleLab", Label);
        this.webView = this.find("WebView", WebView);
    }

    public flush(type:number = 1) {
        let info:{title:string, url:string} = this.urlInfo[type];
        this.titleLab.string = info.title;
        this.webView.url = info.url;
        console.log("打开安全协议------>" + info.url)
    }

    
    protected onShow(): void {
        
    }
    protected onHide(...args: any[]): void {
        
    }
}
