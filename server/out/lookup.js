"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilenameFromRootBsconfig = exports.getFilenameFromBsconfig = exports.getSuffixAndPathFragmentFromBsconfig = exports.readBsConfig = exports.findFilePathFromProjectRoot = exports.replaceFileExtension = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const c = __importStar(require("./constants"));
const getCompiledFolderName = (moduleFormat) => {
    switch (moduleFormat) {
        case "es6":
            return "es6";
        case "es6-global":
            return "es6_global";
        case "commonjs":
        default:
            return "js";
    }
};
const replaceFileExtension = (filePath, ext) => {
    let name = path.basename(filePath, path.extname(filePath));
    return path.format({ dir: path.dirname(filePath), name, ext });
};
exports.replaceFileExtension = replaceFileExtension;
// Check if filePartialPath exists at directory and return the joined path,
// otherwise recursively check parent directories for it.
const findFilePathFromProjectRoot = (directory, // This must be a directory and not a file!
filePartialPath) => {
    if (directory == null) {
        return null;
    }
    let filePath = path.join(directory, filePartialPath);
    if (fs.existsSync(filePath)) {
        return filePath;
    }
    let parentDir = path.dirname(directory);
    if (parentDir === directory) {
        // reached the top
        return null;
    }
    return (0, exports.findFilePathFromProjectRoot)(parentDir, filePartialPath);
};
exports.findFilePathFromProjectRoot = findFilePathFromProjectRoot;
const readBsConfig = (projDir) => {
    try {
        let bsconfigFile = fs.readFileSync(path.join(projDir, c.bsconfigPartialPath), { encoding: "utf-8" });
        let result = JSON.parse(bsconfigFile);
        return result;
    }
    catch (e) {
        return null;
    }
};
exports.readBsConfig = readBsConfig;
// Collect data from bsconfig to be able to find out the correct path of
// the compiled JS artifacts.
const getSuffixAndPathFragmentFromBsconfig = (bsconfig) => {
    let pkgSpecs = bsconfig["package-specs"];
    let pathFragment = "";
    let module = c.bsconfigModuleDefault;
    let moduleFormatObj = { module: module };
    let suffix = c.bsconfigSuffixDefault;
    if (pkgSpecs) {
        if (!Array.isArray(pkgSpecs) &&
            typeof pkgSpecs !== "string" &&
            pkgSpecs.module) {
            moduleFormatObj = pkgSpecs;
        }
        else if (typeof pkgSpecs === "string") {
            module = pkgSpecs;
        }
        else if (Array.isArray(pkgSpecs) && pkgSpecs[0]) {
            if (typeof pkgSpecs[0] === "string") {
                module = pkgSpecs[0];
            }
            else {
                moduleFormatObj = pkgSpecs[0];
            }
        }
    }
    if (moduleFormatObj["module"]) {
        module = moduleFormatObj["module"];
    }
    if (!moduleFormatObj["in-source"]) {
        pathFragment = "lib/" + getCompiledFolderName(module);
    }
    if (moduleFormatObj.suffix) {
        suffix = moduleFormatObj.suffix;
    }
    else if (bsconfig.suffix) {
        suffix = bsconfig.suffix;
    }
    return [suffix, pathFragment];
};
exports.getSuffixAndPathFragmentFromBsconfig = getSuffixAndPathFragmentFromBsconfig;
const getFilenameFromBsconfig = (projDir, partialFilePath) => {
    let bsconfig = (0, exports.readBsConfig)(projDir);
    if (!bsconfig) {
        return null;
    }
    let [suffix, pathFragment] = (0, exports.getSuffixAndPathFragmentFromBsconfig)(bsconfig);
    let compiledPartialPath = (0, exports.replaceFileExtension)(partialFilePath, suffix);
    return path.join(projDir, pathFragment, compiledPartialPath);
};
exports.getFilenameFromBsconfig = getFilenameFromBsconfig;
// Monorepo helpers
const getFilenameFromRootBsconfig = (projDir, partialFilePath) => {
    let rootBsConfigPath = (0, exports.findFilePathFromProjectRoot)(path.join("..", projDir), c.bsconfigPartialPath);
    if (!rootBsConfigPath) {
        return null;
    }
    let rootBsconfig = (0, exports.readBsConfig)(path.dirname(rootBsConfigPath));
    if (!rootBsconfig) {
        return null;
    }
    let [suffix, pathFragment] = (0, exports.getSuffixAndPathFragmentFromBsconfig)(rootBsconfig);
    let compiledPartialPath = (0, exports.replaceFileExtension)(partialFilePath, suffix);
    return path.join(projDir, pathFragment, compiledPartialPath);
};
exports.getFilenameFromRootBsconfig = getFilenameFromRootBsconfig;
//# sourceMappingURL=lookup.js.map