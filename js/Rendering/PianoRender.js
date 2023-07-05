import {
    DomHelper
} from "../ui/DomHelper.js"
import {
    getSetting,
    setSettingCallback
} from "../settings/Settings.js"
import {
    formatNote,
    isBlack
} from "../Util.js"
import {
    getRenderDimensions
} from "./RenderDimensions.js"
/**
 * Class to render the piano (and the colored keys played on the piano)
 */
export class PianoRender {
    constructor() {
        getRenderDimensions().registerResizeCallback(this.resize.bind(this))
        this.clickCallback = null
        this.blackKeyImg = new Image()
        this.blackKeyImg.src = "../../blackKey.svg"
        this.blackKeyImg.onload
        this.positionY = 50 //from bottom

        setSettingCallback("pianoWhiteKeyColor", this.resize.bind(this))
        setSettingCallback("pianoBlackKeyColor", this.resize.bind(this))
        setSettingCallback("pianoBackgroundColor", this.resize.bind(this))

        this.resize()
    }
    /**
     * Resize canvases and redraw piano.
     */
    resize() {
        this.resizeCanvases()
        this.drawPiano(this.ctxWhite, this.ctxBlack)
    }
    /**
     * pass listeners that are called with the note number as argument when piano canvas is clicked.
     * @param {Function} onNoteOn
     * @param {Function} onNoteOff
     */
    setPianoInputListeners(onNoteOn, onNoteOff) {
        this.onNoteOn = onNoteOn
        this.onNoteOff = onNoteOff
    }
    /**
     * Register a callback to trigger when user clicks the piano Canvas. Callback is called with
     */
    setClickCallback(callback) {
        this.clickCallback = callback
    }
    getAllCanvases() {
        return [
            this.getPianoCanvasWhite(),
            this.getPlayedKeysWhite(),
            this.getPianoCanvasBlack(),
            this.getPlayedKeysBlack()
        ]
    }

    /**
     * Resizes all piano canvases.
     */
    resizeCanvases() {
        const renderDims = getRenderDimensions()
        const wKeyHt = renderDims.whiteKeyHeight
        const bKeyHt = renderDims.blackKeyHeight
        const windowWd = renderDims.renderWidth
        this.getAllCanvases().forEach(canvas => {
            DomHelper.setCanvasSize(canvas, windowWd, Math.max(wKeyHt, bKeyHt))
            canvas.style.width = renderDims.windowWidth + "px"
            canvas.style.height =
                Math.max(wKeyHt, bKeyHt) /* / window.devicePixelRatio */ + "px"
        })
        this.repositionCanvases()
    }

    repositionCanvases() {
        const pianoPos = getRenderDimensions().getAbsolutePianoPosition()
        this.getAllCanvases().forEach(canvas => {
            canvas.style.top = pianoPos + "px"
        })
    }
    /**
     *
     * @param {Integer} noteNumber
     */
    drawActiveInputKey(noteNumber, color) {
        let dim = getRenderDimensions().getKeyDimensions(noteNumber)
        let isKeyBlack = isBlack(noteNumber)
        let ctx = isKeyBlack ? this.playedKeysCtxBlack : this.playedKeysCtxWhite

        ctx.globalCompositeOperation = getSetting("pianoEnableLighter") ?
            "lighter" :
            "source-over"
        ctx.shadowColor = getSetting("pianoShadowColor")
        ctx.shadowBlur = getSetting("pianoShadowBlur")
        if (isKeyBlack) {
            this.drawBlackKey(ctx, dim, color, false)
        } else {
            this.drawWhiteKey(ctx, dim, color, false)
        }
        ctx.globalCompositeOperation = "source-over"
    }

    drawActiveKey(renderInfo, color) {
        let dim = getRenderDimensions().getKeyDimensions(renderInfo.noteNumber)
        let isKeyBlack = renderInfo.isBlack
        let ctx = isKeyBlack ? this.playedKeysCtxBlack : this.playedKeysCtxWhite

        let velocityStartFrames = 1
        let startTimeRatio = 1
        if (getSetting("drawPianoKeyHitEffect")) {
            velocityStartFrames = (327 - renderInfo.velocity) / 1 // ~65 -> 40
            startTimeRatio = Math.min(
                1,
                0.6 +
                (renderInfo.currentTime - renderInfo.timestamp) / velocityStartFrames
            )
        }

        ctx.globalCompositeOperation = getSetting("pianoEnableLighter") ?
            "lighter" :
            "source-over"
        ctx.shadowColor = getSetting("pianoShadowColor")
        ctx.shadowBlur = getSetting("pianoShadowBlur")
        ctx.fillStyle = color
        if (isKeyBlack) {
            this.drawBlackKey(ctx, dim, color, false, 0.8, startTimeRatio)
        } else {
            this.drawWhiteKey(ctx, dim, color, false, 0.8, startTimeRatio)
        }
        ctx.globalCompositeOperation = "source-over"
    }

    clearPlayedKeysCanvases() {
        const renderDims = getRenderDimensions()
        const wKeyHt = renderDims.whiteKeyHeight
        const bKeyHt = renderDims.blackKeyHeight
        const windowWd = renderDims.renderWidth
        this.playedKeysCtxWhite.clearRect(0, 0, windowWd, Math.max(wKeyHt, bKeyHt))
        this.playedKeysCtxBlack.clearRect(0, 0, windowWd, Math.max(wKeyHt, bKeyHt))
    }

    drawPiano(ctxWhite, ctxBlack) {
        const renderDims = getRenderDimensions()
        const wKeyHt = renderDims.whiteKeyHeight
        const bKeyHt = renderDims.blackKeyHeight
        const windowWd = renderDims.renderWidth
        ctxWhite.clearRect(0, 0, windowWd, Math.max(wKeyHt, bKeyHt))
        ctxBlack.clearRect(0, 0, windowWd, Math.max(wKeyHt, bKeyHt))
        // Background
        ctxWhite.fillStyle = getSetting("pianoBackgroundColor")
        ctxWhite.fillRect(0, 0, windowWd, wKeyHt)

        this.drawWhiteKeys(ctxWhite)
        if (getSetting("showKeyNamesOnPianoWhite")) {
            this.drawWhiteKeyNames(ctxWhite)
        }
        // var img = new Image()
        // img.src = "../../blackKey.svg"
        // img.onload = function () {
        this.drawBlackKeys(ctxBlack)
        if (getSetting("showKeyNamesOnPianoBlack")) {
            this.drawBlackKeyNames(ctxBlack)
        }

        // }.bind(this)

        //velvet
        // ctxWhite.strokeStyle = "rgba(155,50,50,1)"
        // ctxWhite.shadowColor = "rgba(155,50,50,1)"
        // ctxWhite.shadowOffsetY = 2
        // ctxWhite.shadowBlur = 52
        // ctxWhite.filter = "blur(4px)"
        // ctxWhite.lineWidth = 12 * getRenderDimensions()._keyResolution
        // ctxWhite.beginPath()
        // ctxWhite.moveTo(getRenderDimensions().windowWidth, 2)
        // ctxWhite.lineTo(0, 2)
        // ctxWhite.closePath()
        // ctxWhite.stroke()
        // ctxWhite.filter = "none"
        // ctxWhite.shadowColor = "rgba(0,0,0,0)"
        // ctxWhite.shadowBlur = 0
    }

    drawWhiteKeys(ctxWhite) {
        for (
            let i = Math.max(0, getRenderDimensions().minNoteNumber); i <= getRenderDimensions().maxNoteNumber; i++
        ) {
            let dims = getRenderDimensions().getKeyDimensions(i)
            if (!isBlack(i)) {
                this.drawWhiteKey(ctxWhite, dims, getSetting("pianoWhiteKeyColor"))
            }
        }
    }

    drawBlackKeys(ctxBlack) {
        const renderDims = getRenderDimensions()
        const maxNote = renderDims.maxNoteNumber
        for (let i = Math.max(0, renderDims.minNoteNumber); i <= maxNote; i++) {
            let dims = renderDims.getKeyDimensions(i)
            if (isBlack(i)) {
                this.drawBlackKey(
                    ctxBlack,
                    dims,
                    getSetting("pianoBlackKeyColor"),
                    true
                )
            }
        }
    }
    drawWhiteKeyNames(ctx) {
        const renderDims = getRenderDimensions()
        const wKeyWd = renderDims.whiteKeyWidth
        const wKeyHt = renderDims.whiteKeyHeight
        const maxNote = renderDims.maxNoteNumber
        ctx.fillStyle = "black"
        const fontSize = wKeyWd / 2.2
        ctx.font = fontSize + "px Arial black"
        for (
            let i = Math.max(0, getRenderDimensions().minNoteNumber); i <= maxNote; i++
        ) {
            let dims = renderDims.getKeyDimensions(i)
            if (!isBlack(i)) {
                let txt = formatNote(i + 21)
                let txtWd = ctx.measureText(txt).width
                ctx.fillText(
                    txt,
                    dims.x + dims.w / 2 - txtWd / 2,
                    wKeyHt - fontSize / 3
                )
            }
        }
    }
    drawBlackKeyNames(ctx) {
        const renderDims = getRenderDimensions()
        const bKeyHt = renderDims.blackKeyHeight
        const maxNote = renderDims.maxNoteNumber
        ctx.fillStyle = "white"
        const fontSize = renderDims.blackKeyWidth / 2.1
        ctx.font = Math.ceil(fontSize) + "px Arial black"
        for (let i = Math.max(0, renderDims.minNoteNumber); i <= maxNote; i++) {
            let dims = getRenderDimensions().getKeyDimensions(i)
            if (isBlack(i)) {
                let txt = formatNote(i + 21)
                let txtWd = ctx.measureText(txt).width
                ctx.fillText(txt, dims.x + dims.w / 2 - txtWd / 2, bKeyHt - 2)
            }
        }
    }

    /**
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {Dimensions} dims
     */
    drawWhiteKey(ctx, dims, color, noShadow, a, startTimeRatio) {
        startTimeRatio = startTimeRatio || 1

        let radius = Math.ceil(getRenderDimensions().whiteKeyWidth / 20)
        let x = dims.x
        let y = Math.floor(dims.y)
        let height = Math.floor(dims.h)
        let width = dims.w / startTimeRatio
        x -= (width - dims.w) / 2

        this.getWhiteKeyPath(ctx, x, y, width, height, radius)

        ctx.fillStyle = color
        ctx.fill()
        if (!noShadow && !getSetting("disableKeyShadows")) {
            ctx.fillStyle = this.getKeyGradient(ctx, a)
            ctx.fill()
        }

        ctx.closePath()
    }
    getKeyGradient(ctx, a) {
        a = a || 1
        if (this.keyGradient == null || this.keyGradientA != a) {
            const renderDims = getRenderDimensions()
            const wKeyHt = renderDims.whiteKeyHeight
            const windowWd = renderDims.renderWidth
            this.keyGradient = ctx.createLinearGradient(
                windowWd / 2,
                0,
                windowWd / 2,
                wKeyHt
            )
            this.keyGradient.addColorStop(0, "rgba(0,0,0," + a + ")")
            this.keyGradient.addColorStop(1, "rgba(255,255,255," + 0 + ")")
            this.keyGradientA = a
        }
        return this.keyGradient
    }
    getWhiteKeyPath(ctx, x, y, width, height, radius) {
        let marg = getRenderDimensions()._keyResolution

        ctx.beginPath()
        ctx.moveTo(x + marg, y)

        ctx.lineTo(x - marg + width, y)

        ctx.lineTo(x - marg + width, y + height - radius)
        ctx.lineTo(x - marg + width - radius, y + height)
        ctx.lineTo(x + marg + radius, y + height)
        ctx.lineTo(x + marg, y + height - radius)
        ctx.lineTo(x + marg, y)
    }

    drawBlackKeySvg(ctx, dims, color) {
        // let radiusTop = getRenderDimensions().blackKeyWidth / 15
        // let radiusBottom = getRenderDimensions().blackKeyWidth / 8
        let x = dims.x
        let y = dims.y + 5
        let height = dims.h
        let width = dims.w

        ctx.drawImage(this.blackKeyImg, x, y, width, height)
    }
    /**
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {Dimensions} dims
     */
    drawBlackKey(ctx, dims, color, noShadow, a, startTimeRatio) {
        startTimeRatio = startTimeRatio || 1
        color = color || "black"

        let radiusTop = 0 //getRenderDimensions().blackKeyWidth / 15
        let radiusBottom = getRenderDimensions().blackKeyWidth / 8
        let x = dims.x
        let y = dims.y
        let height = dims.h
        let width = dims.w / startTimeRatio
        x -= (width - dims.w) / 2

        this.getBlackKeyPath(ctx, x, y, radiusTop, width, height, radiusBottom)

        ctx.fillStyle = color
        ctx.fill()
        if (!noShadow && !getSetting("disableKeyShadows")) {
            ctx.fillStyle = this.getKeyGradient(ctx, a)
            ctx.fill()
        }
        ctx.closePath()
    }

    getBlackKeyPath(ctx, x, y, radiusTop, width, height, radiusBottom) {
        let marg = getRenderDimensions()._keyResolution
        ctx.beginPath()
        ctx.moveTo(x + marg, y + radiusTop)
        ctx.lineTo(x + marg + radiusTop, y)
        ctx.lineTo(x - marg - radiusTop + width, y)
        ctx.lineTo(x - marg + width, y + radiusTop)
        ctx.lineTo(x - marg + width, y + height - radiusBottom)
        ctx.lineTo(x - marg + width - radiusBottom, y + height)
        ctx.lineTo(x + marg + radiusBottom, y + height)
        ctx.lineTo(x + marg, y + height - radiusBottom)
        ctx.lineTo(x + marg, y)
    }

    getPianoCanvasWhite() {
        if (!this.pianoCanvasWhite) {
            this.pianoCanvasWhite = this.createPianoCanvas(99)
            this.ctxWhite = this.pianoCanvasWhite.getContext("2d")
        }
        return this.pianoCanvasWhite
    }
    getPlayedKeysWhite() {
        if (!this.playedKeysCanvasWhite) {
            this.playedKeysCanvasWhite = this.createPianoCanvas(99)
            this.playedKeysCtxWhite = this.playedKeysCanvasWhite.getContext("2d")
        }
        return this.playedKeysCanvasWhite
    }
    getPianoCanvasBlack() {
        if (!this.pianoCanvasBlack) {
            this.pianoCanvasBlack = this.createPianoCanvas(99)
            this.ctxBlack = this.pianoCanvasBlack.getContext("2d")
        }
        return this.pianoCanvasBlack
    }
    getPlayedKeysBlack() {
        if (!this.playedKeysCanvasBlack) {
            this.playedKeysCanvasBlack = this.createPianoCanvas(99)
            this.playedKeysCtxBlack = this.playedKeysCanvasBlack.getContext("2d")

            this.playedKeysCanvasBlack.addEventListener(
                "mousedown",
                this.onPianoMousedown.bind(this)
            )
            this.playedKeysCanvasBlack.addEventListener(
                "mouseup",
                this.onPianoMouseup.bind(this)
            )
            this.playedKeysCanvasBlack.addEventListener(
                "mousemove",
                this.onPianoMousemove.bind(this)
            )
            this.playedKeysCanvasBlack.addEventListener(
                "mouseleave",
                this.onPianoMouseleave.bind(this)
            )

            this.playedKeysCanvasBlack.addEventListener(
                "touchstart",
                this.onPianoMousedown.bind(this)
            )
            this.playedKeysCanvasBlack.addEventListener(
                "touchend",
                this.onPianoMouseup.bind(this)
            )
            this.playedKeysCanvasBlack.addEventListener(
                "touchmove",
                this.onPianoMousemove.bind(this)
            )
        }
        return this.playedKeysCanvasBlack
    }
    createPianoCanvas(zIndex) {
        const renderDims = getRenderDimensions()
        const wKeyHt = renderDims.whiteKeyHeight
        const bKeyHt = renderDims.blackKeyHeight
        const windowWd = renderDims.renderWidth
        let cnv = DomHelper.createCanvas(windowWd, Math.max(wKeyHt, bKeyHt), {
            position: "absolute",
            left: "0px",
            zIndex: zIndex,
            pointerEvents: "none"
        })
        cnv.className = "pianoCanvas"
        cnv.style.width = renderDims.windowWidth + "px"
        cnv.style.height =
            Math.max(wKeyHt, bKeyHt) /*/ window.devicePixelRatio*/ + "px"
        document.body.appendChild(cnv)
        return cnv
    }
    onPianoMousedown(ev) {
        ev.preventDefault()
        if (getSetting("clickablePiano")) {
            let {
                x,
                y
            } = this.getCanvasPosFromMouseEvent(ev)
            let keyUnderMouse = this.getKeyAtPos(x, y)
            if (keyUnderMouse >= 0) {
                this.currentKeyUnderMouse = keyUnderMouse
                this.isMouseDown = true
                this.onNoteOn(keyUnderMouse)
            } else {
                this.clearCurrentKeyUnderMouse()
            }
        }
    }

    onPianoMouseup(ev) {
        ev.preventDefault()
        this.isMouseDown = false
        this.clearCurrentKeyUnderMouse()
    }
    onPianoMouseleave(ev) {
        ev.preventDefault()
        this.isMouseDown = false
        this.clearCurrentKeyUnderMouse()
    }

    onPianoMousemove(ev) {
        ev.preventDefault()
        if (getSetting("clickablePiano")) {
            let {
                x,
                y
            } = this.getCanvasPosFromMouseEvent(ev)
            let keyUnderMouse = this.getKeyAtPos(x, y)
            if (this.isMouseDown && keyUnderMouse >= 0) {
                if (this.currentKeyUnderMouse != keyUnderMouse) {
                    this.onNoteOff(this.currentKeyUnderMouse)
                    this.onNoteOn(keyUnderMouse)
                    this.currentKeyUnderMouse = keyUnderMouse
                }
            } else {
                this.clearCurrentKeyUnderMouse()
            }
        }
    }
    clearCurrentKeyUnderMouse() {
        if (this.currentKeyUnderMouse >= 0) {
            this.onNoteOff(this.currentKeyUnderMouse)
        }
        this.currentKeyUnderMouse = -1
    }
    getKeyAtPos(x, y) {
        let clickedKey = -1
        const renderDims = getRenderDimensions()
        for (let i = 0; i <= 87; i++) {
            let dims = renderDims.getKeyDimensions(i)
            if (x > dims.x && x < dims.x + dims.w) {
                if (y > dims.y && y < dims.y + dims.h) {
                    if (clickedKey == -1) {
                        clickedKey = i
                    } else if (isBlack(i) && !isBlack(clickedKey)) {
                        clickedKey = i
                        break
                    }
                }
            }
        }
        return clickedKey
    }
    getCanvasPosFromMouseEvent(ev) {
        // let canvHt = Math.max(
        // 	getRenderDimensions().whiteKeyHeight,
        // 	getRenderDimensions().blackKeyHeight
        // )
        let yOffset = getRenderDimensions().getAbsolutePianoPosition()
        if (ev.clientX == undefined) {
            if (ev.touches.length) {
                return {
                    x: ev.touches[ev.touches.length - 1]
                        .clientX /** window.devicePixelRatio*/ ,
                    y: ev.touches[ev.touches.length - 1].clientY - yOffset
                }
            } else {
                return {
                    x: -1,
                    y: -1
                }
            }
        }
        let x = ev.clientX /** window.devicePixelRatio*/
        let y = ev.clientY - yOffset
        return {
            x,
            y
        }
    }
}