import {
    getSetting
} from "../settings/Settings.js"
import {
    getKeyBinder
} from "../ui/KeyBinder.js"
import {
    drawRoundRect,
    formatNote
} from "../Util.js"
import {
    getRenderDimensions
} from "./RenderDimensions.js"
import {
    createThreeJsParticles
} from "./ThreeJs/threeJsHandler.js"

/**
 * Class to render the notes on screen.
 */
export class NoteRender {
    constructor(ctx, ctxForeground, pianoRender) {
        this.ctx = ctx
        this.ctxForeground = ctxForeground

        this.pianoRender = pianoRender
        this.lastActiveNotes = {}
    }
    render(time, renderInfoByTrackMap, inputActiveNotes, inputPlayedNotes) {
        renderInfoByTrackMap["input"] = {
            white: inputActiveNotes
                .filter(noteInfo => !noteInfo.isBlack)
                .concat(inputPlayedNotes.filter(noteInfo => !noteInfo.isBlack)),
            black: inputActiveNotes
                .filter(noteInfo => noteInfo.isBlack)
                .concat(inputPlayedNotes.filter(noteInfo => noteInfo.isBlack))
        }

        this.ctx.globalCompositeOperation = getSetting("noteEnableLighterDraw") ?
            "lighter" :
            "source-over"
        this.ctx.shadowColor = getSetting("noteShadowColor")
        this.ctx.shadowBlur = getSetting("noteShadowBlur")
        //sustained note "tails"
        if (getSetting("showSustainedNotes")) {
            this.drawSustainedNotes(renderInfoByTrackMap, time)
        }

        let activeNotesByTrackMap =
            this.getActiveNotesByTrackMap(renderInfoByTrackMap)
        //Active notes effect
        Object.keys(activeNotesByTrackMap).forEach(trackIndex => {
            this.renderActiveNotesEffects(activeNotesByTrackMap[trackIndex])
        })

        //Notes
        Object.keys(renderInfoByTrackMap).forEach(trackIndex => {
            this.drawNotes(
                renderInfoByTrackMap[trackIndex].white,
                renderInfoByTrackMap[trackIndex].black
            )
        })
        this.ctx.globalCompositeOperation = "source-over"
        this.ctx.shadowBlur = 0
        let currentActiveNotes = {}

        //Active keys on piano + stroking of active notes
        Object.keys(activeNotesByTrackMap).forEach(trackIndex => {
            this.renderActivePianoKeys(
                activeNotesByTrackMap[trackIndex],
                currentActiveNotes
            )

            this.createNoteParticles(activeNotesByTrackMap[trackIndex])
        })

        this.lastActiveNotes = currentActiveNotes
    }

    drawSustainedNotes(renderInfoByTrackMap, time) {
        Object.keys(renderInfoByTrackMap).forEach(trackIndex => {
            let notesRenderInfoBlack = renderInfoByTrackMap[trackIndex].black
            let notesRenderInfoWhite = renderInfoByTrackMap[trackIndex].white

            this.ctx.globalAlpha = getSetting("sustainedNotesOpacity") / 100
            if (notesRenderInfoWhite.length > 0) {
                this.ctx.fillStyle = notesRenderInfoWhite[0].fillStyle
            }
            notesRenderInfoWhite.forEach(renderInfo =>
                this.drawSustainedNote(renderInfo)
            )
            if (notesRenderInfoBlack.length > 0) {
                this.ctx.fillStyle = notesRenderInfoBlack[0].fillStyle
            }
            notesRenderInfoBlack.forEach(renderInfo =>
                this.drawSustainedNote(renderInfo)
            )
        })
    }

    drawSustainedNote(renderInfos) {
        let ctx = this.ctx

        let x = renderInfos.x
        let w = renderInfos.w / 2

        if (renderInfos.sustainH && renderInfos.sustainY) {
            ctx.beginPath()
            ctx.rect(x + w / 2, renderInfos.sustainY, w, renderInfos.sustainH)
            ctx.closePath()
            ctx.fill()
        }
    }

    getActiveNotesByTrackMap(renderInfoByTrackMap) {
        return Object.keys(renderInfoByTrackMap).map(trackIndex =>
            this.getActiveNotes(
                renderInfoByTrackMap[trackIndex].black,
                renderInfoByTrackMap[trackIndex].white
            )
        )
    }
    getActiveNotes(notesRenderInfoBlack, notesRenderInfoWhite) {
        let activeNotesBlack = notesRenderInfoBlack
            .slice(0)
            .filter(renderInfo => renderInfo.isOn)

        let activeNotesWhite = notesRenderInfoWhite
            .slice(0)
            .filter(renderInfo => renderInfo.isOn)
        return {
            white: activeNotesWhite,
            black: activeNotesBlack
        }
    }

    renderActiveNotesEffects(activeNotes) {
        if (getSetting("showHitKeys")) {
            if (activeNotes.white.length) {
                this.ctx.fillStyle = activeNotes.white[0].fillStyle
            }
            activeNotes.white.forEach(note => this.renderActiveNoteEffect(note))

            if (activeNotes.black.length) {
                this.ctx.fillStyle = activeNotes.black[0].fillStyle
            }
            activeNotes.black.forEach(note => this.renderActiveNoteEffect(note))
        }
    }

    renderActiveNoteEffect(renderInfos) {
        let ctx = this.ctx
        const renderDims = getRenderDimensions()
        const keyWd = renderDims.whiteKeyWidth
        const keyHt = renderDims.whiteKeyHeight
        ctx.globalAlpha = Math.max(
            0,
            0.7 - Math.min(0.7, renderInfos.noteDoneRatio)
        )
        let wOffset = Math.pow(
            keyWd / 2,
            1 + Math.min(1, renderInfos.noteDoneRatio) * renderInfos.isOn
        )
        this.doNotePath(renderInfos, {
            x: renderInfos.x - wOffset / 2,
            w: renderInfos.w + wOffset,
            y: renderInfos.y - (getSetting("reverseNoteDirection") ? keyHt : 0),
            h: renderInfos.h + keyHt
        })

        ctx.fill()
        ctx.globalAlpha = 1
    }

    drawNotes(notesRenderInfoWhite, notesRenderInfoBlack) {
        let {
            incomingWhiteNotes,
            incomingBlackNotes,
            playedWhiteNotes,
            playedBlackNotes
        } = this.getIncomingAndPlayedNotes(
            notesRenderInfoWhite,
            notesRenderInfoBlack
        )

        this.ctx.globalAlpha = 1
        this.ctx.strokeStyle = getSetting("strokeNotesColor")
        this.ctx.lineWidth =
            getSetting("strokeNotesWidth") * 5 * getRenderDimensions()._keyResolution

        this.drawIncomingNotes(incomingWhiteNotes, incomingBlackNotes)

        this.drawPlayedNotes(playedWhiteNotes, playedBlackNotes)
    }

    rectAbovePiano() {
        const renderDims = getRenderDimensions()
        this.ctx.rect(
            0,
            0,
            renderDims.renderWidth,
            renderDims.getAbsolutePianoPosition(true)
        )
    }
    rectBelowPiano() {
        const renderDims = getRenderDimensions()
        const keyHt = renderDims.whiteKeyHeight
        const pianoPos = renderDims.getAbsolutePianoPosition(true)
        this.ctx.rect(
            0,
            pianoPos + keyHt,
            renderDims.renderWidth,
            renderDims.renderHeight - (pianoPos + keyHt)
        )
    }
    drawPlayedNotes(playedWhiteNotes, playedBlackNotes) {
        this.ctx.save()
        this.ctx.beginPath()
        getSetting("reverseNoteDirection") ?
            this.rectAbovePiano() :
            this.rectBelowPiano()

        this.ctx.clip()
        this.ctx.closePath()
        this.ctx.fillStyle = playedWhiteNotes.length ?
            playedWhiteNotes[0].fillStyle :
            ""

        //strokeActiveAndOthers would be faster if renderInfos are split by on/offs to save setting the strokestyle everytime
        playedWhiteNotes.forEach(renderInfo => {
            this.drawNoteAfter(renderInfo)
            this.ctx.fill()
            this.strokeActiveAndOthers(renderInfo)
        })

        this.ctx.fillStyle = playedBlackNotes.length ?
            playedBlackNotes[0].fillStyle :
            ""
        playedBlackNotes.forEach(renderInfo => {
            this.drawNoteAfter(renderInfo)
            this.ctx.fill()
            this.strokeActiveAndOthers(renderInfo)
        })

        this.ctx.restore()
    }

    strokeActiveAndOthers(renderInfo) {
        if (renderInfo.isOn && getSetting("strokeActiveNotes")) {
            this.ctx.strokeStyle = getSetting("strokeActiveNotesColor")
            // this.ctx.globalCompositeOperation = "screen"
            this.ctx.lineWidth =
                getSetting("strokeActiveNotesWidth") *
                5 *
                getRenderDimensions()._keyResolution
            this.ctx.stroke()
            this.ctx.fill()
            // this.ctx.globalCompositeOperation = "source-over"
        } else if (getSetting("strokeNotes")) {
            this.ctx.strokeStyle = getSetting("strokeNotesColor")
            this.ctx.lineWidth =
                getSetting("strokeNotesWidth") *
                5 *
                getRenderDimensions()._keyResolution
            this.ctx.stroke()
        }
    }

    drawIncomingNotes(incomingWhiteNotes, incomingBlackNotes) {
        this.ctx.save()
        this.ctx.beginPath()
        getSetting("reverseNoteDirection") ?
            this.rectBelowPiano() :
            this.rectAbovePiano()
        this.ctx.clip()
        this.ctx.closePath()
        this.ctx.fillStyle = incomingWhiteNotes.length ?
            incomingWhiteNotes[0].fillStyle :
            ""
        incomingWhiteNotes.forEach(renderInfo => {
            this.drawNoteBefore(renderInfo)
            this.ctx.fill()
            this.strokeActiveAndOthers(renderInfo)
        })
        if (getSetting("noteLabel") != "None") {
            incomingWhiteNotes.forEach(renderInfo => this.drawNoteLabel(renderInfo))
        }

        this.ctx.fillStyle = incomingBlackNotes.length ?
            incomingBlackNotes[0].fillStyle :
            ""
        incomingBlackNotes.forEach(renderInfo => {
            this.drawNoteBefore(renderInfo)
            this.ctx.fill()
            this.strokeActiveAndOthers(renderInfo)
        })
        if (getSetting("noteLabel") != "None") {
            incomingBlackNotes.forEach(renderInfo => this.drawNoteLabel(renderInfo))
        }
        this.ctx.restore()
    }

    getIncomingAndPlayedNotes(notesRenderInfoWhite, notesRenderInfoBlack) {
        let incomingWhiteNotes = []
        let playedWhiteNotes = []
        notesRenderInfoWhite
            .filter(renderInfo => renderInfo.w > 0 && renderInfo.h > 0)
            .forEach(renderInfo => {
                if (renderInfo.noteDoneRatio < 1) {
                    incomingWhiteNotes.push(renderInfo)
                }
                if (getSetting("pianoPosition") != 0 && renderInfo.noteDoneRatio > 0) {
                    playedWhiteNotes.push(renderInfo)
                }
            })
        let incomingBlackNotes = []
        let playedBlackNotes = []
        notesRenderInfoBlack
            .filter(renderInfo => renderInfo.w > 0 && renderInfo.h > 0)
            .forEach(renderInfo => {
                if (renderInfo.noteDoneRatio < 1) {
                    incomingBlackNotes.push(renderInfo)
                }
                if (getSetting("pianoPosition") != 0 && renderInfo.noteDoneRatio > 0) {
                    playedBlackNotes.push(renderInfo)
                }
            })
        return {
            incomingWhiteNotes,
            incomingBlackNotes,
            playedWhiteNotes,
            playedBlackNotes
        }
    }

    drawInputNotes(inputActiveNotes, inputPlayedNotes) {
        this.ctx.globalAlpha = 1
        this.ctx.strokeStyle = getSetting("strokeNotesColor")
        this.ctx.lineWidth =
            getSetting("strokeNotesWidth") * 5 * getRenderDimensions()._keyResolution
        inputActiveNotes.forEach(noteInfo => {
            this.ctx.fillStyle = noteInfo.isBlack ?
                getSetting("inputNoteColorBlack") :
                getSetting("inputNoteColorWhite")
            this.pianoRender.drawActiveInputKey(
                parseInt(noteInfo.noteNumber),
                this.ctx.fillStyle
            )

            this.drawNoteAfter(noteInfo)
            this.ctx.fill()
        })
        inputPlayedNotes.forEach(noteInfo => {
            // noteInfo.y += getRenderDimensions().whiteKeyHeight
            this.drawNoteAfter(noteInfo)
            this.ctx.fill()
        })
    }

    drawNoteAfter(renderInfos) {
        let y =
            renderInfos.y +
            (getSetting("reverseNoteDirection") ? -1 : 1) *
            getRenderDimensions().whiteKeyHeight

        this.doNotePath(renderInfos, {
            y
        })
    }

    drawNoteBefore(renderInfos) {
        //Done by .clip() now. Keep in case clipping isn't performant
        // let h = Math.min(
        // 	renderInfos.h,
        // 	getRenderDimensions().getAbsolutePianoPosition() - renderInfos.y
        // )
        this.doNotePath(renderInfos /*, { h }*/ )
    }

    drawNoteLabel(renderInfo) {
        const fontSize = Math.max(
            12,
            Math.min(20, Math.min(renderInfo.w, renderInfo.h) / 2.1)
        )
        let c = this.ctx
        c.textBaseline = "bottom"
        c.font = fontSize + "px Arial black"
        c.fillStyle = "rgba(15,15,15,1)"
        let y = renderInfo.y + renderInfo.h
        //Render bound key name
        if (getSetting("noteLabel") == "Key Binding") {
            let bindings = getKeyBinder().getKeysForNote(renderInfo.noteNumber)
            y -= (fontSize - 2) * (bindings.length - 1)
            bindings.forEach((bindingKey, index) => {
                let wd = c.measureText(bindingKey).width / 2
                c.fillText(
                    bindingKey,
                    renderInfo.x + renderInfo.w / 2 - wd,
                    y + (fontSize + 2) * index
                )
            })
        } else {
            //render note Name
            let tx = formatNote(renderInfo.noteNumber + 21)
            let wd = c.measureText(tx).width / 2
            c.fillText(tx, renderInfo.x + renderInfo.w / 2 - wd, y)
        }
    }

    renderActivePianoKeys(activeNotes, currentActiveNotes) {
        if (getSetting("highlightActivePianoKeys")) {
            activeNotes.white.forEach(noteRenderInfo => {
                this.pianoRender.drawActiveKey(noteRenderInfo, noteRenderInfo.fillStyle)
            })
            activeNotes.black.forEach(noteRenderInfo => {
                this.pianoRender.drawActiveKey(noteRenderInfo, noteRenderInfo.fillStyle)
            })
        }
    }

    doNotePath(renderInfo, overWriteParams) {
        if (!overWriteParams) {
            overWriteParams = {}
        }
        for (let key in renderInfo) {
            if (!overWriteParams.hasOwnProperty(key)) {
                overWriteParams[key] = renderInfo[key]
            }
        }
        if (getSetting("roundedNotes") || getSetting("noteBorderRadius") > 0) {
            drawRoundRect(
                this.ctx,
                overWriteParams.x,
                overWriteParams.y,
                overWriteParams.w,
                overWriteParams.h,
                overWriteParams.rad,
                getSetting("roundedNotes")
            )
        } else {
            this.ctx.beginPath()
            this.ctx.rect(
                overWriteParams.x,
                overWriteParams.y,
                overWriteParams.w,
                overWriteParams.h
            )
            this.ctx.closePath()
        }
    }

    createNoteParticles(activeNotes) {
        if (getSetting("showParticles")) {
            activeNotes.white.forEach(noteRenderInfo => {
                createThreeJsParticles(noteRenderInfo)
            })
            activeNotes.black.forEach(noteRenderInfo => {
                createThreeJsParticles(noteRenderInfo)
            })
        }
    }

    getAlphaFromY(y) {
        //TODO broken.
        return Math.min(
            1,
            Math.max(
                0,
                (y - getRenderDimensions().menuHeight - 5) /
                (getRenderDimensions().renderHeight * 0.5)
            )
        )
    }
}