import {
    DomHelper
} from "./js/ui/DomHelper.js"

const sections = {
    About: {
        lines: [
            "Midiano is an interactive Piano-learning app that runs on any device with a modern browser.",
            "Open any MIDI-File and Midiano shows you the notes as falling bars over a piano as well as the corresponding sheet music.",
            "Connect a MIDI-Keyboard to get instant feedback if you hit the correct notes.",
            " You can also use the keyboard as output device to play the MIDI-Files on your keyboard. ",
            "",
            "It runs on any browser (and device) that supports the <a href='https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API#browser_compatibility'>WebAudioAPI</a> (Full support apart from Internet Explorer). ",
            "To connect a MIDI-Keyboard the browser also needs to support the <a href='https://developer.mozilla.org/en-US/docs/Web/API/MIDIAccess#browser_compatibility'>WebMIDIAPI</a> (Currently only Chrome and Edge). "
        ]
    },
    "Development Roadmap": {
        lines: [
            "Here are a couple of ideas / planned future updates. If you have any ideas or suggestions feel free to open an issue on Github or send an Email."
        ],
        lists: [{
            title: "",
            bulletPoints: [
                "Sheet reading/listening exercises",
                "Note Recognition with microphone",
                "Implement MIDI-messages for soft and sostenuto pedals and pitch-shift",
                "Implement MIDI-messages (mainly pedals) when using a MIDI-Device as output. ",
                "Add another mode when playing along, where the song doesn't wait for you but scores the player if the right note is hit."
            ]
        }]
    },
    Updates: {
        lists: [{
                title: "21.03.23",
                bulletPoints: [
                    "Added button to view all hot-key bindings.",
                    "Added hotkeys to jump to different parts of the song (0-9).",
                    "Added setting to disable all hotkeys.",
                    "Stroke thickness now scales with the note width.",
                    "Piano should no longer block scrolling across it.",
                    "Adjusted some of the particle presets.",
                    "Fixed some particle settings not properly updating.",
                    "Fixed the key binding not properly rendering.",
                    "Lots of small improvements concerning accesibility and performance.",
                    "Added social icons & links and created a subreddit & discord & twitter account!"
                ]
            },
            {
                title: "11.02.23",
                bulletPoints: [
                    "Made Midiano installable! You can now install Midiano through your browser and use it offline. See if your <a href='https://caniuse.com/?search=PWA'>browser supports progressive web apps here</a>.",
                    "Fixed a memory leak that caused the particles to lag during garbage collection"
                ]
            },
            {
                title: "19.01.23",
                bulletPoints: [
                    "Added lots of new songs",
                    "Added opengraph support",
                    "Various fixes & improvements"
                ]
            },
            {
                title: "07.06.2022",
                bulletPoints: [
                    "Fixed Sheet-display not properly resizing",
                    "Fixed notes outside the 0-88 range causing Sheet-generation to fail. They are now ignored."
                ]
            },
            {
                title: "20.01.2022",
                bulletPoints: [
                    "Some performance improvements & fixed a memory leak with the sheet rendering"
                ]
            },
            {
                title: "19.01.2022",
                bulletPoints: [
                    "Improved the particle system: The turbulence setting now creates a much smoother effect. Also improved the shader performance and added a max texture size setting. Watch out when increasing this. Depending on your GPU it might crash your browser if set too high.",
                    "Some styling",
                    "Attempted to clean up the UI a little bit"
                ]
            },
            {
                title: "21.11.2021",
                bulletPoints: [
                    "Completely reworked the particle and piano-line system. They now work with shaders and should be much more performant. You can also save particle settings as presets now and combine different types of particles in a preset, allowing for much more creative freedom :)",
                    "Fixed some UI Bugs when resizing the window",
                    "Attempted to clean up the UI a little bit"
                ]
            },
            {
                title: "01.10.2021",
                bulletPoints: [
                    "Added convolver option with lots of Impulse responses for different reverb effects",
                    "Increased the default release times",
                    "Fixed some minor bugs"
                ]
            },
            {
                title: "30.09.2021",
                bulletPoints: [
                    "Added lots of settings for the line above the piano. Can now be animated as a squiggly glowing line",
                    "Added shrink and friction settings for particles",
                    "Added glow effect + settings for particles, notes and piano keys",
                    "Added settings for custom piano key colors",
                    "Fixed smoke particles rendering as rectangles."
                ]
            },
            {
                title: "28.09.2021",
                bulletPoints: [
                    "Added IndexedDB support. Uploaded MIDI-files are now saved in your browser.",
                    "Added a much nicer Piano soundfont. It's 13MB large, so it's disabled by default. You can enable it under Settings -> Audio -> Use HQ Piano Soundfont",
                    "Added Smoke particles",
                    "Added more particle settings + improved performance. They now glow and have a little nicer movement.",
                    "Added setting to toggle rendering of measure lines",
                    "Made then piano keys a little longer by default",
                    "Some small styling changes"
                ]
            },
            {
                title: "14.08.2021",
                bulletPoints: [
                    "Added keyboard bindings - You can now play with your computer keyboard and don't require a MIDI device to active play-along mode for tracks",
                    "Added Note labels - Showing either key bindings or note names",
                    "Changed the piano hit key effect",
                    "Fixed scrolling issues in full screen",
                    "Some other minor bug fixes"
                ]
            },
            {
                title: "10.08.2021",
                bulletPoints: [
                    "Added dynamic sizing of sheet display when screen is too small",
                    "Fixed clef not displaying properly for some key signatures",
                    "Fixed input notes not displaying correctly on staffs",
                    "Fixed too narrow black notes not displaying on small screens.",
                    "Modified some default settings for better performance."
                ]
            },
            {
                title: "08.08.2021",
                bulletPoints: [
                    "Added Sheet Music generation. Still has its faults. Especially when theres more than one voice in a staff. But it works fairly well with clean and simple MIDI files.",
                    "Fixed long notes disappearing too early",
                    "Restyled the landing page",
                    "Added some more example songs."
                ]
            },
            {
                title: "06.06.2021",
                bulletPoints: [
                    "Added a sandwich menu for smaller screens.",
                    "Clicking/Tapping the main window will now play/pause the song.",
                    "Added some more example songs."
                ]
            },
            {
                title: "18.04.2021",
                bulletPoints: [
                    "Added info-button on loaded songs - displays some information about the MIDI-file.",
                    "Fixed sustain control messages so that it only affects notes on the respective channel.",
                    "Fixed the note number not displaying correctly in the debug info on hover."
                ]
            },
            {
                title: "13.04.2021",
                bulletPoints: [
                    "Fixed names of black keys",
                    "Added setting to switch between ♭/# for black keys"
                ]
            },
            {
                title: "28.03.2021",
                bulletPoints: [
                    "Added setting for black input key color",
                    "Added seperate settings for top/bottom particles + settings for particle stroke and whether they're drawn in front of or behind the notes.",
                    "Piano-zoom is automatically set when loading a new song (there's a setting to turn that off)",
                    "Some more UI Improvements for smaller screen sizes"
                ]
            },
            {
                title: "27.03.2021",
                bulletPoints: [
                    "Added a landing page with some info",
                    "Fixed detection and rendering of beat/measure lines",
                    "Tracks are now split by instrument. So if the MIDI File just has one track but multiple instruments, it will display a track for each instrument.",
                    "Some fixes for touch-based devices",
                    "Added swatches of the default colors to the color pickers",
                    "Lots of other, smaller fixes or changes."
                ]
            }
        ]
    },
    Contact: {
        lines: [
            "If you find a bug or have a question, issue or recommendation, please let me know by opening an issue on <a href='https://github.com/Bewelge/MIDIano/issues'>Github</a> or send an E-Mail to <span id='m'></span>. "
            // "Please be patient if I don't manage to get back to you right away. I work a full-time job and occasionaly have to sleep ;-) "
        ]
    },
    Privacy: {
        lines: [
            "Cookies:",
            "This website uses LocalStorage to save the settings of midiano that you have customized. This is entirely functional.",
            "",
            "GoatCounter:",
            "This website uses <a href='https://www.goatcounter.com/'>GoatCounter</a> to track the amount of visits to this website. It tracks NO personal data. The following information is collected: ",
            "",
            "URL of the visited page.",
            "Referer header.",
            "User-Agent header.",
            "Screen size.",
            "Country based on IP address.",
            "A hash of the IP address, User-Agent, and random number.",
            "",
            "No personal information (such as IP address) is collected; a hash of the IP address, User-Agent, and a random number (“salt”) is kept in the process memory for 8 hours to identify a browsing session, and is never stored to disk."
        ]
    }
}

function getSectionContent(section) {
    let sectionWrapper = DomHelper.createDivWithClass("bulletList")
    let spanWrap = DomHelper.createElement("span")
    sectionWrapper.appendChild(spanWrap)

    if (section.hasOwnProperty("lines")) {
        section.lines.forEach(line => {
            spanWrap.innerHTML += line + "</br>"
        })
    }
    if (section.hasOwnProperty("lists")) {
        section.lists.forEach(list => {
            let str = "<br><br>" + "<b>" + list.title + "</b>"

            if (list.bulletPoints.length) {
                str += "<ul>"
            }
            list.bulletPoints.forEach(bulletPoint => {
                str += "<li>" + bulletPoint + "</li>"
            })
            if (list.bulletPoints.length) {
                str += "</ul>"
            }
            spanWrap.innerHTML += str
        })
    }
    return sectionWrapper
}
var tabDivs = {}
var sectionDivs = {}
var burgerDivs = {}
const generateTopTabButtons = divToAppendTo => {
    let wrapperDiv = DomHelper.createDivWithIdAndClass(
        "lpTopMenuWrapper",
        "lpTopDiv"
    )
    divToAppendTo.appendChild(wrapperDiv)
    let tabsWrapper = DomHelper.createDivWithIdAndClass(
        "lpTabsWrapper",
        "tabsWrapper"
    )
    let tabsWrapperSelectionLine = DomHelper.createDivWithId(
        "lpTabsWrapperSelectionLine"
    )
    tabsWrapper.appendChild(tabsWrapperSelectionLine)
    wrapperDiv.appendChild(tabsWrapper)
    let burgerButton = DomHelper.createDivWithIdAndClass(
        "lpBurgerButton",
        "burgerButton"
    )
    burgerButton.appendChild(
        DomHelper.createElementWithClass("glyphicon glyphicon-list", "span")
    )
    wrapperDiv.appendChild(burgerButton)
    let burgerWrapper = document.querySelector("#lpBurgerMenu")
    burgerButton.addEventListener("click", () => openBurger())
    divToAppendTo.appendChild(burgerWrapper)
    Object.keys(sections).forEach(sectionTitle => {
        let scrollToFunc = () => {
            document.getElementById("lpMainWrapper").scrollTop =
                sectionDivs[sectionTitle].offsetTop
        }

        let burgerDiv = DomHelper.createDivWithIdAndClass(
            sectionTitle + "BugerDiv",
            "burgerDiv"
        )
        burgerDiv.innerHTML = sectionTitle
        burgerDiv.addEventListener("click", () => {
            closeBurger()
            scrollToFunc()
        })
        burgerDivs[sectionTitle] = burgerDiv
        burgerWrapper.appendChild(burgerDiv)
        let tabDiv = DomHelper.createDivWithIdAndClass(
            sectionTitle + "tabDiv",
            "tabDiv"
        )
        let tabDivSpan = DomHelper.createElement("span")
        tabDivSpan.innerHTML = sectionTitle
        tabDiv.appendChild(tabDivSpan)
        tabDiv.addEventListener("click", scrollToFunc)
        tabDivs[sectionTitle] = tabDiv
        tabsWrapper.appendChild(tabDiv)
    })
}

function openBurger() {
    let sandwichMenuWrap = document.querySelector("#lpBurgerMenu")
    if (sandwichMenuWrap.classList.contains("burgerOpened")) {
        closeBurger()
        return
    }
    sandwichMenuWrap.classList.add("burgerOpened")
    sandwichMenuWrap.style.height = "85%"
    sandwichMenuWrap.style.top =
        document.querySelector("#lpTop").clientHeight + "px"

    window.setTimeout(() => (sandwichMenuWrap.style.overflowY = "auto"), 500)
}

function closeBurger() {
    let sandwichMenuWrap = document.querySelector("#lpBurgerMenu")
    sandwichMenuWrap.classList.remove("burgerOpened")
    sandwichMenuWrap.style.height = "0%"
    window.setTimeout(() => (sandwichMenuWrap.style.overflowY = "hidden"), 500)
}
const generateLandingPageContent = divToAppendTo => {
    Object.keys(sections).forEach(sectionTitle => {
        let sectionDiv = DomHelper.createDivWithIdAndClass(
            sectionTitle,
            "lpSection dottedBg"
        )

        let title = DomHelper.createElement("p", {}, {
            innerHTML: sectionTitle
        })
        sectionDiv.appendChild(title)

        let sectionContent = getSectionContent(sections[sectionTitle])
        sectionDiv.appendChild(sectionContent)

        sectionDivs[sectionTitle] = sectionDiv
        divToAppendTo.appendChild(sectionDiv)
    })
}
const generateStartPage = tapToStart => {
    let startBtn = document.querySelector("#startPage #startButton")
    let startClicked = false
    startBtn.onclick = ev => {
        if (!startClicked) {
            startClicked = true
            showAppPage(ev, tapToStart)
        }
    }
    let aboutBtn = document.querySelector("#startPage #aboutButton")
    let clicked = false
    aboutBtn.onclick = () => {
        if (!clicked) {
            clicked = true
            showLandingPage()

            window.setTimeout(() => (clicked = false), 500)
        }
    }
}

export const showAppPage = (ev, tapToStart) => {
    DomHelper.hideDiv(document.querySelector("#startPage .logo"), true)
    window.setTimeout(() => tapToStart(ev), 250)
}
export const showStartPage = () => {
    DomHelper.hideDiv(document.querySelector("#startPage .logo"), true)
    window.setTimeout(
        () => DomHelper.hideDiv(document.querySelector("#startPage"), true),
        250
    )
}
export const showLandingPage = () => {
    DomHelper.hideDiv(document.querySelector("#startPage .logo"), true)
    window.setTimeout(
        () => DomHelper.hideDiv(document.querySelector("#startPage"), true),
        250
    )
}

export const initLandingPage = (
    tabDivToAppendTo,
    contentDivToAppendTo,
    tapToStart
) => {
    generateStartPage(tapToStart)

    generateTopTabButtons(tabDivToAppendTo)
    generateLandingPageContent(contentDivToAppendTo)

    let mailBt = document.querySelector("#m")
    let aet = ")ta("
    mailBt.innerHTML = ("moc.onaidim" + aet + "tcatnoc")
        .split("")
        .reverse()
        .reduce((prev, cur) => prev + cur, "")
    let startButtons = document.querySelectorAll(".lpStartButton")
    startButtons.forEach(startButton => {
        startButton.style.opacity = 1
        startButton.style.pointerEvents = "all"
        startButton.onclick = tapToStart
    })

    document.querySelector("#lpMainWrapper").addEventListener("scroll", () => {
        let mainWrapper = document.querySelector("#lpMainWrapper")
        let offsetTop = document.querySelector("#About").offsetTop
        let scrollHeight = mainWrapper.scrollHeight - offsetTop
        let yStart = Math.max(0, (mainWrapper.scrollTop - offsetTop) / scrollHeight)
        let yEnd = Math.max(
            0,
            (mainWrapper.scrollTop + mainWrapper.clientHeight - offsetTop) /
            scrollHeight
        )

        let tabWd = document.querySelector("#lpTabsWrapper").clientWidth
        let tabSelectionLine = document.querySelector("#lpTabsWrapperSelectionLine")
        tabSelectionLine.style.left = Math.floor(yStart * tabWd) + "px"
        tabSelectionLine.style.width =
            Math.floor(Math.max(0, yEnd - yStart) * tabWd) + "px"
    })
}