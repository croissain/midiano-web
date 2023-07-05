import {
    getSetting
} from "../settings/Settings.js"
import {
    getRenderDimensions
} from "./RenderDimensions.js"

/**
 * Class to render the markers in the midi-song
 */
export class MarkerRenderer {
    constructor(ctx) {
        this.ctx = ctx
    }
    render(time, markers) {
        if (getSetting("showMarkersSong")) {
            const renderDims = getRenderDimensions()
            const windowWd = renderDims.renderWidth

            let lookAheadTime = Math.ceil(
                time + renderDims.getSecondsDisplayedBefore() + 1
            )

            let c = this.ctx
            c.fillStyle = "rgba(255,255,255,0.6)"
            c.strokeStyle = "rgba(255,255,255,0.6)"
            c.font = "1.2em Arial black"
            c.textBaseline = "top"
            c.lineWidth = 1.5
            markers.forEach(marker => {
                if (
                    marker.timestamp / 1000 >= time &&
                    marker.timestamp / 1000 < lookAheadTime
                ) {
                    let y = renderDims.getYForTime(marker.timestamp - time * 1000)
                    let txtWd = c.measureText(marker.text).width
                    c.fillText(marker.text, windowWd / 2 - txtWd / 2, y + 3)
                    c.beginPath()
                    c.moveTo(0, y)
                    c.lineTo(windowWd, y)
                    c.closePath()
                    c.stroke()
                }
            })
        }
    }
}