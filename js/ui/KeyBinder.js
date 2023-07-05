import {
    DomHelper
} from "./DomHelper.js"
import {
    getSetting,
    setSetting
} from "../settings/Settings.js"
import {
    Notification
} from "./Notification.js"
import {
    isBlack
} from "../Util.js"
import {
    getRenderDimensions
} from "../Rendering/RenderDimensions.js"

class KeyBindings {
    constructor() {
        this.currentIndex = 0
        this.bindings = getSetting("keyBindings") || {}

        if (typeof this.bindings == "string") {
            this.bindings = {}
        }
        this.done = true

        this.canvas = document.createElement("canvas")
        this.canvas.id = "keyBindCanvas"
        this.ctx = this.canvas.getContext("2d")
        this.glowTicker = 0

        getRenderDimensions().registerResizeCallback(
            () => (this.resizeTriggered = true)
        )

        document.body.appendChild(this.canvas)
    }
    render() {
        if (this.isSizeChanged()) {
            let c = this.ctx
            const renderDims = getRenderDimensions()
            c.clearRect(0, 0, renderDims.windowWidth, renderDims.whiteKeyHeight)
            this.positionCanvas()

            if (!this.done) {
                c.lineWidth = 1

                c.fillStyle = "rgba(0,0,0,0.4)"
                c.fillRect(0, 0, renderDims.windowWidth, renderDims.whiteKeyHeight)
                this.glowTicker += 0.05
                c.strokeStyle = "rgba(255,255,255,0.8)"
                c.lineWidth = 6 + 1 * Math.sin(this.glowTicker)
                let activeDims = renderDims.getKeyDimensions(this.currentIndex)
                c.strokeRect(activeDims.x + 1, 0, activeDims.w - 2, activeDims.h)
                this.resizeTriggered = true
            }

            this.drawKeys()
        }
    }
    getBoundKeys(noteNum) {
        return Object.entries(this.bindings)
            .filter(entry => entry[1].includes(noteNum))
            .map(entry => entry[0])
    }
    getKeysForNote(noteNum) {
        let keys = []
        for (let keyCode in this.bindings) {
            if (this.bindings[keyCode].includes(noteNum)) {
                keys.push(keyCode)
                continue
            }
        }
        return keys
    }
    clearNoteKey(noteNum) {
        for (let keyCode in this.bindings) {
            for (let i = this.bindings[keyCode].length - 1; i >= 0; i--) {
                if (this.bindings[keyCode][i] == noteNum)
                    this.bindings[keyCode].splice(i, 1)
            }
        }
    }
    drawKeys() {
        if (this.isEnabled || !this.done) {
            const fontSize = getRenderDimensions().blackKeyWidth / 2.1
            const renderDims = getRenderDimensions()
            const maxNote = renderDims.maxNoteNumber
            for (
                let i = Math.max(0, getRenderDimensions().minNoteNumber); i <= maxNote; i++
            ) {
                let bindings = this.getKeysForNote(i)
                let dims = renderDims.getKeyDimensions(i)
                let y = 15 + (fontSize + 2)
                let c = this.ctx
                c.fillStyle = "rgba(15,15,15,1)"
                if (isBlack(i)) {
                    c.fillStyle = "rgba(155,155,155,1)"
                }
                c.font = Math.ceil(fontSize) + "px Arial black"
                bindings.forEach((binding, index) => {
                    let txt = binding
                    let txtWd = c.measureText(txt).width
                    c.fillText(
                        txt,
                        dims.x + dims.w / 2 - txtWd / 2,
                        y + index * (fontSize + 2)
                    )
                })
            }
        }
    }
    theKeyDownCallback(ev) {
        if (ev.key == "Enter") {
            this.resizeTriggered = true
            this.stopKeyBind()
            return
        }
        if (ev.key == "Escape") {
            this.resizeTriggered = true
            this.clearNoteKey(this.currentIndex)
            return
        }
        if (ev.key == "ArrowLeft") {
            this.currentIndex--
                this.resizeTriggered = true
            ev.stopPropagation()
            return
        }
        if (ev.key == "ArrowRight") {
            this.currentIndex++
                this.resizeTriggered = true
            ev.stopPropagation()
            return
        }

        if (
            ev.key == "AltGraph" ||
            ev.key == "Alt" ||
            ev.key == "Shift" ||
            ev.key == "Control"
        ) {
            return
        }

        let upperKey = ev.key.toUpperCase()
        if (!this.bindings.hasOwnProperty(upperKey)) {
            this.bindings[upperKey] = []
        }
        if (!this.bindings[upperKey].includes(this.currentIndex)) {
            this.bindings[upperKey].push(this.currentIndex)
            this.currentIndex++
        }

        if (this.currentIndex > getRenderDimensions().maxNoteNumber) {
            this.stopKeyBind()
        }
    }
    start() {
        this.resizeTriggered = true
        if (!this.done) {
            this.stopKeyBind()
        }
        this.currentIndex = getRenderDimensions().minNoteNumber

        this.positionCanvas()
        this.canvas.zIndex = 150
        this.canvas.style.display = "block"
        DomHelper.showDiv(this.canvas)

        this.notification = Notification.createPermanent(
            "Press any key to bind to piano </br> Left/Right - Select key </br> Escape - Clear key  </br> Enter - Exit binding mode"
        )

        this.done = false
        this.keylistener = this.theKeyDownCallback.bind(this)
        document.addEventListener("keydown", this.keylistener)
    }
    stopKeyBind() {
        document.removeEventListener("keydown", this.keylistener)
        setSetting("keyBindings", this.bindings)
        Notification.remove()
        this.done = true
    }
    isSizeChanged() {
        if (
            this.resizeTriggered ||
            this.windowWidth != getRenderDimensions().windowWidth ||
            this.height != getRenderDimensions().whiteKeyHeight ||
            this.top != getRenderDimensions().getAbsolutePianoPosition() + "px" ||
            this.isEnabled != getSetting("showKeyBindingsOnPiano")
        ) {
            this.resizeTriggered = false
            this.positionCanvas()
            return true
        }
    }
    positionCanvas() {
        const renderDims = getRenderDimensions()
        this.windowWidth = renderDims.renderWidth
        this.height = renderDims.whiteKeyHeight

        this.canvas.width = this.windowWidth
        this.canvas.height = this.height

        this.canvas.style.width = renderDims.windowWidth + "px"
        this.canvas.style.height = this.height /* / window.devicePixelRatio*/ + "px"

        this.top = getRenderDimensions().getAbsolutePianoPosition() + "px"
        this.canvas.style.top = this.top

        this.isEnabled = getSetting("showKeyBindingsOnPiano")
    }
    clear() {
        this.bindings = {}
    }
}

var theKeyBinder
export const getKeyBinder = () => {
    return theKeyBinder
}
export const createKeyBinder = () => {
    theKeyBinder = new KeyBindings()
}
export const getKeyBindings = () => {
    return getKeyBinder().bindings
}