import {
    CONST
} from "../../data/CONST.js"

export class ThreeJsSceneManager {
    constructor() {
        this.sceneBehindNotes = new THREE.Scene()
        this.sceneBehindPiano = new THREE.Scene()
        this.sceneFront = new THREE.Scene()
    }
    getScene(distrZ) {
        switch (distrZ) {
            case CONST.DISTRIBUTIONS.Z.BEHIND_NOTES:
                return this.sceneBehindNotes
            case CONST.DISTRIBUTIONS.Z.BEHIND_PIANO:
                return this.sceneBehindPiano
            case CONST.DISTRIBUTIONS.Z.FRONT_OF_PIANO:
                return this.sceneFront

            default:
                break
        }
    }
    getScenes() {
        return [this.sceneBehindNotes, this.sceneBehindPiano, this.sceneFront]
    }
}