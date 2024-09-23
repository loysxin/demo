import { DEV, IOS } from "cc/env";
import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { GetUserCode, autoLogin, debugLogin, getAdcfg, hasSdk } from "../../Platform";
import { EventMgr, Evt_Map_Tile_Complete, Evt_ReConnect, Evt_ReConnect_Success, Evt_ReLogin, Evt_Show_Scene } from "../../manager/EventMgr";
import { GetLoginInfo, Http, SendChaoyouToken } from "../../net/Http";
import { Session } from "../../net/Session";
import LocalStorage from "../../utils/LocalStorage";
import Logger from "../../utils/Logger";
import { GameSet } from "../GameSet";
import { ChangeScenePanel } from "../home/ChangeScenePanel";
import { LoginPanel } from "./LoginPanel";
import { Second } from "../../utils/Utils";
import { AdHelper } from "../../AdHelper";
import { WaitPanel } from "./WaitPanel";
import { Game, game } from "cc";
import { MsgPanel } from "../common/MsgPanel";
import { ServerPanel } from "./ServerPanel";
import { ResMgr } from "../../manager/ResMgr";

export class LoginModule {
    private serverInfo: any;
    private loginning = false;
    constructor() {
        Session.on(MsgTypeRet.VerifyTokenRet, this.onLogin, this);
        EventMgr.on(Evt_ReLogin, this.onRelogin, this);
        EventMgr.on(Evt_ReConnect, this.reconnect, this);
        game.on(Game.EVENT_SHOW, this.onShow, this);

        if (autoLogin()) {
            GameSet.Local_host = "http://113.45.139.51:7880";
            this.login();
        } else if (ResMgr.HasResource("config/channel_cfg") && !DEV && !debugLogin()) {
            ServerPanel.Show(this.login.bind(this));
        } else {
            LoginPanel.Show(this.login.bind(this));
        }
    }

    protected onShow() {
        console.log("Game.EVENT_SHOW", Session.connectting, Session.hasConnected);
        if (Session.connectting) return;
        if (GameSet.GateUrl && GameSet.Token && !Session.hasConnected) {
            this.reconnect();
        }
    }

    protected onRelogin() {
        if (ResMgr.HasResource("config/channel_cfg") && !DEV && !debugLogin()) {
            ServerPanel.Show(this.login.bind(this));
        } else {
            LoginPanel.Show(this.login.bind(this));
        }
    }

    async login() {
        if (this.loginning) return;

        GameSet.Reconnect = false;
        let code = GetUserCode();
        console.log("###login", hasSdk());

        const loginFunc = this.login.bind(this);
        let uri = GetLoginInfo;
        if (hasSdk()) uri = SendChaoyouToken;
        console.log("loginSdk###", JSON.stringify(GameSet.Server_cfg));
        let thisObj = this;
        this.loginning = true;
        this.serverInfo = await Http.Send(uri, { code: code });
        console.log('loginInfo', this.serverInfo);
        if (!this.serverInfo || !this.serverInfo.gate_url || !this.serverInfo.gate_url.length) {
            MsgPanel.Show("请求失败，请重试！");
            if (ResMgr.HasResource("config/channel_cfg") && !DEV && !debugLogin()) {
                ServerPanel.Show(loginFunc, true);
            } else {
                LoginPanel.Show(this.login.bind(this));
            }
            this.loginning = false;
            return;
        }

        await ChangeScenePanel.PlayEffect(Evt_Map_Tile_Complete);
        GameSet.Token = this.serverInfo.token;
        GameSet.GateUrl = this.serverInfo.gate_url;
        if (Session.hasConnected || Session.connectting) {
            await Session.Close();
            await Second(0.1);
        }
        try {
            Session.Build(this.serverInfo.gate_url, () => {
                thisObj.loginning = false;
                let data = {
                    type: "0_VerifyToken",
                    data: {
                        token: GameSet.Token,
                    }
                }
                Session.Send(data);
            }, () => { });
        } catch (e) {
            console.error(e);
        }
    }

    private prevConnect = 0;
    async reconnect() {
        console.log("reconnect", Session.connectting, Session.hasConnected, Session.closeDuration, this.prevConnect);
        if (Session.connectting) return;
        WaitPanel.Show();
        if (Session.hasConnected) {
            await Session.Close();
        }
        while (game.totalTime - this.prevConnect < 1000) {
            await Second(1);
        }
        this.prevConnect = game.totalTime;
        GameSet.Reconnect = true;
        try {
            Session.Build(GameSet.GateUrl, () => {
                EventMgr.emit(Evt_ReConnect_Success);
                WaitPanel.Hide();
                let data = {
                    type: "0_VerifyToken",
                    data: {
                        token: GameSet.Token,
                    }
                }
                Session.Send(data);
            }, () => { });
        } catch (e) {
            console.error(e);
            GameSet.Reconnect = false;
        }
    }

    async onLogin() {
        console.log("登录成功!");
        let data = {
            type: MsgTypeSend.GetPlayerData,
            data: {}
        }
        Session.Send(data);
        Session.startHeartbeat();
    }
}
