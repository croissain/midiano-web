import {
    DomHelper
} from "./DomHelper.js"

export class InputDialog {
    static create(message, confirmCallback, defaultVal = "") {
        let dialog = DomHelper.createDivWithClass("notification")

        let textPanel = DomHelper.createDivWithClass("notificationText")
        textPanel.innerHTML = message

        let inputPanel = DomHelper.createDivWithClass("btn-group spaceAround")
        let inputEl = DomHelper.createTextInput(() => {})
        inputEl.value = defaultVal
        inputPanel.appendChild(inputEl)

        let butPanel = DomHelper.createDivWithClass("btn-group spaceAround")

        let okBut = DomHelper.createTextButton("okBut", "Confirm", () => {
            document.body.removeChild(dialog)
            confirmCallback(inputEl.value)
        })
        let cancelBut = DomHelper.createTextButton("okBut", "Cancel", () =>
            document.body.removeChild(dialog)
        )

        DomHelper.appendChildren(butPanel, [okBut, cancelBut])
        dialog.appendChild(textPanel)
        dialog.appendChild(inputPanel)
        dialog.appendChild(butPanel)
        document.body.appendChild(dialog)
    }
}