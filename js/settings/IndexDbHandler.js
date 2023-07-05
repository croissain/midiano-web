class IndexDbHandler {
    constructor() {
        if (!window.indexedDB) {
            this.notSupported = true
        } else {
            this.db = null
            var request = window.indexedDB.open("UploadedSongsDb", 2)
            request.onerror = event => {
                console.log("Couldnt init DB - " + event.target.error)
            }
            request.onsuccess = event => {
                this.db = event.target.result
                console.log("DB Sucessfully initialized.")
                this.db.onerror = function(ev) {
                    console.error("Database error: " + ev.target.error)
                }
            }

            request.onupgradeneeded = event => {
                this.db = event.target.result
                let objectStore = this.db.createObjectStore("savedSongs", {
                    keyPath: "fileName"
                })
                objectStore.createIndex("fileName", "fileName", {
                    unique: true
                })
                objectStore.transaction.oncomplete = function(event) {
                    console.log(event)
                }
            }
        }
    }

    addSong(fileName, songData) {
        if (!this.db) return
        let saveObj = {
            fileName: fileName,
            song: songData
        }
        var transaction = this.db.transaction(["savedSongs"], "readwrite")
        transaction.oncomplete = event => {
            console.log("All done!")
        }

        transaction.onerror = event => {
            console.log("Error saving song to DB" + event.target.error)
        }

        var objectStore = transaction.objectStore("savedSongs")

        var request = objectStore.add(saveObj)
        request.onsuccess = event => {
            console.log("Song sucessfully saved " + fileName + " to DB")
        }
    }
    removeSong(fileName) {
        if (!this.db) return
        var request = this.db
            .transaction(["savedSongs"], "readwrite")
            .objectStore("savedSongs")
            .delete(fileName)
        request.onsuccess = () =>
            console.log("Sucessfully deleted " + fileName + " from DB.")
        request.onerror = event =>
            console.log("Error deleting  " + fileName + "  -  " + event.target.error)
    }
    loadSong(songName) {
        if (!this.db) return
        var transaction = this.db.transaction(["savedSongs"])
        var objectStore = transaction.objectStore("savedSongs")
        var request = objectStore.get(songName)
        return request
    }
    async getAllSongs() {
        if (!this.db) return
        var transaction = this.db.transaction(["savedSongs"])
        var objectStore = transaction.objectStore("savedSongs")
        var myIndex = objectStore.index("fileName")
        return myIndex.getAll()
    }
}
var theDb = new IndexDbHandler()
export const saveSongInDb = (fileName, midiData) => {
    theDb.addSong(fileName, midiData)
}
export const deleteSongInDb = songName => {
    theDb.removeSong(songName)
}
export const getSongFromDb = async fileName => theDb.loadSong(fileName)
export const getSongsFromDb = async () => theDb.getAllSongs()