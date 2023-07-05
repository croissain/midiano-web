import {
    CONST
} from "../../data/CONST.js"
import {
    getCurrentParticleTypes
} from "../../settings/ParticlePreset.js"
import {
    getSetting,
    setSettingCallback
} from "../../settings/Settings.js"
import {
    DomHelper
} from "../../ui/DomHelper.js"
import {
    rndFloat
} from "../../Util.js"
import {
    getRenderDimensions
} from "../RenderDimensions.js"
import {
    ThreeJsTextureManager
} from "./TheeJsTextureManager.js"
import {
    ThreeJsParticle
} from "./threeJsParticles.js"
import {
    ThreeJsPianoLine
} from "./threeJsPianoLine.js"
import {
    ThreeJsSceneManager
} from "./ThreeJsSceneManager.js"

//todo make point pool and recycle threejs objects.
export class ThreeJsHandler {
    constructor() {}
    init() {
        this.setupCanvases()

        const renderDims = getRenderDimensions()
        let windowWd = renderDims.renderWidth
        let windowHt = renderDims.renderHeight
        renderDims.registerResizeCallback(() => {
            windowWd = renderDims.renderWidth
            windowHt = renderDims.renderHeight
            let cnvs = [this.cnv0, this.cnv1, this.cnv2]
            cnvs.forEach(cnv => {
                cnv.width = windowWd
                cnv.height = windowHt
                cnv.style.width = renderDims.windowWidth + "px"
                cnv.style.height = renderDims.windowHeight + "px"
            })

            this.camera.left = windowWd / -2
            this.camera.right = windowWd / 2
            this.camera.top = windowHt / 2
            this.camera.bottom = windowHt / -2

            this.camera.updateProjectionMatrix()
            this.renderer.setSize(windowWd, windowHt, 1)
        })

        this.camera = new THREE.OrthographicCamera(
            windowWd / -2,
            windowWd / 2,
            windowHt / 2,
            windowHt / -2,
            1,
            1000
        )
        this.camera.position.set(0, 0, 500)

        this.sceneManager = new ThreeJsSceneManager()
        this.textureManager = new ThreeJsTextureManager()
        this.threeJsParticles = new ThreeJsParticle()
        this.threeJsPianoLine = new ThreeJsPianoLine()

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        })
        this.renderer.setSize(windowWd, windowHt)

        // this.setupSettings()

        // this.createPianoLine()
    }

    setupCanvases() {
        const renderDims = getRenderDimensions()
        const windowWd = renderDims.renderWidth
        const windowHt = renderDims.renderHeight
        this.cnv0 = DomHelper.createCanvas(windowWd, windowHt)
        this.cnv1 = DomHelper.createCanvas(windowWd, windowHt)
        this.cnv2 = DomHelper.createCanvas(windowWd, windowHt)

        this.cnv0.style.zIndex = 1
        this.cnv1.style.zIndex = 5
        this.cnv2.style.zIndex = 105

        this.ctx0 = this.cnv0.getContext("2d")
        this.ctx1 = this.cnv1.getContext("2d")
        this.ctx2 = this.cnv2.getContext("2d")

        this.cnv0.style.position = "absolute"
        this.cnv1.style.position = "absolute"
        this.cnv2.style.position = "absolute"

        this.cnv0.style.pointerEvents = "none"
        this.cnv1.style.pointerEvents = "none"
        this.cnv2.style.pointerEvents = "none"
        DomHelper.appendChildren(document.body, [this.cnv0, this.cnv1, this.cnv2])
    }

    render(time = 10) {
        if (getSetting("pianoLineEnabled")) {
            this.threeJsPianoLine.render()
        }
        if (getSetting("showParticles")) {
            this.threeJsParticles.render()
        }
        if (!getSetting("pianoLineEnabled") && !getSetting("showParticles")) {
            return
        }

        const renderDims = getRenderDimensions()
        const windowWd = renderDims.renderWidth
        const windowHt = renderDims.renderHeight

        this.ctx0.clearRect(0, 0, windowWd, windowHt)
        this.ctx1.clearRect(0, 0, windowWd, windowHt)
        this.ctx2.clearRect(0, 0, windowWd, windowHt)

        let ctxs = [this.ctx0, this.ctx1, this.ctx2]
        this.sceneManager.getScenes().forEach((scene, i) => {
            this.renderer.render(scene, this.camera)
            ctxs[i].drawImage(this.renderer.domElement, 0, 0)
        })
    }
}

var threeJsHandler
export const initThreeJs = () => {
    threeJsHandler = new ThreeJsHandler()
    threeJsHandler.init()
}
export const getThreeJsHandler = () => threeJsHandler
export const threeJsRender = time => threeJsHandler.render(time)
export const createThreeJsParticles = renderInfo => {
    threeJsHandler.threeJsParticles.create(renderInfo)
}

export const getTheeJsColor = str => {
    let spl = str.split(",")
    spl.splice(spl.length - 1, 1)
    str = spl.join(",").replace("rgba", "rgb") + ")"
    let colorObj = new THREE.Color()
    colorObj.setStyle(str)
    return colorObj
}
export const getTexture = textureName =>
    threeJsHandler.textureManager.getTexture(textureName)
export const loadTexture = (textureName, callback) =>
    threeJsHandler.textureManager.loadTexture(textureName, callback)
export const getScene = sceneName =>
    threeJsHandler.sceneManager.getScene(sceneName)