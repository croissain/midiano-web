import {
    getSettingObject
} from "./Settings.js"

const SAVE_PATH_ROOT = "Midiano/SavedSettings"
const PRESET_PATH_ROOT = "Midiano/ParticlePresets"
export const getGlobalSavedSettings = () => {
    let obj = {}
    if (window.localStorage) {
        let storedObj = window.localStorage.getItem(SAVE_PATH_ROOT)
        if (storedObj) {
            obj = JSON.parse(storedObj)
        }
    }
    return obj
}

export const saveCurrentSettings = () => {
    if (window.localStorage) {
        let saveObj = getSettingObject()
        window.localStorage.setItem(SAVE_PATH_ROOT, JSON.stringify(saveObj))
    }
}
export const getSavedParticlePresets = () => {
    let presets = []
    if (window.localStorage) {
        let storedObj = window.localStorage.getItem(PRESET_PATH_ROOT)
        if (storedObj) {
            presets = JSON.parse(storedObj)
        }
    }
    return presets
}
export const getSavedPreset = presetName => {
    let presets = []
    if (window.localStorage) {
        try {
            let storedObj = window.localStorage.getItem(PRESET_PATH_ROOT)
            if (storedObj) {
                presets = JSON.parse(storedObj)
            }
        } catch (error) {
            console.log("Couldn't retrieve saved presets")
            return null
        }
    }
    return presets.filter(preset => preset.particlePresetName == presetName)[0]
}

export const saveCurrentPresetSettings = obj => {
    if (window.localStorage) {
        window.localStorage.setItem(PRESET_PATH_ROOT, JSON.stringify(obj))
    }
}