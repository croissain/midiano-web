import {
    DomHelper
} from "../ui/DomHelper.js"
import {
    PianoRender
} from "./PianoRender.js"
import {
    DebugRender
} from "./DebugRender.js"
import {
    OverlayRender
} from "./OverlayRender.js"
import {
    NoteRender
} from "./NoteRender.js"
import {
    SustainRender
} from "./SustainRenderer.js"
import {
    MarkerRenderer
} from "./MarkerRenderer.js"
import {
    getRenderDimensions,
    RenderDimensions
} from "./RenderDimensions.js"
import {
    BackgroundRender
} from "./BackgroundRender.js"
import {
    MeasureLinesRender
} from "./MeasureLinesRender.js"
import {
    ProgressBarRender
} from "./ProgressBarRender.js"
import {
    getSetting,
    setSettingCallback,
    triggerSettingCallback
} from "../settings/Settings.js"
import {
    isBlack
} from "../Util.js"
import {
    getTrackColor,
    isTrackDrawn
} from "../player/Tracks.js"
import {
    getPlayer,
    getPlayerState
} from "../player/Player.js"
import {
    InSongTextRenderer
} from "./InSongTextRenderer.js"
import {
    CONST
} from "../data/CONST.js"
import {
    SheetRender
} from "../sheet/SheetRender.js"
import {
    createKeyBinder,
    getKeyBinder
} from "../ui/KeyBinder.js"
import {
    threeJsRender
} from "./ThreeJs/threeJsHandler.js"
import {
    SHEET_SIDE_MARGIN
} from "../sheet/SheetGenerator.js"

const DEBUG = true

export const PROGRESS_BAR_CANVAS_HEIGHT = 25

/**
 * Class that handles all rendering
 */
export class Render {
    constructor() {
        getRenderDimensions().registerResizeCallback(this.setupCanvases.bind(this))

        createKeyBinder()

        getPlayer().addNewSongCallback(() => {
            if (getSetting("fitZoomOnNewSong")) {
                getRenderDimensions().fitSong(getPlayer().song.getNoteRange())
            }
        })
        setSettingCallback("particleBlur", this.setCtxBlur.bind(this))
        setSettingCallback("particleRenderBehind", this.setFgCtxZIndex.bind(this))

        this.setupCanvases()

        this.pianoRender = new PianoRender()
        this.overlayRender = new OverlayRender(this.ctx)
        this.debugRender = new DebugRender(DEBUG, this.ctx)
        this.sheetRender = new SheetRender(this.ctxSheet)

        this.resizeTimer = null
        window.addEventListener("resize", () => {
            if (this.sheetRender.active) {
                clearTimeout(this.resizeTimer)
                this.resizeTimer = window.setTimeout(() => {
                    if (getPlayer().song && getPlayer().song.sheetGen) {
                        getPlayer().song.sheetGen.computeLines(
                            getRenderDimensions().windowWidth / this.sheetRender.scale,
                            SHEET_SIDE_MARGIN / this.sheetRender.scale,
                            50
                        )
                    }
                })
            }
        })

        getRenderDimensions().sheetY =
            this.progressBarCanvas.getBoundingClientRect().top +
            PROGRESS_BAR_CANVAS_HEIGHT

        this.noteRender = new NoteRender(
            this.ctx,
            this.ctxForeground,
            this.pianoRender
        )

        this.sustainRender = new SustainRender(this.ctx)
        this.markerRender = new MarkerRenderer(this.ctx)
        this.inSongTextRender = new InSongTextRenderer(this.ctx)
        this.measureLinesRender = new MeasureLinesRender(this.ctx)
        this.progressBarRender = new ProgressBarRender(this.progressBarCtx)
        this.backgroundRender = new BackgroundRender(this.ctxBG)

        //Needed for FPS calc
        this.fpsFilterStrength = 10
        this.frameTime = 0
        this.lastTimestamp = window.performance.now()

        this.mouseX = 0
        this.mouseY = 0

        this.playerState = getPlayerState()

        this.showKeyNamesOnPianoWhite = getSetting("showKeyNamesOnPianoWhite")
        this.showKeyNamesOnPianoBlack = getSetting("showKeyNamesOnPianoBlack")
        this.drawPianoShadows = getSetting("disableKeyShadows")
    }

    setCtxBlur() {
        let blurPx = parseInt(getSetting("particleBlur"))
        if (blurPx == 0) {
            this.ctxForeground.filter = "none"
        } else {
            this.ctxForeground.filter = "blur(" + blurPx + "px)"
        }
    }
    setPianoInputListeners(onNoteOn, onNoteOff) {
        this.pianoRender.setPianoInputListeners(onNoteOn, onNoteOff)
    }

    /**
     * Main rendering function
     */
    render(playerState) {
        this.playerState = playerState
        const renderDims = getRenderDimensions()
        const windowWd = renderDims.renderWidth
        const windowHt = renderDims.renderHeight
        this.ctx.clearRect(0, 0, windowWd, windowHt)
        this.ctxForeground.clearRect(0, 0, windowWd, windowHt)

        this.pianoRender.clearPlayedKeysCanvases()
        if (
            this.showKeyNamesOnPianoWhite != getSetting("showKeyNamesOnPianoWhite") ||
            this.showKeyNamesOnPianoBlack != getSetting("showKeyNamesOnPianoBlack") ||
            this.showPianoKeyNameFlats != getSetting("showPianoKeyNameFlats") ||
            this.drawPianoShadows != getSetting("disableKeyShadows")
        ) {
            this.showKeyNamesOnPianoWhite = getSetting("showKeyNamesOnPianoWhite")
            this.showKeyNamesOnPianoBlack = getSetting("showKeyNamesOnPianoBlack")
            this.showPianoKeyNameFlats = getSetting("showPianoKeyNameFlats")
            this.drawPianoShadows = getSetting("disableKeyShadows")
            this.pianoRender.resize()
        }

        threeJsRender(playerState.time)

        getKeyBinder().render()

        this.backgroundRender.renderIfColorsChanged()

        let renderInfosByTrackMap = this.getRenderInfoByTrackMap(playerState)
        let inputActiveRenderInfos = this.getInputActiveRenderInfos(playerState)
        let inputPlayedRenderInfos = this.getInputPlayedRenderInfos(playerState)

        if (this.sheetCnv) {
            if (playerState.song) {
                this.sheetRender.render(
                    playerState.time,
                    playerState.song.sheetGen,
                    inputActiveRenderInfos,
                    this.mouseX,
                    this.mouseY
                )
            }
            this.sheetRender.active = true
        } else {
            this.sheetRender.active = false
        }
        const time = this.getRenderTime(playerState)
        const end = playerState.end
        if (!playerState.loading && playerState.song) {
            const measureLines = playerState.song ?
                playerState.song.getMeasureLines() :
                []

            this.progressBarRender.render(time, end, playerState.song.markers)
            this.measureLinesRender.render(time, measureLines)
            this.sustainRender.render(
                time,
                playerState.song.sustainsByChannelAndSecond,
                playerState.song.sustainPeriods
            )

            this.noteRender.render(
                time,
                renderInfosByTrackMap,
                inputActiveRenderInfos,
                inputPlayedRenderInfos
            )
            this.markerRender.render(time, playerState.song.markers)
            this.inSongTextRender.render(time, playerState.song.markers)
        }

        this.overlayRender.render()

        this.debugRender.render(renderInfosByTrackMap, this.mouseX, this.mouseY)

        if (getSetting("showBPM")) {
            this.drawBPM(playerState)
        }
        if (getSetting("showFps")) {
            this.drawFPS()
        }
    }
    /**
     * Returns current time adjusted for the render-offset from the settings
     * @param {Object} playerState
     */
    getRenderTime(playerState) {
        return playerState.time + getSetting("renderOffset") / 1000
    }
    getRenderInfoByTrackMap(playerState) {
        let renderInfoByTrackMap = {}
        if (playerState)
            if (playerState.song) {
                const renderDims = getRenderDimensions()
                const secondsAfter = renderDims.getSecondsDisplayedAfter()
                const secondsBefore = renderDims.getSecondsDisplayedBefore()
                playerState.song.activeTracks.forEach((track, trackIndex) => {
                    if (isTrackDrawn(trackIndex)) {
                        let notesDrawn = new Set()
                        renderInfoByTrackMap[trackIndex] = {
                            black: [],
                            white: []
                        }

                        let time = this.getRenderTime(playerState)
                        let firstSecondShown = Math.floor(
                            time - secondsAfter - CONST.LOOKBACKTIME
                        )
                        let lastSecondShown = Math.ceil(time + secondsBefore)

                        for (let i = firstSecondShown; i < lastSecondShown; i++) {
                            if (track.notesBySeconds[i]) {
                                track.notesBySeconds[i]
                                    // .filter(note => note.instrument != "percussion")
                                    .map(note => {
                                        notesDrawn.add(note)
                                        return this.getNoteRenderInfo(note, time)
                                    })
                                    .forEach(renderInfo =>
                                        renderInfo.isBlack ?
                                        renderInfoByTrackMap[trackIndex].black.push(renderInfo) :
                                        renderInfoByTrackMap[trackIndex].white.push(renderInfo)
                                    )
                            }
                        }
                        playerState.longNotes[trackIndex]
                            .filter(note => !notesDrawn.has(note))
                            .filter(
                                note =>
                                !(note.offTime < firstSecondShown * 1000) &&
                                note.timestamp < firstSecondShown * 1000
                            )
                            .map(note => this.getNoteRenderInfo(note, time))
                            .map(note => {
                                return note
                            })
                            .forEach(renderInfo =>
                                renderInfo.isBlack ?
                                renderInfoByTrackMap[trackIndex].black.push(renderInfo) :
                                renderInfoByTrackMap[trackIndex].white.push(renderInfo)
                            )
                    }
                })
            }
        return renderInfoByTrackMap
    }
    getInputActiveRenderInfos(playerState) {
        let inputRenderInfos = []
        for (let key in playerState.inputActiveNotes) {
            let activeInputNote = playerState.inputActiveNotes[key]
            inputRenderInfos.push(
                this.getNoteRenderInfo({
                        timestamp: activeInputNote.timestamp,
                        noteNumber: activeInputNote.noteNumber,
                        offTime: playerState.ctxTime * 1000 + 0,
                        duration: playerState.ctxTime * 1000 - activeInputNote.timestamp,
                        velocity: 127,
                        fillStyle: isBlack(activeInputNote.noteNumber) ?
                            getSetting("inputNoteColorBlack") :
                            getSetting("inputNoteColorWhite"),
                        isOn: true,
                        id: "input" + activeInputNote.noteNumber + activeInputNote.timestamp
                    },
                    playerState.ctxTime
                )
            )
        }
        return inputRenderInfos
    }
    getInputPlayedRenderInfos(playerState) {
        let inputRenderInfos = []
        const secondsAfter = getRenderDimensions().getSecondsDisplayedAfter()
        for (let key in playerState.inputPlayedNotes) {
            let playedInputNote = playerState.inputPlayedNotes[key]
            if (
                secondsAfter >
                Math.floor(
                    (playerState.ctxTime * 1000 - playedInputNote.offTime) / 1000
                )
            ) {
                inputRenderInfos.push(
                    this.getNoteRenderInfo({
                            timestamp: playedInputNote.timestamp,
                            noteNumber: playedInputNote.noteNumber,
                            offTime: playedInputNote.offTime,
                            duration: playerState.ctxTime * 1000 - playedInputNote.timestamp,
                            velocity: 127,
                            fillStyle: isBlack(playedInputNote.noteNumber) ?
                                getSetting("inputNoteColorBlack") :
                                getSetting("inputNoteColorWhite")
                        },
                        playerState.ctxTime
                    )
                )
            }
        }
        return inputRenderInfos
    }
    getNoteRenderInfo(note, time) {
        time *= 1000
        let noteDims = getRenderDimensions().getNoteDimensions(
            note.noteNumber,
            time,
            note.timestamp,
            note.offTime,
            note.sustainOffTime
        )
        //overwrite isOn for input notes. As they are continuous and would otherwise always appear to be already played
        let isOn = note.isOn ?
            note.isOn :
            note.timestamp < time && note.offTime > time ?
            1 :
            0
        let elapsedTime = Math.max(0, time - note.timestamp)
        let noteDoneRatio = elapsedTime / note.duration

        let isKeyBlack = isBlack(note.noteNumber)
        //TODO Clean up. Right now it returns more info than necessary to use in DebugRender..
        return {
            noteNumber: note.noteNumber,
            timestamp: note.timestamp,
            offTime: note.offTime,
            duration: note.duration,
            instrument: note.instrument,
            track: note.track,
            channel: note.channel,
            fillStyle: note.fillStyle ?
                note.fillStyle :
                isKeyBlack ?
                getTrackColor(note.track).black :
                getTrackColor(note.track).white,
            currentTime: time,
            isBlack: isKeyBlack,
            noteDims: noteDims,
            isOn: isOn,
            noteDoneRatio: noteDoneRatio,
            rad: noteDims.rad,
            x: noteDims.x,
            y: noteDims.y,
            w: noteDims.w,
            h: noteDims.h,
            sustainH: noteDims.sustainH,
            sustainY: noteDims.sustainY,
            velocity: note.velocity,
            noteId: note.id
        }
    }

    drawBPM(playerState) {
        this.ctx.font = "1em Arial black"
        this.ctx.fillStyle = "rgba(255,255,255,0.8)"
        this.ctx.textBaseline = "top"
        this.ctx.fillText(
            Math.round(playerState.bpm) + " BPM",
            20,
            getRenderDimensions().menuHeight +
            PROGRESS_BAR_CANVAS_HEIGHT +
            getRenderDimensions().sheetHeight +
            12
        )
    }
    drawFPS() {
        this.thisTimestamp = window.performance.now()

        let timePassed = this.thisTimestamp - this.lastTimestamp
        this.frameTime += (timePassed - this.frameTime) / this.fpsFilterStrength
        this.ctx.font = "1em Arial black"
        this.ctx.textBaseline = "top"
        this.ctx.fillStyle = "rgba(255,255,255,0.8)"
        let txtMetrics = this.ctx.measureText("M").width
        this.ctx.fillText(
            (1000 / this.frameTime).toFixed(0) + " FPS",
            20,
            getRenderDimensions().menuHeight +
            PROGRESS_BAR_CANVAS_HEIGHT +
            getRenderDimensions().sheetHeight +
            12 +
            (getSetting("showBPM") ? 1 : 0) * txtMetrics * 1.2
        )

        this.lastTimestamp = this.thisTimestamp
    }

    addStartingOverlayMessage() {
        this.overlayRender.addOverlay("MIDiano", 150)
        this.overlayRender.addOverlay("A Javascript MIDI-Player", 150)
        this.overlayRender.addOverlay(
            "Example song by Bernd Krueger from piano-midi.de",
            150
        )
    }

    /**
     *
     */
    setupCanvases() {
        const renderDims = getRenderDimensions()
        const windowWd = renderDims.renderWidth
        const windowHt = renderDims.renderHeight
        DomHelper.setCanvasSize(this.getBgCanvas(), windowWd, windowHt)
        this.getBgCanvas().style.width = window.innerWidth + "px"
        this.getBgCanvas().style.height = window.innerHeight + "px"
        this.getBgCanvas().style.zIndex = 0

        DomHelper.setCanvasSize(this.getMainCanvas(), windowWd, windowHt)
        this.getMainCanvas().style.width = window.innerWidth + "px"
        this.getMainCanvas().style.height = window.innerHeight + "px"
        this.getMainCanvas().style.zIndex = 2

        DomHelper.setCanvasSize(
            this.getProgressBarCanvas(),
            windowWd,
            PROGRESS_BAR_CANVAS_HEIGHT /* * window.devicePixelRatio*/
        )
        this.getProgressBarCanvas().style.width = window.innerWidth + "px"
        this.getProgressBarCanvas().style.height = PROGRESS_BAR_CANVAS_HEIGHT + "px"
        this.getProgressBarCanvas().style.bottom = -PROGRESS_BAR_CANVAS_HEIGHT + "px"

        DomHelper.setCanvasSize(this.getForegroundCanvas(), windowWd, windowHt)
        this.getForegroundCanvas().style.width = window.innerWidth + "px"
        this.getForegroundCanvas().style.height = window.innerHeight + "px"

        let sheetHeight = this.sheetRender ?
            this.sheetRender.getSheetHeight() :
            300 /** window.devicePixelRatio*/
        DomHelper.setCanvasSize(this.getSheetCanvas(), windowWd, sheetHeight)
        this.getSheetCanvas().style.width = window.innerWidth + "px"
        this.getSheetCanvas().style.height =
            sheetHeight /*/ window.devicePixelRatio*/ + "px"
        this.getSheetCanvas().style.bottom = -sheetHeight /* / window.devicePixelRatio*/ -
            PROGRESS_BAR_CANVAS_HEIGHT +
            "px"
        this.setFgCtxZIndex()
        this.setCtxBlur()
    }
    setFgCtxZIndex() {
        this.getForegroundCanvas().style.zIndex = getSetting("particleRenderBehind") ?
            1 :
            100
    }
    getBgCanvas() {
        if (!this.cnvBG) {
            this.cnvBG = DomHelper.createCanvas(
                getRenderDimensions().renderWidth,
                getRenderDimensions().renderHeight, {
                    backgroundColor: "black",
                    position: "absolute",
                    top: "0px",
                    left: "0px"
                }
            )
            this.cnvBG.style.width = window.innerWidth + "px"
            this.cnvBG.style.height = window.innerHeight + "px"
            document.body.appendChild(this.cnvBG)
            this.ctxBG = this.cnvBG.getContext("2d")
        }
        return this.cnvBG
    }
    getMainCanvas() {
        if (!this.cnv) {
            this.cnv = DomHelper.createCanvas(
                getRenderDimensions().renderWidth,
                getRenderDimensions().renderHeight, {
                    position: "absolute",
                    top: "0px",
                    left: "0px"
                }
            )
            this.cnv.style.width = window.innerWidth + "px"
            this.cnv.style.height = window.innerHeight + "px"
            document.body.appendChild(this.cnv)
            this.ctx = this.cnv.getContext("2d")
        }
        return this.cnv
    }
    getForegroundCanvas() {
        if (!this.cnvForeground) {
            this.cnvForeground = DomHelper.createCanvas(
                getRenderDimensions().renderWidth,
                getRenderDimensions().renderHeight, {
                    position: "absolute",
                    top: "0px",
                    left: "0px"
                }
            )
            this.cnvForeground.style.width = window.innerWidth + "px"
            this.cnvForeground.style.height = window.innerHeight + "px"
            this.cnvForeground.style.pointerEvents = "none"
            this.cnvForeground.style.zIndex = "101"
            document.body.appendChild(this.cnvForeground)
            this.ctxForeground = this.cnvForeground.getContext("2d")
        }
        return this.cnvForeground
    }
    getSheetCanvas() {
        if (!this.sheetCnv) {
            this.sheetCnv = DomHelper.createCanvas(
                getRenderDimensions().renderWidth,
                700 /** window.devicePixelRatio*/
            )
            this.sheetCnv.id = "SheetCnv"
            this.sheetCnv.style.width = window.innerWidth + "px"
            this.sheetCnv.style.height = 700 + "px"
            this.sheetCnv.id = "sheetCnv"
            this.ctxSheet = this.sheetCnv.getContext("2d")

            if (!getSetting("enableSheet")) {
                getRenderDimensions().setSheetHeight(0)
                DomHelper.hideDiv(this.sheetCnv)
            }

            setSettingCallback("enableSheet", () => {
                if (getSetting("enableSheet")) {
                    DomHelper.showDiv(this.sheetCnv)
                } else {
                    getRenderDimensions().setSheetHeight(0)
                    DomHelper.hideDiv(this.sheetCnv)
                }
            })
        }
        return this.sheetCnv
    }

    getProgressBarCanvas() {
        if (!this.progressBarCanvas) {
            this.progressBarCanvas = DomHelper.createCanvas(
                getRenderDimensions().renderWidth,
                PROGRESS_BAR_CANVAS_HEIGHT /** window.devicePixelRatio*/ , {}
            )
            this.progressBarCanvas.style.width = window.innerWidth + "px"
            this.progressBarCanvas.style.height = PROGRESS_BAR_CANVAS_HEIGHT + "px"
            this.progressBarCanvas.id = "progressBarCanvas"
            this.progressBarCtx = this.progressBarCanvas.getContext("2d")
        }
        return this.progressBarCanvas
    }
    setProgressBarGrabbed(isGrabbed = true) {
        this.progressBarRender.setGrabbed(isGrabbed)
    }
    isNoteDrawn(note, tracks) {
        return !tracks[note.track] || !tracks[note.track].draw
    }

    isOnMainCanvas(position) {
        const renderDims = getRenderDimensions()
        return (
            (position.x > renderDims.menuHeight &&
                position.y < renderDims.getAbsolutePianoPosition()) ||
            position.y >
            renderDims.getAbsolutePianoPosition() + renderDims._whiteKeyHeight
        )
    }
    setMouseCoords(x, y) {
        this.mouseX = x
        this.mouseY = y
    }
    getTimeFromHeight(height) {
        const renderDims = getRenderDimensions()
        return (
            (height * renderDims.getNoteToHeightConst()) /
            (renderDims.windowHeight - renderDims._whiteKeyHeight) /
            1000
        )
    }
}