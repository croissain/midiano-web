import {
    DomHelper
} from "./DomHelper.js"

export class ConfirmDialog {
    static create(message, confirmCallback) {
        let dialog = DomHelper.createDivWithClass("notification")

        let textPanel = DomHelper.createDivWithClass("notificationText")
        textPanel.innerHTML = message

        let butPanel = DomHelper.createDivWithClass("btn-group spaceAround")
        let okBut = DomHelper.createTextButton("okBut", "Yes", () => {
            document.body.removeChild(dialog)
            confirmCallback()
        })
        let cancelBut = DomHelper.createTextButton("okBut", "Cancel", () =>
            document.body.removeChild(dialog)
        )

        DomHelper.appendChildren(butPanel, [okBut, cancelBut])
        dialog.appendChild(textPanel)
        dialog.appendChild(butPanel)
        document.body.appendChild(dialog)
    }
}