const sass = require('sass');
const path = require('path');
const fs = require('fs');

const style = path.join(__dirname, "scss", "style.scss");

function compile(dest) {
    const result = sass.compile(style, {
        style: "compressed",
        alertColor: true,
    });

    if (dest == undefined) {
        dest = "dist";
    }

    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
    }

    fs.writeFileSync(path.join(dest, "style.css"), result.css);
    return result.loadedUrls;
}

/**
 * 
 * @param {Array<string>} files
 * @returns {Promise<{event: string, filename: string}>}
 */
function watch_files(files) {
    return new Promise((resolve, reject) => {
        let watchers = [];
        let on_change = (event, filename) => {
            for (let watcher of watchers) {
                watcher.close();
            }
            resolve({
                event,
                filename
            });
        };
        for (let file of files) {
            watchers.push(fs.watch(file, on_change));
        }
    });
}


async function watch(dest) {
    console.log("Compiling and watching for changes..");
    let files = [];
    while (true) {
        try {
            let loadedUrls = compile(dest);
            files = [];
            for (let loadedUrl of loadedUrls) {
                if (loadedUrl.protocol == "file:") {
                    files.push(loadedUrl.pathname);
                }
            }
            console.log("Success!");
        } catch (err) {
            console.error(err);
        }
        if (files.length == 0) {
            console.error("Unable to watch for file changes");
            break;
        }
        let result = await watch_files(files);
        console.clear();
        console.log(`${result.filename} changed, recompiling..`);
    }
}

const args = process.argv.slice(2);

var dest = undefined;
var watch_mode = false;

for (let arg of args) {
    if (arg.startsWith("--")) {
        if (arg == "--watch") {
            watch_mode = true;
        }
    } else {
        dest = arg;
    }
}

if (watch_mode) {
    watch(dest);
} else {
    compile(dest);
}