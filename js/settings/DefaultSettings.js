import {
    CONST
} from "../data/CONST.js"
import {
    createNewParticlePreset,
    createNewParticleType,
    deleteCurrentParticlePreset,
    deleteCurrentParticleType,
    deleteParticlePreset,
    deleteParticleType,
    renameParticlePreset,
    renameParticleType
} from "./ParticlePreset.js"

import {
    getSetting,
    setSetting
} from "./Settings.js"

export const getDefaultSettings = () => {
    let copy = {}
    for (let tab in defaultSettings) {
        copy[tab] = {}
        for (let category in defaultSettings[tab]) {
            copy[tab][category] = []
            defaultSettings[tab][category].forEach(setting => {
                let settingCopy = {}
                for (let attribute in setting) {
                    settingCopy[attribute] = setting[attribute]
                }
                copy[tab][category].push(settingCopy)
            })
        }
    }
    return copy
}
const TAB_GENERAL = "General"
const TAB_AUDIO = "Audio"
const TAB_VIDEO = "Video"

const defaultSettings = {
    //tabs
    General: {
        //default or subcategory
        default: [{
                type: "slider",
                id: "renderOffset",
                label: "Render offset (ms)",
                value: 0,
                min: -250,
                max: 250,
                step: 1,
                onChange: value => setSetting("renderOffset", value)
            },
            {
                type: "checkbox",
                id: "disableHotkeys",
                label: "Disable hotkeys",
                value: false,
                onChange: ev => {
                    setSetting("disableHotkeys", ev.target.checked)
                }
            },
            {
                type: "checkbox",
                id: "fitZoomOnNewSong",
                label: "Auto fit zoom for new songs",
                value: false,
                onChange: ev => {
                    setSetting("fitZoomOnNewSong", ev.target.checked)
                }
            },
            {
                type: "checkbox",
                id: "saveIndexedDb",
                label: "Save uploaded songs in browser",
                value: true,
                onChange: ev => {
                    setSetting("saveIndexedDb", ev.target.checked)
                }
            },
            {
                type: "checkbox",
                id: "reverseNoteDirection",
                label: "Reverse note direction",
                value: false,
                onChange: ev => {
                    setSetting("reverseNoteDirection", ev.target.checked)
                    setSetting(
                        "pianoPosition",
                        Math.abs(parseInt(getSetting("pianoPosition")) + 1)
                    )
                }
            },
            {
                type: "checkbox",
                id: "showBPM",
                label: "Show BPM",
                value: false,
                onChange: ev => setSetting("showBPM", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "showMiliseconds",
                label: "Show Miliseconds",
                value: false,
                onChange: ev => setSetting("showMiliseconds", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "showNoteDebugInfo",
                label: "Enable note debug info on hover over note",
                value: false,
                onChange: ev => setSetting("showNoteDebugInfo", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "showMarkersSong",
                label: "Show markers in the song",
                value: false,
                onChange: ev => setSetting("showMarkersSong", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "showMarkersTimeline",
                label: "Show markers on timeline",
                value: false,
                onChange: ev => setSetting("showMarkersTimeline", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "showFps",
                label: "Show FPS",
                value: false,
                onChange: ev => setSetting("showFps", ev.target.checked)
            },
            {
                type: "color",
                id: "inputNoteColorWhite",
                label: "Your white note color",
                value: "rgba(40,155,155,0.8)",
                onChange: value => setSetting("inputNoteColorWhite", value)
            },
            {
                type: "color",
                id: "inputNoteColorBlack",
                label: "Your black note color",
                value: "rgba(40,155,155,0.8)",
                onChange: value => setSetting("inputNoteColorBlack", value)
            },
            {
                type: "list",
                id: "inputInstrument",
                label: "Your Instrument",
                value: "acoustic_grand_piano",
                list: Object.keys(CONST.INSTRUMENTS.BY_ID)
                    .map(id => CONST.INSTRUMENTS.BY_ID[id].id)
                    .sort(),
                onChange: value => setSetting("inputInstrument", value)
            }
        ],
        "Sheet Music": [{
                type: "checkbox",
                id: "enableSheet",
                label: "Show Sheet Music",
                value: false,
                onChange: ev => setSetting("enableSheet", ev.target.checked)
            },

            {
                type: "checkbox",
                id: "sheetMeasureScroll",
                label: "Scrolling sheet",
                value: true,
                onChange: ev => setSetting("sheetMeasureScroll", ev.target.checked)
            },
            {
                type: "list",
                id: "hideRestsBelow",
                label: "Hide rests below & including duration",
                value: "Sixteenths",
                list: Object.keys(CONST.NOTE_DENOMS_NAMES),
                onChange: value => setSetting("hideRestsBelow", value)
            },
            {
                type: "checkbox",
                id: "sheetRenderInputNotes",
                label: "Draw input notes",
                value: true,
                onChange: ev => setSetting("sheetRenderInputNotes", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "renderSheetCursor",
                label: "Draw Cursor",
                value: false,
                onChange: ev => setSetting("renderSheetCursor", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "sheetColorActiveNotes",
                label: "Color active notes",
                value: true,
                onChange: ev => setSetting("sheetColorActiveNotes", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "sheetHighlightActiveNotes",
                label: "Highlight active notes",
                value: false,
                onChange: ev =>
                    setSetting("sheetHighlightActiveNotes", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "sheetColorByTrack",
                label: "Use track color",
                value: true,
                onChange: ev => setSetting("sheetColorByTrack", ev.target.checked)
            },
            {
                type: "color",
                id: "sheetActiveNotesColor",
                label: "Active note color",
                value: "rgba(255, 143, 0, 1)",
                onChange: val => setSetting("sheetActiveNotesColor", val)
            },
            {
                type: "color",
                id: "sheetActiveHighlightColor",
                label: "Highlight active color",
                value: "rgba(0, 255, 0, 0.12)",
                onChange: val => setSetting("sheetActiveHighlightColor", val)
            }
        ],
        "On Screen Piano": [{
                type: "checkbox",
                id: "clickablePiano",
                label: "Clickable piano",
                value: true,
                onChange: ev => setSetting("clickablePiano", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "showKeyNamesOnPianoWhite",
                label: "Show white key names on piano",
                value: false,
                onChange: ev =>
                    setSetting("showKeyNamesOnPianoWhite", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "showKeyNamesOnPianoBlack",
                label: "Show black key names on piano",
                value: false,
                onChange: ev =>
                    setSetting("showKeyNamesOnPianoBlack", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "showKeyBindingsOnPiano",
                label: "Show key bindings on piano",
                value: false,
                onChange: ev => setSetting("showKeyBindingsOnPiano", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "showPianoKeyNameFlats",
                label: "Black key names as flats",
                value: false,
                onChange: ev => setSetting("showPianoKeyNameFlats", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "disableKeyShadows",
                label: "Disable Key shadow",
                value: true,
                onChange: ev => setSetting("disableKeyShadows", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "highlightActivePianoKeys",
                label: "Color active piano keys",
                value: true,
                onChange: ev =>
                    setSetting("highlightActivePianoKeys", ev.target.checked)
            },

            {
                type: "checkbox",
                id: "pianoEnableLighter",
                label: "Enable 'lighter' draw",
                value: true,
                onChange: ev => setSetting("pianoEnableLighter", ev.target.checked)
            },
            {
                type: "color",
                id: "pianoWhiteKeyColor",
                label: "White key color",
                value: "rgba(205, 205, 205, 1)",
                onChange: value => setSetting("pianoWhiteKeyColor", value)
            },
            {
                type: "color",
                id: "pianoBlackKeyColor",
                label: "Black key color",
                value: "rgba(20,20,20,1)",
                onChange: value => setSetting("pianoBlackKeyColor", value)
            },
            {
                type: "color",
                id: "pianoBackgroundColor",
                label: "Background color",
                value: "rgba(255,255,255,1)",
                onChange: value => setSetting("pianoBackgroundColor", value)
            },
            {
                type: "color",
                id: "pianoShadowColor",
                label: "Shadow color",
                value: "rgba(255, 255, 255, 0.31)",
                onChange: value => setSetting("pianoShadowColor", value)
            },
            {
                type: "slider",
                id: "pianoShadowBlur",
                label: "Shadow blur",
                value: 30,
                min: 0,
                max: 50,
                step: 0.5,
                onChange: value => setSetting("pianoShadowBlur", value)
            },
            {
                type: "checkbox",
                id: "drawPianoKeyHitEffect",
                label: "Active key hit effect",
                value: true,
                onChange: ev => setSetting("drawPianoKeyHitEffect", ev.target.checked)
            },
            {
                type: "slider",
                id: "pianoPosition",
                label: "Piano Position",
                value: 0,
                min: 0,
                max: 100,
                step: 1,
                onChange: value => setSetting("pianoPosition", value)
            },
            {
                type: "slider",
                id: "whiteKeyHeight",
                label: "Height (%) - White keys",
                value: 100,
                min: 0,
                max: 200,
                step: 1,
                onChange: value => setSetting("whiteKeyHeight", value)
            },
            {
                type: "slider",
                id: "blackKeyHeight",
                label: "Height (%) - Black keys",
                value: 100,
                min: 0,
                max: 200,
                step: 1,
                onChange: value => setSetting("blackKeyHeight", value)
            }
        ],
        "Piano Line": [{
                type: "checkbox",
                id: "pianoLineEnabled",
                label: "Enable piano line",
                value: false,
                onChange: ev => setSetting("pianoLineEnabled", ev.target.checked)
            },
            {
                type: "slider",
                id: "pianoLineSpeed",
                label: "Speed",
                value: 6,
                min: 1,
                max: 50,
                step: 1,
                onChange: value => setSetting("pianoLineSpeed", value)
            },
            {
                type: "slider",
                id: "pianoLineResolution",
                label: "Resolution",
                value: 5,
                min: 0.01,
                max: 150,
                step: 0.01,
                onChange: value => setSetting("pianoLineResolution", value)
            },

            {
                type: "slider",
                id: "pianoLineAmplitude",
                label: "Amplitude",
                value: 3,
                min: 0.01,
                max: 10,
                step: 0.01,
                onChange: value => setSetting("pianoLineAmplitude", value)
            },
            {
                type: "slider",
                id: "pianoLineReflection",
                label: "Reflection",
                value: 0.3,
                min: 0.0,
                max: 1,
                step: 0.001,
                onChange: value => setSetting("pianoLineReflection", value)
            },
            {
                type: "slider",
                hidden: true,
                id: "pianoLineNoiseA",
                label: "Noise a",
                value: 12.12,
                min: 0.01,
                max: 50,
                step: 0.01,
                onChange: value => setSetting("pianoLineNoiseA", value)
            },
            {
                type: "slider",
                hidden: true,
                id: "pianoLineNoiseB",
                label: "Noise b",
                value: 0.01,
                min: 0.01,
                max: 50,
                step: 0.01,
                onChange: value => setSetting("pianoLineNoiseB", value)
            },
            {
                type: "slider",
                hidden: true,
                id: "pianoLineNoiseC",
                label: "Noise c",
                value: 1.52,
                min: 0.01,
                max: 50,
                step: 0.01,
                onChange: value => setSetting("pianoLineNoiseC", value)
            },
            {
                type: "slider",
                hidden: true,
                id: "pianoLineNoiseD",
                label: "Noise d",
                value: 5.28,
                min: 0.01,
                max: 50,
                step: 0.01,
                onChange: value => setSetting("pianoLineNoiseD", value)
            },
            {
                type: "color",
                id: "pianoLineColor",
                label: "Color",
                value: "rgba(255, 255, 255, 1)",
                onChange: value => setSetting("pianoLineColor", value)
            },

            {
                type: "slider",
                id: "pianoLineOpacity",
                label: "Opacity",
                value: 1,
                min: 0,
                max: 1,
                step: 0.01,
                onChange: value => setSetting("pianoLineOpacity", value)
            },
            {
                type: "slider",
                id: "pianoLineYOffset",
                label: "Y-Offset",
                value: 0,
                min: -50,
                max: 50,
                step: 1,
                onChange: value => setSetting("pianoLineYOffset", value)
            }
        ]
    },

    Video: {
        default: [{
                type: "slider",
                id: "noteToHeightConst",
                label: "Seconds shown on screen",
                value: 3,
                min: 0.1,
                max: 30,
                step: 0.1,
                onChange: value => setSetting("noteToHeightConst", value)
            },
            {
                type: "checkbox",
                id: "drawMeasureLines",
                label: "Draw measure lines",
                value: true,
                onChange: ev => setSetting("drawMeasureLines", ev.target.checked)
            }
        ],
        "Note Appearance": [{
                type: "checkbox",
                id: "showHitKeys",
                label: "Active Notes effect",
                value: true,
                onChange: ev => setSetting("showHitKeys", ev.target.checked)
            },
            {
                type: "list",
                id: "noteLabel",
                label: "Note Labels",
                value: "None",
                list: ["None", "Note name", "Key Binding"],
                onChange: value => setSetting("noteLabel", value)
            },
            {
                type: "checkbox",
                id: "noteEnableLighterDraw",
                label: "Enable 'lighter' draw",
                value: false,
                onChange: ev => setSetting("noteEnableLighterDraw", ev.target.checked)
            },
            {
                type: "color",
                id: "noteShadowColor",
                label: "Shadow color",
                value: "rgba(255, 255, 255, 0.31)",
                onChange: value => setSetting("noteShadowColor", value)
            },
            {
                type: "slider",
                id: "noteShadowBlur",
                label: "Shadow blur",
                value: 30,
                min: 0,
                max: 50,
                step: 0.5,
                onChange: value => setSetting("noteShadowBlur", value)
            },
            {
                type: "checkbox",
                id: "strokeActiveNotes",
                label: "Stroke active notes",
                value: true,
                onChange: ev => setSetting("strokeActiveNotes", ev.target.checked)
            },
            {
                type: "color",
                id: "strokeActiveNotesColor",
                label: "Stroke color",
                value: "rgba(240,240,240,0.5)",
                onChange: value => setSetting("strokeActiveNotesColor", value)
            },
            {
                type: "slider",
                id: "strokeActiveNotesWidth",
                label: "Stroke width",
                value: "2",
                min: 1,
                max: 10,
                step: 0.5,
                onChange: value => setSetting("strokeActiveNotesWidth", value)
            },
            {
                type: "checkbox",
                id: "strokeNotes",
                label: "Stroke notes",
                value: false,
                onChange: ev => setSetting("strokeNotes", ev.target.checked)
            },
            {
                type: "color",
                id: "strokeNotesColor",
                label: "Stroke color",
                value: "rgba(0,0,0,1)",
                onChange: value => setSetting("strokeNotesColor", value)
            },
            {
                type: "slider",
                id: "strokeNotesWidth",
                label: "Stroke width",
                value: "1",
                min: 1,
                max: 10,
                step: 0.5,
                onChange: value => setSetting("strokeNotesWidth", value)
            },
            {
                type: "checkbox",
                id: "roundedNotes",
                label: "Rounded notes",
                value: true,
                onChange: ev => setSetting("roundedNotes", ev.target.checked)
            },
            //TODO fix getAlphaFromY in Noterender.
            // {
            // 	type: "checkbox",
            // 	id: "fadeInNotes",
            // 	label: "Enable fade in effect",
            // 	value: true,
            // 	onChange: ev => setSetting("fadeInNotes", ev.target.checked)
            // },
            {
                type: "slider",
                id: "noteBorderRadius",
                label: "Note border radius (%)",
                value: 15,
                min: 0,
                max: 50,
                step: 1,
                onChange: value => setSetting("noteBorderRadius", value)
            },
            {
                type: "slider",
                id: "minNoteHeight",
                label: "Minimum Note height (px)",
                value: 10,
                min: 1,
                max: 50,
                step: 1,
                onChange: value => setSetting("minNoteHeight", value)
            },
            {
                type: "slider",
                id: "noteEndedShrink",
                label: "Played Notes shrink speed",
                value: 1,
                min: 0,
                max: 5,
                step: 0.1,
                onChange: value => setSetting("noteEndedShrink", value)
            },
            {
                type: "slider",
                id: "playedNoteFalloffSpeed",
                label: "Played Note Speed",
                value: 1,
                min: 0.1,
                max: 10,
                step: 0.1,
                onChange: value => setSetting("playedNoteFalloffSpeed", value)
            }
        ],
        Sustain: [{
                type: "checkbox",
                id: "showSustainOnOffs",
                label: "Draw Sustain On/Off Events",
                value: false,
                onChange: function(ev) {
                    setSetting("showSustainOnOffs", ev.target.checked)
                }
            },
            {
                type: "checkbox",
                id: "showSustainChannels",
                label: "Show sustain channels",
                value: false,
                onChange: function(ev) {
                    setSetting("showSustainChannels", ev.target.checked)
                }
            },
            {
                type: "checkbox",
                id: "showSustainPeriods",
                label: "Draw Sustain Periods",
                value: false,
                onChange: ev => setSetting("showSustainPeriods", ev.target.checked)
            },
            {
                type: "checkbox",
                id: "showSustainedNotes",
                label: "Draw Sustained Notes",
                value: false,
                onChange: ev => setSetting("showSustainedNotes", ev.target.checked)
            },
            {
                type: "slider",
                id: "sustainedNotesOpacity",
                label: "Sustained Notes Opacity (%)",
                value: 50,
                min: 0,
                max: 100,
                step: 1,
                onChange: value => setSetting("sustainedNotesOpacity", value)
            }
        ],
        Particles: [{
                type: "checkbox",
                id: "showParticles",
                label: "Enable particles",
                value: false,
                onChange: ev => setSetting("showParticles", ev.target.checked)
            },
            {
                type: "slider",
                id: "particlesMaxTextureSize",
                label: "Max texture size",
                value: 500,
                min: 0,
                max: 5000,
                step: 1,
                onChange: value => setSetting("particlesMaxTextureSize", value)
            },

            // { type: "label", label: "Particle Presets:" },
            {
                type: "dynList",
                id: "particlePreset",
                label: "Particle Presets:",
                value: "Default",
                list: [],
                renameCallback: (item, setHtmlCallback) =>
                    renameParticlePreset(item, setHtmlCallback),
                createCallback: () => createNewParticlePreset(),
                deleteCallback: item => deleteParticlePreset(item),
                onChange: newVal => setSetting("particlePreset", newVal)
            },
            // {
            // 	type: "list",
            // 	id: "particlePreset",
            // 	label: "Choose Preset",
            // 	value: "Default",
            // 	list: [],
            // 	onChange: newVal => setSetting("particlePreset", newVal)
            // },
            // {
            // 	type: "buttonGroup",
            // 	buttons: [
            // 		{
            // 			type: "button",
            // 			id: "particlePresetCreate",
            // 			label: "New Preset",
            // 			onChange: newVal => createNewParticlePreset()
            // 		},
            // 		{
            // 			type: "button",
            // 			id: "particlePresetDelete",
            // 			label: "Delete current preset",
            // 			onChange: newVal => deleteCurrentParticlePreset()
            // 		}
            // 	]
            // },

            // { type: "label", label: "Particle Types:" },
            {
                type: "dynList",
                id: "particlePresetType",
                label: "Particle Types:",
                value: "Default",
                list: [],
                renameCallback: (item, setHtmlCallback) =>
                    renameParticleType(item, setHtmlCallback), //TODO
                createCallback: () => createNewParticleType(),
                deleteCallback: item => deleteParticleType(item),
                onChange: newVal => setSetting("particlePresetType", newVal)
            },
            // {
            // 	type: "buttonGroup",
            // 	buttons: [
            // 		{
            // 			type: "button",
            // 			id: "particlePresetTypeCreate",
            // 			label: "New Type",
            // 			onChange: newVal => createNewParticleType()
            // 		},
            // 		{
            // 			type: "button",
            // 			id: "particlePresetTypeDelete",
            // 			label: "Delete current type",
            // 			onChange: newVal => deleteCurrentParticleType()
            // 		}
            // 	]
            // },

            {
                type: "label",
                label: "Particle Type Settings:"
            },
            {
                type: "list",
                id: "particlesTexture",
                label: "Texture",
                value: CONST.PARTICLE_TEXTURES[0],
                list: CONST.PARTICLE_TEXTURES,
                onChange: newVal => setSetting("particlesTexture", newVal)
            },
            {
                type: "list",
                id: "particlesBlending",
                label: "Blending",
                value: CONST.BLENDING.Normal,
                list: Object.keys(CONST.BLENDING),
                onChange: newVal => setSetting("particlesBlending", newVal)
            },
            {
                type: "checkbox",
                id: "particleOverrideColor",
                label: "Enable custom color",
                value: false,
                onChange: ev => setSetting("particleOverrideColor", ev.target.checked)
            },
            {
                type: "color",
                id: "particleColor",
                label: "Custom color",
                value: "rgba(255,255,255,0.8)",
                onChange: value => setSetting("particleColor", value)
            },
            {
                type: "slider",
                id: "particlesOpacity",
                label: "Opacity",
                value: 1,
                min: 0,
                max: 1,
                step: 0.01,
                onChange: value => setSetting("particlesOpacity", value)
            },
            {
                type: "slider",
                id: "particleSize",
                label: "Size",
                value: 4,
                min: 0,
                max: 100,
                step: 1,
                onChange: value => setSetting("particleSize", value)
            },
            {
                type: "slider",
                id: "particleAmount",
                label: "Amount (per frame)",
                value: 1,
                min: 0.01,
                max: 25,
                step: 0.01,
                onChange: value => setSetting("particleAmount", value)
            },
            {
                type: "slider",
                id: "particleLife",
                label: "Duration",
                value: 150,
                min: 1,
                max: 300,
                step: 1,
                onChange: value => setSetting("particleLife", value)
            },
            {
                type: "slider",
                id: "particleSpeed",
                label: "Physics speed",
                value: 1,
                min: 1,
                max: 100,
                step: 1,
                onChange: value => setSetting("particleSpeed", value)
            },
            {
                type: "slider",
                id: "particleFadeOut",
                label: "Fade out",
                value: 1,
                min: 0,
                max: 1,
                step: 0.1,
                onChange: value => setSetting("particleFadeOut", value)
            },
            {
                type: "slider",
                id: "particlesShrink",
                label: "Shrink",
                value: 1,
                min: 0,
                max: 1,
                step: 0.001,
                onChange: value => setSetting("particlesShrink", value)
            },
            {
                type: "slider",
                id: "particleSpeedX",
                label: "Initial X Speed",
                value: 2,
                min: 0,
                max: 50,
                step: 0.1,
                onChange: value => setSetting("particleSpeedX", value)
            },
            {
                type: "slider",
                id: "particleSpeedY",
                label: "Initial Y Speed",
                value: 10,
                min: -50,
                max: 50,
                step: 0.1,
                onChange: value => setSetting("particleSpeedY", value)
            },
            {
                type: "slider",
                id: "particlesFriction",
                label: "Friction",
                value: 0.05,
                min: 0,
                max: 1,
                step: 0.001,
                onChange: value => setSetting("particlesFriction", value)
            },
            {
                type: "slider",
                id: "particleRising",
                label: "Gravity",
                value: -1,
                min: -15,
                max: 15,
                step: 0.1,
                onChange: value => setSetting("particleRising", value)
            },
            {
                type: "slider",
                id: "particlesRotation",
                label: "Starting rotation",
                value: 360,
                min: 0,
                max: 360,
                step: 1,
                onChange: value => setSetting("particlesRotation", value)
            },
            {
                type: "slider",
                id: "particlesRotationRandom",
                label: "Starting rotation randomness",
                value: 180,
                min: 0,
                max: 180,
                step: 1,
                onChange: value => setSetting("particlesRotationRandom", value)
            },
            {
                type: "slider",
                id: "particlesRotationSpeed",
                label: "Rotation speed",
                value: 0,
                min: 0,
                max: 1,
                step: 0.001,
                onChange: value => setSetting("particlesRotationSpeed", value)
            },
            {
                type: "slider",
                id: "turbulenceXAmplitude",
                label: "Turbulence X Amplitude",
                value: 6,
                min: 0,
                max: 500,
                step: 1,
                onChange: value => setSetting("turbulenceXAmplitude", value)
            },
            {
                type: "slider",
                id: "turbulenceXFrequency",
                label: "Turbulence X Frequency",
                value: 0.5,
                min: 0,
                max: 2,
                step: 0.01,
                onChange: value => setSetting("turbulenceXFrequency", value)
            },
            {
                type: "slider",
                id: "turbulenceYAmplitude",
                label: "Turbulence Y Amplitude",
                value: 6,
                min: 0,
                max: 500,
                step: 1,
                onChange: value => setSetting("turbulenceYAmplitude", value)
            },
            {
                type: "slider",
                id: "turbulenceYFrequency",
                label: "Turbulence Y Frequency",
                value: 0.5,
                min: 0,
                max: 2,
                step: 0.01,
                onChange: value => setSetting("turbulenceYFrequency", value)
            },

            {
                type: "slider",
                id: "particleYOffset",
                label: "Y Offset",
                value: 0,
                min: -150,
                max: 150,
                step: 1,
                onChange: value => setSetting("particleYOffset", value)
            },
            {
                type: "list",
                id: "particleDistributionX",
                label: "X-Distribution",
                value: CONST.DISTRIBUTIONS.X.ACROSS,
                list: Object.values(CONST.DISTRIBUTIONS.X),
                onChange: newVal => setSetting("particleDistributionX", newVal)
            },
            {
                type: "slider",
                id: "particleDistributionXSpread",
                label: "X-Spread (%)",
                showIfDependendence: "particleDistributionX",
                showIfVal: CONST.DISTRIBUTIONS.X.ACROSS,
                value: 100,
                min: 0,
                max: 200,
                step: 1,
                onChange: value => setSetting("particleDistributionXSpread", value)
            },
            {
                type: "list",
                id: "particleDistributionY",
                label: "Y-Distribution",
                value: CONST.DISTRIBUTIONS.Y.KEYS_TOP,
                list: Object.values(CONST.DISTRIBUTIONS.Y),
                onChange: newVal => setSetting("particleDistributionY", newVal)
            },
            {
                type: "list",
                id: "particleDistributionZ",
                label: "Layer",
                value: CONST.DISTRIBUTIONS.Z.BEHIND_PIANO,
                list: Object.values(CONST.DISTRIBUTIONS.Z),
                onChange: newVal => setSetting("particleDistributionZ", newVal)
            }
        ],

        Background: [{
                type: "checkbox",
                id: "extendBgPastPiano",
                label: "Extend background past piano",
                value: false,
                onChange: ev => setSetting("extendBgPastPiano", ev.target.checked)
            },
            {
                type: "color",
                id: "bgCol1",
                label: "Background fill color 1",
                value: "rgba(40,40,40,0.8)",
                onChange: value => {
                    setSetting("bgCol1", value)
                }
            },
            {
                type: "color",
                id: "bgCol2",
                label: "Background fill color 2",
                value: "rgba(0,0,0,1)",
                onChange: value => {
                    setSetting("bgCol2", value)
                }
            },
            {
                type: "color",
                id: "bgCol3",
                label: "Background stroke color 1",
                value: "rgba(10,10,10,0.5)",
                onChange: value => {
                    setSetting("bgCol3", value)
                }
            },
            {
                type: "color",
                id: "bgCol4",
                label: "Background stroke color 2",
                value: "rgba(10,10,10,0.5)",
                onChange: value => {
                    setSetting("bgCol4", value)
                }
            }
        ]
    },
    Audio: {
        default: [{
                type: "list",
                id: "soundfontName",
                label: "Soundfont",
                value: "MusyngKite",
                list: ["MusyngKite", "FluidR3_GM", "FatBoy"],
                onChange: newVal => setSetting("soundfontName", newVal)
            },
            {
                type: "checkbox",
                id: "useHQPianoSoundfont",
                label: "Use HQ Piano Soundfont (~13MB)",
                value: false,
                onChange: function(ev) {
                    setSetting("useHQPianoSoundfont", ev.target.checked)
                }.bind(this)
            },
            {
                type: "checkbox",
                id: "sustainEnabled",
                label: "Enable Sustain",
                value: true,
                onChange: function(ev) {
                    setSetting("sustainEnabled", ev.target.checked)
                }.bind(this)
            },
            {
                type: "checkbox",
                id: "enableMetronome",
                label: "Enable Metronome",
                value: false,
                onChange: function(ev) {
                    setSetting("enableMetronome", ev.target.checked)
                }.bind(this)
            },
            {
                type: "slider",
                id: "metronomeVolume",
                label: "Metronome Volume",
                value: 0.1,
                min: 0,
                max: 1,
                step: 0.05,
                onChange: value => setSetting("metronomeVolume", value)
            },
            {
                type: "checkbox",
                id: "enableReverb",
                label: "Enable convolver (reverb)",
                value: true,
                onChange: function(ev) {
                    setSetting("enableReverb", ev.target.checked)
                }.bind(this)
            },
            {
                type: "list",
                id: "reverbImpulseResponse",
                label: "Impulse Response",
                value: CONST.REVERBS[0],
                list: CONST.REVERBS,
                onChange: value => setSetting("reverbImpulseResponse", value)
            }
        ],
        "ADSR Envelope": [{
                type: "slider",
                id: "adsrAttack",
                label: "Attack (Seconds)",
                value: 0,
                min: 0,
                max: 2,
                step: 0.01,
                onChange: value => setSetting("adsrAttack", value)
            },
            {
                type: "slider",
                id: "adsrDecay",
                label: "Decay (Seconds)",
                value: 0,
                min: 0,
                max: 0.5,
                step: 0.01,
                onChange: value => setSetting("adsrDecay", value)
            },
            {
                type: "slider",
                id: "adsrSustain",
                label: "Sustain (%)",
                value: 100,
                min: 0,
                max: 100,
                step: 1,
                onChange: value => setSetting("adsrSustain", value)
            },
            {
                type: "slider",
                id: "adsrReleaseKey",
                label: "Release - Key (Seconds)",
                value: 0.35,
                min: 0,
                max: 10,
                step: 0.01,
                onChange: value => setSetting("adsrReleaseKey", value)
            },
            {
                type: "slider",
                id: "adsrReleasePedal",
                label: "Release - Pedal (Seconds)",
                value: 0.35,
                min: 0,
                max: 10,
                step: 0.01,
                onChange: value => setSetting("adsrReleasePedal", value)
            }
        ]
    },
    Hidden: {
        default: [{
                type: "text",
                id: "particlePresetName",
                label: "Preset Name",
                value: "Default",
                onChange: ev => setSetting("particlePresetName", ev.target.value)
            },
            {
                type: "text",
                id: "particleTypeName",
                label: "Type Name",
                value: "Default",
                onChange: ev => setSetting("particleTypeName", ev.target.value)
            },
            {
                type: "text",
                id: "keyBindings",
                label: "Key Bindings",
                value: {
                    0: [36],
                    1: [27],
                    2: [28],
                    3: [29],
                    4: [30],
                    5: [31],
                    6: [32],
                    7: [33],
                    8: [34],
                    9: [35],
                    Q: [37],
                    W: [38],
                    E: [39],
                    R: [40],
                    T: [41],
                    Y: [42],
                    U: [43],
                    I: [44],
                    O: [45],
                    P: [46],
                    A: [47],
                    S: [48],
                    D: [49],
                    F: [50],
                    G: [51],
                    H: [52],
                    J: [53],
                    K: [54],
                    L: [55],
                    X: [57],
                    Z: [56],
                    C: [58],
                    V: [59],
                    B: [60],
                    N: [61],
                    M: [62]
                },
                onChange: value => {
                    setSetting("keyBindings", value)
                }
            }
        ]
    }
}