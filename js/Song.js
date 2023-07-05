import {
    CONST
} from "./data/CONST.js"
import {
    getSetting
} from "./settings/Settings.js"
import {
    SheetGenerator
} from "./sheet/SheetGenerator.js"
import {
    getLoader
} from "./ui/Loader.js"
export class Song {
    constructor(opts) {
        this.fileName = opts.fileName
        this.name = opts.name || opts.fileName
        this.copyright = opts.copyright || ""
        this.onready = opts.onready
        this.piece = opts.piece || false
        this.artist = opts.artist || false
        this.text = []
        this.timeSignatures
        this.keySignatures
        this.notesBySeconds = {}
        this.controlEvents = []
        this.temporalData = opts.midiData.temporalData
        this.sustainsByChannelAndSecond =
            opts.midiData.temporalData.sustainsByChannelAndSecond

        this.header = opts.midiData.header
        this.tracks = opts.midiData.tracks
        this.markers = []
        this.otherTracks = []
        this.activeTracks = []
        this.microSecondsPerBeat = 10
        this.channels = this.getDefaultChannels()
        this.idCounter = 0
        this.isLoaded = true

        this.processEvents(opts.midiData)
    }
    clear() {}
    getStart() {
        return this.getNoteSequence()[0].timestamp
    }
    getEnd() {
        if (!this.end) {
            let noteSequence = this.getNoteSequence().sort(
                (a, b) => a.offTime - b.offTime
            )
            let lastNote = noteSequence[noteSequence.length - 1]
            this.end = lastNote.offTime
        }
        return this.end
    }
    getOffset() {
        if (!this.smpteOffset) {
            return 0 //
        } else {
            return (
                ((this.smpteOffset.hour * 60 + this.smpteOffset.min) * 60 +
                    this.smpteOffset.sec) *
                1000
            )
        }
    }
    getMeasureLines() {
        if (!this.measureLines) {
            this.setMeasureLines()
        }
        return this.measureLines
    }
    getTimeSignature(time) {
        //TODO handle multple timesignature within a song
        if (this.timeSignatures.length) {
            return this.timeSignatures[0]
        }
        return {
            numerator: 4,
            denominator: 4,
            thirtySeconds: 8
        }
    }
    getKeySignature(time) {
        if (this.keySignatures.length) {
            return this.keySignatures[0]
        }
        return {
            scale: 0,
            key: 0
        }
    }
    setMeasureLines() {
        let timeSignature = this.getTimeSignature()

        let numerator = timeSignature.numerator || 4
        let denominator = timeSignature.denominator || 4
        let thirtySeconds = timeSignature.thirtyseconds || 8

        let beatsToSkip = numerator * (4 / denominator)
        // let beatsPerMeasure = numerator / (denominator * (thirtySeconds / 32))

        let skippedBeats = beatsToSkip - 1
        this.measureLines = {}
        let lastBeatTime = 0
        Object.keys(this.temporalData.beatsBySecond).forEach(second => {
            this.temporalData.beatsBySecond[second].forEach(beat => {
                let beatDuration = beat[0] - lastBeatTime
                lastBeatTime = beat[0]
                if (skippedBeats < beatsToSkip - 1) {
                    skippedBeats++
                    return
                }
                skippedBeats -= beatsToSkip - 1

                let adjust = skippedBeats != 0 ? skippedBeats * beatDuration : 0
                let beatSecond = Math.floor((beat[0] - adjust) / 1000)

                //dont count beats that come after the last note.
                if (beat[0] < this.getEnd()) {
                    if (!this.measureLines.hasOwnProperty(beatSecond)) {
                        this.measureLines[beatSecond] = []
                    }
                    this.measureLines[beatSecond].push([
                        beat[0] - adjust,
                        Math.floor(beat[1] / beatsToSkip) + 1
                    ])
                }
            })
        })
    }
    setSustainPeriods() {
        this.sustainPeriods = []

        for (let channel in this.sustainsByChannelAndSecond) {
            let isOn = false
            for (let second in this.sustainsByChannelAndSecond[channel]) {
                this.sustainsByChannelAndSecond[channel][second].forEach(sustain => {
                    if (isOn) {
                        if (!sustain.isOn) {
                            isOn = false
                            this.sustainPeriods[this.sustainPeriods.length - 1].end =
                                sustain.timestamp
                        }
                    } else {
                        if (sustain.isOn) {
                            isOn = true
                            this.sustainPeriods.push({
                                start: sustain.timestamp,
                                value: sustain.value,
                                channel: channel
                            })
                        }
                    }
                })
            }
        }
    }
    getMicrosecondsPerBeat() {
        return this.microSecondsPerBeat
    }
    getBPM(time) {
        for (let i = this.temporalData.bpms.length - 1; i >= 0; i--) {
            if (this.temporalData.bpms[i].timestamp < time) {
                return this.temporalData.bpms[i].bpm
            }
        }
    }

    getNotes(from, to) {
        let secondStart = Math.floor(from)
        let secondEnd = Math.floor(to)
        let notes = []
        for (let i = secondStart; i < secondEnd; i++) {
            for (let track in this.activeTracks) {
                if (this.activeTracks[track].notesBySeconds.hasOwnProperty(i)) {
                    for (let n in this.activeTracks[track].notesBySeconds[i]) {
                        let note = this.activeTracks[track].notesBySeconds[i][n]
                        if (note.timestamp > from) {
                            notes.push(note)
                        }
                    }
                }
            }
        }
        return notes
    }
    parseAllControlEvents() {
        this.tracks.forEach(track => {
            track.forEach(event => {
                if (event.type == "controller" && event.controllerType == 7) {
                    if (!this.controlEvents.hasOwnProperty(
                            Math.floor(event.timestamp / 1000)
                        )) {
                        this.controlEvents[Math.floor(event.timestamp / 1000)] = []
                    }
                    this.controlEvents[Math.floor(event.timestamp / 1000)].push(event)
                }
            })
        })
    }
    getAllInstruments() {
        let instruments = {}
        this.controlEvents = {}

        this.tracks.forEach(track => {
            this.getAllInstrumentsOfTrack(track).forEach(
                instrumentId => (instruments[instrumentId] = true)
            )
        })
        return Object.keys(instruments)
    }
    getAllInstrumentsOfTrack(track) {
        let instruments = {}
        let programs = {}
        track.forEach(event => {
            let channel = event.channel

            if (event.type == "programChange") {
                programs[channel] = event.programNumber
            }

            if (event.type == "noteOn" || event.type == "noteOff") {
                if (channel != 9) {
                    let program = programs[channel]
                    let instrument =
                        CONST.INSTRUMENTS.BY_ID[isFinite(program) ? program : channel]
                    instruments[instrument.id] = true
                    event.instrument = instrument.id
                } else {
                    instruments["percussion"] = true
                    event.instrument = "percussion"
                }
            }
        })
        return Object.keys(instruments)
    }
    processEvents(midiData) {
        midiData.trackInstruments = {}
        midiData.tracks.forEach((track, trackIndex) => {
            midiData.trackInstruments[trackIndex] =
                this.getAllInstrumentsOfTrack(track)
        })
        let songWorker = new Worker("./js/SongWorker.js")
        songWorker.onmessage = ev => {
            let dat = JSON.parse(ev.data)
            this.sustainPeriods = dat.sustainPeriods
            this.activeTracks = dat.activeTracks
            this.otherTracks = dat.otherTracks
            this.longNotes = dat.longNotes
            this.controlEvents = dat.controlEvents
            this.text = dat.otherParams.text
            this.markers = dat.otherParams.markers
            this.timeSignatures = dat.otherParams.timeSignatures
            this.keySignatures = dat.otherParams.keySignatures
            this.smpteOffset = dat.otherParams.smpteOffset

            this.ready = true
            this.getMeasureLines()
            this.onready(this)
            if (getSetting("enableSheet")) this.generateSheet()
            //TODO wait for/modify Vexflow to be able to run in worker
            // let sheetGenWorker = new Worker("./js/SheetGenWorker.js")
            // sheetGenWorker.onmessage = ev => {
            // 	console.log(ev)
            // }
            // sheetGenWorker.postMessage(
            // 	JSON.stringify({
            // 		tracks: this.activeTracks,
            // 		measuresBySecond: this.getMeasureLines(),
            // 		numerator: this.getTimeSignature().numerator,
            // 		denominator: this.getTimeSignature().denominator,
            // 		keySignatureName:
            // 			CONST.MIDI_TO_VEXFLOW_KEYS[
            // 				this.getKeySignature().scale == 0 ? "MAJOR" : "MINOR"
            // 			][this.getKeySignature().key],
            // 		end: this.getEnd(),
            // 		isScroll: getSetting("sheetMeasureScroll"),
            // 		windowWidth: window.innerWidth,
            // 		midiNoteToKey: CONST.MIDI_NOTE_TO_KEY
            // 	})
            // )
        }
        songWorker.onerror = e => {
            console.error(e)
        }
        songWorker.postMessage(JSON.stringify(midiData))
    }
    getName() {
        let str = ""
        if (this.piece) {
            return this.piece + " - " + this.name
        }
        return this.name
    }
    getArtist() {
        return this.artist || ""
    }
    async generateSheet() {
        getLoader().startLoad()

        getLoader().setLoadMessage("Generating Sheet from MIDI")

        await this.getSheet()
    }
    async getSheet() {
        if (this.sheetGen) {
            this.sheetGen.clear()
            this.sheetGen = null
        }
        if (!this.sheetGen) {
            this.sheetGen = new SheetGenerator(
                this.getMeasureLines(),
                this.getTimeSignature().numerator,
                this.getTimeSignature().denominator,
                this.getKeySignature(),
                this.getEnd()
            )
        }
        await this.sheetGen
            .generate(this.activeTracks)
            .then(() => getLoader().stopLoad())
    }

    distributeEvents(track, newTrack) {
        track.forEach(event => {
            event.id = this.idCounter++
                if (event.type == "noteOn" || event.type == "noteOff") {
                    newTrack.notes.push(event)
                } else
            if (event.type == "setTempo") {
                newTrack.tempoChanges.push(event)
            } else if (event.type == "trackName") {
                newTrack.name = event.text
            } else if (event.type == "text") {
                this.text.push(event.text)
            } else if (event.type == "timeSignature") {
                this.timeSignatures.push(event)
            } else if (event.type == "keySignature") {
                newTrack.keySignature = event
                this.keySignatures.push(event)
            } else if (event.type == "smpteOffset") {
                this.smpteOffset = event
            } else if (event.type == "marker") {
                this.markers.push(event)
            } else {
                newTrack.meta.push(event)
            }
        })
    }

    setNotesBySecond(track) {
        track.notes.forEach(note => {
            let second = Math.floor(note.timestamp / 1000)
            if (track.notesBySeconds.hasOwnProperty(second)) {
                track.notesBySeconds[second].push(note)
            } else {
                track.notesBySeconds[second] = [note]
            }
        })
    }
    getNoteSequence() {
        if (!this.notesSequence) {
            let tracks = []
            for (let t in this.activeTracks)[tracks.push(this.activeTracks[t].notes)]

            this.noteSequence = [].concat
                .apply([], tracks)
                .sort((a, b) => a.timestamp - b.timestamp)
        }
        return this.noteSequence.slice(0)
    }
    getNoteRange() {
        let seq = this.getNoteSequence()
        let min = 87
        let max = 0
        seq.forEach(note => {
            if (note.noteNumber > max) {
                max = note.noteNumber
            }
            if (note.noteNumber < min) {
                min = note.noteNumber
            }
        })
        return {
            min,
            max
        }
    }
    setNoteSustainTimestamps(notes) {
        for (let i = 0; i < notes.length; i++) {
            let note = notes[i]
            let currentSustains = this.sustainPeriods
                .filter(period => period.channel == note.channel)
                .filter(
                    period =>
                    (period.start < note.timestamp && period.end > note.timestamp) ||
                    (period.start < note.offTime && period.end > note.offTime)
                )
            if (currentSustains.length) {
                note.sustainOnTime = currentSustains[0].start
                let end = Math.max.apply(
                    null,
                    currentSustains.map(sustain => sustain.end)
                )
                note.sustainOffTime = end
                note.sustainDuration = note.sustainOffTime - note.timestamp
            }
        }
    }

    setNoteOffTimestamps(notes) {
        for (let i = 0; i < notes.length; i++) {
            let note = notes[i]
            if (note.type == "noteOn") {
                Song.findOffNote(i, notes.slice(0))
            }
        }
    }

    static findOffNote(index, notes) {
        let onNote = notes[index]
        for (let i = index + 1; i < notes.length; i++) {
            if (
                notes[i].type == "noteOff" &&
                onNote.noteNumber == notes[i].noteNumber
            ) {
                onNote.offTime = notes[i].timestamp
                onNote.offVelocity = notes[i].velocity
                onNote.duration = onNote.offTime - onNote.timestamp

                break
            }
        }
    }

    getDefaultChannels() {
        let channels = {}
        for (var i = 0; i <= 15; i++) {
            channels[i] = {
                instrument: i,
                pitchBend: 0,
                volume: 127,
                volumeControl: 50,
                mute: false,
                mono: false,
                omni: false,
                solo: false
            }
        }
        channels[9].instrument = -1
        return channels
    }
}