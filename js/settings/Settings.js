import {
    getDefaultSettings
} from "./DefaultSettings.js"
import {
    SettingUI
} from "../ui/SettingUI.js"
import {
    getGlobalSavedSettings,
    saveCurrentSettings
} from "./LocalStorageHandler.js"

class Settings {
    constructor(ui) {
        this.settings = getDefaultSettings()
        let savedSettings = getGlobalSavedSettings()
        this.uiUpdateQueue = []

        this.settingsById = {}
        Object.keys(this.settings).forEach(tabId =>
            Object.keys(this.settings[tabId]).forEach(categoryId =>
                this.settings[tabId][categoryId].forEach(setting => {
                    this.settingsById[setting.id] = setting

                    if (savedSettings.hasOwnProperty(setting.id)) {
                        setting.value = savedSettings[setting.id]
                    }
                })
            )
        )

        this.settingsUi = new SettingUI()
    }
    setSettingValue(settingId, value) {
        this.settingsById[settingId].value = value
    }
    addUiUpdateQueue(obj) {
        this.uiUpdateQueue.push(obj)
        if (!this.updating) {
            this.updateUi()
        }
    }
    updateUi() {
        this.updating = true
        let updateable = this.uiUpdateQueue.find(queueItem => queueItem.condition())
        if (updateable) {
            this.uiUpdateQueue.splice(this.uiUpdateQueue.indexOf(updateable), 1)
            updateable.update()
        }
        if (this.uiUpdateQueue.length > 0) {
            window.requestAnimationFrame(this.updateUi.bind(this))
        } else {
            this.updating = false
        }
    }
}

var globalSettings = null
export const initSettings = () => null //(globalSettings = new Settings())
export const setSettingList = (id, list, val) => {
    if (globalSettings.settingsById[id].div) {
        globalSettings.settingsById[id].div.updateList(list, val)
    } else {
        globalSettings.addUiUpdateQueue({
            condition: () => globalSettings.settingsById[id].div,
            update: () => globalSettings.settingsById[id].div.updateList(list, val)
        })
    }
}
export const getSetting = settingId => {
    if (globalSettings == null) {
        globalSettings = new Settings()
    }
    return globalSettings.settingsById[settingId] ?
        globalSettings.settingsById[settingId].value :
        null
}
export const setSetting = (settingId, value) => {
    globalSettings.settingsById[settingId].value = value
    if (settingCallbacks.hasOwnProperty(settingId)) {
        settingCallbacks[settingId].forEach(callback => callback())
    }
    saveCurrentSettings()
}
export const setSettingUI = (settingId, value) => {
    try {
        if (globalSettings.settingsById[settingId].hasOwnProperty("setUIValue")) {
            globalSettings.settingsById[settingId].setUIValue(value)
        }
        setSetting(settingId, value)
    } catch (e) {
        console.log("Couldnt set UI setting for " + settingId + ". ")
    }
}
export const getSettingsDiv = () => {
    return globalSettings.settingsUi.getSettingsDiv(globalSettings.settings)
}
var settingCallbacks = {}
export const setSettingCallback = (settingId, callback) => {
    if (!settingCallbacks.hasOwnProperty(settingId)) {
        settingCallbacks[settingId] = []
    }
    settingCallbacks[settingId].push(callback)
}
export const removeSettingCallback = (settingId, callback) => {
    let ind = settingCallbacks[settingId].indexOf(callback)
    if (ind >= 0) {
        settingCallbacks[settingId].splice(ind, 1)
    } else {
        console.log("Couldnt find setting " + settingId)
    }
}

export const triggerSettingCallback = settingId => {
    if (settingCallbacks.hasOwnProperty(settingId)) {
        settingCallbacks[settingId].forEach(func => func())
    }
}
export const getSettingObject = () => {
    let obj = {}
    for (let key in globalSettings.settingsById) {
        obj[key] = globalSettings.settingsById[key].value
    }
    return obj
}
export const getDefaultSettingValue = settingId => {
    let defaultSettings = getDefaultSettings()
    for (let tabId in defaultSettings) {
        for (let categoryId in defaultSettings[tabId]) {
            for (let i = 0; i < defaultSettings[tabId][categoryId].length; i++) {
                let setting = defaultSettings[tabId][categoryId][i]
                if (setting.id == settingId) {
                    return setting.value
                }
            }
        }
    }
}
export const resetSettingsToDefault = () => {
    let defaultSettings = getDefaultSettings()
    Object.keys(defaultSettings).forEach(tabId =>
        Object.keys(defaultSettings[tabId]).forEach(categoryId =>
            defaultSettings[tabId][categoryId].forEach(setting => {
                globalSettings.settingsById[setting.id].value = setting.value
            })
        )
    )

    let parent = globalSettings.settingsUi.getSettingsDiv(
        globalSettings.settings
    ).parentElement
    parent.removeChild(
        globalSettings.settingsUi.getSettingsDiv(globalSettings.settings)
    )
    globalSettings.settingsUi.mainDiv = null
    parent.appendChild(getSettingsDiv())
}

export const addDynamicSettingsToObj = (settingIds, obj, prefix = "") => {
    settingIds.forEach(settingId => {
        obj[prefix + settingId] = getSetting(settingId)
        setSettingCallback(
            settingId,
            () => (obj[prefix + settingId] = getSetting(settingId))
        )
    })
}