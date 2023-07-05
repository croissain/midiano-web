import {
    addDynamicSettingsToObj,
    getSetting
} from "../settings/Settings.js"
import {
    drawRoundRect,
    formatTime,
    getCssVariable
} from "../Util.js"
import {
    PROGRESS_BAR_CANVAS_HEIGHT
} from "./Render.js"
import {
    getRenderDimensions
} from "./RenderDimensions.js"
/**
 * Renders the progress bar of the song
 */
export class ProgressBarRender {
    constructor(ctx) {
        this.ctx = ctx
        this.isGrabbed = false
        this.mouseX = 0
        this.isMouseOver = false
        this.fontColor0 = "rgba(240,240,240,1)"
        this.fontColor1 = "rgba(0,0,0,1)"
        this.ctx.canvas.addEventListener(
            "mousemove",
            function(ev) {
                this.mouseX = ev.clientX /* * window.devicePixelRatio*/
                this.isMouseOver = true
            }.bind(this)
        )
        this.ctx.canvas.addEventListener(
            "mouseleave",
            function() {
                this.isMouseOver = false
            }.bind(this)
        )

        this.darkInnerMenuBgColor = getCssVariable("darkInnerMenuBgColor")
        this.inputBgColor = getCssVariable("inputBgColor")
        this.inputBgColor = getCssVariable("inputBgColor")
        this.progressBarGreen = getCssVariable("progressBarGreen")
        this.progressBarHeight = parseFloat(getCssVariable("progressBarHeight"))
        let settingIds = ["showMiliseconds", "showMarkersTimeline"]
        addDynamicSettingsToObj(settingIds, this, "_")

        getRenderDimensions().registerResizeCallback(() => {
            this.gradient = this.ctx.createLinearGradient(
                getRenderDimensions().renderWidth / 2,
                0,
                getRenderDimensions().renderWidth / 2,
                PROGRESS_BAR_CANVAS_HEIGHT /** window.devicePixelRatio*/
            )
            this.gradient.addColorStop(0, "transparent")
            this.gradient.addColorStop(0.05, this.darkInnerMenuBgColor)
            this.gradient.addColorStop(0.1, this.inputBgColor)
            this.gradient.addColorStop(0.9, this.inputBgColor)

            this.gradient.addColorStop(0.95, this.darkInnerMenuBgColor)
            this.gradient.addColorStop(1, "transparent")
        })
    }
    setGrabbed(isGrabbed) {
        this.isGrabbed = isGrabbed
    }
    render(time, end, markers) {
        end = end / 1000

        this.ctx.clearRect(
            0,
            0,
            getRenderDimensions().renderWidth,
            PROGRESS_BAR_CANVAS_HEIGHT /** window.devicePixelRatio*/
        )
        let ctx = this.ctx

        ctx.globalAlpha = 0.4
        ctx.fillStyle = this.gradient

        ctx.fillRect(
            0,
            0,
            getRenderDimensions().renderWidth,
            PROGRESS_BAR_CANVAS_HEIGHT /** window.devicePixelRatio*/
        )
        ctx.globalAlpha = 1

        ctx.fillStyle = this.progressBarGreen
        let barHt = parseInt(this.progressBarHeight) /** window.devicePixelRatio*/
        let margin = this.getMargin()
        drawRoundRect(
            ctx,
            margin / 2,
            margin / 2,
            this.getX(time, end) - barHt / 4,
            barHt,
            barHt / 4,
            true
        )
        ctx.fill()

        this.renderMarkersAndTime(time, end, markers)
    }
    renderMarkersAndTime(time, end, markers) {
        let ctx = this.ctx
        ctx.font = "14px Arial black"

        let midText =
            this.getTimeText(Math.min(end, time)) + " / " + this.getTimeText(end)
        let midTextWd = ctx.measureText(midText).width

        let midTextX = getRenderDimensions().renderWidth / 2 - midTextWd / 2

        let y = this.getY()

        this.coveredRanges = []

        if (this.isGrabbed) {
            let hoverTimeTxt = this.getTimeText(Math.min(time, end))
            let grabTextWd = ctx.measureText(hoverTimeTxt).width
            let grabTextX = this.getX(time, end, this.getMargin()) - grabTextWd / 2
            ctx.fillStyle = this.fontColor0
            ctx.fillText(hoverTimeTxt, grabTextX, y)

            this.coveredRanges.push({
                start: grabTextX,
                end: grabTextX + grabTextWd
            })
        }

        if (this._showMarkersTimeline) {
            ctx.lineCap = "round"
            markers.forEach(marker => {
                this.renderMarker(marker, end, ctx)
            })
        }

        if (!this.isOverlap(midTextX, midTextX + midTextWd)) {
            ctx.fillStyle = this.fontColor1
            ctx.fillText(midText, midTextX, y)

            this.coveredRanges.push({
                start: midTextX,
                end: midTextX + midTextWd
            })
        }

        if (this.isMouseOver) {
            let hoverTimeTxt = formatTime(
                Math.min((this.mouseX / getRenderDimensions().renderWidth) * end, end),
                this._showMiliseconds
            )
            let grabTextWd = ctx.measureText(hoverTimeTxt).width
            let grabTextX = this.mouseX - grabTextWd / 2
            if (!this.isOverlap(grabTextX, grabTextX + grabTextWd)) {
                ctx.fillStyle = this.fontColor1
                ctx.fillText(hoverTimeTxt, grabTextX, y)
            }
        }
    }

    renderMarker(marker, end, ctx) {
        let xPos =
            (marker.timestamp / 1000 / end) * getRenderDimensions().renderWidth
        const isMouseOverMarker = Math.abs(xPos - this.mouseX) < 10
        if (isMouseOverMarker && this.isMouseOver) {
            this.renderMarkerText(ctx, marker, xPos)
        } else {
            this.renderMarkerNub(ctx, xPos)
        }
    }

    renderMarkerText(ctx, marker, xPos) {
        let y = this.getY()
        let markerTxtWd = ctx.measureText(marker.text).width
        let markerX = Math.min(
            getRenderDimensions().renderWidth - markerTxtWd - 5,
            xPos - markerTxtWd / 2
        )
        markerX = Math.max(5, markerX)
        if (!this.isOverlap(markerX, markerX + markerTxtWd)) {
            ctx.fillStyle = this.fontColor0
            ctx.fillText(marker.text, markerX, y)
        }
        this.coveredRanges.push({
            start: markerX,
            end: markerX + markerTxtWd
        })
    }

    renderMarkerNub(ctx, xPos) {
        let ht = 3
        ctx.fillStyle = "rgba(240,240,240,1)"
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(xPos, PROGRESS_BAR_CANVAS_HEIGHT /** window.devicePixelRatio*/ )
        ctx.lineTo(
            xPos,
            PROGRESS_BAR_CANVAS_HEIGHT /** window.devicePixelRatio*/ - ht
        )

        ctx.stroke()
        ctx.closePath()
    }
    getTimeText(end) {
        return formatTime(end, this._showMiliseconds)
    }

    getProgressPercent(time, end) {
        return Math.max(0, time / end)
    }
    getMargin() {
        let barHt = parseInt(this.progressBarHeight) /** window.devicePixelRatio*/
        return PROGRESS_BAR_CANVAS_HEIGHT /** window.devicePixelRatio*/ - barHt
    }
    getX(time, end) {
        let margin = this.getMargin()
        let progressPercent = this.getProgressPercent(time, end)
        return (
            (getRenderDimensions().renderWidth - margin) *
            Math.min(1, progressPercent)
        )
    }

    getY() {
        return PROGRESS_BAR_CANVAS_HEIGHT /** window.devicePixelRatio*/ / 2 + 5
    }

    isOverlap(start, end) {
        return this.coveredRanges.find(
            range => !(range.start + 5 > end || range.end < start + 5)
        )
    }
}