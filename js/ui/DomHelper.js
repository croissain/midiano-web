import {
    CONST
} from "../data/CONST.js"
import {
    replaceAllString
} from "../Util.js"

export class DomHelper {
    static createCanvas(width, height, styles) {
        return DomHelper.createElement("canvas", styles, {
            width: width,
            height: height
        })
    }
    static hideDiv(div, top) {
        div.style.opacity = 0
        div.classList.add("hidden")
        if (top) {
            div.classList.add("hideTop")
        } else {
            div.classList.add("hideLeft")
        }
        div.classList.remove("unhidden")
    }
    static showDiv(div) {
        div.style.opacity = 1
        div.classList.remove("hideTop")
        div.classList.remove("hideLeft")
        div.classList.remove("hidden")
        div.classList.add("unhidden")
    }
    static createSpinner() {
        let spinner = DomHelper.createDivWithIdAndClass("loadSpinner", "loader")
        spinner.appendChild(document.createElement("div"))
        spinner.appendChild(document.createElement("div"))
        return spinner
    }
    static setCanvasSize(cnv, width, height) {
        if (cnv.width != width) {
            cnv.width = width
        }
        if (cnv.height != height) {
            cnv.height = height
        }
    }
    static replaceGlyph(element, oldIcon, newIcon) {
        element.children.forEach(childNode => {
            if (childNode.classList.contains("glyphicon-" + oldIcon)) {
                childNode.className = childNode.className.replace(
                    "glyphicon-" + oldIcon,
                    "glyphicon-" + newIcon
                )
            }
        })
    }
    static removeClass(className, element) {
        if (element.classList.contains(className)) {
            element.classList.remove(className)
        }
    }
    static removeClassFromElementsSelector(selector, className) {
        document.querySelectorAll(selector).forEach(el => {
            if (el && el.classList.contains(className)) {
                el.classList.remove(className)
            }
        })
    }
    static createSliderWithLabel(id, label, val, min, max, step, onChange) {
        let cont = DomHelper.createElement(
            "div", {}, {
                id: id + "container",
                className: "sliderContainer"
            }
        )
        let labelDiv = DomHelper.createElement(
            "label", {}, {
                id: id + "label",
                className: "sliderLabel",
                innerHTML: label
            }
        )
        let slider = DomHelper.createSlider(id, val, min, max, step, onChange)
        cont.appendChild(labelDiv)
        cont.appendChild(slider)
        return {
            slider: slider,
            container: cont
        }
    }
    static createSliderWithLabelAndField(
        id,
        label,
        val,
        min,
        max,
        step,
        onChange
    ) {
        let displayDiv = DomHelper.createElement(
            "div", {}, {
                id: id + "Field",
                className: "sliderVal",
                innerHTML: val
            }
        )

        let onChangeInternal = ev => {
            displayDiv.innerHTML = ev.target.value
            onChange(ev.target.value)
        }

        let cont = DomHelper.createElement(
            "div", {}, {
                id: id + "container",
                className: "sliderContainer"
            }
        )
        let labelDiv = DomHelper.createElement(
            "label", {}, {
                id: id + "label",
                className: "sliderLabel",
                innerHTML: label
            }
        )
        let slider = DomHelper.createSlider(
            id,
            val,
            min,
            max,
            step,
            onChangeInternal
        )
        cont.appendChild(labelDiv)
        cont.appendChild(displayDiv)
        cont.appendChild(slider)

        return {
            slider: slider,
            container: cont
        }
    }
    static createGlyphiconButton(id, glyph, onClick) {
        let bt = DomHelper.createButton(id, onClick)
        bt.appendChild(this.getGlyphicon(glyph))
        return bt
    }
    static createGlyphiconTextButton(id, glyph, text, onClick) {
        let bt = DomHelper.createButton(id, onClick)
        bt.appendChild(this.getGlyphicon(glyph))
        bt.innerHTML += " " + text
        return bt
    }
    static createDiv(styles, attributes) {
        return DomHelper.createElement("div", styles, attributes)
    }
    static createDivWithId(id, styles, attributes) {
        attributes = attributes || {}
        attributes.id = id
        return DomHelper.createElement("div", styles, attributes)
    }
    static createDivWithClass(className, styles, attributes) {
        attributes = attributes || {}
        attributes.className = className
        return DomHelper.createElement("div", styles, attributes)
    }
    static createDivWithIdAndClass(id, className, styles, attributes) {
        attributes = attributes || {}
        attributes.id = id
        attributes.className = className
        return DomHelper.createElement("div", styles, attributes)
    }
    static createElementWithId(id, tag, styles, attributes) {
        attributes = attributes || {}
        attributes.id = id
        return DomHelper.createElement(tag, styles, attributes)
    }
    static createElementWithClass(className, tag, styles, attributes) {
        attributes = attributes || {}
        attributes.className = className
        return DomHelper.createElement(tag, styles, attributes)
    }
    static createElementWithIdAndClass(id, className, tag, styles, attributes) {
        styles = styles || {}
        attributes = attributes || {}
        attributes.id = id
        attributes.className = className
        return DomHelper.createElement(tag, styles, attributes)
    }
    static getGlyphicon(name) {
        return DomHelper.createElement(
            "span", {}, {
                className: "glyphicon glyphicon-" + name
            }
        )
    }
    static createSlider(id, val, min, max, step, onChange) {
        let el = DomHelper.createElement(
            "input", {}, {
                id: id,
                oninput: onChange,
                type: "range",
                value: val,
                min: min,
                max: max,
                step: step
            }
        )
        el.value = val
        return el
    }
    static createTextInput(onChange, styles, attributes) {
        attributes = attributes || {}
        attributes.type = "text"
        attributes.onchange = onChange
        return DomHelper.createElement("input", styles, attributes)
    }
    static createTextInputDiv(label, value, onChange) {
        let cont = DomHelper.createDiv()
        let labelEl = DomHelper.createElement("label")
        labelEl.innerHTML = label
        cont.appendChild(labelEl)
        cont.appendChild(this.createTextInput(onChange, {}, {
            value: value
        }))

        return cont
    }
    static createCheckbox(text, onChange, value, isChecked) {
        let id = replaceAllString(text, " ", "") + "checkbox"
        let cont = DomHelper.createDivWithIdAndClass(id, "checkboxCont")
        let checkbox = DomHelper.createElementWithClass("checkboxInput", "input")
        checkbox.setAttribute("type", "checkbox")
        checkbox.checked = value
        checkbox.setAttribute("name", id)
        checkbox.onchange = onChange

        let label = DomHelper.createElementWithClass(
            "checkboxlabel",
            "label", {}, {
                innerHTML: text,
                for: id
            }
        )

        label.setAttribute("for", id)

        cont.appendChild(label)
        cont.appendChild(checkbox)
        cont.addEventListener("click", ev => {
            if (ev.target != checkbox) {
                checkbox.click()
                if (isChecked) {
                    checkbox.checked = isChecked()
                }
            }
        })
        return cont
    }
    static addClassToElements(className, elements) {
        elements.forEach(element => DomHelper.addClassToElement(className, element))
    }
    static addClassToElement(className, element) {
        if (element && !element.classList.contains(className)) {
            element.classList.add(className)
        }
    }
    static createFlexContainer() {
        return DomHelper.createElement("div", {}, {
            className: "flexContainer"
        })
    }
    static addToFlexContainer(el) {
        let cont = DomHelper.createFlexContainer()
        cont.appendChild(el)
        return cont
    }
    static appendChildren(parent, children) {
        children.forEach(child => parent.appendChild(child))
    }
    static createButtonGroup(vertical) {
        return vertical ?
            DomHelper.createElement(
                "div", {
                    justifyContent: "space-around"
                }, {
                    className: "btn-group btn-group-vertical",
                    role: "group"
                }
            ) :
            DomHelper.createElement(
                "div", {
                    justifyContent: "space-around"
                }, {
                    className: "btn-group",
                    role: "group"
                }
            )
    }
    static createFileInput(text, callback) {
        let customFile = DomHelper.createElement(
            "label", {}, {
                className: "btn btn-default btn-file"
            }
        )
        customFile.appendChild(DomHelper.getGlyphicon("folder-open"))
        customFile.innerHTML += " " + text
        let inp = DomHelper.createElement(
            "input", {
                display: "none"
            }, {
                type: "file"
            }
        )

        customFile.appendChild(inp)
        inp.onchange = callback

        return customFile
    }
    static getDivider() {
        return DomHelper.createElement("div", {}, {
            className: "divider"
        })
    }
    static createButton(id, onClick) {
        let bt = DomHelper.createElement(
            "button", {}, {
                id: id,
                type: "button",
                className: "btn btn-default",
                onclick: onClick
            }
        )
        bt.appendChild(DomHelper.getButtonSelectLine())
        return bt
    }
    static createTextButton(id, text, onClick) {
        let bt = DomHelper.createElement(
            "button", {}, {
                id: id,
                type: "button",
                className: "btn btn-default",
                onclick: onClick,
                innerHTML: text
            }
        )
        bt.appendChild(DomHelper.getButtonSelectLine())
        return bt
    }
    static getButtonSelectLine() {
        return DomHelper.createDivWithClass("btn-select-line")
    }
    static createElement(tag, styles, attributes) {
        tag = tag || "div"
        attributes = attributes || {}
        styles = styles || {}
        let el = document.createElement(tag)
        Object.keys(attributes).forEach(attr => {
            el[attr] = attributes[attr]
        })
        Object.keys(styles).forEach(style => {
            el.style[style] = styles[style]
        })
        return el
    }

    static createDynamicInputSelect(
        title,
        items,
        value,
        selectCallback,
        renameCallback,
        createCallback,
        deleteCallback
    ) {
        let selectBoxOuter = DomHelper.createDivWithIdAndClass(
            title,
            "dynSettingContOuter"
        )
        let selectBoxInner = DomHelper.createDivWithClass("dynSettingContInner")
        let selectBoxList = DomHelper.createDivWithClass("dynSettingList")

        let addButton = DomHelper.createGlyphiconTextButton(
            "add" + title,
            "plus-sign",
            "New",
            createCallback
        )

        let label = DomHelper.createElementWithClass(
            "dynSettingLabel",
            "label", {}, {
                innerHTML: title
            }
        )
        selectBoxOuter.appendChild(selectBoxInner)
        let firstRow = DomHelper.createDivWithClass("dynSettingRow")

        firstRow.appendChild(label)
        firstRow.appendChild(addButton)

        selectBoxInner.appendChild(firstRow)
        selectBoxInner.appendChild(selectBoxList)

        selectBoxOuter.updateList = (list, val) => {
            selectBoxList
                .querySelectorAll(".dynSettingOptionOuter")
                .forEach(option => option.parentNode.removeChild(option))
            list.forEach(item => {
                let el = DomHelper.createDynamicInputSelectOption(
                    item,
                    () => {
                        selectCallback(item)

                        selectBoxInner
                            .querySelectorAll(".dynSettingOptionOuter")
                            .forEach(opt => {
                                opt.classList.remove("selected")
                            })
                        el.classList.add("selected")
                    },
                    setHtmlCallback => {
                        renameCallback(item, setHtmlCallback)
                    },
                    () => deleteCallback(item)
                )

                if (item == val) {
                    el.classList.add("selected")
                }
                selectBoxList.appendChild(el)
            })
        }
        selectBoxOuter.updateList(items, value)
        return selectBoxOuter
    }
    static createDynamicInputSelectOption(
        txt,
        selectCallback,
        renameCallback,
        deleteCallback
    ) {
        let optionOuter = DomHelper.createDivWithIdAndClass(
            txt,
            "dynSettingOptionOuter"
        )

        let txtElement = DomHelper.createDivWithClass("dynSettingOptionLabel")
        txtElement.innerHTML = txt

        let delButton = DomHelper.createGlyphiconButton(
            "dynInputOptionDel" + txt.trim(),
            "remove",
            deleteCallback
        )
        let renameButton = DomHelper.createGlyphiconButton(
            "dynInputOptionRename" + txt.trim(),
            "pencil",
            () => {
                let setHtmlName = newTxt => (txtElement.innerHTML = newTxt)
                renameCallback(setHtmlName)
            }
        )

        optionOuter.appendChild(txtElement)
        optionOuter.appendChild(renameButton)
        optionOuter.appendChild(delButton)

        optionOuter.onclick = () => {
            if (optionOuter.classList.contains("selected")) return
            selectCallback()
        }

        // renameButton.onclick = () => {
        // 	let setHtmlName = () => (txtElement.innerHTML = newTxt)
        // 	renameCallback(setHtmlName)
        // }
        delButton.onclick = deleteCallback

        return optionOuter
    }
    static createInputSelect(title, items, value, callback) {
        let selectBox = DomHelper.createDivWithId(title)
        let label = DomHelper.createElementWithClass(
            "inputSelectLabel",
            "label", {}, {
                innerHTML: title
            }
        )
        selectBox.appendChild(label)
        let selectTag = DomHelper.createElementWithIdAndClass(
            title,
            "inputSelect",
            "select"
        )
        selectBox.appendChild(selectTag)
        selectBox.addEventListener("change", ev => {
            callback(selectTag.value)
        })
        selectBox.updateList = (list, val) => {
            selectTag
                .querySelectorAll("option")
                .forEach(option => option.parentNode.removeChild(option))
            list.forEach(item => {
                let option = DomHelper.createElement(
                    "option", {}, {
                        value: item,
                        innerHTML: item
                    }
                )
                if (item == val) {
                    option.selected = true
                }
                selectTag.appendChild(option)
            })
        }
        selectBox.updateList(items, value)
        return selectBox
    }

    static createColorPickerGlyphiconText(glyph, text, startColor, onChange) {
        let pickrEl = null
        let pickrElCont = DomHelper.createDiv()
        let glyphBut = DomHelper.createGlyphiconTextButton(
            "colorPickerGlyph" + glyph + replaceAllString(text, " ", "_"),
            glyph,
            text,
            () => {
                pickrEl.show()
            }
        )

        glyphBut.appendChild(pickrElCont)

        pickrEl = Pickr.create({
            el: pickrElCont,
            theme: "nano",
            useAsButton: true,
            swatches: Object.keys(CONST.TRACK_COLORS)
                .map(key => CONST.TRACK_COLORS[key])
                .flat(),
            components: {
                hue: true,
                preview: true,
                opacity: true,
                interaction: {
                    input: true
                }
            }
        })

        let getGlyphEl = () =>
            glyphBut.querySelector(
                "#colorPickerGlyph" +
                glyph +
                replaceAllString(text, " ", "_") +
                " .glyphicon"
            )

        pickrEl.on("init", () => {
            pickrEl.setColor(startColor)
            getGlyphEl().style.color = startColor
        })
        pickrEl.on("change", color => {
            let colorString = color.toRGBA().toString()
            getGlyphEl().style.color = colorString
            onChange(colorString)
        })
        return glyphBut
    }
    /**
     *
     * @param {String} text
     * @param {String} startColor
     * @param {Function} onChange  A color string of the newly selected color will be passed as argument
     */
    static createColorPickerText(text, startColor, onChange) {
        let cont = DomHelper.createDivWithClass("settingContainer")

        let label = DomHelper.createDivWithClass(
            "colorLabel settingLabel", {}, {
                innerHTML: text
            }
        )

        let colorButtonContainer = DomHelper.createDivWithClass(
            "colorPickerButtonContainer"
        )
        let colorButton = DomHelper.createDivWithClass("colorPickerButton")
        colorButtonContainer.appendChild(colorButton)

        cont.appendChild(label)
        cont.appendChild(colorButtonContainer)
        let colorPicker = Pickr.create({
            el: colorButton,
            theme: "nano",
            defaultRepresentation: "RGBA",
            swatches: Object.keys(CONST.TRACK_COLORS)
                .map(key => [
                    CONST.TRACK_COLORS[key].white,
                    CONST.TRACK_COLORS[key].black
                ])
                .flat(),
            components: {
                hue: true,
                preview: true,
                opacity: true,
                interaction: {
                    input: true
                }
            }
        })
        colorButtonContainer.style.backgroundColor = startColor
        cont.onclick = () => colorPicker.show()
        colorPicker.on("init", () => {
            colorPicker.show()
            colorPicker.setColor(startColor)
            colorPicker.hide()
        })
        colorPicker.on("change", color => {
            let arr = color.toRGBA()
            let roundedArr = [
                Math.floor(1 * arr[0]) / 1,
                Math.floor(1 * arr[1]) / 1,
                Math.floor(1 * arr[2]) / 1,
                arr[3]
            ]
            let str =
                "rgba(" +
                roundedArr[0] +
                "," +
                roundedArr[1] +
                "," +
                roundedArr[2] +
                "," +
                roundedArr[3] +
                ")"
            colorButtonContainer.style.backgroundColor = str
            onChange(str)
        })

        return {
            cont,
            colorPicker
        }
    }
}