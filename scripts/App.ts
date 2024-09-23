import { ANDROID, DEBUG, DEV, IOS } from "cc/env";
import LocalStorage from "./utils/LocalStorage";
import { CircularDependency } from "./Proxy";
import { LoginModule } from "./module/login/LoginModule";
import { LocalSet } from "./debug/LocalSet";
import { HomeScene } from "./module/home/HomeScene";
import { HomeModule } from "./module/home/HomeModule";
import { HomeUI } from "./module/home/panel/HomeUI";
import { CfgMgr } from "./manager/CfgMgr";
import { ProductionModule } from "./module/production/ProductionModule";
import { PlayerModule } from "./module/roleModule/PlayerModule";
import { SoldierModule } from "./module/soldierProduction/SoldierModule";
import { assetManager, director, game, profiler } from "cc";
import { BagModule } from "./module/bag/BagModule";
import { FanyuModule } from "./module/fanyu/FanyuModule";
import { UIGuide } from "./manager/UIGuide";
import { TradeModule } from "./module/trade/TradeModule";
import { ChangeScenePanel } from "./module/home/ChangeScenePanel";
import { TaskModule } from "./module/task/TaskModule";
import { FrienModule } from "./module/friend/FriendModule";
import { MailModule } from "./module/mail/MailModule";
import { FishingModule } from "./module/fishing/FishingModule";
import { LootModule } from "./module/loot/LootModule";
import { ShopModule } from "./module/shop/ShopModule";
import { FanyuPanel } from "./module/fanyu/FanyuPanel";
import { GameSet } from "./module/GameSet";
import { RolePanel } from "./module/role/RolePanel";
import { TradePanel } from "./module/trade/TradePanel";
import { ShopPanel } from "./module/shop/ShopPanel";
import { ResourcesPanel } from "./module/home/panel/ResourcesPanel";
import { JidiPanel } from "./module/home/panel/JidiPanel";
import { CurrencyIncomModule } from "./module/currencyIncomInfo/CurrencyIncomModule";
import { rightsModule } from "./module/rights/rightsModule";
import { GuildModule } from "./module/guild/GuildModule";
import { HoverMgr } from "./HoverMgr";

let $gameApp: any;

export class App {

    constructor() {
        if ($gameApp) {
            throw "GameApp 不可重复创建!";
        }
        $gameApp = this;
        this.init();
        // profiler.hideStats();
        // if(IOS || ANDROID) profiler.showStats();
    }

    async init() {

        console.log("version-2024-08-16 16:20");

        // 本地调试参数
        if (DEV) {
            new LocalSet();
        }

        // 加载
        // await HomeScene.load();
        // await HomeUI.load();
        // await ChangeScenePanel.load();
        await CfgMgr.Load();

        // 初始化游戏各个模块
        new PlayerModule();
        new BagModule();
        new HomeModule();
        new LoginModule();
        new ProductionModule();
        new SoldierModule();
        new FanyuModule();
        new TradeModule();
        new TaskModule();
        new FrienModule();
        new MailModule();
        new FishingModule();
        new LootModule();
        new ShopModule();
        new GuildModule();
        new CurrencyIncomModule();
        new rightsModule()
        // 引导相关
        new UIGuide();
        
        await HomeScene.load();
        await HomeUI.load();
        await ChangeScenePanel.load(); 
        await ResourcesPanel.load();
        await JidiPanel.load();
        await FanyuPanel.load();
        await RolePanel.load();
        await TradePanel.load();
        await ShopPanel.load();

        GameSet.maxConcurrency = assetManager.downloader.maxConcurrency;

        // 注册类名,用于解除循环依赖
        CircularDependency();

        LocalStorage.SetBool('isOpen', true);
        if (!IOS) HoverMgr.creat();
    }
}

