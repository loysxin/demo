import { _decorator, Component, Label, Node } from 'cc';
import PlayerData from '../roleModule/PlayerData';
import { formatNumber } from '../../utils/Utils';
const { ccclass, property } = _decorator;

@ccclass('MeansLayout')
export class MeansLayout extends Component {

    @property({ type: Label, displayName: '石灵' })
    rock: Label = null;
    @property({ type: Label, displayName: '古木' })
    wood: Label = null;
    @property({ type: Label, displayName: '水宝' })
    water: Label = null;
    @property({ type: Label, displayName: '源种' })
    seed: Label = null;
    @property({ type: Label, displayName: '通用货币' })
    currency: Label = null;
    
    protected onLoad(): void {
        this.rock = this.node.getChildByPath('panel/MeansLayout/stone/Label').getComponent(Label);
        this.wood = this.node.getChildByPath('panel/MeansLayout/tree/Label').getComponent(Label);
        this.water = this.node.getChildByPath('panel/MeansLayout/water/Label').getComponent(Label);
        this.seed = this.node.getChildByPath('panel/MeansLayout/seed/Label').getComponent(Label);
        this.currency = this.node.getChildByPath('panel/MeansLayout/currency/Label').getComponent(Label);
    }

    public updateMeans(): void {
        let res = PlayerData.resources;
        this.rock.string = formatNumber(res.rock, 2);
        this.wood.string = formatNumber(res.wood, 2);
        this.water.string = formatNumber(res.water, 2);
        this.seed.string = formatNumber(res.seed, 2);
        this.currency.string = PlayerData.roleInfo.currency + '';
    }
}


