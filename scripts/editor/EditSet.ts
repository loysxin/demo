import { EditFacePanel } from "./EditFacePanel";

export class EditSet {
    static get pause() {
        if (EditFacePanel.Showing) return true;
    }
}