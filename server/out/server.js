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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = __importDefault(require("process"));
const p = __importStar(require("vscode-languageserver-protocol"));
const v = __importStar(require("vscode-languageserver"));
const rpc = __importStar(require("vscode-jsonrpc/node"));
const path = __importStar(require("path"));
const fs_1 = __importDefault(require("fs"));
// TODO: check DidChangeWatchedFilesNotification.
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const lookup = __importStar(require("./lookup"));
const utils = __importStar(require("./utils"));
const c = __importStar(require("./constants"));
const chokidar = __importStar(require("chokidar"));
const console_1 = require("console");
const url_1 = require("url");
let extensionClientCapabilities = {};
// All values here are temporary, and will be overridden as the server is
// initialized, and the current config is received from the client.
let extensionConfiguration = {
    allowBuiltInFormatter: false,
    askToStartBuild: true,
    inlayHints: {
        enable: false,
        maxLength: 25,
    },
    codeLens: false,
    binaryPath: null,
    platformPath: null,
    signatureHelp: {
        enabled: true,
    },
};
// Below here is some state that's not important exactly how long it lives.
let hasPromptedAboutBuiltInFormatter = false;
let pullConfigurationPeriodically = null;
// https://microsoft.github.io/language-server-protocol/specification#initialize
// According to the spec, there could be requests before the 'initialize' request. Link in comment tells how to handle them.
let initialized = false;
let serverSentRequestIdCounter = 0;
// https://microsoft.github.io/language-server-protocol/specification#exit
let shutdownRequestAlreadyReceived = false;
let stupidFileContentCache = new Map();
let projectsFiles = new Map();
// ^ caching AND states AND distributed system. Why does LSP has to be stupid like this
// This keeps track of code actions extracted from diagnostics.
let codeActionsFromDiagnostics = {};
// will be properly defined later depending on the mode (stdio/node-rpc)
let send = (_) => { };
let findRescriptBinary = (projectRootPath) => extensionConfiguration.binaryPath == null
    ? lookup.findFilePathFromProjectRoot(projectRootPath, path.join(c.nodeModulesBinDir, c.rescriptBinName))
    : utils.findBinary(extensionConfiguration.binaryPath, c.rescriptBinName);
let findPlatformPath = (projectRootPath) => {
    if (extensionConfiguration.platformPath != null) {
        return extensionConfiguration.platformPath;
    }
    let rescriptDir = lookup.findFilePathFromProjectRoot(projectRootPath, path.join("node_modules", "rescript"));
    if (rescriptDir == null) {
        return null;
    }
    let platformPath = path.join(rescriptDir, c.platformDir);
    // Workaround for darwinarm64 which has no folder yet in ReScript <= 9.1.4
    if (process_1.default.platform == "darwin" &&
        process_1.default.arch == "arm64" &&
        !fs_1.default.existsSync(platformPath)) {
        platformPath = path.join(rescriptDir, process_1.default.platform);
    }
    return platformPath;
};
let findBscExeBinary = (projectRootPath) => utils.findBinary(findPlatformPath(projectRootPath), c.bscExeName);
let createInterfaceRequest = new v.RequestType("textDocument/createInterface");
let openCompiledFileRequest = new v.RequestType("textDocument/openCompiled");
let getCurrentCompilerDiagnosticsForFile = (fileUri) => {
    let diagnostics = null;
    projectsFiles.forEach((projectFile, _projectRootPath) => {
        if (diagnostics == null && projectFile.filesDiagnostics[fileUri] != null) {
            diagnostics = projectFile.filesDiagnostics[fileUri].slice();
        }
    });
    return diagnostics !== null && diagnostics !== void 0 ? diagnostics : [];
};
let sendUpdatedDiagnostics = () => {
    projectsFiles.forEach((projectFile, projectRootPath) => {
        let { filesWithDiagnostics } = projectFile;
        let compilerLogPath = path.join(projectRootPath, c.compilerLogPartialPath);
        let content = fs_1.default.readFileSync(compilerLogPath, { encoding: "utf-8" });
        let { done, result: filesAndErrors, codeActions, linesWithParseErrors, } = utils.parseCompilerLogOutput(content);
        if (linesWithParseErrors.length > 0) {
            let params = {
                type: p.MessageType.Warning,
                message: `There are more compiler warning/errors that we could not parse. You can help us fix this by opening an [issue on the repository](https://github.com/rescript-lang/rescript-vscode/issues/new?title=Compiler%20log%20parse%20error), pasting the contents of the file [lib/bs/.compiler.log](file://${compilerLogPath}).`,
            };
            let message = {
                jsonrpc: c.jsonrpcVersion,
                method: "window/showMessage",
                params: params,
            };
            send(message);
        }
        projectFile.filesDiagnostics = filesAndErrors;
        codeActionsFromDiagnostics = codeActions;
        // diff
        Object.keys(filesAndErrors).forEach((file) => {
            let params = {
                uri: file,
                diagnostics: filesAndErrors[file],
            };
            let notification = {
                jsonrpc: c.jsonrpcVersion,
                method: "textDocument/publishDiagnostics",
                params: params,
            };
            send(notification);
            filesWithDiagnostics.add(file);
        });
        if (done) {
            // clear old files
            filesWithDiagnostics.forEach((file) => {
                if (filesAndErrors[file] == null) {
                    // Doesn't exist in the new diagnostics. Clear this diagnostic
                    let params = {
                        uri: file,
                        diagnostics: [],
                    };
                    let notification = {
                        jsonrpc: c.jsonrpcVersion,
                        method: "textDocument/publishDiagnostics",
                        params: params,
                    };
                    send(notification);
                    filesWithDiagnostics.delete(file);
                }
            });
        }
    });
};
let deleteProjectDiagnostics = (projectRootPath) => {
    let root = projectsFiles.get(projectRootPath);
    if (root != null) {
        root.filesWithDiagnostics.forEach((file) => {
            let params = {
                uri: file,
                diagnostics: [],
            };
            let notification = {
                jsonrpc: c.jsonrpcVersion,
                method: "textDocument/publishDiagnostics",
                params: params,
            };
            send(notification);
        });
        projectsFiles.delete(projectRootPath);
    }
};
let sendCompilationFinishedMessage = () => {
    let notification = {
        jsonrpc: c.jsonrpcVersion,
        method: "rescript/compilationFinished",
    };
    send(notification);
};
let compilerLogsWatcher = chokidar
    .watch([], {
    awaitWriteFinish: {
        stabilityThreshold: 1,
    },
})
    .on("all", (_e, changedPath) => {
    var _a;
    sendUpdatedDiagnostics();
    sendCompilationFinishedMessage();
    if (((_a = extensionConfiguration.inlayHints) === null || _a === void 0 ? void 0 : _a.enable) === true) {
        sendInlayHintsRefresh();
    }
    if (extensionConfiguration.codeLens === true) {
        sendCodeLensRefresh();
    }
});
let stopWatchingCompilerLog = () => {
    // TODO: cleanup of compilerLogs?
    compilerLogsWatcher.close();
};
let openedFile = (fileUri, fileContent) => {
    let filePath = (0, url_1.fileURLToPath)(fileUri);
    stupidFileContentCache.set(filePath, fileContent);
    let projectRootPath = utils.findProjectRootOfFile(filePath);
    if (projectRootPath != null) {
        let projectRootState = projectsFiles.get(projectRootPath);
        if (projectRootState == null) {
            projectRootState = {
                openFiles: new Set(),
                filesWithDiagnostics: new Set(),
                filesDiagnostics: {},
                bsbWatcherByEditor: null,
                hasPromptedToStartBuild: /(\/|\\)node_modules(\/|\\)/.test(projectRootPath)
                    ? "never"
                    : false,
            };
            projectsFiles.set(projectRootPath, projectRootState);
            compilerLogsWatcher.add(path.join(projectRootPath, c.compilerLogPartialPath));
        }
        let root = projectsFiles.get(projectRootPath);
        root.openFiles.add(filePath);
        // check if .bsb.lock is still there. If not, start a bsb -w ourselves
        // because otherwise the diagnostics info we'll display might be stale
        let bsbLockPath = path.join(projectRootPath, c.bsbLock);
        if (projectRootState.hasPromptedToStartBuild === false &&
            extensionConfiguration.askToStartBuild === true &&
            !fs_1.default.existsSync(bsbLockPath)) {
            // TODO: sometime stale .bsb.lock dangling. bsb -w knows .bsb.lock is
            // stale. Use that logic
            // TODO: close watcher when lang-server shuts down
            if (findRescriptBinary(projectRootPath) != null) {
                let payload = {
                    title: c.startBuildAction,
                    projectRootPath: projectRootPath,
                };
                let params = {
                    type: p.MessageType.Info,
                    message: `Start a build for this project to get the freshest data?`,
                    actions: [payload],
                };
                let request = {
                    jsonrpc: c.jsonrpcVersion,
                    id: serverSentRequestIdCounter++,
                    method: "window/showMessageRequest",
                    params: params,
                };
                send(request);
                projectRootState.hasPromptedToStartBuild = true;
                // the client might send us back the "start build" action, which we'll
                // handle in the isResponseMessage check in the message handling way
                // below
            }
            else {
                let request = {
                    jsonrpc: c.jsonrpcVersion,
                    method: "window/showMessage",
                    params: {
                        type: p.MessageType.Error,
                        message: extensionConfiguration.binaryPath == null
                            ? `Can't find ReScript binary in  ${path.join(projectRootPath, c.nodeModulesBinDir)} or parent directories. Did you install it? It's required to use "rescript" > 9.1`
                            : `Can't find ReScript binary in the directory ${extensionConfiguration.binaryPath}`,
                    },
                };
                send(request);
            }
        }
        // no need to call sendUpdatedDiagnostics() here; the watcher add will
        // call the listener which calls it
    }
};
let closedFile = (fileUri) => {
    let filePath = (0, url_1.fileURLToPath)(fileUri);
    stupidFileContentCache.delete(filePath);
    let projectRootPath = utils.findProjectRootOfFile(filePath);
    if (projectRootPath != null) {
        let root = projectsFiles.get(projectRootPath);
        if (root != null) {
            root.openFiles.delete(filePath);
            // clear diagnostics too if no open files open in said project
            if (root.openFiles.size === 0) {
                compilerLogsWatcher.unwatch(path.join(projectRootPath, c.compilerLogPartialPath));
                deleteProjectDiagnostics(projectRootPath);
                if (root.bsbWatcherByEditor !== null) {
                    root.bsbWatcherByEditor.kill();
                    root.bsbWatcherByEditor = null;
                }
            }
        }
    }
};
let updateOpenedFile = (fileUri, fileContent) => {
    let filePath = (0, url_1.fileURLToPath)(fileUri);
    (0, console_1.assert)(stupidFileContentCache.has(filePath));
    stupidFileContentCache.set(filePath, fileContent);
};
let getOpenedFileContent = (fileUri) => {
    let filePath = (0, url_1.fileURLToPath)(fileUri);
    let content = stupidFileContentCache.get(filePath);
    (0, console_1.assert)(content != null);
    return content;
};
// Start listening now!
// We support two modes: the regular node RPC mode for VSCode, and the --stdio
// mode for other editors The latter is _technically unsupported_. It's an
// implementation detail that might change at any time
if (process_1.default.argv.includes("--stdio")) {
    let writer = new rpc.StreamMessageWriter(process_1.default.stdout);
    let reader = new rpc.StreamMessageReader(process_1.default.stdin);
    // proper `this` scope for writer
    send = (msg) => writer.write(msg);
    reader.listen(onMessage);
}
else {
    // proper `this` scope for process
    send = (msg) => process_1.default.send(msg);
    process_1.default.on("message", onMessage);
}
function hover(msg) {
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    let code = getOpenedFileContent(params.textDocument.uri);
    let tmpname = utils.createFileInTempDir();
    fs_1.default.writeFileSync(tmpname, code, { encoding: "utf-8" });
    let response = utils.runAnalysisCommand(filePath, [
        "hover",
        filePath,
        params.position.line,
        params.position.character,
        tmpname,
        Boolean(extensionClientCapabilities.supportsMarkdownLinks),
    ], msg);
    fs_1.default.unlink(tmpname, () => null);
    return response;
}
function inlayHint(msg) {
    const params = msg.params;
    const filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    const response = utils.runAnalysisCommand(filePath, [
        "inlayHint",
        filePath,
        params.range.start.line,
        params.range.end.line,
        extensionConfiguration.inlayHints.maxLength,
    ], msg);
    return response;
}
function sendInlayHintsRefresh() {
    let request = {
        jsonrpc: c.jsonrpcVersion,
        method: p.InlayHintRefreshRequest.method,
        id: serverSentRequestIdCounter++,
    };
    send(request);
}
function codeLens(msg) {
    const params = msg.params;
    const filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    const response = utils.runAnalysisCommand(filePath, ["codeLens", filePath], msg);
    return response;
}
function sendCodeLensRefresh() {
    let request = {
        jsonrpc: c.jsonrpcVersion,
        method: p.CodeLensRefreshRequest.method,
        id: serverSentRequestIdCounter++,
    };
    send(request);
}
function signatureHelp(msg) {
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    let code = getOpenedFileContent(params.textDocument.uri);
    let tmpname = utils.createFileInTempDir();
    fs_1.default.writeFileSync(tmpname, code, { encoding: "utf-8" });
    let response = utils.runAnalysisCommand(filePath, [
        "signatureHelp",
        filePath,
        params.position.line,
        params.position.character,
        tmpname,
    ], msg);
    fs_1.default.unlink(tmpname, () => null);
    return response;
}
function definition(msg) {
    // https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_definition
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    let response = utils.runAnalysisCommand(filePath, ["definition", filePath, params.position.line, params.position.character], msg);
    return response;
}
function typeDefinition(msg) {
    // https://microsoft.github.io/language-server-protocol/specification/specification-current/#textDocument_typeDefinition
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    let response = utils.runAnalysisCommand(filePath, [
        "typeDefinition",
        filePath,
        params.position.line,
        params.position.character,
    ], msg);
    return response;
}
function references(msg) {
    // https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_references
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    let result = utils.getReferencesForPosition(filePath, params.position);
    let response = {
        jsonrpc: c.jsonrpcVersion,
        id: msg.id,
        result,
        // error: code and message set in case an exception happens during the definition request.
    };
    return response;
}
function prepareRename(msg) {
    // https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_prepareRename
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    let locations = utils.getReferencesForPosition(filePath, params.position);
    let result = null;
    if (locations !== null) {
        locations.forEach((loc) => {
            if (path.normalize((0, url_1.fileURLToPath)(loc.uri)) ===
                path.normalize((0, url_1.fileURLToPath)(params.textDocument.uri))) {
                let { start, end } = loc.range;
                let pos = params.position;
                if (start.character <= pos.character &&
                    start.line <= pos.line &&
                    end.character >= pos.character &&
                    end.line >= pos.line) {
                    result = loc.range;
                }
            }
        });
    }
    return {
        jsonrpc: c.jsonrpcVersion,
        id: msg.id,
        result,
    };
}
function rename(msg) {
    // https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_rename
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    let documentChanges = utils.runAnalysisAfterSanityCheck(filePath, [
        "rename",
        filePath,
        params.position.line,
        params.position.character,
        params.newName,
    ]);
    let result = null;
    if (documentChanges !== null) {
        result = { documentChanges };
    }
    let response = {
        jsonrpc: c.jsonrpcVersion,
        id: msg.id,
        result,
    };
    return response;
}
function documentSymbol(msg) {
    // https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_documentSymbol
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    let extension = path.extname(params.textDocument.uri);
    let code = getOpenedFileContent(params.textDocument.uri);
    let tmpname = utils.createFileInTempDir(extension);
    fs_1.default.writeFileSync(tmpname, code, { encoding: "utf-8" });
    let response = utils.runAnalysisCommand(filePath, ["documentSymbol", tmpname], msg, 
    /* projectRequired */ false);
    fs_1.default.unlink(tmpname, () => null);
    return response;
}
function askForAllCurrentConfiguration() {
    // https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#workspace_configuration
    let params = {
        items: [
            {
                section: "rescript.settings",
            },
        ],
    };
    let req = {
        jsonrpc: c.jsonrpcVersion,
        id: c.configurationRequestId,
        method: p.ConfigurationRequest.type.method,
        params,
    };
    send(req);
}
function semanticTokens(msg) {
    // https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_semanticTokens
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    let extension = path.extname(params.textDocument.uri);
    let code = getOpenedFileContent(params.textDocument.uri);
    let tmpname = utils.createFileInTempDir(extension);
    fs_1.default.writeFileSync(tmpname, code, { encoding: "utf-8" });
    let response = utils.runAnalysisCommand(filePath, ["semanticTokens", tmpname], msg, 
    /* projectRequired */ false);
    fs_1.default.unlink(tmpname, () => null);
    return response;
}
function completion(msg) {
    // https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_completion
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    let code = getOpenedFileContent(params.textDocument.uri);
    let tmpname = utils.createFileInTempDir();
    fs_1.default.writeFileSync(tmpname, code, { encoding: "utf-8" });
    let response = utils.runAnalysisCommand(filePath, [
        "completion",
        filePath,
        params.position.line,
        params.position.character,
        tmpname,
        Boolean(extensionClientCapabilities.supportsSnippetSyntax),
    ], msg);
    fs_1.default.unlink(tmpname, () => null);
    return response;
}
function codeAction(msg) {
    var _a;
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    let code = getOpenedFileContent(params.textDocument.uri);
    let extension = path.extname(params.textDocument.uri);
    let tmpname = utils.createFileInTempDir(extension);
    // Check local code actions coming from the diagnostics.
    let localResults = [];
    (_a = codeActionsFromDiagnostics[params.textDocument.uri]) === null || _a === void 0 ? void 0 : _a.forEach(({ range, codeAction }) => {
        if (utils.rangeContainsRange(range, params.range)) {
            localResults.push(codeAction);
        }
    });
    fs_1.default.writeFileSync(tmpname, code, { encoding: "utf-8" });
    let response = utils.runAnalysisCommand(filePath, [
        "codeAction",
        filePath,
        params.range.start.line,
        params.range.start.character,
        tmpname,
    ], msg);
    fs_1.default.unlink(tmpname, () => null);
    let { result } = response;
    // We must send `null` when there are no results, empty array isn't enough.
    let codeActions = result != null && Array.isArray(result)
        ? [...localResults, ...result]
        : localResults;
    let res = {
        jsonrpc: c.jsonrpcVersion,
        id: msg.id,
        result: codeActions.length > 0 ? codeActions : null,
    };
    return res;
}
function format(msg) {
    // technically, a formatting failure should reply with the error. Sadly
    // the LSP alert box for these error replies sucks (e.g. doesn't actually
    // display the message). In order to signal the client to display a proper
    // alert box (sometime with actionable buttons), we need to first send
    // back a fake success message (because each request mandates a
    // response), then right away send a server notification to display a
    // nicer alert. Ugh.
    let fakeSuccessResponse = {
        jsonrpc: c.jsonrpcVersion,
        id: msg.id,
        result: [],
    };
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.textDocument.uri);
    let extension = path.extname(params.textDocument.uri);
    if (extension !== c.resExt && extension !== c.resiExt) {
        let params = {
            type: p.MessageType.Error,
            message: `Not a ${c.resExt} or ${c.resiExt} file. Cannot format it.`,
        };
        let response = {
            jsonrpc: c.jsonrpcVersion,
            method: "window/showMessage",
            params: params,
        };
        return [fakeSuccessResponse, response];
    }
    else {
        // code will always be defined here, even though technically it can be undefined
        let code = getOpenedFileContent(params.textDocument.uri);
        let projectRootPath = utils.findProjectRootOfFile(filePath);
        let bscExeBinaryPath = findBscExeBinary(projectRootPath);
        let formattedResult = utils.formatCode(bscExeBinaryPath, filePath, code, extensionConfiguration.allowBuiltInFormatter);
        if (formattedResult.kind === "success") {
            let max = code.length;
            let result = [
                {
                    range: {
                        start: { line: 0, character: 0 },
                        end: { line: max, character: max },
                    },
                    newText: formattedResult.result,
                },
            ];
            let response = {
                jsonrpc: c.jsonrpcVersion,
                id: msg.id,
                result: result,
            };
            return [response];
        }
        else if (formattedResult.kind === "blocked-using-built-in-formatter") {
            // Let's only prompt the user once about this, or things might become annoying.
            if (hasPromptedAboutBuiltInFormatter) {
                return [fakeSuccessResponse];
            }
            hasPromptedAboutBuiltInFormatter = true;
            let params = {
                type: p.MessageType.Warning,
                message: `Formatting not applied! Could not find the ReScript compiler in the current project, and you haven't configured the extension to allow formatting using the built in formatter. To allow formatting files not strictly part of a ReScript project using the built in formatter, [please configure the extension to allow that.](command:workbench.action.openSettings?${encodeURIComponent(JSON.stringify(["rescript.settings.allowBuiltInFormatter"]))})`,
            };
            let response = {
                jsonrpc: c.jsonrpcVersion,
                method: "window/showMessage",
                params: params,
            };
            return [fakeSuccessResponse, response];
        }
        else {
            // let the diagnostics logic display the updated syntax errors,
            // from the build.
            // Again, not sending the actual errors. See fakeSuccessResponse
            // above for explanation
            return [fakeSuccessResponse];
        }
    }
}
let updateDiagnosticSyntax = (fileUri, fileContent) => {
    let filePath = (0, url_1.fileURLToPath)(fileUri);
    let extension = path.extname(filePath);
    let tmpname = utils.createFileInTempDir(extension);
    fs_1.default.writeFileSync(tmpname, fileContent, { encoding: "utf-8" });
    // We need to account for any existing diagnostics from the compiler for this
    // file. If we don't we might accidentally clear the current file's compiler
    // diagnostics if there's no syntax diagostics to send. This is because
    // publishing an empty diagnostics array is equivalent to saying "clear all
    // errors".
    let compilerDiagnosticsForFile = getCurrentCompilerDiagnosticsForFile(fileUri);
    let syntaxDiagnosticsForFile = utils.runAnalysisAfterSanityCheck(filePath, ["diagnosticSyntax", tmpname]);
    let notification = {
        jsonrpc: c.jsonrpcVersion,
        method: "textDocument/publishDiagnostics",
        params: {
            uri: fileUri,
            diagnostics: [...syntaxDiagnosticsForFile, ...compilerDiagnosticsForFile],
        },
    };
    fs_1.default.unlink(tmpname, () => null);
    send(notification);
};
function createInterface(msg) {
    let params = msg.params;
    let extension = path.extname(params.uri);
    let filePath = (0, url_1.fileURLToPath)(params.uri);
    let projDir = utils.findProjectRootOfFile(filePath);
    if (projDir === null) {
        let params = {
            type: p.MessageType.Error,
            message: `Cannot locate project directory to generate the interface file.`,
        };
        let response = {
            jsonrpc: c.jsonrpcVersion,
            method: "window/showMessage",
            params: params,
        };
        return response;
    }
    if (extension !== c.resExt) {
        let params = {
            type: p.MessageType.Error,
            message: `Not a ${c.resExt} file. Cannot create an interface for it.`,
        };
        let response = {
            jsonrpc: c.jsonrpcVersion,
            method: "window/showMessage",
            params: params,
        };
        return response;
    }
    let resPartialPath = filePath.split(projDir)[1];
    // The .cmi filename may have a namespace suffix appended.
    let namespaceResult = utils.getNamespaceNameFromBsConfig(projDir);
    if (namespaceResult.kind === "error") {
        let params = {
            type: p.MessageType.Error,
            message: `Error reading bsconfig file.`,
        };
        let response = {
            jsonrpc: c.jsonrpcVersion,
            method: "window/showMessage",
            params,
        };
        return response;
    }
    let namespace = namespaceResult.result;
    let suffixToAppend = namespace.length > 0 ? "-" + namespace : "";
    let cmiPartialPath = path.join(path.dirname(resPartialPath), path.basename(resPartialPath, c.resExt) + suffixToAppend + c.cmiExt);
    let cmiPath = path.join(projDir, c.compilerDirPartialPath, cmiPartialPath);
    let cmiAvailable = fs_1.default.existsSync(cmiPath);
    if (!cmiAvailable) {
        let params = {
            type: p.MessageType.Error,
            message: `No compiled interface file found. Please compile your project first.`,
        };
        let response = {
            jsonrpc: c.jsonrpcVersion,
            method: "window/showMessage",
            params,
        };
        return response;
    }
    let response = utils.runAnalysisCommand(filePath, ["createInterface", filePath, cmiPath], msg);
    let result = typeof response.result === "string" ? response.result : "";
    try {
        let resiPath = lookup.replaceFileExtension(filePath, c.resiExt);
        fs_1.default.writeFileSync(resiPath, result, { encoding: "utf-8" });
        let response = {
            jsonrpc: c.jsonrpcVersion,
            id: msg.id,
            result: {
                uri: utils.pathToURI(resiPath),
            },
        };
        return response;
    }
    catch (e) {
        let response = {
            jsonrpc: c.jsonrpcVersion,
            id: msg.id,
            error: {
                code: p.ErrorCodes.InternalError,
                message: "Unable to create interface file.",
            },
        };
        return response;
    }
}
function openCompiledFile(msg) {
    let params = msg.params;
    let filePath = (0, url_1.fileURLToPath)(params.uri);
    let projDir = utils.findProjectRootOfFile(filePath);
    if (projDir === null) {
        let params = {
            type: p.MessageType.Error,
            message: `Cannot locate project directory.`,
        };
        let response = {
            jsonrpc: c.jsonrpcVersion,
            method: "window/showMessage",
            params: params,
        };
        return response;
    }
    let compiledFilePath = utils.getCompiledFilePath(filePath, projDir);
    if (compiledFilePath.kind === "error" ||
        !fs_1.default.existsSync(compiledFilePath.result)) {
        let message = compiledFilePath.kind === "success"
            ? `No compiled file found. Expected it at: ${compiledFilePath.result}`
            : `No compiled file found. Please compile your project first.`;
        let params = {
            type: p.MessageType.Error,
            message,
        };
        let response = {
            jsonrpc: c.jsonrpcVersion,
            method: "window/showMessage",
            params,
        };
        return response;
    }
    let response = {
        jsonrpc: c.jsonrpcVersion,
        id: msg.id,
        result: {
            uri: utils.pathToURI(compiledFilePath.result),
        },
    };
    return response;
}
function onMessage(msg) {
    var _a, _b, _c, _d, _f, _g, _h;
    if (p.Message.isNotification(msg)) {
        // notification message, aka the client ends it and doesn't want a reply
        if (!initialized && msg.method !== "exit") {
            // From spec: "Notifications should be dropped, except for the exit notification. This will allow the exit of a server without an initialize request"
            // For us: do nothing. We don't have anything we need to clean up right now
            // TODO: we might have things we need to clean up now... like some watcher stuff
        }
        else if (msg.method === "exit") {
            // The server should exit with success code 0 if the shutdown request has been received before; otherwise with error code 1
            if (shutdownRequestAlreadyReceived) {
                process_1.default.exit(0);
            }
            else {
                process_1.default.exit(1);
            }
        }
        else if (msg.method === vscode_languageserver_protocol_1.DidOpenTextDocumentNotification.method) {
            let params = msg.params;
            openedFile(params.textDocument.uri, params.textDocument.text);
            updateDiagnosticSyntax(params.textDocument.uri, params.textDocument.text);
        }
        else if (msg.method === vscode_languageserver_protocol_1.DidChangeTextDocumentNotification.method) {
            let params = msg.params;
            let extName = path.extname(params.textDocument.uri);
            if (extName === c.resExt || extName === c.resiExt) {
                let changes = params.contentChanges;
                if (changes.length === 0) {
                    // no change?
                }
                else {
                    // we currently only support full changes
                    updateOpenedFile(params.textDocument.uri, changes[changes.length - 1].text);
                    updateDiagnosticSyntax(params.textDocument.uri, changes[changes.length - 1].text);
                }
            }
        }
        else if (msg.method === vscode_languageserver_protocol_1.DidCloseTextDocumentNotification.method) {
            let params = msg.params;
            closedFile(params.textDocument.uri);
        }
        else if (msg.method === vscode_languageserver_protocol_1.DidChangeConfigurationNotification.type.method) {
            // Can't seem to get this notification to trigger, but if it does this will be here and ensure we're synced up at the server.
            askForAllCurrentConfiguration();
        }
    }
    else if (p.Message.isRequest(msg)) {
        // request message, aka client sent request and waits for our mandatory reply
        if (!initialized && msg.method !== "initialize") {
            let response = {
                jsonrpc: c.jsonrpcVersion,
                id: msg.id,
                error: {
                    code: p.ErrorCodes.ServerNotInitialized,
                    message: "Server not initialized.",
                },
            };
            send(response);
        }
        else if (msg.method === "initialize") {
            // Save initial configuration, if present
            let initParams = msg.params;
            let initialConfiguration = (_a = initParams.initializationOptions) === null || _a === void 0 ? void 0 : _a.extensionConfiguration;
            if (initialConfiguration != null) {
                extensionConfiguration = initialConfiguration;
            }
            // These are static configuration options the client can set to enable certain
            let extensionClientCapabilitiesFromClient = (_b = initParams
                .initializationOptions) === null || _b === void 0 ? void 0 : _b.extensionClientCapabilities;
            if (extensionClientCapabilitiesFromClient != null) {
                extensionClientCapabilities = extensionClientCapabilitiesFromClient;
            }
            extensionClientCapabilities.supportsSnippetSyntax = Boolean((_f = (_d = (_c = initParams.capabilities.textDocument) === null || _c === void 0 ? void 0 : _c.completion) === null || _d === void 0 ? void 0 : _d.completionItem) === null || _f === void 0 ? void 0 : _f.snippetSupport);
            // send the list of features we support
            let result = {
                // This tells the client: "hey, we support the following operations".
                // Example: we want to expose "jump-to-definition".
                // By adding `definitionProvider: true`, the client will now send "jump-to-definition" requests.
                capabilities: {
                    // TODO: incremental sync?
                    textDocumentSync: v.TextDocumentSyncKind.Full,
                    documentFormattingProvider: true,
                    hoverProvider: true,
                    definitionProvider: true,
                    typeDefinitionProvider: true,
                    referencesProvider: true,
                    codeActionProvider: true,
                    renameProvider: { prepareProvider: true },
                    documentSymbolProvider: true,
                    completionProvider: {
                        triggerCharacters: [".", ">", "@", "~", '"', "=", "("],
                    },
                    semanticTokensProvider: {
                        legend: {
                            tokenTypes: [
                                "operator",
                                "variable",
                                "support-type-primitive",
                                "jsx-tag",
                                "class",
                                "enumMember",
                                "property",
                                "jsx-lowercase",
                            ],
                            tokenModifiers: [],
                        },
                        documentSelector: [{ scheme: "file", language: "rescript" }],
                        // TODO: Support range for full, and add delta support
                        full: true,
                    },
                    inlayHintProvider: (_g = extensionConfiguration.inlayHints) === null || _g === void 0 ? void 0 : _g.enable,
                    codeLensProvider: extensionConfiguration.codeLens
                        ? {
                            workDoneProgress: false,
                        }
                        : undefined,
                    signatureHelpProvider: ((_h = extensionConfiguration.signatureHelp) === null || _h === void 0 ? void 0 : _h.enabled)
                        ? {
                            triggerCharacters: ["("],
                            retriggerCharacters: ["=", ","],
                        }
                        : undefined,
                },
            };
            let response = {
                jsonrpc: c.jsonrpcVersion,
                id: msg.id,
                result: result,
            };
            initialized = true;
            // Periodically pull configuration from the client.
            pullConfigurationPeriodically = setInterval(() => {
                askForAllCurrentConfiguration();
            }, c.pullConfigurationInterval);
            send(response);
        }
        else if (msg.method === "initialized") {
            // sent from client after initialize. Nothing to do for now
            let response = {
                jsonrpc: c.jsonrpcVersion,
                id: msg.id,
                result: null,
            };
            send(response);
        }
        else if (msg.method === "shutdown") {
            // https://microsoft.github.io/language-server-protocol/specification#shutdown
            if (shutdownRequestAlreadyReceived) {
                let response = {
                    jsonrpc: c.jsonrpcVersion,
                    id: msg.id,
                    error: {
                        code: p.ErrorCodes.InvalidRequest,
                        message: `Language server already received the shutdown request`,
                    },
                };
                send(response);
            }
            else {
                shutdownRequestAlreadyReceived = true;
                // TODO: recheck logic around init/shutdown...
                stopWatchingCompilerLog();
                // TODO: delete bsb watchers
                if (pullConfigurationPeriodically != null) {
                    clearInterval(pullConfigurationPeriodically);
                }
                let response = {
                    jsonrpc: c.jsonrpcVersion,
                    id: msg.id,
                    result: null,
                };
                send(response);
            }
        }
        else if (msg.method === p.HoverRequest.method) {
            send(hover(msg));
        }
        else if (msg.method === p.DefinitionRequest.method) {
            send(definition(msg));
        }
        else if (msg.method === p.TypeDefinitionRequest.method) {
            send(typeDefinition(msg));
        }
        else if (msg.method === p.ReferencesRequest.method) {
            send(references(msg));
        }
        else if (msg.method === p.PrepareRenameRequest.method) {
            send(prepareRename(msg));
        }
        else if (msg.method === p.RenameRequest.method) {
            send(rename(msg));
        }
        else if (msg.method === p.DocumentSymbolRequest.method) {
            send(documentSymbol(msg));
        }
        else if (msg.method === p.CompletionRequest.method) {
            send(completion(msg));
        }
        else if (msg.method === p.SemanticTokensRequest.method) {
            send(semanticTokens(msg));
        }
        else if (msg.method === p.CodeActionRequest.method) {
            send(codeAction(msg));
        }
        else if (msg.method === p.DocumentFormattingRequest.method) {
            let responses = format(msg);
            responses.forEach((response) => send(response));
        }
        else if (msg.method === createInterfaceRequest.method) {
            send(createInterface(msg));
        }
        else if (msg.method === openCompiledFileRequest.method) {
            send(openCompiledFile(msg));
        }
        else if (msg.method === p.InlayHintRequest.method) {
            let params = msg.params;
            let extName = path.extname(params.textDocument.uri);
            if (extName === c.resExt) {
                send(inlayHint(msg));
            }
        }
        else if (msg.method === p.CodeLensRequest.method) {
            let params = msg.params;
            let extName = path.extname(params.textDocument.uri);
            if (extName === c.resExt) {
                send(codeLens(msg));
            }
        }
        else if (msg.method === p.SignatureHelpRequest.method) {
            let params = msg.params;
            let extName = path.extname(params.textDocument.uri);
            if (extName === c.resExt) {
                send(signatureHelp(msg));
            }
        }
        else {
            let response = {
                jsonrpc: c.jsonrpcVersion,
                id: msg.id,
                error: {
                    code: p.ErrorCodes.InvalidRequest,
                    message: "Unrecognized editor request.",
                },
            };
            send(response);
        }
    }
    else if (p.Message.isResponse(msg)) {
        if (msg.id === c.configurationRequestId) {
            if (msg.result != null) {
                // This is a response from a request to get updated configuration. Note
                // that it seems to return the configuration in a way that lets the
                // current workspace settings override the user settings. This is good
                // as we get started, but _might_ be problematic further down the line
                // if we want to support having several projects open at the same time
                // without their settings overriding eachother. Not a problem now though
                // as we'll likely only have "global" settings starting out.
                let [configuration] = msg.result;
                if (configuration != null) {
                    extensionConfiguration = configuration;
                }
            }
        }
        else if (msg.result != null &&
            // @ts-ignore
            msg.result.title != null &&
            // @ts-ignore
            msg.result.title === c.startBuildAction) {
            let msg_ = msg.result;
            let projectRootPath = msg_.projectRootPath;
            // TODO: sometime stale .bsb.lock dangling
            // TODO: close watcher when lang-server shuts down. However, by Node's
            // default, these subprocesses are automatically killed when this
            // language-server process exits
            let rescriptBinaryPath = findRescriptBinary(projectRootPath);
            if (rescriptBinaryPath != null) {
                let bsbProcess = utils.runBuildWatcherUsingValidBuildPath(rescriptBinaryPath, projectRootPath);
                let root = projectsFiles.get(projectRootPath);
                root.bsbWatcherByEditor = bsbProcess;
                // bsbProcess.on("message", (a) => console.log(a));
            }
        }
    }
}
//# sourceMappingURL=server.js.map