import {
    getSetting
} from "../settings/Settings.js"
import {
    getRenderDimensions
} from "./RenderDimensions.js"

/**
 * Class to render the sustain events in the midi-song. Can fill the sustain periods or draw lines for the individual control-events.
 */
export class SustainRender {
    constructor(ctx) {
        this.ctx = ctx

        this.sustainPeriodFillStyle = "rgba(0,0,0,0.4)"
        this.sustainOnStrokeStyle = "rgba(55,155,55,0.6)"
        this.sustainOffStrokeStyle = "rgba(155,55,55,0.6)"
        this.sustainOnOffFont = "0.6em Arial black"
    }
    render(time, sustainsByChannelAndSecond, sustainPeriods) {
        if (getSetting("showSustainPeriods")) {
            this.renderSustainPeriods(time, sustainPeriods)
        }
        if (getSetting("showSustainOnOffs")) {
            this.renderSustainOnOffs(time, sustainsByChannelAndSecond)
        }
    }
    /**
     * Renders On/Off Sustain Control-Events as lines on screen.
     *
     * @param {Number} time
     * @param {Object} sustainsByChannelAndSecond
     */
    renderSustainOnOffs(time, sustainsByChannelAndSecond) {
        const renderDims = getRenderDimensions()
        let lookBackTime = Math.floor(
            time - renderDims.getSecondsDisplayedAfter() - 4
        )
        let lookAheadTime = Math.ceil(
            time + renderDims.getSecondsDisplayedBefore() + 1
        )
        for (let channel in sustainsByChannelAndSecond) {
            for (
                let lookUpTime = lookBackTime; lookUpTime < lookAheadTime; lookUpTime++
            ) {
                if (sustainsByChannelAndSecond[channel].hasOwnProperty(lookUpTime)) {
                    sustainsByChannelAndSecond[channel][lookUpTime].forEach(sustain => {
                        this.ctx.lineWidth = "1"
                        let text = ""
                        this.ctx.fillStyle = "rgba(0,0,0,0.8)"
                        let channelStr = getSetting("showSustainChannels") ?
                            "(Channel:  " + channel + ")" :
                            ""
                        if (sustain.isOn) {
                            this.ctx.strokeStyle = this.sustainOnStrokeStyle
                            text = "Sustain On " + channelStr
                        } else {
                            this.ctx.strokeStyle = this.sustainOffStrokeStyle
                            text = "Sustain Off " + channelStr
                        }
                        let y = renderDims.getYForTime(sustain.timestamp - time * 1000)
                        this.ctx.beginPath()
                        this.ctx.moveTo(0, y)
                        this.ctx.lineTo(renderDims.renderWidth, y)
                        this.ctx.closePath()
                        this.ctx.stroke()

                        this.ctx.fillStyle = "rgba(255,255,255,0.6)"
                        this.ctx.font = this.sustainOnOffFont
                        this.ctx.textBaseline = "bottom"
                        this.ctx.fillText(text, 10, y - 1)
                    })
                }
            }
        }
    }
    /**
     * Renders Sustain Periods as rectangles on screen.
     * @param {Number} time
     * @param {Array} sustainPeriods
     */
    renderSustainPeriods(time, sustainPeriods) {
        const renderDims = getRenderDimensions()
        let firstSecondShown = Math.floor(
            time - renderDims.getSecondsDisplayedAfter() - 4
        )
        let lastSecondShown = Math.ceil(
            time + renderDims.getSecondsDisplayedBefore() + 1
        )
        this.ctx.fillStyle = this.sustainPeriodFillStyle

        sustainPeriods
            .filter(
                period =>
                (period.start < lastSecondShown * 1000 &&
                    period.start > firstSecondShown * 1000) ||
                (period.start < firstSecondShown * 1000 &&
                    period.end > firstSecondShown * 1000)
            )
            .forEach(period => {
                let yStart = renderDims.getYForTime(period.start - time * 1000)
                let yEnd = renderDims.getYForTime(period.end - time * 1000)

                this.ctx.fillRect(0, yEnd, renderDims.renderWidth, yStart - yEnd)
            })
    }
}