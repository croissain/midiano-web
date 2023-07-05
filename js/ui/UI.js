import {
    DomHelper
} from "./DomHelper.js"
import {
    getSetting,
    getSettingsDiv,
    setSettingCallback,
    triggerSettingCallback
} from "../settings/Settings.js"
import {
    ZoomUI
} from "./ZoomUI.js"
import {
    createTrackDivs
} from "./TrackUI.js"
import {
    getCurrentSong,
    getPlayer
} from "../player/Player.js"
import {
    SongUI
} from "./SongUI.js"
import {
    getMidiHandler
} from "../MidiInputHandler.js"
import {
    PROGRESS_BAR_CANVAS_HEIGHT
} from "../Rendering/Render.js"
import {
    Notification
} from "./Notification.js"
import {
    ElementHighlight
} from "./ElementHighlight.js"
import {
    saveSongInDb
} from "../settings/IndexDbHandler.js"
import {
    initThreeJs
} from "../Rendering/ThreeJs/threeJsHandler.js"
import {
    getRenderDimensions
} from "../Rendering/RenderDimensions.js"
/**
 * Contains all initiation, appending and manipulation of DOM-elements.
 * Callback-bindings for some events are created in  the constructor
 */
export class UI {
    constructor(render, isMobile) {
        initThreeJs()
        this.isMobile = window.matchMedia(
            "only screen and (max-width: 1600px)"
        ).matches

        this.songUI = new SongUI()
        this.innerMenuShown = false
        //add callbacks to the player
        getPlayer().newSongCallbacks.push(this.newSongCallback.bind(this))

        getRenderDimensions().registerResizeCallback(
            this.refreshMenuHeight.bind(this)
        )

        document.body.addEventListener("mousemove", this.mouseMoved.bind(this))

        this.createControlMenu()

        this.getNavBar().appendChild(render.getProgressBarCanvas())
        this.sheetCanvas = render.getSheetCanvas()
        this.getNavBar().appendChild(this.sheetCanvas)

        this.menuHeight = 200

        this.setInnerMenuDivsTop()

        this.zoomUI = new ZoomUI(render.renderDimensions)
        this.getNavBar().appendChild(this.zoomUI.getContentDiv())
    }

    setInnerMenuDivsTop() {
        let cssHeight =
            "calc(100% - " +
            (this.getNavBar().clientHeight +
                PROGRESS_BAR_CANVAS_HEIGHT +
                this.getCloseInnerMenuDivButton().clientHeight) +
            "px)"

        document.querySelectorAll(".innerMenuDiv").forEach(el => {
            el.style.height = cssHeight
            let top =
                this.getCloseInnerMenuDivButton().clientHeight > 0 ?
                this.getCloseInnerMenuDivButton().clientHeight + "px" :
                "calc(0px + 2.5em)" //TODO still needed?
            el.style.top = top
        })
        document.querySelector(".innerMenuDivsContainer").style.marginTop =
            PROGRESS_BAR_CANVAS_HEIGHT + "px"
    }

    setExampleSongs(exampleSongsJson) {
        this.songUI.setExampleSongs(exampleSongsJson)
    }
    setDbSongs(dbSongs) {
        this.songUI.setDbSongs(dbSongs)
    }
    addDbSong(songDbObj) {
        this.songUI.addDBSong(songDbObj)
    }

    fireInitialListeners() {
        this.setInnerMenuDivsTop()
        this.setZoomTop()
        getRenderDimensions().resize()
        window.setTimeout(() => {
            this.setInnerMenuDivsTop()
            this.setZoomTop()
            getRenderDimensions().resize()
        }, 500)

        setSettingCallback("enableSheet", () => {
            this.setZoomTop()
            if (
                getSetting("enableSheet") &&
                getCurrentSong() &&
                (!getCurrentSong().sheetGen || !getCurrentSong().sheetGen.generated)
            ) {
                getCurrentSong().generateSheet()
            }
            triggerSettingCallback("pianoPositionOnce")
        })
        setSettingCallback("recalcZoomTop", this.setZoomTop.bind(this))
    }

    setZoomTop() {
        this.zoomUI.setTop(
            this.getNavBar().clientHeight +
            PROGRESS_BAR_CANVAS_HEIGHT +
            5 +
            (getSetting("enableSheet") ? this.sheetCanvas.height : 0)
        )
    }

    mouseMoved() {
        this.getMinimizeButton().style.opacity = 1
        this.zoomUI.getContentDiv().style.opacity = 1
        if (!this.fadingOutMinimizeButton) {
            this.fadingOutMinimizeButton = true
            window.setTimeout(() => {
                this.getMinimizeButton().style.opacity = 0
                this.zoomUI.getContentDiv().style.opacity = 0
                this.fadingOutMinimizeButton = false
            }, 2500)
        }
    }
    createControlMenu() {
        let topGroupsContainer = DomHelper.createDivWithClass("container")

        let fileGrp = this.getFileButtonGroup()
        let songSpeedGrp = this.getSpeedButtonGroup()
        let songControlGrp = this.getSongControlButtonGroup()
        let volumeGrp = this.getVolumneButtonGroup()
        let settingsGrpRight = this.getSettingsButtonGroup()
        let trackGrp = this.getTracksButtonGroup()
        let sandwichMenuGrp = DomHelper.createButtonGroup(false)
        DomHelper.addClassToElement("inlineFlex", sandwichMenuGrp)
        sandwichMenuGrp.appendChild(this.getSandwichMenuButton())

        DomHelper.addClassToElements("align-middle", [
            fileGrp,
            songSpeedGrp,
            songControlGrp,
            volumeGrp,
            trackGrp
        ])

        let empty0 = DomHelper.createElementWithClass("topContainer hiddenIfSmall")
        let empty1 = DomHelper.createElementWithClass("topContainer hiddenIfSmall")
        let empty2 = DomHelper.createElementWithClass("topContainer hiddenIfSmall")
        let leftTop0 = DomHelper.createElementWithClass(
            "topContainer hiddenIfSmall"
        )
        let leftTop1 = DomHelper.createElementWithClass(
            "topContainer hiddenIfSmall"
        )

        let middleTop = DomHelper.createElementWithClass("topContainer")
        let rightTop0 = DomHelper.createElementWithClass("topContainer ")
        let rightTop1 = DomHelper.createElementWithClass(
            "topContainer hiddenIfSmall"
        )
        let rightTop2 = DomHelper.createElementWithClass(
            "topContainer hiddenIfSmall"
        )

        let sandwichMenuTop = DomHelper.createElementWithClass(
            "topContainer shownIfSmall"
        )

        DomHelper.appendChildren(leftTop0, [fileGrp])
        DomHelper.appendChildren(leftTop1, [trackGrp])

        DomHelper.appendChildren(middleTop, [songControlGrp])
        DomHelper.appendChildren(rightTop0, [songSpeedGrp])
        DomHelper.appendChildren(rightTop1, [volumeGrp])
        DomHelper.appendChildren(rightTop2, [settingsGrpRight])
        DomHelper.appendChildren(sandwichMenuTop, [sandwichMenuGrp])

        DomHelper.appendChildren(topGroupsContainer, [
            leftTop0,
            empty0,
            leftTop1,
            empty1,
            middleTop,
            empty2,
            rightTop0,
            rightTop1, //empty
            rightTop2,
            sandwichMenuTop
        ])
        this.getNavBar().appendChild(topGroupsContainer)

        let minimizeButton = this.getMinimizeButton()
        this.getNavBar().appendChild(minimizeButton)

        let innerMenuDivsContainer = DomHelper.createElementWithClass(
            "innerMenuDivsContainer"
        )
        DomHelper.appendChildren(innerMenuDivsContainer, [
            this.getCloseInnerMenuDivButton(),
            this.getMidiSetupDialog(),
            this.getTrackMenuDiv(),
            this.getLoadedSongsDiv(),
            this.getSettingsDiv(),
            this.getSandwichMenu()
        ])

        document.body.appendChild(this.getNavBar())
        document.body.appendChild(innerMenuDivsContainer)

        this.createFileDragArea()
    }

    getMinimizeButton() {
        if (!this.minimizeButton) {
            this.minimizeButton = DomHelper.createGlyphiconButton(
                "minimizeMenu",
                "chevron-up",
                () => {
                    if (!this.navMinimized) {
                        this.minimizeMenu()
                    } else {
                        this.maximizeMenu()
                    }
                }
            )
        }
        return this.minimizeButton
    }
    refreshMenuHeight() {
        this.isMobile = window.matchMedia(
            "only screen and (max-width: 1600px)"
        ).matches
        this.setInnerMenuDivsTop()
        this.setMenuHeight()
    }
    setMenuHeight() {
        if (!this.navMinimized) {
            this.navMargin = 0
        } else {
            this.navMargin = -this.getNavBar().clientHeight
        }
        this.getNavBar().style.marginTop = `${this.navMargin}px`
    }
    toggleMenu() {
        this.navMinimized ? this.maximizeMenu() : this.minimizeMenu()
    }
    maximizeMenu() {
        this.navMinimized = false
        DomHelper.replaceGlyph(this.minimizeButton, "chevron-down", "chevron-up")
        this.setMenuHeight()
        this.setInnerMenuDivsTop()
        window.setTimeout(() => getRenderDimensions().resize(), 410)
    }

    minimizeMenu() {
        this.navMinimized = true
        DomHelper.replaceGlyph(this.minimizeButton, "chevron-up", "chevron-down")
        this.setMenuHeight()
        this.setInnerMenuDivsTop()
        window.setTimeout(() => getRenderDimensions().resize(), 410)
    }

    getSettingsButtonGroup() {
        let settingsGrpRight = DomHelper.createButtonGroup(true)
        DomHelper.appendChildren(settingsGrpRight, [
            this.getFullscreenButton(),
            this.getSettingsButton()
        ])
        return settingsGrpRight
    }

    getTracksButtonGroup() {
        let trackGrp = DomHelper.createButtonGroup(true)
        trackGrp.classList.add("hiddenIfSmall")
        DomHelper.appendChildren(trackGrp, [
            this.getTracksButton(),
            this.getMidiSetupButton()
            // this.getChannelsButton()
        ])
        return trackGrp
    }

    getVolumneButtonGroup() {
        let volumeGrp = DomHelper.createButtonGroup(true)
        volumeGrp.classList.add("hiddenIfSmall")
        volumeGrp.id = "topVolumeGroup"
        DomHelper.appendChildren(volumeGrp, [
            this.getMainVolumeSlider().container,
            this.getMuteButton()
        ])
        return volumeGrp
    }

    getSongControlButtonGroup() {
        let songControlGrp = DomHelper.createButtonGroup(false)
        DomHelper.addClassToElement("inlineFlex", songControlGrp)
        DomHelper.appendChildren(songControlGrp, [
            this.getPlayButton(),
            this.getPauseButton(),
            this.getStopButton()
        ])
        return songControlGrp
    }

    getSpeedButtonGroup() {
        let songSpeedGrp = DomHelper.createButtonGroup(true)
        // songSpeedGrp.classList.add("hiddenIfSmall")
        DomHelper.appendChildren(songSpeedGrp, [this.getSpeedDiv()])
        return songSpeedGrp
    }

    getFileButtonGroup() {
        let fileGrp = DomHelper.createButtonGroup(true)
        fileGrp.classList.add("hiddenIfSmall")
        DomHelper.appendChildren(fileGrp, [
            this.getLoadSongButton(),
            this.getLoadedSongsButton()
        ])
        return fileGrp
    }

    getNavBar() {
        if (!this.navBar) {
            this.navBar = DomHelper.createElement(
                "nav", {}, {
                    className: "navbar navbar-wrapper dottedBg"
                }
            )
        }
        return this.navBar
    }
    getSettingsButton() {
        if (!this.settingsButton) {
            this.settingsButton = DomHelper.createGlyphiconButton(
                "settingsButton",
                "cog"
            )
            this.settingsButton.onclick = this.getShowHideListener(
                this.getSettingsDiv(),
                this.settingsButton
            ).bind(this)
        }
        DomHelper.addClassToElement("innerMenuDivButton", this.settingsButton)
        return this.settingsButton
    }
    getShowHideListener(div, btn, onShowCallback) {
        return () => {
            if (div.classList.contains("unhidden")) {
                this.innerMenuShown = false
                this.hideInnerMenuDiv(div, btn)
            } else {
                this.allHidden = false

                this.innerMenuShown = true
                this.showInnerMenuDiv(div, btn)
                if (onShowCallback) {
                    onShowCallback()
                }
            }
        }
    }
    showHideListener(div, btn, onShowCallback) {
        if (this.innerMenuShown && !this.allHidden) {
            this.innerMenuShown = false
            this.hideInnerMenuDiv(div, btn)
        } else {
            this.innerMenuShown = true
            this.showInnerMenuDiv(div, btn)
            if (onShowCallback) {
                onShowCallback()
            }
        }
    }
    showInnerMenuDiv(div, btn) {
        this.hideAllDialogs()
        this.allHidden = false
        DomHelper.addClassToElement("selected", btn)

        DomHelper.showDiv(this.getCloseInnerMenuDivButton())
        DomHelper.showDiv(div)
    }
    hideInnerMenuDiv(div, btn) {
        DomHelper.removeClass("selected", btn)

        DomHelper.hideDiv(this.getCloseInnerMenuDivButton())
        DomHelper.hideDiv(div)
    }

    getSettingsDiv() {
        if (!this.settingsDiv) {
            this.settingsDiv = DomHelper.createDivWithIdAndClass(
                "settingsDiv",
                "innerMenuDiv"
            )
            DomHelper.hideDiv(this.settingsDiv)
            this.settingsDiv.appendChild(this.getSettingsContent())
        }
        return this.settingsDiv
    }
    getSettingsContent() {
        return getSettingsDiv()
    }
    getFullscreenButton() {
        if (!this.fullscreenButton) {
            this.fullscreen = false
            let clickFullscreen = () => {
                if (!this.fullscreen) {
                    document.body.requestFullscreen()
                } else {
                    document.exitFullscreen()
                }
            }
            this.fullscreenButton = DomHelper.createGlyphiconButton(
                "fullscreenButton",
                "fullscreen",
                clickFullscreen.bind(this)
            )
            let fullscreenSwitch = () => (this.fullscreen = !this.fullscreen)
            document.body.onfullscreenchange = fullscreenSwitch.bind(this)
        }
        return this.fullscreenButton
    }
    getLoadSongButton() {
        if (!this.loadSongButton) {
            this.loadSongButton = DomHelper.createFileInput(
                "Load MIDI",
                this.handleFileSelect.bind(this)
            )
            DomHelper.addClassToElement("floatSpanLeft", this.loadSongButton)
        }
        return this.loadSongButton
    }
    getLoadedSongsButton() {
        if (!this.loadedSongsButton) {
            this.loadedSongsButton = DomHelper.createGlyphiconTextButton(
                "songsBtn",
                "music",
                "Songs"
            )
            this.loadedSongsButton.onclick = this.getShowHideListener(
                this.getLoadedSongsDiv(),
                this.loadedSongsButton
            )
            DomHelper.addClassToElement("floatSpanLeft", this.loadedSongsButton)
            DomHelper.addClassToElement("innerMenuDivButton", this.loadedSongsButton)
        }
        return this.loadedSongsButton
    }

    getLoadedSongsDiv() {
        if (!this.loadedSongsDiv) {
            this.loadedSongsDiv = DomHelper.createDivWithClass("innerMenuDiv")
            this.loadedSongsDiv.appendChild(this.songUI.getDivContent())
            DomHelper.hideDiv(this.loadedSongsDiv)
        }
        return this.loadedSongsDiv
    }

    createFileDragArea() {
        let dragArea = DomHelper.createElement(
            "div", {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 10000,
                visibility: "hidden",
                opacity: "0",
                backgroundColor: "rgba(0,0,0,0.6)",
                transition: "all 0.2s ease-out"
            }, {
                draggable: "true"
            }
        )

        let dragAreaText = DomHelper.createDivWithClass(
            "centeredBigText", {
                marginTop: "25%",
                fontSize: "35px",
                color: "rgba(225,225,225,0.8)"
            }, {
                innerHTML: "Drop Midi File anywhere!"
            }
        )
        dragArea.appendChild(dragAreaText)

        dragArea.ondrop = ev => {
            ev.preventDefault()
            dragArea.style.backgroundColor = "rgba(0,0,0,0)"
            this.handleDragDropFileSelect(ev)
        }
        let lastTarget
        window.ondragenter = ev => {
            ev.preventDefault()
            lastTarget = ev.target
            dragArea.style.visibility = ""
            dragArea.style.opacity = "1"
        }
        window.ondragleave = ev => {
            if (ev.target === lastTarget || ev.target === document) {
                dragArea.style.visibility = "hidden"
                dragArea.style.opacity = "0"
            }
        }
        window.ondragover = ev => ev.preventDefault()
        window.ondrop = ev => {
            ev.preventDefault()
            dragArea.style.visibility = "hidden"
            dragArea.style.opacity = "0"
            this.handleDragDropFileSelect(ev)
        }
        document.body.appendChild(dragArea)
    }
    handleDragOverFile(ev) {
        this.createFileDragArea().style
    }
    handleDragDropFileSelect(ev) {
        if (ev.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            if (ev.dataTransfer.items.length > 0) {
                if (ev.dataTransfer.items[0].kind === "file") {
                    var file = ev.dataTransfer.items[0].getAsFile()
                    this.readFile(file)
                }
            }
        } else {
            // Use DataTransfer interface to access the file(s)
            if (ev.dataTransfer.files.length > 0) {
                var file = ev.dataTransfer.files[0]
                this.readFile(file)
            }
        }
    }
    handleFileSelect(evt) {
        var files = evt.target.files
        for (var i = 0, f;
            (f = files[i]); i++) {
            this.readFile(f)
        }
    }
    readFile(file) {
        let reader = new FileReader()
        let fileName = file.name
        reader.onload = function(theFile) {
            if (getSetting("saveIndexedDb")) {
                saveSongInDb(fileName, reader.result)
            }
            getPlayer().loadSong(reader.result, {
                fileName
            })
        }.bind(this)
        reader.readAsDataURL(file)
    }

    getSpeedDiv() {
        if (!this.speedDiv) {
            this.speedDiv = DomHelper.createDivWithClass(
                "btn-group btn-group-vertical"
            )
            this.speedDiv.appendChild(this.getSpeedUpButton())
            this.speedDiv.appendChild(this.getSpeedDisplayField())
            this.speedDiv.appendChild(this.getSpeedDownButton())
        }
        return this.speedDiv
    }
    getSpeedUpButton() {
        if (!this.speedUpButton) {
            this.speedUpButton = DomHelper.createGlyphiconButton(
                "speedUp",
                "triangle-top",
                ev => {
                    getPlayer().increaseSpeed(0.05)
                    this.updateSpeed()
                }
            )
            this.speedUpButton.className += " btn-xs forcedThinButton"
        }
        return this.speedUpButton
    }
    updateSpeed() {
        this.getSpeedDisplayField().value =
            Math.round(getPlayer().playbackSpeed * 100) + "%"
    }
    getSpeedDisplayField() {
        if (!this.speedDisplay) {
            this.speedDisplay = DomHelper.createTextInput(
                ev => {
                    let newVal = Math.max(1, Math.min(1000, parseInt(ev.target.value)))
                    if (!isNaN(newVal)) {
                        ev.target.value = newVal + "%"
                        getPlayer().playbackSpeed = newVal / 100
                    }
                }, {
                    float: "none",
                    textAlign: "center"
                }, {
                    value: Math.floor(getPlayer().playbackSpeed * 100) + "%",
                    className: "forcedThinButton",
                    type: "text"
                }
            )
        }
        return this.speedDisplay
    }
    getSpeedDownButton() {
        if (!this.speedDownButton) {
            this.speedDownButton = DomHelper.createGlyphiconButton(
                "speedUp",
                "triangle-bottom",
                ev => {
                    getPlayer().increaseSpeed(-0.05)
                    this.updateSpeed()
                }
            )
            this.speedDownButton.className += " btn-xs forcedThinButton"
        }
        return this.speedDownButton
    }
    getTracksButton() {
        if (!this.tracksButton) {
            let onShowCallback = () => {
                //instrument of a track could theoretically change during the song.
                document
                    .querySelectorAll(".instrumentName")
                    .forEach(
                        el =>
                        (el.innerHTML = getPlayer().getCurrentTrackInstrument(
                            el.id.split("instrumentName")[1]
                        ))
                    )
            }
            this.tracksButton = DomHelper.createGlyphiconTextButton(
                "tracks",
                "align-justify",
                "Tracks"
            )
            this.tracksButton.onclick = this.getShowHideListener(
                this.getTrackMenuDiv(),
                this.tracksButton, //instrument of a track could theoretically change during the song.
                onShowCallback
            )
            DomHelper.addClassToElement("floatSpanLeft", this.tracksButton)
            DomHelper.addClassToElement("innerMenuDivButton", this.tracksButton)
        }
        return this.tracksButton
    }

    getMidiSetupButton() {
        if (!this.midiSetupButton) {
            this.midiSetupButton = DomHelper.createGlyphiconTextButton(
                "midiSetup",
                "tower",
                "Midi-Setup"
            )
            this.midiSetupButton.onclick = this.getShowHideListener(
                this.getMidiSetupDialog(),
                this.midiSetupButton
            )
            DomHelper.addClassToElement("floatSpanLeft", this.midiSetupButton)
            DomHelper.addClassToElement("innerMenuDivButton", this.midiSetupButton)
        }
        return this.midiSetupButton
    }

    getChannelsButton() {
        if (!this.channelsButton) {
            let channelMenuDiv = this.getChannelMenuDiv()
            this.channelsButton = DomHelper.createGlyphiconTextButton(
                "channels",
                "align-justify",
                "Channels"
            )
            this.channelsButton.onclick = this.getShowHideListener(
                this.getChannelMenuDiv(),
                this.channelsButton
            )
            DomHelper.addClassToElement("floatSpanLeft", this.channelsButton)
            DomHelper.addClassToElement("innerMenuDivButton", this.channelsButton)

            //Todo. decide what channel info to show...
            this.channelsButton.style.opacity = 0
        }
        return this.channelsButton
    }
    getChannelMenuDiv() {
        if (!this.channelMenuDiv) {
            this.channelMenuDiv = DomHelper.createDivWithId("trackContainerDiv")
            this.channelMenuDiv.style.display = "none"
            this.channelMenuDiv.style.top = this.getNavBar().style.height
            document.body.appendChild(this.channelMenuDiv)
        }
        return this.channelMenuDiv
    }

    hideAllDialogs() {
        // this.hideChannels()
        // this.hideMidiSetupDialog()
        // this.hideSettings()
        // this.hideLoadedSongsDiv()
        // this.hideTracks()
        // this.hideLoadedSongsDiv()
        document.querySelectorAll(".innerMenuDiv").forEach(el => {
            DomHelper.hideDiv(el)
        })

        document.querySelectorAll(".innerMenuDivButton").forEach(el => {
            el.classList.remove("selected")
        })
        this.allHidden = true

        DomHelper.hideDiv(this.getCloseInnerMenuDivButton())
    }

    getMainVolumeSlider() {
        if (!this.mainVolumeSlider) {
            this.mainVolumeSlider = DomHelper.createSliderWithLabel(
                "volumeMain",
                "Master Volume",
                getPlayer().volume,
                0,
                100,
                1,
                ev => {
                    if (getPlayer().volume == 0 && parseInt(ev.target.value) != 0) {
                        DomHelper.replaceGlyph(
                            this.getMuteButton(),
                            "volume-off",
                            "volume-up"
                        )
                        //this.getMuteButton().firstChild.className = this.muteButton.firstChild.className.replace('volume-off', 'volume-up')
                    }
                    getPlayer().volume = parseInt(ev.target.value)
                    if (getPlayer().volume <= 0) {
                        DomHelper.replaceGlyph(
                            this.getMuteButton(),
                            "volume-up",
                            "volume-off"
                        )
                    } else if (this.getMuteButton().innerHTML == "Unmute") {
                        DomHelper.replaceGlyph(
                            this.getMuteButton(),
                            "volume-off",
                            "volume-up"
                        )
                    }
                }
            )
        }
        return this.mainVolumeSlider
    }
    getMuteButton() {
        if (!this.muteButton) {
            this.muteButton = DomHelper.createGlyphiconButton(
                "mute",
                "volume-up",
                ev => {
                    this.mute()
                }
            )
        }
        return this.muteButton
    }
    mute() {
        if (getPlayer().muted) {
            getPlayer().muted = false
            if (!isNaN(getPlayer().mutedAtVolume)) {
                if (getPlayer().mutedAtVolume == 0) {
                    getPlayer().mutedAtVolume = 100
                }
                this.getMainVolumeSlider().slider.value = getPlayer().mutedAtVolume
                getPlayer().volume = getPlayer().mutedAtVolume
            }
            DomHelper.replaceGlyph(this.muteButton, "volume-off", "volume-up")
        } else {
            getPlayer().mutedAtVolume = getPlayer().volume
            getPlayer().muted = true
            getPlayer().volume = 0
            this.getMainVolumeSlider().slider.value = 0
            DomHelper.replaceGlyph(this.muteButton, "volume-up", "volume-off")
        }
    }

    getPlayButton() {
        if (!this.playButton) {
            this.playButton = DomHelper.createGlyphiconButton(
                "play",
                "play",
                this.clickPlay.bind(this)
            )
            DomHelper.addClassToElement("playControlButton", this.playButton)
        }
        return this.playButton
    }
    clickPlay(ev) {
        if (getPlayer().song) {
            DomHelper.removeClass("selected", this.getPauseButton())
            getPlayer().startPlay()
            DomHelper.addClassToElement("selected", this.playButton)
        }
    }
    getPauseButton() {
        if (!this.pauseButton) {
            this.pauseButton = DomHelper.createGlyphiconButton(
                "pause",
                "pause",
                this.clickPause.bind(this)
            )
            DomHelper.addClassToElement("playControlButton", this.pauseButton)
        }
        return this.pauseButton
    }
    clickPause(ev) {
        getPlayer().pause()
        DomHelper.removeClass("selected", this.getPlayButton())

        DomHelper.addClassToElement("selected", this.pauseButton)
    }

    getStopButton() {
        if (!this.stopButton) {
            this.stopButton = DomHelper.createGlyphiconButton(
                "stop",
                "stop",
                this.clickStop.bind(this)
            )

            DomHelper.addClassToElement("playControlButton", this.stopButton)
        }
        return this.stopButton
    }
    clickStop(ev) {
        getPlayer().stop()
        DomHelper.removeClass("selected", this.getPlayButton())
        DomHelper.removeClass("selected", this.getPauseButton())
    }
    resetTrackMenuDiv() {
        let menuDiv = this.getTrackMenuDiv()
        menuDiv.innerHTML = ""
        DomHelper.appendChildren(menuDiv, createTrackDivs())
    }
    newSongCallback() {
        this.hideAllDialogs()
        this.resetTrackMenuDiv()
        this.clickStop()
        this.songUI.newSongCallback(getCurrentSong())
        if (
            getCurrentSong() &&
            getCurrentSong().activeTracks.length > 2 &&
            getSetting("enableSheet")
        ) {
            Notification.create(
                "Only the first 2 tracks of this song are shown as sheet music. You can enable other tracks in the Tracks-Menu.",
                5000
            )
            new ElementHighlight(this.getTracksButton(), 5000)
        }
    }

    getMidiSetupDialog() {
        if (!this.midiSetupDialog) {
            this.midiSetupDialog = DomHelper.createDivWithIdAndClass(
                "midiSetupDialog",
                "innerMenuDiv"
            )
            DomHelper.hideDiv(this.midiSetupDialog)

            let textMsg = getMidiHandler().noMIDISupport ?
                "Your browser does not support WebMIDI. Check <a href='https://developer.mozilla.org/en-US/docs/Web/API/MIDIAccess#browser_compatibility'>here</a> to see which browser support it. As of March 21 it's only supported by Chrome and Edge." :
                "Choose MIDI Device: "

            let text = DomHelper.createDivWithClass(
                "centeredBigText", {
                    marginTop: "25px"
                }, {
                    innerHTML: textMsg
                }
            )

            this.midiSetupDialog.appendChild(text)

            this.inputDevicesDiv = DomHelper.createDivWithClass("halfContainer")
            this.outputDevicesDiv = DomHelper.createDivWithClass("halfContainer")
            this.midiSetupDialog.appendChild(this.inputDevicesDiv)
            this.midiSetupDialog.appendChild(this.outputDevicesDiv)
        }
        if (!getMidiHandler().noMIDISupport) {
            let inputDevices = getMidiHandler().getAvailableInputDevices()
            if (inputDevices.length == 0) {
                this.inputDevicesDiv.innerHTML = "No MIDI input-devices found."
            } else {
                this.inputDevicesDiv.innerHTML = ""
                let inputTitle = DomHelper.createElementWithClass("row", "span")
                inputTitle.innerHTML = "Input: "
                this.inputDevicesDiv.appendChild(inputTitle)
                inputDevices.forEach(device => {
                    this.inputDevicesDiv.appendChild(this.createDeviceDiv(device))
                })
            }

            let outputDevices = getMidiHandler().getAvailableOutputDevices()
            if (outputDevices.length == 0) {
                this.outputDevicesDiv.innerHTML = "No MIDI output-devices found."
            } else {
                this.outputDevicesDiv.innerHTML = ""
                let outputTitle = DomHelper.createDivWithClass("row")
                outputTitle.innerHTML = "Output: "
                this.outputDevicesDiv.appendChild(outputTitle)
                outputDevices.forEach(device => {
                    this.outputDevicesDiv.appendChild(this.createOutputDeviceDiv(device))
                })
            }
        }
        return this.midiSetupDialog
    }
    createDeviceDiv(device) {
        let deviceDiv = DomHelper.createTextButton(
            "midiInDeviceDiv" + device.id,
            device.name,
            () => {
                if (deviceDiv.classList.contains("selected")) {
                    DomHelper.removeClass("selected", deviceDiv)
                    getMidiHandler().clearInput(device)
                } else {
                    DomHelper.addClassToElement("selected", deviceDiv)
                    getMidiHandler().addInput(device)
                }
            }
        )
        if (getMidiHandler().isDeviceActive(device)) {
            DomHelper.addClassToElement("selected", deviceDiv)
        }

        return deviceDiv
    }
    createOutputDeviceDiv(device) {
        let deviceDiv = DomHelper.createTextButton(
            "midiOutDeviceDiv" + device.id,
            device.name,
            () => {
                if (deviceDiv.classList.contains("selected")) {
                    DomHelper.removeClass("selected", deviceDiv)
                    getMidiHandler().clearOutput(device)
                } else {
                    DomHelper.addClassToElement("selected", deviceDiv)
                    getMidiHandler().addOutput(device)
                }
            }
        )
        if (getMidiHandler().isOutputDeviceActive(device)) {
            document
                .querySelectorAll(".midiOutDeviceDiv")
                .forEach(el =>
                    el.classList.contains("selected") ?
                    el.classList.remove("selected") :
                    null
                )
            DomHelper.addClassToElement("selected", deviceDiv)
        }
        deviceDiv.classList.add("midiOutDeviceDiv")

        return deviceDiv
    }
    getCloseInnerMenuDivButton() {
        if (!this.closeInnerMenuButton) {
            this.closeInnerMenuButton = DomHelper.createElementWithClass("")
            this.closeInnerMenuButton.id = "innerMenuCloser"
            this.closeInnerMenuButton.innerHTML = "Close"
            this.closeInnerMenuButton.onclick = () => this.hideAllDialogs()
            DomHelper.hideDiv(this.closeInnerMenuButton)
        }

        return this.closeInnerMenuButton
    }
    getTrackMenuDiv() {
        if (!this.trackMenuDiv) {
            this.trackMenuDiv = DomHelper.createDivWithIdAndClass(
                "trackContainerDiv",
                "innerMenuDiv"
            )

            DomHelper.hideDiv(this.trackMenuDiv)
        }
        return this.trackMenuDiv
    }

    getSandwichMenuButton() {
        if (this.sandwichMenuBtn == null) {
            this.sandwichMenuBtn = DomHelper.createGlyphiconButton(
                "sandwichMenu",
                "list"
            )
            this.sandwichMenuBtn.onclick = this.getShowHideListener(
                this.getSandwichMenu(),
                this.sandwichMenuBtn
            )
            this.sandwichMenuBtn.classList.add("innerMenuDivButton")
            this.sandwichMenuBtn.classList.add("playControlButton")
        }
        return this.sandwichMenuBtn
    }

    getSandwichMenu() {
        if (this.sandwichMenu == null) {
            this.sandwichMenu = DomHelper.createDivWithClass(
                "sandwichMenu innerMenuDiv hidden"
            )
            let swBtns = [
                this.getSandwichLoadSongButton(),
                this.getSandwichLoadedSongsButton(),
                this.getSandwichMidiSetupButton(),
                this.getSandwichTracksButton(),
                this.getSandwichMuteButton(),
                this.getSandwichFullscreenButton(),
                this.getSandwichSettingsButton()
            ]
            swBtns.forEach(btn => btn.classList.add("sandwichButton"))
            DomHelper.appendChildren(this.sandwichMenu, swBtns)
        }
        return this.sandwichMenu
        //Upload
        //Songs
        //Tracks
        //MIDI_Setup
        //Speed
        //Volume
        //fullscreen
        //Settings
    }

    getSandwichLoadSongButton() {
        if (!this.swLoadSongButton) {
            this.swLoadSongButton = DomHelper.createFileInput(
                "Upload MIDI",
                this.handleFileSelect.bind(this)
            )
            DomHelper.addClassToElement("floatSpanLeft", this.swLoadSongButton)
        }
        return this.swLoadSongButton
    }
    getSandwichLoadedSongsButton() {
        if (!this.swLoadedSongsButton) {
            this.swLoadedSongsButton = DomHelper.createGlyphiconTextButton(
                "swsongsBtn",
                "music",
                "Songs"
            )
            this.swLoadedSongsButton.onclick = this.getShowHideListener(
                this.getLoadedSongsDiv(),
                this.swLoadedSongsButton
            )
            DomHelper.addClassToElement("floatSpanLeft", this.swLoadedSongsButton)
            DomHelper.addClassToElement(
                "innerMenuDivButton",
                this.swLoadedSongsButton
            )
        }
        return this.swLoadedSongsButton
    }
    getSandwichMidiSetupButton() {
        if (!this.swMidiSetupButton) {
            this.swMidiSetupButton = DomHelper.createGlyphiconTextButton(
                "swmidiSetup",
                "tower",
                "Midi-Setup"
            )
            this.swMidiSetupButton.onclick = this.getShowHideListener(
                this.getMidiSetupDialog(),
                this.swMidiSetupButton
            )
            DomHelper.addClassToElement("floatSpanLeft", this.swMidiSetupButton)
            DomHelper.addClassToElement("innerMenuDivButton", this.swMidiSetupButton)
        }
        return this.swMidiSetupButton
    }
    getSandwichTracksButton() {
        if (!this.swTracksButton) {
            this.swTracksButton = DomHelper.createGlyphiconTextButton(
                "swtracks",
                "align-justify",
                "Tracks"
            )
            this.swTracksButton.onclick = this.getShowHideListener(
                this.getTrackMenuDiv(),
                this.swTracksButton
            )
            DomHelper.addClassToElement("floatSpanLeft", this.swTracksButton)
            DomHelper.addClassToElement("innerMenuDivButton", this.swTracksButton)
        }
        return this.swTracksButton
    }
    getSandwichFullscreenButton() {
        if (!this.swFullscreenButton) {
            this.fullscreen = false
            let clickFullscreen = () => {
                if (!this.fullscreen) {
                    document.body.requestFullscreen()
                } else {
                    document.exitFullscreen()
                }
            }
            this.swFullscreenButton = DomHelper.createGlyphiconTextButton(
                "fullscreenButton",
                "fullscreen",
                "Fullscreen",
                clickFullscreen.bind(this)
            )
            let fullscreenSwitch = () => (this.fullscreen = !this.fullscreen)
            document.body.onfullscreenchange = fullscreenSwitch.bind(this)
        }
        return this.swFullscreenButton
    }
    getSandwichSettingsButton() {
        if (!this.swSettingsButton) {
            this.swSettingsButton = DomHelper.createGlyphiconTextButton(
                "settingsButton",
                "cog",
                "Settings"
            )
            this.swSettingsButton.onclick = this.getShowHideListener(
                this.getSettingsDiv(),
                this.swSettingsButton
            )

            DomHelper.addClassToElement("innerMenuDivButton", this.swSettingsButton)
        }
        return this.swSettingsButton
    }

    getSandwichMuteButton() {
        if (!this.swMuteButton) {
            this.swMuteButton = DomHelper.createGlyphiconTextButton(
                "mute",
                "volume-up",
                "Mute",
                ev => {
                    if (getPlayer().muted) {
                        getPlayer().muted = false
                        if (!isNaN(getPlayer().mutedAtVolume)) {
                            if (getPlayer().mutedAtVolume == 0) {
                                getPlayer().mutedAtVolume = 100
                            }
                            this.getMainVolumeSlider().slider.value =
                                getPlayer().mutedAtVolume
                            getPlayer().volume = getPlayer().mutedAtVolume
                        }
                        DomHelper.replaceGlyph(
                            this.getMuteButton(),
                            "volume-up",
                            "volume-off"
                        )
                    } else {
                        getPlayer().mutedAtVolume = getPlayer().volume
                        getPlayer().muted = true
                        getPlayer().volume = 0
                        this.getMainVolumeSlider().slider.value = 0
                        DomHelper.replaceGlyph(
                            this.getMuteButton(),
                            "volume-up",
                            "volume-off"
                        )
                    }
                }
            )
        }
        return this.swMuteButton
    }
}

export const hideAllDialogs = () => {
    document.querySelectorAll(".innerMenuDiv").forEach(el => {
        DomHelper.hideDiv(el)
    })

    document.querySelectorAll(".innerMenuDivButton").forEach(el => {
        el.classList.remove("selected")
    })

    DomHelper.hideDiv(document.querySelector("#innerMenuCloser"))
}

export const createListGroupDiv = (listName, itemList, createDivFunc) => {
    let cont = DomHelper.createDivWithClass(
        "settingsGroupContainer innerMenuContDiv collapsable"
    )
    if (listName != "default") {
        cont.classList.add("collapsed")
        let label = DomHelper.createElementWithClass(
            "settingsLabel settingsGroupLabel clickableTitle dottedBg",
            "div", {}, {}
        )
        cont.appendChild(label)

        let collapsed = true
        let glyph = DomHelper.getGlyphicon("menu-right")
        glyph.classList.add("rightGlyphSpan")
        glyph.classList.add("collapser")
        let txt = DomHelper.createElement("div")
        txt.innerHTML = listName + ":"
        label.appendChild(txt)
        label.appendChild(glyph)

        label.onclick = e => {
            e.stopPropagation()
            if (collapsed == true) {
                collapsed = false
                cont.classList.remove("collapsed")
            } else {
                collapsed = true
                cont.classList.add("collapsed")
            }
        }
    }

    itemList
        .filter(listItem => !listItem.hidden)
        .forEach((listItem, i) => {
            if (listItem.hasOwnProperty("piece")) {
                let pieceCont = DomHelper.createDivWithClass("innerMenuSubContDiv")
                let pieces = listItem.pieces
                let label = DomHelper.createDivWithClass("menuSubLabel")
                label.innerHTML = listItem.piece
                pieceCont.appendChild(label)
                pieces.forEach(piece => {
                    let div = createDivFunc(piece)
                    listItem.div = div

                    pieceCont.appendChild(div)
                })
                cont.appendChild(pieceCont)
            } else {
                let div = createDivFunc(listItem)
                listItem.div = div

                cont.appendChild(div)
            }
        })
    return cont
}