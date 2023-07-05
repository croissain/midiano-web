import {
    getUI
} from "./main.js"
import {
    getCurrentSong,
    getPlayer,
    START_DELAY
} from "./player/Player.js"
import {
    getRenderDimensions
} from "./Rendering/RenderDimensions.js"
import {
    getSetting
} from "./settings/Settings.js"
import {
    getKeyBindings
} from "./ui/KeyBinder.js"

export class InputListeners {
    constructor(ui, render) {
        this.grabSpeed = []
        this.delay = false

        window.oncontextmenu = function(event) {
            event.preventDefault()
            event.stopPropagation()
            return false
        }

        this.addMouseAndTouchListeners(render, ui)

        render.getMainCanvas().addEventListener("wheel", this.onWheel())

        this.addProgressBarMouseListeners(render)

        window.addEventListener("keydown", this.onKeyDown(ui))
        window.addEventListener("keyup", this.onKeyUp())

        ui.fireInitialListeners()

        this.keysPressed = {}

        let player = getPlayer()
        render.setPianoInputListeners(
            player.addInputNoteOn.bind(player),
            player.addInputNoteOff.bind(player)
        )
    }

    addMouseAndTouchListeners(render, ui) {
        window.addEventListener("mouseup", ev => this.onMouseUp(ev, render))
        render
            .getMainCanvas()
            .addEventListener("mousedown", ev => this.onMouseDown(ev, render), {
                passive: false
            })
        render
            .getMainCanvas()
            .addEventListener("mousemove", ev => this.onMouseMove(ev, render, ui), {
                passive: false
            })
        window.addEventListener("touchend", ev => this.onMouseUp(ev, render), {
            passive: false
        })
        render
            .getMainCanvas()
            .addEventListener("touchstart", ev => this.onMouseDown(ev, render), {
                passive: false
            })
        render
            .getMainCanvas()
            .addEventListener("touchmove", ev => this.onMouseMove(ev, render, ui), {
                passive: false
            })
    }

    addProgressBarMouseListeners(render) {
        render
            .getProgressBarCanvas()
            .addEventListener("mousemove", this.onMouseMoveProgressCanvas(render))
        render
            .getProgressBarCanvas()
            .addEventListener("mousedown", this.onMouseDownProgressCanvas(render))
    }

    onWheel() {
        return event => {
            if (this.delay) {
                return
            }
            this.delay = true

            let alreadyScrolling = getPlayer().scrolling != 0

            //Because Firefox does not set .wheelDelta
            let wheelDelta = event.wheelDelta ? event.wheelDelta : -1 * event.deltaY

            let evDel =
                ((wheelDelta + 1) / (Math.abs(wheelDelta) + 1)) *
                Math.min(500, Math.abs(wheelDelta))

            var wheel = (evDel / Math.abs(evDel)) * 500

            if (!isNaN(wheel) && Math.abs(wheel) > 0) {
                getPlayer().scrolling -= 0.001 * wheel
                if (!alreadyScrolling) {
                    getPlayer().handleScroll()
                }
            }
            this.delay = false
        }
    }

    onKeyDown(ui) {
        return e => {
            if (!getPlayer().isFreeplay) {
                if (!isActiveElSelectOrInput()) {
                    if (!getSetting("disableHotkeys") &&
                        Object.values(functionKeys)
                        .map(val => val.key.toUpperCase())
                        .includes(e.key.toUpperCase())
                    ) {
                        getFunctionKey(e.key).func(e)
                    }
                    if (Object.keys(getKeyBindings()).includes(e.key.toUpperCase())) {
                        getKeyBindings()[e.key.toUpperCase()].forEach(noteNum => {
                            if (!this.keysPressed[noteNum]) {
                                this.keysPressed[noteNum] = true
                                getPlayer().addInputNoteOn(noteNum)
                            }
                        })
                    }
                }
            }
        }
    }
    onKeyUp() {
        return e => {
            let player = getPlayer()
            if (!player.isFreeplay) {
                if (getKeyBindings().hasOwnProperty(e.key.toUpperCase())) {
                    getKeyBindings()[e.key.toUpperCase()].forEach(noteNum => {
                        this.keysPressed[noteNum] = false
                        player.addInputNoteOff(noteNum)
                    })
                }
            }
        }
    }

    onMouseDownProgressCanvas(render) {
        return ev => {
            ev.preventDefault()
            if (ev.target == render.getProgressBarCanvas()) {
                this.grabbedProgressBar = true
                render.setProgressBarGrabbed()
                getPlayer().wasPaused = getPlayer().paused
                getPlayer().pause()
                let newTime =
                    (ev.clientX / getRenderDimensions().windowWidth) *
                    (getPlayer().song.getEnd() / 1000)

                getPlayer().setTime(newTime)
            }
        }
    }

    onMouseMoveProgressCanvas(render) {
        return ev => {
            if (this.grabbedProgressBar && getPlayer().song) {
                let newTime =
                    (ev.clientX / getRenderDimensions().windowWidth) *
                    (getPlayer().song.getEnd() / 1000)
                getPlayer().setTime(newTime)
            }
        }
    }

    onMouseMove(ev, render, ui) {
        let pos = this.getXYFromMouseEvent(ev)

        if (this.grabbedPiano) {
            if (this.grabbedPiano && this.isOnPiano(pos)) {
                render.pianoRender.onPianoMousemove(ev)
            }
            return
        }
        if (this.grabbedProgressBar && getPlayer().song) {
            let newTime =
                (ev.clientX / getRenderDimensions().windowWidth) *
                (getPlayer().song.getEnd() / 1000)
            getPlayer().setTime(newTime)
            return
        }

        if (this.grabbedMainCanvas && getPlayer().song) {
            if (this.lastYGrabbed) {
                let alreadyScrolling = getPlayer().scrolling != 0
                let yChange =
                    (getSetting("reverseNoteDirection") ? -1 : 1) *
                    (this.lastYGrabbed - pos.y)
                if (!alreadyScrolling) {
                    getPlayer().setTime(
                        getPlayer().getTime() - render.getTimeFromHeight(yChange)
                    )
                    this.grabSpeed.push(yChange)
                    if (this.grabSpeed.length > 3) {
                        this.grabSpeed.splice(0, 1)
                    }
                }
            }
            this.lastYGrabbed = pos.y
        }

        render.setMouseCoords(
            ev.clientX /* * window.devicePixelRatio*/ ,
            ev.clientY /* * window.devicePixelRatio*/
        )

        ui.mouseMoved()
    }

    isOnPiano(pos) {
        let renderDims = getRenderDimensions()
        let diff = pos.y - renderDims.getAbsolutePianoPosition()
        return diff < renderDims.whiteKeyHeight && diff > 0
    }

    onMouseDown(ev, render) {
        let pos = this.getXYFromMouseEvent(ev)
        this.lastMouseDownTime = window.performance.now()
        this.lastMouseDownPos = pos

        if (this.isOnPiano(pos)) {
            this.grabbedPiano = true
            render.pianoRender.onPianoMousedown(ev)
        } else if (render.isOnMainCanvas(pos) && !this.grabbedProgressBar) {
            getPlayer().wasPaused = getPlayer().paused
            ev.preventDefault()
            this.grabbedMainCanvas = true
            getPlayer().pause()
        }
    }

    onMouseUp(ev, render) {
        let pos = this.getXYFromMouseEvent(ev)
        if (ev.target == document.body && render.isOnMainCanvas(pos)) {
            ev.preventDefault()
        }
        if (this.grabbedPiano) {
            render.pianoRender.onPianoMouseup(ev)
        } else if (
            this.grabbedMainCanvas &&
            window.performance.now() - this.lastMouseDownTime < 125 &&
            !this.lastYGrabbed
        ) {
            this.grabbedMainCanvas = false
            let newState = !getPlayer().wasPaused
            newState ? getPlayer().pause() : getPlayer().resume()
            return
        }
        if (this.grabSpeed.length) {
            let delta = this.grabSpeed[this.grabSpeed.length - 1] / 50
            if (!isNaN(delta)) {
                getPlayer().scrolling = delta
                getPlayer().handleScroll()
            }

            this.grabSpeed = []
        }
        if (this.grabbedProgressBar || this.grabbedMainCanvas) {
            if (!getPlayer().wasPaused) {
                getPlayer().resume()
            }
        }
        this.grabbedProgressBar = false
        render.setProgressBarGrabbed(false)
        this.grabbedMainCanvas = false
        this.grabbedPiano = false
        this.lastYGrabbed = false
    }

    getXYFromMouseEvent(ev) {
        if (ev.clientX == undefined) {
            if (ev.touches.length) {
                return {
                    x: ev.touches[ev.touches.length - 1].clientX,
                    y: ev.touches[ev.touches.length - 1].clientY
                }
            } else {
                return {
                    x: -1,
                    y: -1
                }
            }
        }
        return {
            x: ev.clientX,
            y: ev.clientY
        }
    }
}
export const functionKeys = {
    Space: {
        key: " ",
        name: "Space",
        description: "Pause / Unpause",
        func: e => {
            e.preventDefault()
            if (!getPlayer().paused) {
                getUI().clickPause(e)
            } else {
                getUI().clickPlay(e)
            }
        }
    },
    Backspace: {
        key: "Backspace",
        name: "Backspace",
        description: "Jump to beginning of the song",
        func: e => {
            e.preventDefault()
            let song = getCurrentSong()
            if (song) {
                getPlayer().setTime(START_DELAY)
            }
        }
    },
    ArrowUp: {
        key: "ArrowUp",
        name: "Up",
        description: "Increase speed",
        func: e => {
            if (!isActiveElSelectOrInput()) {
                getPlayer().increaseSpeed(0.05)
                getUI().getSpeedDisplayField().value =
                    Math.floor(getPlayer().playbackSpeed * 100) + "%"
            }
        }
    },
    ArrowDown: {
        key: "ArrowDown",
        name: "Down",
        description: "Decrease speed",
        func: e => {
            if (!isActiveElSelectOrInput()) {
                getPlayer().increaseSpeed(-0.05)
                getUI().getSpeedDisplayField().value =
                    Math.floor(getPlayer().playbackSpeed * 100) + "%"
            }
        }
    },
    ArrowLeft: {
        key: "ArrowLeft",
        name: "Left",
        description: "Skip 3s forward",
        func: e => {
            if (!isActiveElSelectOrInput()) {
                getPlayer().skipBack()
            }
        }
    },
    ArrowRight: {
        key: "ArrowRight",
        name: "Right",
        description: "Skip 3s backward",
        func: e => {
            if (!isActiveElSelectOrInput()) {
                getPlayer().skipForward()
            }
        }
    },
    M: {
        key: "M",
        name: "M",
        description: "Mute / Unmute",
        func: e => {
            e.preventDefault()
            getUI().mute()
        }
    },
    C: {
        key: "C",
        name: "C",
        description: "Show / Hide top menu",
        func: e => {
            e.preventDefault()
            getUI().toggleMenu()
        }
    }
}

for (let i = 0; i <= 9; i++) {
    let key = i + ""
    let name = "" + i
    let description = `Jump to ${i * 10}% of the song`
    let func = e => {
        e.preventDefault()
        let song = getCurrentSong()
        if (song) {
            getPlayer().setTime(((song.getEnd() / 1000) * i) / 10)
        }
    }
    functionKeys["Z" + key] = {
        key,
        name,
        description,
        func
    }
}

function getFunctionKey(key) {
    return Object.values(functionKeys).find(
        fk => fk.key.toUpperCase() == key.toUpperCase()
    )
}

function isActiveElSelectOrInput() {
    let activeElTagname = document.activeElement.tagName.toLocaleLowerCase()
    return activeElTagname == "select" || activeElTagname == "input"
}