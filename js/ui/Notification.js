import {
    DomHelper
} from "./DomHelper.js"

let notificationListener = null
let notifEl = null
export class Notification {
    static createPermanent(message, time) {
        return Notification.create(message, time, false)
    }
    static create(message, time, deletable = true) {
        if (deletable) {
            window.setTimeout(() => {
                notificationListener = Notification.remove
                document.body.addEventListener("click", notificationListener)
            }, 100)
        }
        notifEl = DomHelper.createDivWithClass("notification")
        notifEl.innerHTML = message
        document.body.appendChild(notifEl)
        if (time > 0) {
            window.setTimeout(() => this.remove(), time)
        }
        return notifEl
    }
    static remove() {
        if (notifEl) {
            document.body.removeChild(notifEl)
            document.body.removeEventListener("click", notificationListener)
            notifEl = null
            notificationListener = null
        }
    }
}