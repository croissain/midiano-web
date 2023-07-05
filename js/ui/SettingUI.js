import {
    functionKeys
} from "../InputListeners.js"
import {
    resetSettingsToDefault
} from "../settings/Settings.js"
import {
    DomHelper
} from "../ui/DomHelper.js"
import {
    ConfirmDialog
} from "./ConfirmDialog.js"
import {
    getKeyBinder
} from "./KeyBinder.js"
import {
    Notification
} from "./Notification.js"
import {
    createListGroupDiv,
    hideAllDialogs
} from "./UI.js"
/**
 * Class to create the DOM Elements used to manipulate the settings.
 */
export class SettingUI {
    constructor() {
        this.tabs = {}
        this.activeTab = "General"
        this.mainDiv = null
    }
    /**
     * returns a div with the following structure:
     * 	.settingsContainer {
     * 		.settingsTabButtonContainer {
     * 			.settingsTabButton ...
     * 		}
     * 		.settingsContentContainer {
     * 			.settingContainer ...
     * 		}
     * }
     *
     * @param {Object} settings  as defined in DefaultSettings.js
     */
    getSettingsDiv(settings) {
        if (this.mainDiv == null) {
            this.mainDiv = DomHelper.createDivWithClass("settingsContainer")
            this.mainDiv.appendChild(this.getTabDiv(Object.keys(settings)))
            this.mainDiv.appendChild(this.getContentDiv(settings))

            this.mainDiv
                .querySelectorAll(".settingsTabContent" + this.activeTab)
                .forEach(el => (el.style.display = "block"))
            this.mainDiv
                .querySelector("#" + this.activeTab + "Tab")
                .classList.add("selected")
        }
        return this.mainDiv
    }
    getTabDiv(tabIds) {
        let cont = DomHelper.createDivWithClass("settingsTabButtonContainer")
        tabIds
            .filter(tabId => tabId != "Hidden")
            .forEach(tabId => {
                let tabButton = this.createTabButton(tabId)
                tabButton.classList.add("settingsTabButton")
                cont.appendChild(tabButton)
            })
        return cont
    }
    createTabButton(tabName) {
        let butEl = DomHelper.createTextButton(tabName + "Tab", tabName, ev => {
            document
                .querySelectorAll(".settingsTabButton")
                .forEach(el => el.classList.remove("selected"))

            butEl.classList.add("selected")

            document
                .querySelectorAll(".settingsTabContentContainer")
                .forEach(settingEl => (settingEl.style.display = "none"))
            document
                .querySelectorAll(".settingsTabContent" + tabName)
                .forEach(settingEl => (settingEl.style.display = "block"))
        })
        return butEl
    }
    getContentDiv(settings) {
        let cont = DomHelper.createDivWithClass("settingsContentContainer")
        Object.keys(settings)
            .filter(tabId => tabId != "Hidden")
            .forEach(tabId => {
                cont.appendChild(
                    this.createSettingTabContentDiv(tabId, settings[tabId])
                )
            })

        return cont
    }
    createSettingTabContentDiv(tabName, settingGroups) {
        let cont = DomHelper.createDivWithClass(
            "settingsTabContentContainer settingsTabContent" + tabName
        )
        Object.keys(settingGroups).forEach(groupId =>
            cont.appendChild(
                createListGroupDiv(
                    groupId,
                    settingGroups[groupId],
                    SettingUI.createSettingDiv
                )
            )
        )
        if (tabName == "General") {
            cont.appendChild(this.getKeyToKeyboardBindingButton())
            cont.appendChild(this.getShowHotKeysButton())
            cont.appendChild(this.getClearKeyBindingButton())
            cont.appendChild(this.getResetButton())
        }
        // if (tabName == "Audio") {
        // 	cont.appendChild(this.getLoadSoundfontButton())
        // }
        return cont
    }
    // handleSoundfontFileSelect(evt) {
    // 	var files = evt.target.files
    // 	for (var i = 0, f; (f = files[i]); i++) {
    // 		this.readFile(f)
    // 	}
    // }
    // readFile(file) {
    // 	let reader = new FileReader()
    // 	let fileName = file.name
    // 	reader.onload = function (theFile) {
    // 		let sf2Data = new Uint8Array(reader.result)
    // 		var parser = new sf2.Parser(sf2Data, { parserOptions: {} })
    // 		parser.parse()
    // 		console.log(parser)
    // 		console.log(theFile)
    // 	}.bind(this)
    // 	reader.readAsArrayBuffer(file)
    // }
    // getLoadSoundfontButton() {
    // 	let but = DomHelper.createFileInput(
    // 		"Load Soundfont",

    // 		this.handleSoundfontFileSelect.bind(this)
    // 	)

    // 	return but
    // }
    getKeyToKeyboardBindingButton() {
        let but = DomHelper.createTextButton(
            "keyboardBinding",
            "Edit Key bindings",
            () => {
                if (getKeyBinder().done) {
                    hideAllDialogs()
                    getKeyBinder().start()
                }
            }
        )
        return but
    }
    getShowHotKeysButton() {
        let but = DomHelper.createTextButton("hotKeys", "Show hot keys", () => {
            hideAllDialogs()
            Notification.create(
                Object.keys(functionKeys)
                .map(
                    key =>
                    "<b>" +
                    functionKeys[key].name +
                    "</b>" +
                    " - " +
                    functionKeys[key].description
                )
                .join("<br>")
            )
        })
        return but
    }
    getClearKeyBindingButton() {
        let but = DomHelper.createTextButton(
            "clearKeyboardBinding",
            "Clear Key bindings",
            () => {
                ConfirmDialog.create("Reset all key bindings?", () =>
                    getKeyBinder().clear()
                )
            }
        )
        return but
    }
    getResetButton() {
        let but = DomHelper.createTextButton(
            "settingsResetButton",
            "Reset to defaults",
            () => {
                ConfirmDialog.create("Reset all settings to default?", () =>
                    resetSettingsToDefault()
                )
            }
        )
        return but
    }

    static createSettingDiv(setting) {
        switch (setting.type) {
            case "list":
                return SettingUI.createListSettingDiv(setting)
            case "dynList":
                return SettingUI.createDynamicListSettingDiv(setting)
            case "checkbox":
                return SettingUI.createCheckboxSettingDiv(setting)
            case "slider":
                return SettingUI.createSliderSettingDiv(setting)
            case "color":
                return SettingUI.createColorSettingDiv(setting)
            case "text":
                return SettingUI.createTextSettingDiv(setting)
            case "label":
                return SettingUI.createLabel(setting)
            case "button":
                return SettingUI.createButton(setting)
            case "buttonGroup":
                return SettingUI.createButtonGroup(setting)
        }
    }
    static createListSettingDiv(setting) {
        let el = DomHelper.createInputSelect(
            setting.label,
            setting.list,
            setting.value,
            setting.onChange
        )
        el.classList.add("settingContainer")
        setting.setUIValue = val => (el.querySelector("select").value = val)
        return el
    }
    static createDynamicListSettingDiv(setting) {
        let el = DomHelper.createDynamicInputSelect(
            setting.label,
            setting.list,
            setting.value,
            setting.onChange,
            setting.renameCallback,
            setting.createCallback,
            setting.deleteCallback
        )
        // el.classList.add("settingContainer")
        setting.setUIValue = val => (el.querySelector("select").value = val)
        return el
    }

    static createCheckboxSettingDiv(setting) {
        let el = DomHelper.createCheckbox(
            setting.label,
            setting.onChange,
            setting.value,
            setting.isChecked
        )
        el.classList.add("settingContainer")
        setting.setUIValue = val => (el.querySelector("input").checked = val)
        return el
    }
    static createTextSettingDiv(setting) {
        let el = DomHelper.createTextInputDiv(
            setting.label,
            setting.value,
            setting.onChange
        )
        el.classList.add("settingContainer")
        setting.setUIValue = val => (el.querySelector("input").value = val)
        return el
    }
    static createLabel(setting) {
        let el = DomHelper.createDiv({}, {
            innerHTML: setting.label
        })
        el.classList.add("settingContainer")
        el.classList.add("label")
        return el
    }
    static createSliderSettingDiv(setting) {
        let el = DomHelper.createSliderWithLabelAndField(
            setting.id + "Slider",
            setting.label,
            parseFloat(setting.value),
            setting.min,
            setting.max,
            setting.step,
            setting.onChange
        ).container
        el.classList.add("settingContainer")
        setting.setUIValue = val => {
            el.querySelector("input").value = val
            el.querySelector(".sliderVal").innerHTML = val
        }
        return el
    }
    static createColorSettingDiv(setting) {
        let picker = DomHelper.createColorPickerText(
            setting.label,
            setting.value,
            setting.onChange
        )
        setting.setUIValue = val => picker.colorPicker.setColor(val)
        return picker.cont
    }
    static createButton(setting) {
        let el = DomHelper.createTextButton(
            setting.id,
            setting.label,
            setting.onChange
        )
        el.classList.add("settingContainer")
        setting.setUIValue = val => {}
        return el
    }
    static createButtonGroup(setting) {
        let el = DomHelper.createDivWithClass("settingContainer")
        setting.buttons.forEach(button => {
            el.appendChild(this.createButton(button))
        })

        setting.setUIValue = val => {}
        return el
    }
}