import {
    getCurrentSong,
    START_DELAY
} from "../player/Player.js"
import {
    getSetting
} from "../settings/Settings.js"
import {
    getRenderDimensions
} from "./RenderDimensions.js"

/**
 * Class to render the markers in the midi-song
 */
export class InSongTextRenderer {
    constructor(ctx) {
        this.ctx = ctx
    }
    render(time) {
        let c = this.ctx
        let isReversed = getSetting("reverseNoteDirection")
        let pianoPos = getRenderDimensions().getAbsolutePianoPosition(true)
        c.fillStyle = "rgba(255,255,255,0.8)"
        c.strokeStyle = "rgba(255,255,255,0.8)"
        let fontsize = 40
        c.font = fontsize + "px Arial black"

        c.textBaseline = "top"
        c.lineWidth = 1.5
        let nameString = getCurrentSong().getName()
        let artistString = getCurrentSong().getArtist()
        let y = getRenderDimensions().getYForTime(
            (START_DELAY * 0.75 - time) * 1000
        )
        let x = getRenderDimensions().renderWidth / 2

        let isYAbovePiano = isReversed ? y >= pianoPos : y <= pianoPos

        //Render Song Name
        if (isYAbovePiano) {
            let txtWd = c.measureText(nameString).width
            while (fontsize > 10 && txtWd > getRenderDimensions().renderWidth / 1.6) {
                fontsize--
                c.font = fontsize + "px Arial black"
                txtWd = c.measureText(nameString).width
            }
            c.fillText(nameString, x - txtWd / 2, y + 3)
            c.font = 25 + "px Arial black"
            let wd1 = c.measureText(artistString).width
            c.fillStyle = "rgba(255,255,255,0.6)"
            c.fillText(artistString, x - wd1 / 2, y + 3 - 40)
        }
        y += fontsize + 15
        isYAbovePiano = isReversed ? y >= pianoPos : y <= pianoPos
        //Render Copyright info
        if (isYAbovePiano) {
            let copyrightText = "MIDI-File: ©" + getCurrentSong().copyright
            if (getCurrentSong().copyright) {
                c.fillStyle = "rgba(255,255,255,0.6)"
                let txtWd = c.measureText(copyrightText).width
                while (
                    fontsize > 7 &&
                    txtWd > getRenderDimensions().renderWidth / 1.4
                ) {
                    fontsize--
                    c.font = fontsize + "px Arial black"
                    txtWd = c.measureText(copyrightText).width
                }

                c.fillText(
                    copyrightText,
                    getRenderDimensions().renderWidth / 2 - txtWd / 2,
                    y + 3
                )
            }
        }

        //Render Time Signature
        y = getRenderDimensions().getYForTime(-time * 1000) + 10
        if (y <= getRenderDimensions().getAbsolutePianoPosition(true)) {
            let timeSig = getCurrentSong().getTimeSignature()
            c.fillStyle = "rgba(255,255,255,0.6)"
            c.font = "1.5em Arial black"
            let text = " "
            if (timeSig) {
                text = " 𝄞 " + timeSig.numerator + "/" + timeSig.denominator
            }
            c.fillText(text, 15, y)
        }
    }
}