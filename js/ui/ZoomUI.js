import {
    getPlayer
} from "../player/Player.js"
import {
    getRenderDimensions
} from "../Rendering/RenderDimensions.js"
import {
    getSetting
} from "../settings/Settings.js"
import {
    DomHelper
} from "./DomHelper.js"

export class ZoomUI {
    constructor() {
        this.contentDiv = null
    }
    setTop(y) {
        if (this.contentDiv) {
            this.contentDiv.style.top = y + "px"
        }
    }
    getContentDiv() {
        if (this.contentDiv) {
            return this.contentDiv
        }
        let cont = DomHelper.createDivWithClass("zoomGroup btn-group")
        this.contentDiv = cont
        const zoomInBtn = DomHelper.createGlyphiconButton(
            "zoomInButton",
            "zoom-in",
            () => getRenderDimensions().zoomIn()
        )
        //zoomIn
        cont.appendChild(zoomInBtn)
        zoomInBtn.classList.add("zoomBtn")
        zoomInBtn.classList.add("hidden")

        const zoomOutBtn = DomHelper.createGlyphiconButton(
            "zoomOutButton",
            "zoom-out",
            () => getRenderDimensions().zoomOut()
        )
        //zoomOut
        cont.appendChild(zoomOutBtn)
        zoomOutBtn.classList.add("zoomBtn")
        zoomOutBtn.classList.add("hidden")

        const moveLeftBtn = DomHelper.createGlyphiconButton(
            "moveViewLeftButton",
            "arrow-left",
            () => getRenderDimensions().moveViewLeft()
        )
        //moveLeft
        cont.appendChild(moveLeftBtn)
        moveLeftBtn.classList.add("zoomBtn")
        moveLeftBtn.classList.add("hidden")

        const moveRightBtn = DomHelper.createGlyphiconButton(
            "moveViewLeftButton",
            "arrow-right",
            () => getRenderDimensions().moveViewRight()
        )
        //moveRight
        cont.appendChild(moveRightBtn)
        moveRightBtn.classList.add("zoomBtn")
        moveRightBtn.classList.add("hidden")

        const fitSongButton = DomHelper.createGlyphiconButton(
            "fitSongButton",
            "resize-small",
            () => getRenderDimensions().fitSong(getPlayer().song.getNoteRange())
        )
        fitSongButton.classList.add("zoomBtn")
        fitSongButton.classList.add("hidden")

        //FitSong
        cont.appendChild(fitSongButton)
        const showAllBtn = DomHelper.createGlyphiconButton(
            "showAllButton",
            "resize-full",
            () => getRenderDimensions().showAll()
        )
        showAllBtn.classList.add("zoomBtn")
        showAllBtn.classList.add("hidden")

        //ShowAll
        cont.appendChild(showAllBtn)

        let collapsed = true
        const collapseAllBtn = DomHelper.createGlyphiconButton(
            "fitSongButton",
            "chevron-down",
            () => {
                if (collapsed) {
                    collapsed = false
                    cont
                        .querySelectorAll(".zoomBtn")
                        .forEach(el => el.classList.remove("hidden"))
                    // cont.style.height = "600px"
                    DomHelper.replaceGlyph(collapseAllBtn, "chevron-down", "chevron-up")
                } else {
                    collapsed = true
                    DomHelper.replaceGlyph(collapseAllBtn, "chevron-up", "chevron-down")
                    cont
                        .querySelectorAll(".zoomBtn")
                        .forEach(el =>
                            collapseAllBtn != el ? el.classList.add("hidden") : null
                        )

                    // cont.style.height = "60px"
                }
            }
        )
        collapseAllBtn.classList.add("zoomBtn")
        cont.appendChild(collapseAllBtn)

        return cont
    }
}