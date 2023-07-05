import {
    getSetting,
    setSettingCallback
} from "../settings/Settings.js"
import {
    getRenderDimensions
} from "./RenderDimensions.js"

/**
 * Class to render measure lines on the main canvas.
 */
export class MeasureLinesRender {
    constructor(ctx) {
        this.ctx = ctx
        this.isEnabled = getSetting("drawMeasureLines")
        setSettingCallback(
            "drawMeasureLines",
            () => (this.isEnabled = getSetting("drawMeasureLines"))
        )
    }
    render(time, measureLines) {
        if (!this.isEnabled) return
        let ctx = this.ctx
        const renderDims = getRenderDimensions()
        const windowWd = renderDims.renderWidth

        ctx.strokeStyle = "rgba(255,255,255,0.3)"
        ctx.fillStyle = "rgba(255,255,255,0.3)"

        ctx.lineWidth = 0.5

        ctx.textBaseline = "bottom"
        ctx.font = "1em Arial black"
        let currentSecond = Math.floor(time)
        ctx.beginPath()

        let lastSecondShown =
            currentSecond + renderDims.getSecondsDisplayedBefore() + 1

        let letterWd = ctx.measureText("M").width
        let numbersToDraw = []
        for (let i = currentSecond; i < lastSecondShown; i++) {
            if (!measureLines[i]) {
                continue
            }
            measureLines[i].forEach((measureLine, index) => {
                if (measureLine[0] + 20 > time * 1000) {
                    let ht = renderDims.getYForTime(measureLine[0] - time * 1000)

                    ctx.moveTo(0, ht)
                    ctx.lineTo(windowWd, ht)

                    numbersToDraw.push([measureLine[1], ht - 1])
                }
            })
        }
        ctx.stroke()
        ctx.closePath()
        numbersToDraw.forEach(numberHeightTuple =>
            ctx.fillText(numberHeightTuple[0], letterWd / 2, numberHeightTuple[1])
        )
    }
}