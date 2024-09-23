import { Button, EditBox, JsonAsset, Game, Input, Label, Node, Widget, profiler, RenderTexture, native } from "cc";
import { Panel } from "../../GameRoot";
import { Tips } from "./Tips";
import LocalStorage from "../../utils/LocalStorage";
import { CfgMgr } from "../../manager/CfgMgr";
import { GameSet, ServerCfg } from "../GameSet";
import { Selector } from "../../editor/skill/Selector";
import { GetNickName, GetUserCode, hasSdk } from "../../Platform";
import { AudioGroup, AudioMgr, LoginSundBGM, SoundDefine } from "../../manager/AudioMgr";
import { ResMgr, folder_bgm } from "../../manager/ResMgr";
import { SSettingData } from "../roleModule/PlayerData";
import { FilmMaker } from "../../manager/FilmMaker";

export class LoginPanel extends Panel {
    protected prefab: string = "prefabs/ui/Login";

    private selector: Selector;
    private input: EditBox;
    protected selectServerCfg: ServerCfg;
    private callback: Function;
    protected async onLoad() {
        this.SetLink(undefined);
        this.selector = this.find("frame/Selector", Selector);
        this.input = this.find("frame/input", EditBox);
        this.find("frame/loginBtn").on(Input.EventType.TOUCH_END, this.onLogin, this);

        let host = LocalStorage.GetString("LocalServer", "http://192.168.0.118:7880");
        let list = CfgMgr.Get("server_list");

        let selectServer = LocalStorage.GetNumber("prev_select_server", 0);//默认精英服
        this.selectServerCfg = list ? list[selectServer] : undefined;

        GameSet.Local_host = host;
        console.log("LoginPanel.onLoad", GameSet.Local_host);
        this.selector.string = host;

        this.selector.Init(list, (item: Node, data: any) => {
            let desc = data.Host;
            if (data.Desc) desc = "(" + data.Desc + ")" + data.Host;
            let label = item.getComponent(Label);
            if (!label) {
                item.getComponent(EditBox).string = desc;
            } else {
                label.string = desc;
            }
        });
        this.selector.node.on('select', this.onSelect, this);

        let str = LocalStorage.GetString("userCode");
        if (str) {
            this.input.string = str;
        }

        AudioMgr.PlayCycle(LoginSundBGM);
    }

    protected onSelect(data: any, itemData?: any) {
        if (itemData) {
            this.selectServerCfg = itemData;
        }
        GameSet.Local_host = data.replace(/\(.*\)/, "");
        console.log("onSelect", GameSet.Local_host);
        LocalStorage.SetString("LocalServer", GameSet.Local_host);
    }

    protected onShow(): void {


    }
    public flush(callBack: Function): void {
        this.callback = callBack;
        // if (hasSdk()) {
        //     this.input.string = GetNickName() || "";
        //     this.input.enabled = false;
        // } else {
        //     this.input.enabled = true;
        // }
    }
    protected onHide(...args: any[]): void {
        AudioMgr.Stop(LoginSundBGM);
    }

    onLogin() {
        let userCode = this.input.string;
        if (hasSdk() && GetUserCode()) {
            GameSet.usecode = GetUserCode();;
        } else {
            GameSet.usecode = userCode;
        }
        if (GameSet.usecode.indexOf("wyc") == 0) {
            profiler.showStats();
        } else {
            profiler.hideStats();
        }
        if (!userCode) {
            Tips.Show("请输入合法token");
        } else {
            if (this.selectServerCfg) {
                let list = CfgMgr.Get("server_list");
                let index = list.indexOf(this.selectServerCfg);
                if (index != -1) LocalStorage.SetNumber("prev_select_server", index);
                CfgMgr.InitServerCfg(this.selectServerCfg.Mark);
            }
            LocalStorage.SetString("userCode", userCode);
            window['usercode'] = GameSet.usecode;
            this.callback(userCode);
            // this.Hide();
        }
    }
}