/**
 * TODO:
 * - Don't move Outdated label into middle
 *  => An "show resolved orientieren"
 * - maybe on page load is better for performance
 */
async function execute() {
    let config = {};

    const setLabelStyleToggled = (label) => {
        label.classList.add("bg-blue-2", "border-blue-light");
        label.classList.remove("text-gray", "color-border-secondary");
    }

    const setLabelStyleUnToggled = (label) => {
        label.classList.remove("bg-blue-2", "border-blue-light");
        label.classList.add("text-gray", "color-border-secondary");
    }

    const isToggled = (id) => {
        return config[id];
    }

    const toggleCommentContents = (header, hide) => {
        let nextSibling = header.nextElementSibling;
        while (nextSibling) {
            nextSibling.style.display = hide ? "none" : "inherit";
            nextSibling = nextSibling.nextElementSibling;
        }
    }

    const updateDomContent = (header, label, input, hide) => {
        if (hide) {
            setLabelStyleToggled(label);
            input.checked = true;
            toggleCommentContents(header, true);
        } else {
            setLabelStyleUnToggled(label);
            input.checked = false;
            toggleCommentContents(header, false);
        }
    }

    const createViewedButton = async (header, id) => {
        const existingButtion = header.querySelector(".hide-comment");
        // Don't add the same button twice
        if (existingButtion) {
            return;
            // TODO: rather use the existing input?
            // header.removeChild(existingButtion)
        }


        const wrapper = document.createElement("div");
        wrapper.className = "d-flex hide-comment";

        const label = document.createElement("label");

        label.className = "ml-2 mr-1 px-2 py-1 rounded-1 f6 text-normal d-flex flex-items-center border";
        label.style.cursor = "pointer";

        const input = document.createElement("input");
        input.className = "mr-1";
        input.type = "checkbox";
        input.addEventListener("click", async () => {
            if (isToggled(id)) {
                updateDomContent(header, label, input, false);
                config[id] = false;
            } else {
                updateDomContent(header, label, input, true);
                config[id] = true;
            }
            await browser.storage.sync.set(config);
        });

        // Initial state-set
        if (isToggled(id)) {
            updateDomContent(header, label, input, true);
        } else {
            updateDomContent(header, label, input, false);
        }

        const span = document.createElement("span");
        span.innerText = "Viewed";

        label.appendChild(input);
        label.appendChild(span);

        wrapper.appendChild(label);
        header.appendChild(wrapper);
    }


    const applyExtension = async (root) => {
        const commentContainers = root.getElementsByClassName("js-resolvable-timeline-thread-container");

        for (let i = 0; i < commentContainers.length; i++) {
            try {
                const containerHeader = commentContainers[i].querySelector(".file-header");

                // js-inline-comments-container
                const comment = commentContainers[i].querySelector(".review-comment");


                // Already resolved
                if (!comment) {
                    continue;
                }


                await createViewedButton(containerHeader, comment.id);
            } catch (e) {
                console.error(e)
            }

        }
    }

    config = await browser.storage.sync.get(undefined);

    const lineItemObserver = new MutationObserver((([{ target }]) => {
        applyExtension(target);
    }));

    const elementsToWatch = Array.from(document.getElementsByClassName("js-discussion"));

    // Add optional reloaded containers
    const itemContainer = document.getElementById("js-progressive-timeline-item-container");
    if (itemContainer) {
        elementsToWatch.push(itemContainer);
    }

    for (const item of elementsToWatch) {
        lineItemObserver.observe(item, { childList: true });
    }

    await applyExtension(document.body);


};

(async () => {
    try {
        await execute();
    } catch (e) {
        console.error(e);
        throw e;
    }
})();