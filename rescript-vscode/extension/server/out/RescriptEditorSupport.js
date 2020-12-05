"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCompletionCommand = exports.runDumpCommand = exports.binaryExists = void 0;
const url_1 = require("url");
const utils = __importStar(require("./utils"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
let binaryPath = path.join(path.dirname(__dirname), process.platform, "rescript-editor-support.exe");
exports.binaryExists = fs_1.default.existsSync(binaryPath);
let findExecutable = (uri) => {
    let filePath = url_1.fileURLToPath(uri);
    let projectRootPath = utils.findProjectRootOfFile(filePath);
    if (projectRootPath == null || !exports.binaryExists) {
        return null;
    }
    else {
        return { binaryPath, filePath, cwd: projectRootPath };
    }
};
function runDumpCommand(msg, onResult) {
    let executable = findExecutable(msg.params.textDocument.uri);
    if (executable == null) {
        onResult(null);
    }
    else {
        let command = executable.binaryPath +
            " dump " +
            executable.filePath +
            ":" +
            msg.params.position.line +
            ":" +
            msg.params.position.character;
        child_process_1.exec(command, { cwd: executable.cwd }, function (_error, stdout, _stderr) {
            let result = JSON.parse(stdout);
            if (result && result[0]) {
                onResult(result[0]);
            }
            else {
                onResult(null);
            }
        });
    }
}
exports.runDumpCommand = runDumpCommand;
function runCompletionCommand(msg, code, onResult) {
    let executable = findExecutable(msg.params.textDocument.uri);
    if (executable == null) {
        onResult(null);
    }
    else {
        let tmpname = utils.createFileInTempDir();
        fs_1.default.writeFileSync(tmpname, code, { encoding: "utf-8" });
        let command = executable.binaryPath +
            " complete " +
            executable.filePath +
            ":" +
            msg.params.position.line +
            ":" +
            msg.params.position.character +
            " " +
            tmpname;
        child_process_1.exec(command, { cwd: executable.cwd }, function (_error, stdout, _stderr) {
            // async close is fine. We don't use this file name again
            fs_1.default.unlink(tmpname, () => null);
            let result = JSON.parse(stdout);
            if (result && result[0]) {
                onResult(result);
            }
            else {
                onResult(null);
            }
        });
    }
}
exports.runCompletionCommand = runCompletionCommand;
//# sourceMappingURL=RescriptEditorSupport.js.map