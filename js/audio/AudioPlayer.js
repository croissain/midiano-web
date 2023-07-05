import {
    getTrack,
    getTracks
} from "../player/Tracks.js"
import {
    getSetting,
    setSettingCallback
} from "../settings/Settings.js"
import {
    SoundfontLoader
} from "../SoundfontLoader.js"
import {
    getLoader
} from "../ui/Loader.js"
import {
    createContinuousAudioNote,
    createCompleteAudioNote
} from "./AudioNote.js"
import {
    getBufferForNote,
    hasBuffer
} from "./Buffers.js"

export class AudioPlayer {
    constructor() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext

        this.context = new AudioContext()
        this.buffers = {}
        this.audioNotes = []
        this.soundfontName = "MusyngKite"
        this.convolverNode = this.context.createConvolver()

        this.loadMetronomeSounds()

        if (getSetting("enableReverb")) {
            this.reverbEnabled = true
            this.setReverb()
        }
        // this.loadImpulseBuffer("../../Reverb/SquareVictoriaDome.wav").then(
        // 	result => {
        // 		this.impulseBuffer = result
        // 	}
        // )

        setSettingCallback("reverbImpulseResponse", this.setReverb.bind(this))
        setSettingCallback("enableReverb", () => {
            this.reverbEnabled = getSetting("enableReverb")
            if (this.reverbEnabled) {
                this.getConvolver().buffer = null
                this.setReverb()
            } else {
                this.getConvolver().disconnect()
            }
        })
    }
    cleanEndedNotes() {
        this.audioNotes = this.audioNotes.filter(
            audioNote =>
            !audioNote.deleteAt || audioNote.deleteAt > this.context.currentTime
        )
    }
    getConvolver() {
        if (!this.convolverNode) {
            this.convolverNode = this.context.createConvolver()
            this.convolverNode.normalize = true
        }
        return this.convolverNode
    }
    setReverb() {
        let reverb = getSetting("reverbImpulseResponse")
        this.loadImpulseBuffer("../../Reverb/" + reverb + ".wav").then(result => {
            this.getConvolver().buffer = result
            this.getConvolver().connect(this.context.destination)
        })
    }
    getContextTime() {
        return this.context.currentTime
    }
    getContext() {
        return this.context
    }
    isRunning() {
        return this.context.state == "running"
    }
    resume() {
        this.context.resume()
    }
    suspend() {
        this.context.suspend()
    }
    stopAllSources() {
        this.audioNotes.forEach(audioNote => {
            try {
                audioNote.source.stop(0)
            } catch (error) {
                console.log(error)
                //Lets ignore this. Happens when notes are created while jumping on timeline
            }
        })
        this.audioNotes = []
    }
    async loadImpulseBuffer(impulseUrl) {
        return fetch(impulseUrl)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.context.decodeAudioData(arrayBuffer))
    }
    getSoundfontName(instrument) {
        let soundfontName = this.soundfontName
        if (instrument == "percussion") {
            soundfontName = "FluidR3_GM"
        }
        if (
            instrument == "acoustic_grand_piano" &&
            getSetting("useHQPianoSoundfont")
        ) {
            soundfontName = "HQSoundfont"
        }
        return soundfontName
    }
    createContinuousNote(noteNumber, volume, instrument) {
        if (this.context.state === "suspended") {
            this.wasSuspended = true
            this.context.resume()
        }

        let audioNote = createContinuousAudioNote(
            this.context,
            getBufferForNote(
                this.getSoundfontName(instrument),
                instrument,
                noteNumber
            ),
            volume / 100,
            this.getDestination()
        )

        return audioNote
    }
    noteOffContinuous(audioNote) {
        audioNote.endAt(this.context.currentTime + 0.1, false)
    }

    playCompleteNote(currentTime, note, playbackSpeed, volume, isPlayAlong) {
        let instrument = note.instrument
        if (getTrack(note.track).overwrittenInstrument) {
            instrument = getTrack(note.track).overwrittenInstrument
        }
        let soundfontName = this.soundfontName
        if (
            instrument == "acoustic_grand_piano" &&
            getSetting("useHQPianoSoundfont")
        ) {
            soundfontName = "HQSoundfont"
        }
        const buffer = getBufferForNote(
            this.getSoundfontName(instrument),
            instrument,
            note.noteNumber
        )

        let audioNote = createCompleteAudioNote(
            note,
            currentTime,
            playbackSpeed,
            volume,
            isPlayAlong,
            this.context,
            buffer,
            this.getDestination()
        )
        this.audioNotes.push(audioNote)
    }
    getDestination() {
        if (this.reverbEnabled) {
            return this.getConvolver()
        } else {
            return this.context.destination
        }
    }
    playBeat(time, newMeasure) {
        if (time < 0) return
        this.context.resume()
        let ctxTime = this.context.currentTime

        const source = this.context.createBufferSource()
        const gainNode = this.context.createGain()
        gainNode.gain.value = getSetting("metronomeVolume")
        source.buffer = newMeasure ? this.metronomSound1 : this.metronomSound2
        source.connect(gainNode)
        gainNode.connect(this.context.destination)
        source.start(ctxTime + time)
        source.stop(ctxTime + time + 0.2)
    }

    async switchSoundfont(soundfontName, currentSong) {
        this.soundfontName = soundfontName
        getLoader().setLoadMessage("Loading Instruments")
        await this.loadInstrumentsForSong(currentSong)
        getLoader().setLoadMessage("Loading Buffers")
        return await this.loadBuffers()
    }
    loadMetronomeSounds() {
        let audioPl = this

        const request = new XMLHttpRequest()
        request.open("GET", "../../metronome/1.wav")
        request.responseType = "arraybuffer"
        request.onload = function() {
            let undecodedAudio = request.response
            audioPl.context.decodeAudioData(
                undecodedAudio,
                data => (audioPl.metronomSound1 = data)
            )
        }
        request.send()

        const request2 = new XMLHttpRequest()
        request2.open("GET", "../../metronome/2.wav")
        request2.responseType = "arraybuffer"
        request2.onload = function() {
            let undecodedAudio = request2.response
            audioPl.context.decodeAudioData(
                undecodedAudio,
                data => (audioPl.metronomSound2 = data)
            )
        }
        request2.send()
    }
    async loadInstrumentsForSong(currentSong) {
        if (!this.buffers.hasOwnProperty(this.soundfontName)) {
            this.buffers[this.soundfontName] = {}
        }

        let instrumentsOfSong = currentSong ? currentSong.getAllInstruments() : []
        let instrumentSoundfontMap = {}
        instrumentsOfSong.forEach(instrument => {
            instrumentSoundfontMap[instrument] = this.soundfontName
        })
        instrumentSoundfontMap[getSetting("inputInstrument")] = this.soundfontName

        //get instruments from custom track instruments
        let tracks = getTracks()
        Object.keys(tracks)
            .map(trackId => tracks[trackId])
            .filter(track => track.hasOwnProperty("overwrittenInstrument"))
            .filter(track => !instrumentsOfSong.includes(track.overwrittenInstrument))
            .forEach(
                track =>
                (instrumentSoundfontMap[track.overwrittenInstrument] =
                    this.soundfontName)
            )

        if (instrumentSoundfontMap.hasOwnProperty("percussion")) {
            instrumentSoundfontMap["percussion"] = "FluidR3_GM"
        }
        if (
            instrumentSoundfontMap.hasOwnProperty("acoustic_grand_piano") &&
            getSetting("useHQPianoSoundfont")
        ) {
            instrumentSoundfontMap["acoustic_grand_piano"] = "HQSoundfont"
        }

        //filter instruments we've loaded already and directly map onto promise
        let neededInstruments = Object.entries(instrumentSoundfontMap)
            .filter(entry => !this.isInstrumentLoaded(entry[0]))
            .map(entry => SoundfontLoader.loadInstrument(entry[0], entry[1]))
        if (neededInstruments.length == 0) {
            return Promise.resolve()
        }
        await Promise.all(neededInstruments)
    }
    isInstrumentLoaded(instrument) {
        return hasBuffer(this.getSoundfontName(instrument), instrument)
    }

    async loadInstrument(instrument) {
        await SoundfontLoader.loadInstrument(instrument, this.soundfontName)
        return await this.loadBuffers()
    }

    async loadBuffers() {
        return await SoundfontLoader.getBuffers(this.context).then(buffers => {
            console.log("Buffers loaded")
            this.loading = false
        })
    }
}