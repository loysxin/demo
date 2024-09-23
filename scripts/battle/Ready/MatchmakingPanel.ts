import { Button, Label, Node, Prefab, Sprite, input, instantiate, resources } from 'cc';
import { Panel } from "../../GameRoot";
import PlayerData, { FightState } from '../../module/roleModule/PlayerData';
import { AutoScroller } from '../../utils/AutoScroller';
import { CfgMgr } from '../../manager/CfgMgr';
import { HomeScene } from '../../module/home/HomeScene';
import { HomeLogic } from '../../module/home/HomeLogic';
import { ResMgr } from '../../manager/ResMgr';
import { Session } from '../../net/Session';
import { MsgTypeRet, MsgTypeSend } from '../../MsgType';
import { BattleReadyLogic } from './BattleReadyLogic';
import { HomeUI } from '../../module/home/panel/HomeUI';
import { BattleUI } from './BattleUI';
import Logger from '../../utils/Logger';
import { AudioMgr, Audio_CommonClick, LootSoundId, LootSoundInfo } from '../../manager/AudioMgr';

export class MatchmakingPanel extends Panel
{
    protected prefab: string = 'prefabs/battle/MatchmakingPanel';

    protected static $self: MatchmakingPanel;
    static get self(): MatchmakingPanel { return this.$instance; }

    private infoItem: Prefab;
    private infoItemContent : Node;

    private closeBtn : Node;

    protected async onLoad() {
        this.infoItemContent = this.node.getChildByPath("ScrollView/view/content");
        this.closeBtn = this.node.getChildByPath("closeBtn");
        this.closeBtn.on(Button.EventType.CLICK, this.onCloseBtnClick, this);


        // Session.on(MsgTypeRet.MatchmakingRet, this.onMatchmaking, this);
        Session.on(MsgTypeRet.GetPlayerBattleDataRet, this.onGetPlayerBattleData, this);
        this.infoItem = await ResMgr.GetResources("prefabs/battle/item/InfoItem");
        this.initComplete();
    }


    protected async onShow(...args: any) {
        await this.initSub;
        Logger.log('onShow ----------->>>>>args', args)

        if(!this.infoItem){
            Logger.log('--------->>>>>>>>>infoItem is null');
        }
        AudioMgr.playSound(LootSoundInfo[LootSoundId.Loot_3], false);
        console.log(`播放抢夺音效---->` + LootSoundInfo[LootSoundId.Loot_3]);
        // let data = {
        //     type: MsgTypeSend.Matchmaking,
        //     data: {
        //     }
        // }
        // Session.Send(data);
 

    }


    public flush(...args: any[]): void {
    }
    protected onHide(...args: any[]): void {
        this.infoItemContent.removeAllChildren();
        if(!HomeUI.Showing)
            HomeUI.Show();
    }


    onCloseBtnClick(button: Button) {
        AudioMgr.PlayOnce(Audio_CommonClick);
        this.Hide();
    }

    onMatchmaking(data: any)
    {
        Logger.log('test', data)
        if(!data) return;

        for(let i = 0; i < data['matches'].length; i++)
        {
            let itemData = data['matches'][i];
            let item = instantiate(this.infoItem);
            this.infoItemContent.addChild(item);
            item.name = itemData['player_name'];
            item.getChildByName('name').getComponent(Label).string = itemData['player_name'];
            item.getChildByPath('power/number').getComponent(Label).string = itemData['battle_power'];
            //item.getChildByName('head/icon').getComponent(Sprite).spriteFrame = ResMgr.GetSpriteFrame('prefabs/battle/item/icon/' + itemData['icon_id']);

            item.getChildByPath('battle').on(Node.EventType.TOUCH_END, () => {
                let data = {
                    type: MsgTypeSend.GetPlayerBattleData,
                    data: {
                        player_id: '1',
                }};
                Session.Send(data);
            });
        
        }

    }
    onGetPlayerBattleData(data: any)
    {
        if(!data) return;
        HomeUI.Hide();
        if(!BattleReadyLogic.ins)
            new BattleReadyLogic();
        // pvp 防守方玩家数据
        let defData = {
            player_id: data.battle_data.player_id,
            type: FightState.PvP,
            homeland_id: data.battle_data.homeland_id,
            buildings: data.battle_data.buildings,
            battle_power: data.battle_data.battle_power,
            icon: data.battle_data.icon,
            defense_lineup: data.battle_data.defense_lineup,
            roles: data.battle_data.roles
        }
        BattleReadyLogic.ins.RealyBattle(defData);

        this.onCloseBtnClick(null);
    }
} 

