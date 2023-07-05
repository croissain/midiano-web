import {
    getPlayer
} from "../player/Player.js"
import {
    getTrackColor,
    isTrackSheetEnabled
} from "../player/Tracks.js"
import {
    PROGRESS_BAR_CANVAS_HEIGHT
} from "../Rendering/Render.js"
import {
    getRenderDimensions
} from "../Rendering/RenderDimensions.js"
import {
    getSetting,
    triggerSettingCallback
} from "../settings/Settings.js"
import {
    formatNote,
    getKeyManagerNoteName,
    getVexFlowNoteName,
    getWhiteKeyNumber
} from "../Util.js"

const SHEET_SIDE_MARGIN = 55
const STAFF_WIDTH = 140
const STAFF_LINE_CUTOFF_WIDTH = 3
export class SheetRender {
    constructor(ctx) {
        this.ctx = ctx
        getPlayer().addNewSongCallback(() => {
            this.staffYs = false
            this.clearCache()
        })
        this.svgNoteHead = new Image()
        this.svgNoteHead.src = "../images/notehead.svg"
        this.svgSharpAcc = new Image()
        this.svgSharpAcc.src = "../images/accidentalSharp.svg"
        this.svgFlatAcc = new Image()
        this.svgFlatAcc.src = "../images/accidentalFlat.svg"
        this.svgNaturalAcc = new Image()
        this.svgNaturalAcc.src = "../images/accidentalNatural.svg"

        this.scale = 1

        this.cache = {
            latestNote: null,
            nextNote: null
        }
        this.lastMin = 0
        this.lastMax = -1
        this.last
        this.yBounds = []

        this.canvasTop = getRenderDimensions().sheetY
    }
    render(curTime, sheetGen, inputNotes, mouseX, mouseY) {
        if (!sheetGen || !sheetGen.generated || !getSetting("enableSheet")) {
            this.staffYs = false
            return
        }

        const renderDims = getRenderDimensions()

        this.mouseX = mouseX
        this.mouseY = mouseY

        this.yBounds = sheetGen.yBounds
        this.canvasTop = renderDims.sheetY
        let ctx = this.ctx
        let unscaledHeight = this.unscaledHeight || 350
        if (renderDims.renderHeight / 3 < unscaledHeight) {
            this.scale = renderDims.renderHeight / 3 / unscaledHeight
        } else {
            this.scale = 1
        }
        this.computeStaffYs(sheetGen)
        ctx.clearRect(-10, -1000,
            getRenderDimensions().renderWidth + 20,
            getRenderDimensions().renderHeight + 1000
        )
        ctx.save()
        if (this.scale != 1) {
            ctx.scale(this.scale, this.scale)
        }

        let curTsp = Math.min(curTime * 1000, sheetGen.songEnd - 1)

        let curPlayMeasureIndex = this.getCurrentlyPlayedMeasureIndex(
            sheetGen,
            curTsp
        )
        let curPlayMeasure = sheetGen.getMeasure(Math.max(0, curPlayMeasureIndex))
        let trackIndex = 0

        let cursorX = this.getCursorXPosition(
            sheetGen,
            curPlayMeasure,
            trackIndex,
            curTsp,
            curPlayMeasureIndex
        )

        //offset for scrolling sheet
        let xOffset = this.getXOffset(
            cursorX + this.getMargin(sheetGen, curPlayMeasureIndex)
        )

        if (getSetting("renderSheetCursor")) {
            this.renderCursorBar(
                cursorX - xOffset + this.getMargin(sheetGen, curPlayMeasureIndex)
            )
        }

        let measuresToDraw = this.getMeasuresToDraw(
            sheetGen,
            curPlayMeasureIndex,
            cursorX
        )

        this.renderMeasures(sheetGen, curTsp, measuresToDraw, xOffset)

        if (getSetting("sheetRenderInputNotes")) {
            this.renderInputNotes(
                sheetGen,
                cursorX - xOffset + this.getMargin(sheetGen, curPlayMeasureIndex),
                ctx,
                inputNotes,
                curPlayMeasure,
                curTime
            )
        }
        ctx.restore()
    }

    renderMeasures(sheetGen, curTsp, measuresToDraw, xOffset) {
        let ctx = this.ctx
        let tracks = Object.keys(measuresToDraw[0].measure.staves)
        let enabledTracks = Object.keys(tracks).filter(track =>
            isTrackSheetEnabled(track)
        )

        measuresToDraw.forEach(measureToDraw => {
            let measure = measureToDraw.measure
            let x = measureToDraw.measure.cumulativeXPosition - xOffset

            let measureIndex = measureToDraw.measureIndex

            x += this.getMargin(sheetGen, measuresToDraw[0].measureIndex)
            enabledTracks.forEach(track => {
                let clef = track == 0 ? "treble" : "bass"
                let keyCnv = sheetGen.getNewLineDiv(measure.keySignatureName)[clef]
                let cnv = measure.canvases[track]

                let y = this.getStaffY(track).min

                if (
                    measureIndex == 0 ||
                    sheetGen.lineStartIndexes.indexOf(measureIndex) > -1
                ) {
                    ctx.drawImage(
                        keyCnv,
                        0,
                        0,
                        keyCnv.width - STAFF_LINE_CUTOFF_WIDTH,
                        keyCnv.height,
                        x - STAFF_WIDTH + STAFF_LINE_CUTOFF_WIDTH * 2,
                        y,
                        keyCnv.width - STAFF_LINE_CUTOFF_WIDTH,
                        keyCnv.height
                    )
                    ctx.drawImage(
                        cnv,
                        STAFF_LINE_CUTOFF_WIDTH,
                        0,
                        cnv.width - STAFF_LINE_CUTOFF_WIDTH,
                        cnv.height,
                        x + STAFF_LINE_CUTOFF_WIDTH,
                        y + sheetGen.yBounds[track].min,
                        cnv.width - STAFF_LINE_CUTOFF_WIDTH,
                        cnv.height
                    )
                } else {
                    ctx.drawImage(cnv, x, y + sheetGen.yBounds[track].min)
                }
            })
            // }

            this.renderActiveNotes(enabledTracks, ctx, x, measure, curTsp)

            this.renderMouseHover(enabledTracks, ctx, x, measure)
        })
    }

    renderActiveNotes(enabledTracks, ctx, x, measure, curTsp) {
        let isColorActiveNotes = getSetting("sheetColorActiveNotes")
        let isHighlightActiveNotes = getSetting("sheetHighlightActiveNotes")

        let highlightNoteColor = isHighlightActiveNotes ?
            getSetting("sheetActiveHighlightColor") :
            ""
        if (isColorActiveNotes || isHighlightActiveNotes) {
            enabledTracks.forEach(track => {
                ctx.save()
                ctx.translate(x, this.getStaffY(track).min)

                let activeNotes = this.getActiveNotes(measure, curTsp, track)
                if (isHighlightActiveNotes) {
                    ctx.fillStyle = highlightNoteColor
                    ctx.beginPath()
                    activeNotes.forEach(roundedNote => {
                        let staffY = this.getStaffY(roundedNote.trackIndex)
                        ctx.rect(
                            roundedNote.staveNote.getNoteHeadBeginX(),
                            0,
                            roundedNote.staveNote.width,
                            staffY.max - staffY.min
                        )
                    })
                    ctx.closePath()
                    ctx.fill()
                }
                if (isColorActiveNotes) {
                    let isColorByTrack = getSetting("sheetColorByTrack")
                    let activeNoteCol = getSetting("sheetActiveNotesColor")
                    activeNotes.forEach(roundedNote => {
                        let activeNoteColor = isColorByTrack ?
                            getTrackColor(roundedNote.trackIndex).white :
                            activeNoteCol
                        roundedNote.paths.forEach(path => {
                            drawPath(ctx, path, activeNoteColor, activeNoteColor)
                        })
                    })
                }

                ctx.restore()
            })
        }
    }

    renderMouseHover(enabledTracks, ctx, x, measure) {
        enabledTracks.forEach(track => {
            let cnv = measure.canvases[track]
            let y = this.getStaffY(track).min
            this.drawMouseHoverNotes(x, y, cnv, track, measure, ctx)
        })
    }

    getMeasuresToDraw(sheetGen, curPlayMeasureIndex, cursorX) {
        const renderDims = getRenderDimensions()
        let {
            firstDrawnMeasure,
            firstDrawnMeasureIndex
        } =
        this.getFirstDrawnMeasure(sheetGen, curPlayMeasureIndex, cursorX)
        let nextLineFirstIndex = sheetGen.lineStartIndexes.find(
            index => index > firstDrawnMeasureIndex
        )
        if (nextLineFirstIndex == undefined) {
            nextLineFirstIndex = Object.keys(sheetGen.measureObjects).length
        }
        let measuresToDraw = []
        let isScrollingSheet = getSetting("sheetMeasureScroll")
        let measureX = firstDrawnMeasure.cumulativeXPosition
        let xOffset = this.getXOffset(cursorX)
        while (
            (!isScrollingSheet && nextLineFirstIndex > firstDrawnMeasureIndex) ||
            (isScrollingSheet &&
                measureX - xOffset < renderDims.renderWidth / this.scale &&
                firstDrawnMeasure)
        ) {
            measuresToDraw.push({
                measure: firstDrawnMeasure,
                measureIndex: firstDrawnMeasureIndex
            })

            measureX += firstDrawnMeasure.measureWidth
            firstDrawnMeasureIndex++
            firstDrawnMeasure = sheetGen.getMeasure(firstDrawnMeasureIndex)
        }
        return measuresToDraw
    }
    getFirstDrawnMeasure(sheetGen, curPlayMeasureIndex, cursorX) {
        let firstDrawnMeasureIndex = curPlayMeasureIndex
        let firstDrawnMeasure = sheetGen.getMeasure(firstDrawnMeasureIndex)
        if (getSetting("sheetMeasureScroll")) {
            let xOffset = this.getXOffset(cursorX)

            if (curPlayMeasureIndex > 0) {
                while (
                    firstDrawnMeasureIndex > 0 &&
                    firstDrawnMeasure.cumulativeXPosition +
                    firstDrawnMeasure.measureWidth -
                    xOffset >
                    0
                ) {
                    firstDrawnMeasureIndex--
                    firstDrawnMeasure = sheetGen.getMeasure(firstDrawnMeasureIndex)
                }
            }
        } else {
            for (let i = sheetGen.lineStartIndexes.length - 1; i >= 0; i--) {
                if (sheetGen.lineStartIndexes[i] <= curPlayMeasureIndex) {
                    firstDrawnMeasureIndex = sheetGen.lineStartIndexes[i]
                    break
                }
            }
            firstDrawnMeasure = sheetGen.getMeasure(firstDrawnMeasureIndex)
        }

        return {
            firstDrawnMeasure,
            firstDrawnMeasureIndex
        }
    }
    getCursorXPosition(
        sheetGen,
        curPlayMeasure,
        trackIndex,
        curTsp,
        curPlayMeasureIndex
    ) {
        let hasNotes = this.isMeasureHasNotes(curPlayMeasure, trackIndex)
        let beforeFirstInMeasure =
            hasNotes &&
            this.getFirstNoteOfMeasure(
                trackIndex,
                curPlayMeasure,
                curPlayMeasureIndex
            ).note.timestamp >= curTsp
        let afterLastInMeasure =
            hasNotes &&
            this.getLastNoteOfMeasure(trackIndex, curPlayMeasure, curPlayMeasureIndex)
            .note.timestamp < curTsp

        let lastTsp = curPlayMeasure.startTsp
        let nextTsp = curPlayMeasure.endTsp
        let nextNote = null
        let lastNote = null
        let lastIsInPreviousMeasure = false
        let nextIsInNextMeasure = false
        if (beforeFirstInMeasure) {
            lastNote =
                curPlayMeasureIndex > 0 ?
                this.getLatestPlayedInMeasure(
                    0,
                    sheetGen.getMeasure(curPlayMeasureIndex - 1),
                    curPlayMeasureIndex - 1,
                    curTsp
                ) :
                null
            lastTsp = lastNote ? lastNote.note.timestamp : curPlayMeasure.startTsp
            lastIsInPreviousMeasure = lastNote ? true : false
            nextNote = hasNotes ?
                this.findNextUnplayedInMeasure(
                    trackIndex,
                    curPlayMeasure,
                    curPlayMeasureIndex,
                    curTsp
                ) :
                null
            nextTsp = nextNote ? nextNote.note.timestamp : curPlayMeasure.endTsp
        } else if (afterLastInMeasure) {
            lastNote = hasNotes ?
                this.getLatestPlayedInMeasure(
                    trackIndex,
                    curPlayMeasure,
                    curPlayMeasureIndex,
                    curTsp
                ) :
                null
            lastTsp = lastNote ? lastNote.note.timestamp : curPlayMeasure.startTsp
            nextNote =
                curPlayMeasureIndex < Object.keys(sheetGen.measureObjects).length - 1 ?
                this.findNextUnplayedInMeasure(
                    trackIndex,
                    sheetGen.getMeasure(curPlayMeasureIndex + 1),
                    curPlayMeasureIndex + 1,
                    curTsp
                ) :
                null
            nextTsp = nextNote ? nextNote.note.timestamp : curPlayMeasure.endTsp
            nextIsInNextMeasure = nextNote ? true : false
        } else if (hasNotes) {
            lastNote = this.getLatestPlayedInMeasure(
                trackIndex,
                curPlayMeasure,
                curPlayMeasureIndex,
                curTsp
            )
            lastTsp = lastNote.note.timestamp
            nextNote = this.findNextUnplayedInMeasure(
                trackIndex,
                curPlayMeasure,
                curPlayMeasureIndex,
                curTsp
            )
            nextTsp = nextNote.note.timestamp
        }

        let leftX = 0
        if (lastIsInPreviousMeasure) {
            leftX =
                sheetGen.getMeasure(curPlayMeasureIndex - 1).cumulativeXPosition +
                lastNote.staveNote.getNoteHeadBeginX()
        } else {
            leftX = lastNote ?
                curPlayMeasure.cumulativeXPosition +
                lastNote.staveNote.getNoteHeadBeginX() :
                curPlayMeasure.cumulativeXPosition
        }

        let rightX = 0
        if (nextIsInNextMeasure) {
            rightX =
                sheetGen.getMeasure(curPlayMeasureIndex + 1).cumulativeXPosition +
                nextNote.staveNote.getNoteHeadBeginX()
        } else {
            rightX = nextNote ?
                curPlayMeasure.cumulativeXPosition +
                nextNote.staveNote.getNoteHeadBeginX() :
                curPlayMeasure.cumulativeXPosition + curPlayMeasure.measureWidth
        }

        let cursorX =
            leftX + ((curTsp - lastTsp) / (nextTsp - lastTsp)) * (rightX - leftX)

        return isFinite(cursorX) ? cursorX : 0
    }
    getXOffset(cursorX) {
        if (getSetting("sheetMeasureScroll")) {
            if (cursorX > getRenderDimensions().renderWidth / 3) {
                return cursorX - getRenderDimensions().renderWidth / 3
            }
        }
        return 0
    }
    getMargin(sheetGen, curPlayMeasureIndex) {
        if (getSetting("sheetMeasureScroll")) {
            return SHEET_SIDE_MARGIN + STAFF_WIDTH - STAFF_LINE_CUTOFF_WIDTH * 2
        } else {
            return (
                (getRenderDimensions().renderWidth / this.scale -
                    this.getSheetLineWidth(sheetGen, curPlayMeasureIndex) +
                    (STAFF_WIDTH - STAFF_LINE_CUTOFF_WIDTH * 2) * 1) /
                2
            )
        }
    }
    getSheetLineWidth(sheetGen, measureIndex) {
        let lineIndexes = sheetGen.lineStartIndexes
        let measureLineWidth = 0
        let nextLineIndex = lineIndexes.find(index => index > measureIndex)
        let firstLineIndex =
            lineIndexes[Math.max(0, lineIndexes.indexOf(nextLineIndex) - 1)]
        if (nextLineIndex == undefined) {
            nextLineIndex = Object.keys(sheetGen.measureObjects).length
            firstLineIndex = lineIndexes[lineIndexes.length - 1]
        }
        for (let i = firstLineIndex; i < nextLineIndex; i++) {
            measureLineWidth += sheetGen.getMeasure(i).measureWidth
        }
        return measureLineWidth
    }
    getFirstTrackWithNotes(curPlayMeasure) {
        let trackIndex = 0
        for (let track in curPlayMeasure.roundedNotes) {
            for (let tsp in curPlayMeasure.roundedNotes[track]) {
                if (
                    curPlayMeasure.roundedNotes[track][tsp].find(
                        roundedNote => !roundedNote.isRest
                    )
                ) {
                    return track
                }
            }
        }

        return trackIndex
    }
    isMeasureHasNotes(measure, trackIndex) {
        let grouped = Object.values(measure.roundedNotes[trackIndex])
        return grouped.find(roundedNotes =>
            roundedNotes.find(roundedNote => !roundedNote.isRest)
        )
    }
    getLastNoteOfMeasure(trackIndex, measure, measureIndex) {
        let arr = this.getFlattenedNotesOfTrack(trackIndex, measure, measureIndex)
        for (let i = arr.length - 1; i >= 0; i--) {
            if (!arr[i].isRest) {
                return arr[i]
            }
        }
    }
    getFirstNoteOfMeasure(trackIndex, measure, measureIndex) {
        let arr = this.getFlattenedNotesOfTrack(trackIndex, measure, measureIndex)
        for (let i = 0; i < arr.length; i++) {
            if (!arr[i].isRest) {
                return arr[i]
            }
        }
    }

    drawMouseHoverNotes(x, y, measureCnv, track, measure) {
        if (
            this.mouseX / this.scale > x &&
            this.mouseX / this.scale < x + measureCnv.width &&
            (this.mouseY - this.canvasTop) / this.scale < this.getStaffY(track).max &&
            (this.mouseY - this.canvasTop) / this.scale > y
        ) {
            let notesInTrack = measure.roundedNotes[track]

            let hoveredNotes = this.getHoveredNotes(notesInTrack, x)
            if (!hoveredNotes.length) return

            let textY = this.getStaffY(track).max - this.getStaffY(track).min

            let txt = hoveredNotes
                .map(roundedNote => formatNote(roundedNote.note.midiNoteNumber) + ", ")
                .reduce((a, b) => a + b, "")
            txt = txt.slice(0, txt.length - 2)

            let c = this.ctx
            c.font = "bold 18px times"
            let txtWd = c.measureText(txt).width

            c.fillStyle = "rgba(0,0,0,0.2)"
            c.fillRect(
                x +
                hoveredNotes[0].staveNote.getNoteHeadBeginX() +
                hoveredNotes[0].staveNote.width / 2 -
                txtWd / 2 -
                4,
                y - 10,
                txtWd + 8,
                textY + 10
            )

            c.fillStyle = "black"
            c.fillText(
                txt,
                x +
                hoveredNotes[0].staveNote.getNoteHeadBeginX() +
                hoveredNotes[0].staveNote.width / 2 -
                txtWd / 2,
                y + textY - 6
            )
        }
        return measure
    }

    getHoveredNotes(notesInTrack, x) {
        let minGroupedNote = []
        let minDis = 1e6
        for (let groupedNoteKey in notesInTrack) {
            let groupedNote = notesInTrack[groupedNoteKey]
            if (groupedNote.find(note => note.isRest)) continue
            let dis = Math.abs(
                this.mouseX / this.scale -
                x -
                (groupedNote[0].staveNote.getNoteHeadBeginX() +
                    groupedNote[0].staveNote.width / 2)
            )

            if (dis < minDis) {
                minDis = dis
                minGroupedNote = groupedNote
            }
        }
        return minGroupedNote
    }

    getActiveNotes(measure, curTsp, track) {
        let activeNotes = []

        if (measure.startTsp < curTsp && measure.endTsp > curTsp) {
            Object.values(measure.roundedNotes[track]).forEach(groupedRoundedNotes =>
                groupedRoundedNotes.forEach(roundedNote => {
                    if (
                        roundedNote.note.timestamp < curTsp &&
                        roundedNote.note.timestamp + roundedNote.note.duration > curTsp
                    ) {
                        activeNotes.push(roundedNote)
                    }
                })
            )
        }
        return activeNotes.filter(roundedNote => !roundedNote.isRest)
    }

    renderInputNotes(sheetGen, cursorX, ctx, inputNotes, measure, curTime) {
        if (measure.canvases && measure.canvases[0]) {
            inputNotes.forEach(inputNote => {
                this.renderInputNote(
                    ctx,
                    sheetGen,
                    measure,
                    inputNote,
                    curTime,
                    cursorX
                )
            })
        }
    }
    renderInputNote(ctx, sheetGen, measure, inputNote, curTime, cursorX) {
        ctx.fillStyle = "red"
        let bestStaffY = null
        let bestStaff = null
        let minNoteDif = 9999999999
        let notesOfStaff = {}
        let clef = "treble"
        let noteName = getVexFlowNoteName(inputNote.noteNumber + 21)
        let midNoteNums = {
            treble: 71,
            bass: 50
        }
        //find best fitting staff
        Object.entries(measure.staves).forEach(staffEntry => {
            let trackIndex = staffEntry[0]
            let staff = staffEntry[1]
            let midNoteNum = midNoteNums[staff.clef]
            let noteDif =
                getWhiteKeyNumber(inputNote.noteNumber + 21) -
                getWhiteKeyNumber(midNoteNum)
            if (Math.abs(minNoteDif) > Math.abs(noteDif)) {
                minNoteDif = noteDif
                bestStaffY = this.getStaffY(trackIndex)
                bestStaff = staff
                notesOfStaff = measure.roundedNotes[trackIndex]
                clef = staff.clef
            }
        })
        let keyManager = new Vex.Flow.KeyManager(sheetGen.keySignatureName)

        //update keymanager with all played notes from measure.
        Object.entries(notesOfStaff)
            .filter(entry => entry[0] < curTime * 1000)
            .forEach(entry =>
                entry[1].forEach(roundedNote =>
                    keyManager.selectNote(
                        getKeyManagerNoteName(roundedNote.note.midiNoteNumber)
                    )
                )
            )

        let noteParts = keyManager.selectNote(
            getKeyManagerNoteName(inputNote.noteNumber + 21)
        )
        let noteAccidental =
            noteParts.accidental === null && noteParts.change ?
            "n" :
            noteParts.accidental
        let line = sheetGen.getLineForKey(
            noteParts.note + "/" + noteName[noteName.length - 1],
            clef
        )

        let y =
            bestStaffY.min +
            (bestStaff.space_above_staff_ln + 4.5 - line) *
            bestStaff.spacing_between_lines_px

        if (noteAccidental && noteParts.change) {
            switch (noteAccidental) {
                case "#":
                    ctx.drawImage(this.svgSharpAcc, cursorX - 10, y - 7)
                    break

                case "b":
                    ctx.drawImage(this.svgFlatAcc, cursorX - 10, y - 14)
                    break
                case "n":
                    ctx.drawImage(this.svgNaturalAcc, cursorX - 10, y - 7)
                    break
            }
        }
        ctx.drawImage(this.svgNoteHead, cursorX, y)
    }

    renderCursorBar(cursorX) {
        let c = this.ctx
        if (cursorX) {
            c.strokeStyle = "rgba(0,0,0,0.5)"
            c.beginPath()
            c.moveTo(cursorX, 0)
            c.lineTo(cursorX, c.canvas.height / this.scale)
            c.stroke()
            c.closePath()
        }
    }

    computeStaffYs(sheetGen) {
        this.staffYs = {}

        let curY = 0

        for (let key in sheetGen.yBounds) {
            if (!isTrackSheetEnabled(key)) continue
            let bounds = sheetGen.yBounds[key]
            let relY = 0 - bounds.min
            curY += relY

            this.staffYs[key] = {}
            this.staffYs[key].min = curY
            curY += bounds.max - bounds.min + 4
            this.staffYs[key].max = curY
        }
        // curY *= window.devicePixelRatio
        if (this.ctx.canvas.height != Math.floor(curY * this.scale)) {
            this.ctx.canvas.height = Math.floor(curY * this.scale)
            this.unscaledHeight = curY
            this.ctx.canvas.style.bottom = -this.ctx.canvas.getBoundingClientRect().height -
                PROGRESS_BAR_CANVAS_HEIGHT +
                "px"
            getRenderDimensions().setSheetHeight(curY /* / window.devicePixelRatio*/ )
            this.canvasTop = this.ctx.canvas.getBoundingClientRect().top
            sheetGen.computeLines(
                getRenderDimensions().renderWidth / this.scale,
                SHEET_SIDE_MARGIN / this.scale /** window.devicePixelRatio*/
            )

            triggerSettingCallback("recalcZoomTop")
            triggerSettingCallback("pianoPositionOnce")
        }
    }
    getSheetHeight() {
        let curY = 0
        if (!this.active) {
            return 300 /** window.devicePixelRatio*/
        }
        for (let key in this.yBounds) {
            if (!isTrackSheetEnabled(key)) continue
            let bounds = this.yBounds[key]
            let relY = 0 - bounds.min
            curY += relY
            curY += bounds.max - bounds.min + 4
        }
        return curY * this.scale
    }
    getStaffY(track) {
        return this.staffYs[track]
    }

    getLatestPlayedInMeasure(trackIndex, measure, measureIndex, curTsp) {
        let arr = this.getFlattenedNotesOfTrack(trackIndex, measure, measureIndex)
        for (let i = arr.length - 1; i >= 0; i--) {
            const roundedNote = arr[i]
            if (roundedNote.note.timestamp <= curTsp) {
                return roundedNote
            }
        }
        return null
    }

    getCurrentlyPlayedMeasureIndex(sheetGen, curTsp) {
        return Math.max(
            0,
            sheetGen.measures.indexOf(
                sheetGen.measures.filter(
                    (measure, index) =>
                    measure[0] <= curTsp &&
                    (sheetGen.measures.length - 1 < index + 1 ||
                        sheetGen.measures[index + 1][0] > curTsp)
                )[0]
            ) + 1
        )
    }
    forEachNoteInMeasure(measureIndex, track, func) {
        for (let tsp in this.getMeasure(meaasureIndex).roundedNotes[track]) {
            func(measure.roundedNotes[track][tsp], tsp, track, measureIndex)
        }
    }
    findNextUnplayedInMeasure(trackIndex, measure, measureIndex, curTsp) {
        let notesOfTrack = this.getFlattenedNotesOfTrack(
            trackIndex,
            measure,
            measureIndex
        )
        for (let i = 0; i < notesOfTrack.length; i++) {
            let roundedNote = notesOfTrack[i]
            if (roundedNote.note.timestamp > curTsp) {
                return roundedNote
            }
        }
    }
    clearCache() {
        this.sortedCache = {}
    }
    getFlattenedNotesOfTrack(trackIndex, measure, measureIndex) {
        if (!this.sortedCache) {
            this.sortedCache = {}
        }
        if (!this.sortedCache.hasOwnProperty(measureIndex)) {
            this.sortedCache[measureIndex] = {}
        }
        if (!this.sortedCache[measureIndex].hasOwnProperty(trackIndex)) {
            let trackNotesByTsp = Object.values(measure.roundedNotes)[trackIndex]
            let sortedNotes = Object.entries(trackNotesByTsp)
                .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
                .flatMap(groupedRoundedNotes => {
                    return groupedRoundedNotes[1]
                })
                .filter(roundedNote => !roundedNote.isRest)

            this.sortedCache[measureIndex][trackIndex] = sortedNotes
        }
        return this.sortedCache[measureIndex][trackIndex]
    }
}

export const drawPath = (ctx, path, fill, stroke, lineWd) => {
    let pathObj = new Path2D(path.getAttribute("d"))
    fill = fill || path.getAttribute("fill")
    stroke = stroke || path.getAttribute("stroke")
    let strokeWd = path.getAttribute("stroke-width")
    if (fill != "none") {
        ctx.fillStyle = fill
        ctx.fill(pathObj)
    }
    if (stroke != "none") {
        ctx.strokeStyle = stroke
        ctx.lineWidth = lineWd || strokeWd
        ctx.stroke(pathObj)
    }
    return pathObj
}
export const drawRects = (curMeasureSvg, ctx) => {
    curMeasureSvg.querySelectorAll("rect").forEach(rect => {
        let fill = rect.getAttribute("fill")
        let stroke = rect.getAttribute("stroke")
        let strokeWd = rect.getAttribute("stroke-width")
        let wd = rect.getAttribute("width")
        let ht = rect.getAttribute("height")
        let relX = rect.getAttribute("x")
        let y = rect.getAttribute("y")
        if (fill != "none") {
            ctx.fillStyle = fill
            ctx.fillRect(relX, y, wd, ht)
        }
        if (stroke != "none") {
            ctx.lineWidth = strokeWd
            ctx.strokeStyle = stroke
            ctx.strokeRect(relX, y, wd, ht)
        }
    })
}