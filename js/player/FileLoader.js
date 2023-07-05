import {
    getLoader
} from "../ui/Loader.js"

export class FileLoader {
    static async loadSongFromURL(url, callback, name) {
        getLoader().setLoadMessage(`Loading Song: ${name ? name : url}`)
        const response = fetch(url, {
            method: "GET"
        }).then(response => {
            const filename = url
            response.blob().then(blob => {
                const reader = new FileReader()
                reader.onload = function(theFile) {
                    callback(reader.result, filename, () => {})
                }
                reader.readAsDataURL(blob)
            })
        })
    }
}