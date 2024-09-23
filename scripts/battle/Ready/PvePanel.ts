import { Panel } from '../../GameRoot';
import { CardQuality, CfgMgr, ConditionType, StdCommonType, StdLevel } from '../../manager/CfgMgr';
import PlayerData, { FightState, SPlayerDataPve, SThing } from '../../module/roleModule/PlayerData';
import { BattleReadyLogic } from './BattleReadyLogic';
import { HomeUI } from '../../module/home/panel/HomeUI';
import { Node, Button, Sprite, SpriteFrame, instantiate, Label, Prefab, path, Vec2, math, UITransform, Vec3, RichText, Toggle, Layout, Input, EventTouch, tween, sp, Layers, ScrollView, Color } from 'cc';
import { folder_icon, folder_item, ResMgr } from '../../manager/ResMgr';
import { AddBtnClick, maxx, minn } from '../../utils/Utils';
import { map } from '../../module/home/MapData';
import { DateUtils } from '../../utils/DateUtils';
import { Tips } from '../../module/login/Tips';
import { Loading } from '../../Loading';
import { ItemUtil } from '../../utils/ItemUtils';
import { ConsumeItem } from '../../module/common/ConsumeItem';
import { AdaptBgTop, ConditionSub, FormatCondition, SetNodeGray } from '../../module/common/BaseUI';
import { ChangeScenePanel } from '../../module/home/ChangeScenePanel';
import { EventMgr, Evt_PveMaploadFinish } from '../../manager/EventMgr';
import { MsgTypeRet, MsgTypeSend } from '../../MsgType';
import { Session } from '../../net/Session';
import { ItemTips } from '../../module/common/ItemTips';
import { Tips2 } from '../../module/home/panel/Tips2';
import { BuyTips } from '../../module/login/BuyTips';
import { MsgPanel } from '../../module/common/MsgPanel';
import { AutoScroller } from '../../utils/AutoScroller';
import { setColor } from '../../../../extensions/plugin-import-2x/creator/common/utlis';

interface BirdInfo {
    node: Node;
    speed: number;
    initPos: Vec3;
    isWait: boolean;
}

export class PvePanel extends Panel {

    
    protected prefab: string = 'prefabs/pve/PvePanel';

    levelInfo: StdLevel;

    _nowChapter: number = 0;
    _nowLevel: number;

    _level_map: Sprite;
    _backBtn: Node;

    _itemPrefab: Node;
    _finishLevelPrefab: Node;
    _levelPrefab: Node;

    _finishLevelContent: Node;
    _levelContent: Node;

    _levelCount;
    _levelProcess: Label;

    _tanxianBtn: Button;
    _tanxianBtnLab: Label;
    _mianfeiBtn: Button;
    _mianfeiBtnLab: Label;
    _pve_data: SPlayerDataPve;
    _testLevel : number;
    private consumeItem:ConsumeItem;
    private tipsLab:RichText;
    private mapBlocks: number[] = [35, 37, 39, 44, 46]
    private blcokPosOffset: Vec2[] = [new Vec2(-242, -17), new Vec2(-3, -13), new Vec2(118, 235), new Vec2(-240, 66), new Vec2(9, -124)]
    private sMapScaleY = 1280;
    private sMapScaleX = 1024
    private xBlock = 8;
    private yBlock = 2;
    private mapNode: Node;
    private chapterOffset: Vec3[]= [];

    private levelBattlePower;
    _onBattle: boolean;

    startX: number;
    touchStartX: number;
    showChapter: number;
    chapterNames = {};
    chapterMask: Node;

    private birds: BirdInfo[];
    private updateEffect = true;
    private nowChapterPos;
    private waitBirds: number;
    private _buzhenBtn: Button;
    // 是否布阵
    private deploy_formation: boolean;

    _middleNode: Node;
    private levelItem_scroller: AutoScroller;
    private levels;
    private levelProcess: UITransform;
    private pveConfig;

    protected onLoad() {
        this.CloseBy('top/back')
        AdaptBgTop(this.find("middle/mask"));
        this.mapNode = this.node.getChildByName("map");
        // this.node.getChildByPath('top/back').on(Button.EventType.CLICK, this.Hide, this);
        this._finishLevelContent = this.node.getChildByPath("bottom/finish/view/content");
        this._levelContent = this.node.getChildByPath("bottom/tiaozhan/view/content");
        this.tipsLab = this.node.getChildByPath("bottom/tipsLab").getComponent(RichText);
        this._itemPrefab = this.node.getChildByPath("Item/Icon");
        this._finishLevelPrefab = this.node.getChildByPath("Item/levelFinishItem");
        this._levelPrefab = this.node.getChildByPath("Item/levelTiaoZhanItem");

        this.node.getChildByPath("bottom/testLevel").active = false;
        //this.node.getChildByPath("bottom/testLevel").on('editing-return', this.onTestLevel, this);
        
        this._tanxianBtn = this.node.getChildByPath("bottom/tanxianBtn").getComponent(Button);
        this._tanxianBtnLab = this.node.getChildByPath("bottom/tanxianBtn/tanxianBtnLab").getComponent(Label);
        let consumeItemNode:Node = this.node.getChildByPath("bottom/tanxianBtn/ConsumeItem");
        this.consumeItem = consumeItemNode.addComponent(ConsumeItem);
        this._mianfeiBtn = this.node.getChildByPath("bottom/mianfeiBtn").getComponent(Button);
        this._mianfeiBtnLab = this.node.getChildByPath("bottom/mianfeiBtn/mianfeiBtnLab").getComponent(Label);
        this._buzhenBtn = this.node.getChildByPath("bottom/buzhen").getComponent(Button);
        this._tanxianBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this._mianfeiBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this._buzhenBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.chapterMask = this.node.getChildByPath("mask");
        this.node.getChildByPath("right/btn").on(Button.EventType.CLICK, ()=>{
            if(this.showChapter < 5)
                this.showChapter++;
            this.ScrollChapter();
        }, this);
        this.node.getChildByPath("left/btn").on(Button.EventType.CLICK, ()=>{
            if(this.showChapter > 1)
                this.showChapter--;
            this.ScrollChapter();
        }, this);
        this.node.getChildByPath("top/info").on(Button.EventType.CLICK, ()=>{
            Tips2.Show(3);
        }, this);

        this._middleNode = this.node.getChildByPath("middle");
        this.node.getChildByPath("bottom/zhangjie").on(Button.EventType.CLICK, ()=>{
            if(!this.levels.length) return;
            let max = this.levels.length;
            let nowIndex = this.levelInfo.ID - 1;
            let index = Math.max(0, nowIndex - 2);
            index = Math.min(index, max - 5);

            this.levelItem_scroller.ScrollToIndex(index);
            this._middleNode.active = true;
        });
        this.node.getChildByPath("middle/closeBtn").on(Button.EventType.CLICK, ()=>{
            this._middleNode.active = false;
        });
        this.node.getChildByPath("middle/mask").on(Button.EventType.CLICK, ()=>{
            this._middleNode.active = false;
        })

        this.levelItem_scroller = this.node.getChildByPath("middle/ScrollView").getComponent(AutoScroller);
        this.levelItem_scroller.SetHandle(this.updateLevelItem.bind(this));
        this.levelProcess = this.node.getChildByPath("middle/bg/process").getComponent(UITransform);

        this.mapNode.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        this.mapNode.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.mapNode.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.mapNode.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

        let chapterInfo = CfgMgr.GetChapterInfo();

        this.chapterNames = chapterInfo["chaptersName"];
        this.levels = chapterInfo["levels"];
        this.pveConfig = CfgMgr.GetCommon(StdCommonType.PVE);

        Session.on(MsgTypeRet.BuyPvETimesRet, this.onBuyPvETimes, this)
    }

    onTouchStart(evt: EventTouch): void {
        // 获取触摸开始时的坐标
        this.startX = evt.getLocation().x;
        this.touchStartX = this.mapNode.getPosition().x;
    }

    onTouchMove(evt): void {
    
        // 获取当前触摸位置
        let currentX = evt.getLocation().x;
        
        // 计算移动距离
        let deltaX = this.startX - currentX;
        
        const moveX = this.mapNode.getPosition().x - this.touchStartX - deltaX;

        if(this.showChapter == 1 && moveX > 250)
            return;
        if(this.showChapter == 5 && moveX < -250)
            return;
        
        // 移动地图
        this.mapNode.setPosition(this.mapNode.getPosition().x - deltaX, this.mapNode.getPosition().y);
        
        this.startX = currentX;
    }

    onTouchEnd(evt): void{
        const moveX = this.mapNode.getPosition().x - this.touchStartX;
        if(Math.abs(moveX) > 250)
        {
            if(moveX > 0)
            {
                if(this.showChapter > 1)
                    this.showChapter--;
            }
            else
            {
                if(this.showChapter < 5)
                    this.showChapter++;
            }
        }

        this.ScrollChapter();
    }

    private ScrollChapter()
    {
        let endPosition = this.node.getChildByPath(`level_point/level_${this.showChapter}`).getPosition();
        tween(this.mapNode).to(0.3, {position: endPosition}).call(()=>{
            //this.chapterMask.active = this.showChapter > this.levelInfo.Chapter;
        }).start();
    }



    protected onShow(...arg: any[]) {
        this.node.active = false;
        this.chapterMask.active = false;
        this._middleNode.active = false;
        this._testLevel = 0;
        this._onBattle = false;
        this._pve_data = PlayerData.pveData;
        this.levelInfo = CfgMgr.GetLevel(this._pve_data.progress + 1);
        this.showChapter = this.levelInfo.Chapter;
        this.nowChapterPos = this.node.getChildByPath(`level_point/level_${this.levelInfo.Chapter}`).getPosition();
        this.mapNode.setPosition(this.nowChapterPos);
        if(this.levelInfo.Chapter != this._nowChapter)
        {
            //await ChangeScenePanel.PlayEffect(Evt_PveMaploadFinish);
        }
        this._levelCount = CfgMgr.GetLevelCountByChapter(this.levelInfo.Chapter);

        this.updateLevelInfo(this.node.getChildByPath("bottom/middle"), this.levelInfo);
        this.updateButtonInfo();
        this.loadMap();
        this.loadChapter();

    }

    private loadChapter():void{
        if(!this.birds)
            this.birds = [];
        for(let i = 1; i <= 5; i++)
        {
            let chapter = this.mapNode.getChildByPath(`chapter_info/chapter_${i}`);
            chapter.off(Button.EventType.CLICK);
            let progress = chapter.getChildByName("Label");
            let lock = chapter.getChildByName("lock");
            lock.active = i <= this.levelInfo.Chapter ? false : true;
            progress.active = i <= this.levelInfo.Chapter ? true : false;
            progress.getComponent(Label).string = i < this.levelInfo.Chapter ? "100%" : (i == this.levelInfo.Chapter ? `${Math.floor(this.levelInfo.LevelID - 1 / this._levelCount * 100)}%` : "");
            if(this.chapterNames.hasOwnProperty(i))
            {
                chapter.getChildByName("text").getComponent(Label).string = this.chapterNames[i].name;
                if(lock.active){
                    chapter.on(Button.EventType.CLICK, ()=>{MsgPanel.Show(CfgMgr.GetText("pve_4", {level: this.chapterNames[i].level}))}, this);
                }
        
            }
            else
                chapter.getChildByName("text").getComponent(Label).string = this.levelInfo.ChapterName;
       
                let effect = chapter.getChildByName("effect");
                if(effect)
                {
                    let ske = effect.getChildByName("ske").getComponent(sp.Skeleton);
                    ske.setAnimation(0, "animation", true);
                }
    
                for (let j = 1; j < 3; j++) {
                    let bird = chapter.getChildByName("bird" + j);
                    if(!bird) continue;
                    let birdSkt = bird.getChildByName("ske").getComponent(sp.Skeleton);
                    birdSkt.setAnimation(0, "animation", true);
                    
                    bird.setPosition(-1080 - j * 200, -j * 100, 0);
                    this.birds.push({
                        node: bird,
                        speed: 150 + Math.random() * 100,
                        initPos: bird.getPosition(),
                        isWait: true
                    });
                }
        }
    }
  


    public flush(...args: any[]): void {
    }
    protected onHide(...args: any[]): void {
        if(!HomeUI.Showing)
            HomeUI.Show();

        this.birds = [];
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this._tanxianBtn:
                if(!ItemUtil.CheckThingConsumes([this.pveConfig.ConsumeItemType], [this.pveConfig.ConsumeItem], [this.pveConfig.ConsumeNumber])){
                    if(this._pve_data.paid_refresh_times > 0){
                        let data = {
                            type: MsgTypeSend.BuyPvETimes,
                            data: {}
                        }
                        let buyInfo = {
                            title: CfgMgr.GetText("pve_2"),
                            money: this.pveConfig.Money,
                            count: 1,
                            info2Text: "今日可购买次数",
                            info2: `${this._pve_data.paid_refresh_times}/${this.pveConfig.AddCountMax}`,
                            icon2: "sheets/items/tiaozhan",
                            info1: CfgMgr.GetText("pve_3"),
                        }
                        BuyTips.Show(buyInfo, () => {
                            if(this._onBattle) return;
                            Session.Send(data, MsgTypeSend.BuyPvETimes, 2000);
                            this._onBattle = true;
                        });
                    }
                    else
                    {
                        Tips.Show(CfgMgr.GetText("pve_1"))
                    }   
                }else{
                    if(this._onBattle) return;
                    Session.Send({
                        type: MsgTypeSend.UseItem,
                        data: {
                            item_id: this.pveConfig.ConsumeItem
                        }
                    }, MsgTypeSend.UseItem, 2000);
                    this._onBattle = true;
                }
                break;
            case this._mianfeiBtn:
                this.toBattle();
                break
            case this._buzhenBtn:
                this.deploy_formation = true;
                this.toBattle();
                this.deploy_formation = false;
                break;
            
        }
    }
    private toBattle():void{
        this.Hide();
        HomeUI.Hide();//关闭主界面

        if(this._testLevel > 0)
            this.levelInfo = CfgMgr.GetLevel(this._testLevel);


        let battleData = {
            type: FightState.PvE,
            player_id: 101,
            homeland_id: 101,
            battle_power: this.levelInfo.Power,
            stage_id: this.levelInfo.ID,
            mapId: this.levelInfo.Map,
            icon: "",
            monsters: this.levelInfo.Monsters,
            deploy_formation: this.deploy_formation
        }

        if(!BattleReadyLogic.ins)
            new BattleReadyLogic();
        BattleReadyLogic.ins.RealyBattle(battleData);
        this._onBattle = false;
    }
    
    private updateButtonInfo()
    {
        let condIdList:number[] = this.levelInfo.ConditionId ? this.levelInfo.ConditionId : [];
        let condValList:number[] = this.levelInfo.ConditionValue ? this.levelInfo.ConditionValue : [];
        let condData:ConditionSub = null;
        for (let index = 0; index < condIdList.length; index++) {
            let condId:number = condIdList[index];
            let condVal:number = condValList[index];
            if(condId == ConditionType.Home_1){
                    condData = FormatCondition(condId, condVal, "主基地升级至<color=#EBCF40>%s级</color>解锁当前关卡");
            }else if(condId == ConditionType.PlayerPower){
                    condData = FormatCondition(condId, condVal, "玩家总战力达<color=#EBCF40>%s</color>解锁当前关卡");
                    this.levelBattlePower = condVal;
            }else{
                condData = FormatCondition(condId, condVal);
            }

            if(condData && condData.fail) break;
        }
        this.tipsLab.string = "每日免费次数<color=#EBCF40>0点</color>重置，可消耗道具探险";
        let pveCount = this._pve_data.times;
        if(pveCount <= 0)
        {
            this._mianfeiBtn.node.active = false;
            this._tanxianBtn.node.active = true;
            let consume:SThing = ItemUtil.CreateThing(this.pveConfig.ConsumeItemType, this.pveConfig.ConsumeItem, this.pveConfig.ConsumeNumber);
            this.consumeItem.SetData(consume);
            if(condData && condData.fail){
                this._tanxianBtnLab.string = "未解锁";
                this.tipsLab.string = condData.fail;
                SetNodeGray(this._tanxianBtn.node, true, true);   
            }else{
                this._tanxianBtnLab.string = "探险";
                let count = ItemUtil.GetHaveThingNum(this.pveConfig.ConsumeItemType, this.pveConfig.ConsumeItem);
                let money = PlayerData.roleInfo.currency;
                if(money < this.pveConfig.Money && count < this.pveConfig.ConsumeNumber){
                    SetNodeGray(this._tanxianBtn.node, true, true);   
                }else{
                    SetNodeGray(this._tanxianBtn.node)
                }
                //SetNodeGray(this._tanxianBtn.node);   
            }
        }
        else
        {
            this._mianfeiBtn.node.active = true;
            this._tanxianBtn.node.active = false;
            if(condData && condData.fail){
                this._mianfeiBtnLab.string = "未解锁";
                this.tipsLab.string = condData.fail;
                
                SetNodeGray(this._mianfeiBtn.node, true, true);   
            }else{
                this._mianfeiBtnLab.string = `探险（${pveCount}次）`;
                SetNodeGray(this._mianfeiBtn.node);   
            }
            
        }
    }

    private async loadMap()
    {

        if(this._nowChapter <= 0)
        {
            this._nowChapter = this.levelInfo.Chapter;
            await this.LoadingMap();
        }
        EventMgr.emit(Evt_PveMaploadFinish);

        if(this._nowLevel != this.levelInfo.LevelID)
        {
            this._nowLevel = this.levelInfo.LevelID;
            this._levelContent.removeAllChildren();
            this._finishLevelContent.removeAllChildren();

            this.levelItem_scroller.UpdateDatas(this.levels);
            
            //this.levelItem_scroller.ScrollToIndex(this.levelInfo.LevelID);

            // if(this.levelInfo.ItemAttrSub != undefined)
            // {
            //     for(let i = 0; i < this.levelInfo.ItemAttrSub.length; i++)
            //     {
            //         let item = instantiate(this._itemPrefab);
            //         item.setPosition(0, 0, 0);
            //         if(this.levelInfo.ItemAttrSub[i].quality)
            //             item.getChildByName("bg").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(path.join(folder_icon, "quality", this.levelInfo.ItemAttrSub[i].quality + "_bag_bg", "spriteFrame") , SpriteFrame);
            //         item.getChildByName("icon").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(this.levelInfo.ItemAttrSub[i].icon, SpriteFrame);
            //         item.getChildByName("count").getComponent(Label).string = this.levelInfo.ItemAttrSub[i].value.toString();
            //         item.off(Button.EventType.CLICK);
            //         item.on(Button.EventType.CLICK, ()=>{ ItemTips.Show(this.levelInfo.ItemAttrSub[i]) }, this);
            //     }

            // }

            for(let i = 1; i <= this._levelCount - this._nowLevel; i++)
            {
                let nextLevelInfo = CfgMgr.GetLevel(this._nowLevel + i);
                let level = instantiate(this._levelPrefab);
                this._levelContent.addChild(level);
                this.updateLevelInfo(level.getChildByName("tiaozhan"), nextLevelInfo);
                if(i > 2) // 仅加载3个
                    break;
            }

            for(let i = 1; i < this._nowLevel; i++)
            {
                let lastLevelInfo = CfgMgr.GetLevel(this._nowLevel - i);
                let finish = instantiate(this._finishLevelPrefab);
                this._finishLevelContent.addChild(finish);
                this.updateLevelInfo(finish.getChildByName("finish"), lastLevelInfo);
                if(i > 2) // 仅加载3个
                    break;
            }
        }

        this.node.active = true;
    }

    private updateLevelInfo(node: Node, levelInfo: StdLevel)
    {
        node.getChildByName("next").active = levelInfo.LevelID != this._levelCount;

        switch(levelInfo.LevelType)
        {
            case 1:
                let now = node.getChildByName("regular");
                now.active = true;
                now.getChildByName("level").getComponent(Label).string = levelInfo.LevelID.toString();
                node.getChildByPath("expert").active = false;
                node.getChildByPath("boss").active = false;
                break;
            case 2:
                node.getChildByPath("expert").active = true;
                node.getChildByName("regular").active = false;
                node.getChildByPath("boss").active = false;
                break;
            case 3:
                node.getChildByPath("expert").active = false;
                node.getChildByName("regular").active = false;
                node.getChildByPath("boss").active = true;
                break;
            default:
                break;
        }
    }


    // private async LoadingMap()
    // {
    //     if(this._nowChapter > this.mapBlocks.length)
    //         return;

    //      // 给定序号
    //      const index1 = this.mapBlocks[maxx(this._nowChapter - 1, 0)];
    //      const index2 = this.mapBlocks[minn(this._nowChapter, this.mapBlocks.length - 1)];
     
    //      // 行列索引计算
    //      let col1 = ((index1 - 1) % this.xBlock) + 1;
    //      let col2 = ((index2 - 1) % this.xBlock) + 1; 
     
    //      // 合并区域边界计算
    //      let startCol = Math.min(col1 - 1, col2 - 1);
    //      let endCol = Math.max(col1 + 1, col2 + 1);
 
    //      startCol = startCol < 1 ? 1 : startCol;
    //      endCol = endCol > 15 ? 15 : endCol;

    //      this.chapterOffset.push(this.offset(index1, col1, startCol, this.blcokPosOffset[maxx(this._nowChapter - 1, 0)]))
    //      this.chapterOffset.push(this.offset(index2, col2, endCol, this.blcokPosOffset[minn(this._nowChapter, this.mapBlocks.length - 1)]))
    //      this.mapNode.setPosition(this.chapterOffset[0])
    
    //      this.mapNode.removeAllChildren();
    //      // 加载合并区域的 SpriteFrames
    //      for (let y = 0; y < this.yBlock; y++) {
    //          for (let x = startCol; x <= endCol; x++) {
    //              const spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(this.getSpriteFrameByIndex(x, y), SpriteFrame);
    //              if (spriteFrame) {
    //                  let node = new Node();
    //                  const sprite = node.addComponent(Sprite);
    //                  sprite.spriteFrame = spriteFrame;
    //                  node.getComponent(UITransform).setAnchorPoint(0, 1)
    //                  // 计算节点位置，将 index1 对应的中心放在视图中心
    //                  node.setPosition((x - startCol) * this.sMapScale, -y * this.sMapScale);
    //                  this.mapNode.addChild(node);
    //              }
    //          }
    //      }
    // }

    // 根据索引获取 SpriteFrame 的路径
    //2850   -2840  155 
    // 1730  -1730  158 
    // 640   -622   154
    // -1530  1547  158
    // -2856  2856 158
    private async LoadingMap()
    {
        //this.mapNode.removeAllChildren();
        // 加载合并区域的 SpriteFrames
        for (let y = 0; y < this.yBlock; y++) {
            for (let x = 0; x < this.xBlock; x++) {
                const spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(this.getSpriteFrameByIndex(x, y), SpriteFrame);
                if (spriteFrame) {
                    let node = new Node();
                    const sprite = node.addComponent(Sprite);
                    sprite.spriteFrame = spriteFrame;
                    node.getComponent(UITransform).setAnchorPoint(0, 1)
                    this.mapNode.addChild(node);
                    // 计算节点位置，将 index1 对应的中心放在视图中心

                    node.setPosition(x * this.sMapScaleX - this.mapNode.getComponent(UITransform).contentSize.x / 2, -y * this.sMapScaleY + this.mapNode.getComponent(UITransform).contentSize.y / 2);
                }
            }
        }
        let chapter = this.mapNode.getChildByName("chapter_info");
        chapter.setSiblingIndex(this.mapNode.children.length - 1);
        chapter.active = true;
    }

    _BirdMove(bird: BirdInfo, dt) {
        let x = bird.node.position.x;
        let y = bird.node.position.y;
        let time = dt;
        
        // 计算新的 y 位置，模拟上下波动
        y += (Math.random() * 2 - 1) * 2;
        
        // // 确保 y 值在 -bird.amplitude 和 bird.amplitude 之间
        // y = Math.min(bird.amplitude, Math.max(-bird.amplitude, y));
        
        // 更新小鸟的位置
        bird.node.setPosition(x + bird.speed * time, y, 0);
    }


    private getSpriteFrameByIndex(x: number, y: number) {
        let index = (y * this.xBlock) + x + 1;
        return `pve/map/G_${(index < 10 ? '0' : '') + index}/spriteFrame`;
    }


    // private offset(index: number, nowCol: number, col: number, offset: Vec2)
    // {
    //     let xOffset = (col - nowCol) * this.sMapScale + this.sMapScale / 2 - this.node.getComponent(UITransform).width / 2;
    //     let yOffset = (index / this.xBlock) * this.sMapScale + this.sMapScale / 2 - 50;
    //     return new Vec3(xOffset - offset.x, yOffset + offset.y, 0);
    // }
    
    private onTestLevel(data)
    {
        const level = Number(data.string);
        if(level == undefined || level <= 0)
            return;

        let config = CfgMgr.GetLevels()[level]
        if(config)
            this._testLevel = level;
    }

    private onBuyPvETimes(data){
        PlayerData.updataPveData(data.pve_data);
        if(data.pve_data.times > 0 && this._onBattle)
            this.toBattle();
    }
    protected update(dt: number): void {
        if(!this.updateEffect) return;
        this.waitBirds = 0;
        for (let bird of this.birds) {
            if (bird.node.position.x + bird.node.parent.position.x + this.mapNode.getPosition().x > 1080) {
                bird.node.setPosition(bird.initPos);
                bird.speed = 150 + Math.random() * 100;
                bird.isWait = true;
            }
            if (!bird.isWait) 
                this._BirdMove(bird, dt);
            else
                this.waitBirds++;
        }
        if(this.waitBirds == this.birds.length)
            this.birds.forEach(bird => bird.isWait = false);
    }

    private async updateLevelItem(item:Node, id: number){
        let config = CfgMgr.GetLevel(id);
        if(!config) return;
        let isNowLevel = id == this.levelInfo.ID;
        let text = item.getChildByName('Label').getComponent(Label);
        text.string = config.ChapterName + config.Name;
        text.color = isNowLevel?  new Color().fromHEX("#0F2DC5") : new Color().fromHEX("#2F7387");
        item.getChildByName('Label').getComponent(Label).string = config.ChapterName + config.Name;
        item.getChildByName("nowLevelIcon").active = isNowLevel;
        let point = item.getChildByName("point");
        point.children.forEach((child:Node) => {
            child.active = false;
        })
        let name = isNowLevel ? "now" : id > this.levelInfo.ID ? "future" : "finish";
        name = id == 1 ? name == "finish" ? "oneFinish" : "oneNow" : name;
        point.getChildByName(name).active = true;
        let itemContent = item.getChildByPath("ScrollView/view/content");
        let tmp = itemContent.children[0];
        for(let i = itemContent.children.length; i < config.ItemAttrSub.length; i++){
            let child = instantiate(tmp);
            child.setPosition(0, 0, 0);
            itemContent.addChild(child);
        }

        for(let i = 0; i < itemContent.children.length; i++){
            let child = itemContent.children[i];
            if(i >= config.ItemAttrSub.length){
                child.active = false;
                continue;
            }
            child.active = true;
            if(config.ItemAttrSub[i].quality)
                child.getChildByName("bg").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(path.join(folder_icon, "quality", config.ItemAttrSub[i].quality + "_bag_bg", "spriteFrame") , SpriteFrame);
            child.getChildByName("icon").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(config.ItemAttrSub[i].icon, SpriteFrame);
            child.getChildByName("count").getComponent(Label).string = config.ItemAttrSub[i].value.toString();
            child.off(Button.EventType.CLICK);
            child.on(Button.EventType.CLICK, ()=>{ ItemTips.Show(config.ItemAttrSub[i]) }, this);
        }

    }


}


