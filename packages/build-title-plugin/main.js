const fs = require("fs");
const path = require("path");

const GAME_TITLE = "休闲游戏";

function onBuildFinished(options, callback) {
    try {
        if (!options || options.platform !== "web-mobile") {
            callback && callback();
            return;
        }

        const indexPath = path.join(options.dest, "index.html");

        if (!fs.existsSync(indexPath)) {
            Editor.warn("[build-title-plugin] index.html not found: " + indexPath);
            callback && callback();
            return;
        }

        let html = fs.readFileSync(indexPath, "utf8");

        html = html.replace(
            /<title>.*?<\/title>/,
            `<title>${GAME_TITLE}</title>`
        );

        fs.writeFileSync(indexPath, html, "utf8");

        Editor.log("[build-title-plugin] title changed: " + GAME_TITLE);
    } catch (e) {
        Editor.error("[build-title-plugin] error: " + e.message);
    }

    callback && callback();
}

module.exports = {
    load() {
        Editor.log("[build-title-plugin] loaded");

        if (Editor.Builder) {
            Editor.Builder.on("build-finished", onBuildFinished);
        }
    },

    unload() {
        if (Editor.Builder) {
            Editor.Builder.removeListener("build-finished", onBuildFinished);
        }
    }
};