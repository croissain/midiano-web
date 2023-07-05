import {
    addDynamicSettingsToObj,
    getSetting,
    setSettingCallback
} from "../settings/Settings.js"
import {
    isBlack
} from "../Util.js"
import {
    getRenderDimensions
} from "./RenderDimensions.js"
/**
 * Class that renders the background of the main canvas
 */
export class BackgroundRender {
    constructor(ctx) {
        this.ctx = ctx
        getRenderDimensions().registerResizeCallback(
            this.renderIfColorsChanged.bind(this)
        )
        setSettingCallback(
            "pianoPositionOnce",
            this.renderIfColorsChanged.bind(this)
        )
        this.settings = [
            "bgCol1",
            "bgCol2",
            "bgCol3",
            "bgCol4",
            "pianoPosition",
            "reverseNoteDirection",
            "extendBgPastPiano"
        ]
        addDynamicSettingsToObj(this.settings, this)
        this.settings.forEach(setting => {
            setSettingCallback(setting, this.renderIfColorsChanged.bind(this))
        })
        this.render()
    }
    renderIfColorsChanged() {
        if (
            this.settings.bgCol1 != getSetting("bgCol1") ||
            this.settings.bgCol2 != getSetting("bgCol2") ||
            this.settings.bgCol3 != getSetting("bgCol3") ||
            this.settings.bgCol4 != getSetting("bgCol4") ||
            this.settings.pianoPosition != getSetting("pianoPosition") ||
            this.settings.reverseNoteDirection !=
            getSetting("reverseNoteDirection") ||
            this.settings.extendBgPastPiano != getSetting("extendBgPastPiano")
        ) {
            this.settings.bgCol1 = getSetting("bgCol1")
            this.settings.bgCol2 = getSetting("bgCol2")
            this.settings.bgCol3 = getSetting("bgCol3")
            this.settings.bgCol4 = getSetting("bgCol4")
            this.settings.pianoPosition = getSetting("pianoPosition")
            this.settings.reverseNoteDirection = getSetting("reverseNoteDirection")
            this.settings.extendBgPastPiano = getSetting("extendBgPastPiano")
            this.render()
        }
    }
    render() {
        const c = this.ctx
        const renderDims = getRenderDimensions()
        const windowWd = renderDims.renderWidth
        const windowHt = renderDims.renderHeight
        const pianoPos = renderDims.getAbsolutePianoPosition(true)
        c.clearRect(0, 0, windowWd, windowHt)

        let reversed = this.reverseNoteDirection
        let extendPastPiano = this.extendBgPastPiano

        let bgHeight = extendPastPiano ? windowHt : pianoPos
        let bgY = 0

        if (reversed && !extendPastPiano) {
            bgHeight = windowHt - pianoPos
            bgY = pianoPos
        }

        extendPastPiano ? windowHt : reversed ? windowHt - pianoPos : pianoPos
        extendPastPiano ? 0 : reversed ? pianoPos : 0
        const col1 = this.bgCol1
        const col2 = this.bgCol2
        const col3 = this.bgCol3
        const col4 = this.bgCol4
        c.strokeStyle = col1
        c.fillStyle = col2
        let whiteKey = 0
        for (let i = 0; i < 88; i++) {
            if (!isBlack(i)) {
                c.strokeStyle = col3
                c.fillStyle = (i + 2) % 2 ? col1 : col2
                c.lineWidth = 1

                let dim = getRenderDimensions().getKeyDimensions(i)
                c.fillRect(Math.floor(dim.x), bgY, Math.ceil(dim.w), bgHeight)

                if (1 + (whiteKey % 7) == 3) {
                    c.lineWidth = 2
                    c.beginPath()
                    c.moveTo(dim.x, bgY)
                    c.lineTo(dim.x, bgY + bgHeight)
                    c.stroke()
                    c.closePath()
                } else {
                    c.strokeStyle = col4
                    c.lineWidth = 1
                    c.beginPath()
                    c.moveTo(dim.x, bgY)
                    c.lineTo(dim.x, bgY + bgHeight)
                    c.stroke()
                    c.closePath()
                }
                whiteKey++
            }
        }
        let dt = c.getImageData(0, 0, c.canvas.width, c.canvas.height)
        let data = dt.data
        for (let i = 0; i < data.length; i += 4) {
            data[i + 3] = Math.min(
                255,
                Math.max(0, data[i + 3] + Math.floor(Math.random() * 144))
            )
        }
        c.putImageData(dt, 0, 0)
        this.pianoPosition = getSetting("pianoPosition")
    }
}