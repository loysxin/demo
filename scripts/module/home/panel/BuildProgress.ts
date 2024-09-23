import { _decorator, Component, Label, ProgressBar, Vec3 } from 'cc';
import { formatTime } from '../../../utils/Utils';
const { ccclass, property } = _decorator;

@ccclass('BuildProgress')
export class BuildProgress extends Component {
    @property({ type: ProgressBar, displayName: "进度条" })
    progress: ProgressBar = null;
    @property({ type: Label, displayName: "倒计时" })
    time: Label = null;

    progressTime: number = 0;

    callBack: Function;
    protected onLoad(): void {
        this.progress = this.node.getChildByName('Progress').getComponent(ProgressBar);
        this.time = this.node.getChildByName('time').getComponent(Label);
    }

    /**
     * 初始化建筑倒计时位置和时间
     * @param pos 
     * @param time 秒
     */
    init(pos = new Vec3(0, 0, 0), time: number, callback: Function) {
        this.node.setPosition(pos);
        this.progressTime = time;
        this.callBack = callback;
    }

    closeTime() {
        this.progressTime = 0;
    }

    protected update(dt: number): void {
        if (this.progressTime > 0) {
            this.progressTime -= dt;
            this.time.string = formatTime(this.progressTime);
        } else {
            this.time.string = '';
            this.callBack && this.callBack();
            this.node.destroy();
        }
    }
}


