import {
    FileLoader
} from "../player/FileLoader.js"
import {
    getCurrentSong,
    getPlayer
} from "../player/Player.js"
import {
    deleteSongInDb,
    getSongFromDb
} from "../settings/IndexDbHandler.js"
import {
    formatTime,
    replaceAllString
} from "../Util.js"
import {
    ConfirmDialog
} from "./ConfirmDialog.js"
import {
    DomHelper
} from "./DomHelper.js"
import {
    getLoader
} from "./Loader.js"
import {
    createListGroupDiv
} from "./UI.js"

export class SongUI {
    constructor() {
        this.songDivs = {}
        this.wrapper = DomHelper.createDiv()
    }
    getDivContent() {
        return this.wrapper
    }
    setExampleSongs(jsonSongs, loadFirstSongWhenReady) {
        let artists = {
            default: []
        }
        let counter = Math.floor(Math.random() * jsonSongs.length)
        jsonSongs.forEach(song => {
            if (song.hasOwnProperty("pieces")) {
                let group = song
                group.pieces.forEach(piece => {
                    piece.piece = group.piece
                    piece.artist = group.artist
                })
            }
            if (song.hasOwnProperty("artist")) {
                if (!artists.hasOwnProperty(song.artist)) {
                    artists[song.artist] = []
                }
                artists[song.artist].push(song)
            } else {
                artists.default.push(song)
            }
        })
        Object.keys(artists).forEach(artistKey => {
            let isChosen = false
            let groupDiv = createListGroupDiv(artistKey, artists[artistKey], song => {
                let songDiv = createSongDiv(song, false, false)
                this.songDivs[song.fileName] = songDiv

                if (--counter == 0) {
                    songDiv.button.click()
                    isChosen = true
                }
                return songDiv.wrapper
            })
            if (isChosen) {
                groupDiv.classList.remove("collapsed")
            }
            this.wrapper.appendChild(groupDiv)
        })
    }
    setDbSongs(dbSongs) {
        let groupDiv = createListGroupDiv("Uploaded Songs", dbSongs, song => {
            let songDiv = createSongDiv(song, false, true)
            this.songDivs[song.fileName] = songDiv

            return songDiv.wrapper
        })
        this.wrapper.appendChild(groupDiv)
    }
    addDBSong(songDbObj) {
        let songDivObj = createSongDiv(songDbObj, false, true)
        this.songDivs[songDbObj.fileName] = songDivObj
        this.wrapper.appendChild(songDivObj.wrapper)
    }
    newSongCallback(song) {
        DomHelper.removeClassFromElementsSelector(".songButton", "selected")
        if (this.songDivs.hasOwnProperty(song.fileName)) {
            song.div = this.songDivs[song.fileName]

            showInfoButton(song.div.button, song)
            DomHelper.addClassToElement(
                "selected",
                song.div.wrapper.querySelector(".songButton")
            )
        } else {
            let songDivObj = createSongDiv(song, true, false)
            this.songDivs[song.fileName] = songDivObj
            this.wrapper.appendChild(songDivObj.wrapper)
        }
    }
}

function showInfoButton(button, songObj) {
    document.querySelectorAll(".infoGlyph").forEach(el => DomHelper.hideDiv(el))
    let glyph = button.querySelector("span.glyphicon-info-sign")
    glyph.onclick = e => {
        e.stopPropagation()
        e.preventDefault()
        openSongInfo(songObj)
    }
    DomHelper.showDiv(glyph)
}

function createSongDiv(songObj, isLoaded, isFromDb) {
    let wrapper = DomHelper.createDivWithIdAndClass(
        "songWrap" + replaceAllString(songObj.fileName, " ", "_"),
        "innerMenuContDiv"
    )
    let button = DomHelper.createDivWithClass("settingsLabel songButton")
    let txt = DomHelper.createDivWithClass("songNameLabel")
    txt.innerHTML = songObj.name || songObj.fileName
    button.appendChild(txt)
    let btnGrp = DomHelper.createDivWithClass("glyphHolder")

    if (isFromDb) {
        let deleteGlyph = DomHelper.getGlyphicon("trash")
        DomHelper.addClassToElement("rightGlyphSpan", deleteGlyph)
        DomHelper.addClassToElement("hidden", deleteGlyph)
        btnGrp.appendChild(deleteGlyph)
        deleteGlyph.onclick = e => {
            e.stopPropagation()
            e.preventDefault()
            ConfirmDialog.create(
                "Delete  " + songObj.fileName + " from your Browser?",
                () => {
                    wrapper.parentNode.removeChild(wrapper)
                    deleteSongInDb(songObj.fileName)
                }
            )
        }
        DomHelper.showDiv(deleteGlyph)
    }

    let infoGlyph = DomHelper.getGlyphicon("info-sign")
    DomHelper.addClassToElement("rightGlyphSpan", infoGlyph)
    DomHelper.addClassToElement("infoGlyph", infoGlyph)
    DomHelper.addClassToElement("hidden", infoGlyph)
    btnGrp.appendChild(infoGlyph)
    if (isLoaded) {
        infoGlyph.onclick = e => {
            e.stopPropagation()
            e.preventDefault()
            openSongInfo(songObj)
        }
        DomHelper.showDiv(infoGlyph)
    }
    button.appendChild(btnGrp)
    button.appendChild(DomHelper.getButtonSelectLine())

    button.onclick = e => {
        if (e.target == infoGlyph) return
        if (!button.classList.contains("selected")) {
            DomHelper.addClassToElement("selected", button)
            loadSongButtonClickCallback(songObj, isFromDb)
        }
    }

    wrapper.appendChild(button)
    if (isLoaded) {
        songObj.div = button
    }

    return {
        wrapper: wrapper,
        name: songObj.name,
        button: button
    }
}

function loadSongButtonClickCallback(song, isFromDb) {
    if (song.isLoaded) {
        let currentSong = getCurrentSong()
        if (currentSong != song) {
            DomHelper.removeClassFromElementsSelector(".songButton", "selected")
            DomHelper.addClassToElement("selected", song.div.wrapper)
            getPlayer().setSong(song)
        }
    } else {
        getLoader().startLoad()
        getLoader().setLoadMessage("Downloading Song")
        if (isFromDb) {
            getSongFromDb(song.fileName).then(request => {
                request.onsuccess = evt => {
                    getPlayer().loadSong(evt.target.result.song, song)
                }
                request.onerror = evt => {
                    console.log(evt.target.error)
                }
            })
        } else {
            FileLoader.loadSongFromURL(
                getSongUrl(song),
                respone => {
                    getPlayer().loadSong(respone, song)
                },
                song.name
            )
        }
    }
}

function getSongUrl(song) {
    return `/exampleSongs/piano-midi/${song.fileName}`
    // `https://bewelge.github.io/piano-midi.de-Files/midi/${song.fileName}?raw=true`
}

function openSongInfo(songObj) {
    let songWrap = DomHelper.createDivWithClass("songInfoWrapper")

    let title = DomHelper.createDivWithClass("songInfoTitle")
    title.innerHTML = songObj.name
    songWrap.appendChild(title)
    let infoRows = {
        "File name": songObj.fileName,
        Duration: formatTime(songObj.getEnd() / 1000, true),
        Tracks: {},
        Header: {
            "Number of Tracks": songObj.header.numTracks,
            Format: songObj.header.format,
            "Ticks per beat": songObj.header.ticksPerBeat
        }
    }

    songObj.timeSignatures.forEach((timeSignature, index) => {
        infoRows["Time Signature" + index] = {
            Numerator: timeSignature.numerator,
            Denominator: timeSignature.denominator,
            Thirtyseconds: timeSignature.thirtyseconds,
            Metronome: timeSignature.metronome
        }
    })
    if (songObj.keySignature) {
        infoRows["Key Signature"] = {
            Key: songObj.keySignature.key,
            Scale: songObj.keySignature.scale
        }
    }
    if (songObj.markers.length) {
        infoRows.Markers = {}
    }
    songObj.markers
        .sort((a, b) => a.timestamp - b.timestamp)
        .forEach(
            marker =>
            (infoRows.Markers[marker.text] = formatTime(
                marker.timestamp / 1000,
                true
            ))
        )
    if (songObj.text) {
        infoRows.Texts = {}
    }
    songObj.text.forEach((text, index) => (infoRows.Texts[index] = text))
    for (let trackIndex in songObj.activeTracks) {
        infoRows.Tracks[songObj.activeTracks[trackIndex].name] =
            songObj.activeTracks[trackIndex].notes.length + " notes"
    }
    for (let trackIndex in songObj.otherTracks) {
        infoRows.Tracks[songObj.otherTracks[trackIndex].name] = 0 + " notes"
    }

    for (let infoRowName in infoRows) {
        let row = DomHelper.createDivWithClass("songInfoRow")
        row.innerHTML = infoRowName + ": "
        if (typeof infoRows[infoRowName] == "object") {
            songWrap.appendChild(row)
            for (let indentenRowName in infoRows[infoRowName]) {
                let indentedRow = DomHelper.createDivWithClass("songInfoRowIndented")
                indentedRow.innerHTML = indentenRowName
                let indentenRowSpan = DomHelper.createDivWithClass("songInfoRowSpan")
                indentenRowSpan.innerHTML = infoRows[infoRowName][indentenRowName]
                indentedRow.appendChild(indentenRowSpan)
                songWrap.appendChild(indentedRow)
            }
        } else {
            let rowSpawn = DomHelper.createDivWithClass("songInfoRowSpan")
            rowSpawn.innerHTML = infoRows[infoRowName]
            row.appendChild(rowSpawn)
            songWrap.appendChild(row)
        }
    }

    document.body.appendChild(songWrap)

    let closeListener = ev => {
        if (
            ev.target != songWrap &&
            !ev.target.classList.contains("songInfoRowIndented") &&
            !ev.target.classList.contains("songInfoRow") &&
            !ev.target.classList.contains("songInfoWrapper") &&
            !ev.target.classList.contains("songInfoTitle") &&
            !ev.target.classList.contains("songInfoRowSpan")
        ) {
            songWrap.parentNode.removeChild(songWrap)
            window.removeEventListener("click", closeListener)
        }
    }
    window.addEventListener("click", closeListener)
    // let title = DomHelper.createDivWithClass("songInfoTitle")
}