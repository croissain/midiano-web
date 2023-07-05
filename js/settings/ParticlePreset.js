import {
    CONST
} from "../data/CONST.js"
import {
    ConfirmDialog
} from "../ui/ConfirmDialog.js"
import {
    InputDialog
} from "../ui/InputDialogue.js"
import {
    Notification
} from "../ui/Notification.js"
import {
    getDefaultPresets
} from "./DefaultParticlePreset.js"
import {
    getSavedParticlePresets,
    saveCurrentPresetSettings
} from "./LocalStorageHandler.js"
import {
    getDefaultSettingValue,
    getSetting,
    setSettingCallback,
    setSettingList,
    setSettingUI
} from "./Settings.js"

class ParticlePreset {
    constructor(opts, isDefault) {
        this.isDefault = isDefault
        this.particlePresetName = opts.particlePresetName
        let types = []
        opts.types.forEach(type => {
            types.push(new ParticleType(type))
        })
        this.types = types
    }
    getTypes() {
        return this.types
    }
    getType(name) {
        return this.types.filter(type => type.particleTypeName == name)[0]
    }

    clone() {
        let i = 1
        let name = this.particlePresetName + "_" + i
        let allNames = getPresetHandler().getAllPresetNames()
        while (allNames.indexOf(name) != -1) {
            i++
            name = name.substr(0, name.length - 1) + i
        }
        let opts = {
            particlePresetName: name,
            types: this.types.map(type => type.clone())
        }
        return new ParticlePreset(opts)
    }
}

class ParticleType {
    constructor(opts) {
        let attrs = [
            "particleTypeName",
            "particlesTexture",
            "particleAmount",
            "particleOverrideColor",
            "particleColor",
            "particlesBlending",
            "particlesOpacity",
            "particleSpeed",
            "particleSize",
            "particleSpeedX",
            "particleSpeedY",
            "particleLife",
            "particleRising",
            "particlesShrink",
            "particlesRotation",
            "particlesRotationRandom",
            "particlesRotationSpeed",
            "particlesFriction",
            "turbulenceXFrequency",
            "turbulenceYFrequency",
            "turbulenceXAmplitude",
            "turbulenceYAmplitude",
            "particleFadeOut",
            "particleYOffset",
            "particleDistributionX",
            "particleDistributionY",
            "particleDistributionZ"
        ]
        attrs.forEach(attr => {
            if (opts.hasOwnProperty(attr)) {
                this[attr] = opts[attr]
            } else {
                this[attr] = getDefaultSettingValue(attr)
            }
        })
    }
    clone() {
        return new ParticleType(this)
    }
}

class ParticlePresetHandler {
    constructor() {
        this.defaultPresets = this.getDefaultPresets()
        this.customPresets = getSavedParticlePresets().map(
            presetOpts => new ParticlePreset(presetOpts)
        )
        let presetName = getSetting("particlePresetName") || "Default"
        let savedPreset = this.customPresets.find(
            preset => preset.particlePresetName == presetName
        )
        if (savedPreset) {
            this.currentPreset = savedPreset
        } else {
            this.currentPreset = this.defaultPresets[0]
        }

        this.currentType = this.currentPreset.types[0]
        this.disableListeners = true
        this.dontSave = true
        this.setPreset(this.currentPreset)

        this.initListeners()

        setSettingList(
            "particlePreset",
            this.getAllPresetNames(),
            this.currentPreset.particlePresetName
        )

        this.dontSave = false
        this.disableListeners = false
    }
    getDefaultPresets() {
        return getDefaultPresets().map(
            presetOpts => new ParticlePreset(presetOpts, true)
        )
    }
    initListeners() {
        setSettingCallback("particlePreset", this.onPresetChanged.bind(this))
        setSettingCallback("particlePresetType", this.onTypeChanged.bind(this))
        let tmpType = new ParticleType({})
        Object.keys(tmpType).forEach(attrName =>
            setSettingCallback(attrName, () => this.onSettingChanged(attrName))
        )

        setSettingCallback("particlePresetName", () => {
            if (this.disableListeners) return

            if (
                this.currentPreset.isDefault &&
                this.currentPreset.particlePresetName !=
                getSetting("particlePresetName")
            ) {
                this.createAndSetPreset()
            } else {
                this.currentPreset.particlePresetName = getSetting("particlePresetName")
            }
            setSettingList(
                "particlePreset",
                this.getAllPresetNames(),
                getSetting("particlePresetName")
            )
        })
        setSettingCallback("particleTypeName", () => {
            if (this.disableListeners) return
            this.currentType.particleTypeName = getSetting("particleTypeName")
            setSettingList(
                "particlePresetType",
                this.getCurrentPresetTypeNames(),
                this.currentType.particleTypeName
            )
        })
    }
    createAndSetPreset() {
        this.disableListeners = true
        let newPreset = this.currentPreset.clone()
        this.customPresets.push(newPreset)
        setSettingList(
            "particlePreset",
            this.getAllPresetNames(),
            newPreset.particlePresetName
        )
        this.setPreset(newPreset)
        this.disableListeners = false
    }
    createAndSetType() {
        this.disableListeners = true
        let newType = this.currentType.clone()
        newType.particleTypeName += "_Copy"
        this.currentPreset.types.push(newType)
        setSettingList(
            "particlePresetType",
            this.getCurrentPresetTypeNames(),
            newType.particleTypeName
        )
        this.setType(newType)
        this.disableListeners = false
    }
    getCustomPresets() {
        return this.customPresets
    }
    save() {
        saveCurrentPresetSettings(this.customPresets)
    }
    getCurrentPreset() {
        return this.currentPreset
    }
    getCurrentPresetTypes() {
        return this.currentPreset.getTypes()
    }
    getCurrentPresetTypeNames() {
        return this.getCurrentPresetTypes().map(type => type.particleTypeName)
    }
    getAllPresets() {
        return this.defaultPresets.concat(this.getCustomPresets())
    }
    getAllPresetNames() {
        return this.getAllPresets().map(preset => preset.particlePresetName)
    }
    getPresetByName(name) {
        return (
            this.defaultPresets.find(preset => preset.particlePresetName == name) ||
            this.customPresets.find(preset => preset.particlePresetName == name)
        )
    }
    setPreset(preset) {
        this.dontSave = true
        this.disableListeners = true

        setSettingUI("particlePresetName", preset.particlePresetName)
        this.currentPreset = preset
        let firstType = preset.getTypes()[0]
        if (firstType) {
            this.setType(firstType)
        }
        try {
            setSettingList(
                "particlePresetType",
                this.getCurrentPresetTypeNames(),
                firstType.particleTypeName
            )
        } catch (e) {
            console.error(e)
        }
        this.disableListeners = false
        this.dontSave = false
    }
    setType(type) {
        this.disableListeners = true
        this.currentType = type
        this.dontSave = true
        for (let attrName in type) {
            if (attrName == "ticker") continue
            setSettingUI(attrName, type[attrName])
        }
        this.dontSave = false
        this.disableListeners = false
    }
    onPresetChanged() {
        if (this.disableListeners) return
        let preset = this.getPresetByName(getSetting("particlePreset"))
        if (preset) {
            console.log(preset)
            this.setPreset(preset)
        }
    }
    onTypeChanged() {
        if (this.disableListeners) return
        let type = this.currentPreset.getType(getSetting("particlePresetType"))
        this.setType(type)
    }
    onSettingChanged(settingId) {
        if (this.disableListeners) return

        //save new setting val
        let newVal = getSetting(settingId)

        //create new setting if currently a default is selected
        if (
            this.currentPreset.isDefault &&
            this.currentType[settingId] != getSetting(settingId)
        ) {
            this.createAndSetPreset()
        }
        this.currentType[settingId] = getSetting(settingId)
        if (!this.dontSave) {
            saveCurrentPresetSettings(this.getCustomPresets())
        }
    }
}

var thePresetHandler = null
export const getPresetHandler = () => {
    if (thePresetHandler == null) {
        thePresetHandler = new ParticlePresetHandler()
    }
    return thePresetHandler
}

export const createNewParticlePreset = () => {
    thePresetHandler.createAndSetPreset()
    saveCurrentPresetSettings(thePresetHandler.getCustomPresets())
}
export const renameParticlePreset = (presetName, setHtmlCallback) => {
    let preset = thePresetHandler.getPresetByName(presetName)
    if (preset) {
        InputDialog.create(
            "New preset name: ",
            newName => {
                preset.particlePresetName = newName
                setHtmlCallback(newName)
                setSettingUI("particlePresetName", newName)
                saveCurrentPresetSettings(thePresetHandler.getCustomPresets())
            },
            presetName
        )
    }
}
export const deleteParticlePreset = presetName => {
    let preset = thePresetHandler.getPresetByName(presetName)
    if (preset) {
        ConfirmDialog.create(
            "Are you sure you want to delete the Preset " +
            preset.particlePresetName +
            "?",
            () => {
                if (preset.isDefault) {
                    Notification.create("Cannot delete a default preset.", 2000)
                    return
                }
                getPresetHandler().customPresets.splice(
                    getPresetHandler().customPresets.indexOf(preset),
                    1
                )
                getPresetHandler().setPreset(getPresetHandler().defaultPresets[0])
                setSettingList(
                    "particlePreset",
                    getPresetHandler().getAllPresetNames(),
                    getPresetHandler().currentPreset.particlePresetName
                )
                saveCurrentPresetSettings(thePresetHandler.getCustomPresets())
            }
        )
    }
}
export const renameParticleType = (typeName, setHtmlCallback) => {
    if (getPresetHandler().currentPreset.isDefault) {
        Notification.create("Cannot rename a default preset type.", 2000)
        return
    }
    let type = thePresetHandler.currentPreset.getType(typeName)
    if (type) {
        InputDialog.create(
            "New type name: ",
            newName => {
                type.particleTypeName = newName
                setHtmlCallback(newName)
                setSettingUI("particleTypeName", newName)
                saveCurrentPresetSettings(thePresetHandler.getCustomPresets())
            },
            typeName
        )
    }
}
export const deleteCurrentParticlePreset = () => {
    ConfirmDialog.create(
        "Are you sure you want to delete the Preset " +
        getPresetHandler().currentPreset.particlePresetName +
        "?",
        () => {
            if (getPresetHandler().currentPreset.isDefault) {
                Notification.create("Cannot delete a default preset.", 2000)
                return
            }
            getPresetHandler().customPresets.splice(
                getPresetHandler().customPresets.indexOf(
                    getPresetHandler().currentPreset
                ),
                1
            )
            getPresetHandler().setPreset(getPresetHandler().defaultPresets[0])
            setSettingList(
                "particlePreset",
                getPresetHandler().getAllPresetNames(),
                getPresetHandler().currentPreset.particlePresetName
            )
            saveCurrentPresetSettings(thePresetHandler.getCustomPresets())
        }
    )
}

export const createNewParticleType = () => {
    thePresetHandler.createAndSetType()
    saveCurrentPresetSettings(thePresetHandler.getCustomPresets())
}
export const deleteParticleType = typeName => {
    let preset = thePresetHandler.currentPreset
    let type = preset.getType(typeName)

    if (type) {
        ConfirmDialog.create(
            "Are you sure you want to delete the particle type " +
            type.particleTypeName +
            "?",
            () => {
                if (preset.isDefault) {
                    Notification.create("Cannot delete a default preset type.", 2000)
                    return
                }
                if (thePresetHandler.currentPreset.types.length < 2) {
                    Notification.create(
                        "Cannot delete. At least one type per preset required.",
                        2000
                    )
                    return
                }

                getPresetHandler().currentPreset.types.splice(
                    getPresetHandler().currentPreset.types.indexOf(type),
                    1
                )
                getPresetHandler().setType(getPresetHandler().currentPreset.types[0])
                setSettingList(
                    "particlePresetType",
                    getPresetHandler().getCurrentPresetTypeNames(),
                    getPresetHandler().currentPreset.particlePresetName
                )
                saveCurrentPresetSettings(thePresetHandler.getCustomPresets())
            }
        )
    }
}
export const deleteCurrentParticleType = () => {
    ConfirmDialog.create(
        "Are you sure you want to delete the Type " +
        getPresetHandler().currentType.particleTypeName +
        "?",
        () => {
            if (getCurrentParticleTypes().length < 2) {
                Notification.create("Cannot delete. At least 1 type required.", 2000)
                return
            }
            getPresetHandler().currentPreset.types.splice(
                getPresetHandler().currentPreset.types.indexOf(
                    getPresetHandler().currentType
                ),
                1
            )
            getPresetHandler().setType(getPresetHandler().currentPreset.types[0])
            setSettingList(
                "particlePresetType",
                getPresetHandler().getCurrentPresetTypeNames(),
                getPresetHandler().currentType.particleTypeName
            )
            saveCurrentPresetSettings(thePresetHandler.getCustomPresets())
        }
    )
}

export const getCurrentParticleTypes = () => {
    return getPresetHandler().getCurrentPresetTypes()
}