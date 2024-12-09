/**
 * Manages focus trapping within specified containers
 */
class FocusTrap {
    /**
     * Initialize focus trap for a container
     * @param {HTMLElement} container - The container element to trap focus within
     */
    constructor(container) {
        this.container = container;
        this.focusableElements = [];
        this.firstFocusable = null;
        this.lastFocusable = null;
        this.updateFocusableElements();
    }

    /**
     * Updates the list of focusable elements within the container
     */
    updateFocusableElements() {
        // Comprehensive list of focusable selectors
        const selector = [
            "button:not([disabled])",
            "[href]",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "[tabindex]:not([tabindex='-1'])",
            ".history-entry"
        ].join(",");

        this.focusableElements = Array.from(
            this.container.querySelectorAll(selector)
        );

        this.firstFocusable = this.focusableElements[0];
        this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
    }

    /**
     * Enables focus trapping
     */
    enable() {
        this.updateFocusableElements();
        this.container.addEventListener("keydown", this.handleTab);
        this.setOutsideElementsInert(true);
        this.firstFocusable?.focus();
    }

    /**
     * Disables focus trapping
     */
    disable() {
        this.container.removeEventListener("keydown", this.handleTab);
        this.setOutsideElementsInert(false);
    }

    /**
     * Handles tab key navigation
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleTab = (e) => {
        if (e.key !== "Tab") return;

        if (e.shiftKey && document.activeElement === this.firstFocusable) {
            e.preventDefault();
            this.lastFocusable?.focus();
        } else if (!e.shiftKey && document.activeElement === this.lastFocusable) {
            e.preventDefault();
            this.firstFocusable?.focus();
        }
    };

    /**
     * Sets inert state for elements outside the container
     * @param {boolean} inert - Whether to set or remove inert attribute
     */
    setOutsideElementsInert(inert) {
        const allElements = document.querySelectorAll("body > *");
        allElements.forEach((element) => {
            if (!this.container.contains(element)) {
                if (inert) {
                    element.setAttribute("inert", "");
                    element.setAttribute("tabindex", "-1");
                } else {
                    element.removeAttribute("inert");
                    element.removeAttribute("tabindex");
                }
            }
        });
    }
}

export default FocusTrap; 