import {
    CONST
} from "../data/CONST.js"
import {
    getSetting
} from "../settings/Settings.js"
import {
    roundToDecimals
} from "../Util.js"
import {
    getRenderDimensions
} from "./RenderDimensions.js"

/**
 * Class to render some general debug-info or when mouse is hovered over a note.
 */
export class DebugRender {
    constructor(active, ctx) {
        this.noteInfoBoxesToDraw = []
        this.active = active
        this.ctx = ctx
    }
    addNote(note) {
        this.noteInfoBoxesToDraw.push(note)
    }
    render(renderInfos, mouseX, mouseY) {
        this.renderNoteDebugInfo(renderInfos, mouseX, mouseY)
    }
    renderNoteDebugInfo(renderInfos, mouseX, mouseY) {
        if (getSetting("showNoteDebugInfo")) {
            let amountOfNotesDrawn = 0
            Object.keys(renderInfos).forEach(trackIndex => {
                renderInfos[trackIndex].black
                    .filter(renderInfo =>
                        this.isMouseInRenderInfo(renderInfo, mouseX, mouseY)
                    )
                    .forEach(renderInfo => {
                        this.drawNoteInfoBox(renderInfo, mouseX, mouseY, amountOfNotesDrawn)
                        amountOfNotesDrawn++
                    })
                renderInfos[trackIndex].white
                    .filter(renderInfo =>
                        this.isMouseInRenderInfo(renderInfo, mouseX, mouseY)
                    )
                    .forEach(renderInfo => {
                        this.drawNoteInfoBox(renderInfo, mouseX, mouseY, amountOfNotesDrawn)
                        amountOfNotesDrawn++
                    })
            })
        }
    }
    isMouseInRenderInfo(renderInfo, mouseX, mouseY) {
        return (
            mouseX > renderInfo.x &&
            mouseX < renderInfo.x + renderInfo.w &&
            mouseY > renderInfo.y &&
            mouseY < renderInfo.y + renderInfo.h
        )
    }

    drawNoteInfoBox(renderInfo, mouseX, mouseY, amountOfNotesDrawn) {
        let c = this.ctx
        c.font = "12px Arial black"
        c.textBaseline = "top"
        c.strokeStyle = renderInfo.fillStyle
        c.lineWidth = 4

        let lines = [
            "Note: " + CONST.MIDI_NOTE_TO_KEY[renderInfo.noteNumber + 21],
            "Note number: " + renderInfo.noteNumber,
            "Midi note number: " + (parseInt(renderInfo.noteNumber) + 21),
            "Start: " + roundToDecimals(renderInfo.timestamp, 4),
            "End: " + roundToDecimals(renderInfo.offTime, 4),
            "Duration: " + roundToDecimals(renderInfo.duration, 4),
            "Velocity: " + renderInfo.velocity,
            "Instrument: ",
            "    " + renderInfo.instrument,
            "MIDI-Track: " + renderInfo.track,
            "MIDI-Channel: " + renderInfo.channel
        ]

        let left = mouseX > getRenderDimensions().renderWidth / 2 ? -160 : 60
        let top =
            mouseY > getRenderDimensions().renderHeight / 2 ?
            -10 - 14 * lines.length :
            10

        top += amountOfNotesDrawn * lines.length * 15
        c.fillStyle = "grey"
        c.fillRect(mouseX + left - 4, mouseY + top - 3, 200, lines.length * 14 + 6)
        c.fillStyle = "white"
        c.beginPath()
        c.moveTo(mouseX + left - 4, mouseY + top - 3)
        c.lineTo(mouseX + left - 4, mouseY + top + lines.length * 14 + 3)
        c.stroke()
        for (let l in lines) {
            c.fillText(lines[l], mouseX + left, mouseY + top + 14 * l)
        }
    }
}