import { DomHelper } from "./DomHelper.js";
class Loader {
  startLoad() {
    let loadingDiv = this.getLoadingDiv();
    // loadingDiv.style.opacity = "1"
    DomHelper.showDiv(loadingDiv);
    this.getLoadingText().innerHTML = "Loading";
    this.loading = false;
    // this.loadAnimation()
  }

  stopLoad() {
    DomHelper.hideDiv(this.getLoadingDiv(), true);
    this.loading = false;
  }
  // loadAnimation() {
  // 	let currentText = this.getLoadingText().innerHTML
  // 	currentText = currentText.replace("...", " ..")
  // 	currentText = currentText.replace(" ..", ". .")
  // 	currentText = currentText.replace(". .", ".. ")
  // 	currentText = currentText.replace(".. ", "...")
  // 	this.getLoadingText().innerHTML = currentText
  // 	if (this.loading) {
  // 		window.requestAnimationFrame(this.loadAnimation.bind(this))
  // 	}
  // }
  setLoadMessage(msg) {
    this.getLoadingText().innerHTML = msg + "...";
  }
  getLoadingText() {
    if (!this.loadingText) {
      this.getLoadingDiv();
      this.loadingText = DomHelper.createElement("p");
      this.textDiv.appendChild(this.loadingText);
    }
    return this.loadingText;
  }
  getLoadingDiv() {
    if (!this.loadingDiv) {
      this.loadingDiv = DomHelper.createDivWithIdAndClass(
        "loadingDiv",
        "fullscreen"
      );
      let logo = document.createElement("img");
      logo.className = "logo";
      logo.src = "./images/logo3.svg";
      logo.onload = () => {};

      this.textDiv = DomHelper.createDivWithClass("loadingText");
      let spinner = DomHelper.createSpinner();

      this.loadingDiv.appendChild(
        DomHelper.createDiv({
          flex: 3,
        })
      );
      this.loadingDiv.appendChild(logo);
      this.loadingDiv.appendChild(
        DomHelper.createDiv({
          flex: 0.5,
        })
      );
      this.loadingDiv.appendChild(spinner);
      this.loadingDiv.appendChild(
        DomHelper.createDiv({
          flex: 0.5,
        })
      );
      this.loadingDiv.appendChild(this.textDiv);
      this.loadingDiv.appendChild(
        DomHelper.createDiv({
          flex: 2,
        })
      );

      document.body.appendChild(this.loadingDiv);
    }
    return this.loadingDiv;
  }
}

export const getLoader = () => loaderSingleton;
const loaderSingleton = new Loader();
