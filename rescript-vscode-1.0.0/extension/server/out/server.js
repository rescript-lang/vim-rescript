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
const process_1 = __importDefault(require("process"));
const p = __importStar(require("vscode-languageserver-protocol"));
const m = __importStar(require("vscode-jsonrpc/lib/messages"));
const v = __importStar(require("vscode-languageserver"));
const path = __importStar(require("path"));
const fs_1 = __importDefault(require("fs"));
// TODO: check DidChangeWatchedFilesNotification.
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const utils = __importStar(require("./utils"));
const c = __importStar(require("./constants"));
const chokidar = __importStar(require("chokidar"));
const console_1 = require("console");
const url_1 = require("url");
const RescriptEditorSupport_1 = require("./RescriptEditorSupport");
// https://microsoft.github.io/language-server-protocol/specification#initialize
// According to the spec, there could be requests before the 'initialize' request. Link in comment tells how to handle them.
let initialized = false;
let serverSentRequestIdCounter = 0;
// https://microsoft.github.io/language-server-protocol/specification#exit
let shutdownRequestAlreadyReceived = false;
let stupidFileContentCache = new Map();
let projectsFiles = new Map();
// ^ caching AND states AND distributed system. Why does LSP has to be stupid like this
let sendUpdatedDiagnostics = () => {
    projectsFiles.forEach(({ filesWithDiagnostics }, projectRootPath) => {
        let content = fs_1.default.readFileSync(path.join(projectRootPath, c.compilerLogPartialPath), { encoding: "utf-8" });
        let { done, result: filesAndErrors } = utils.parseCompilerLogOutput(content);
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
            process_1.default.send(notification);
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
                    process_1.default.send(notification);
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
            process_1.default.send(notification);
        });
        projectsFiles.delete(projectRootPath);
    }
};
let compilerLogsWatcher = chokidar.watch([]).on("all", (_e, changedPath) => {
    sendUpdatedDiagnostics();
});
let stopWatchingCompilerLog = () => {
    // TODO: cleanup of compilerLogs?
    compilerLogsWatcher.close();
};
let openedFile = (fileUri, fileContent) => {
    let filePath = url_1.fileURLToPath(fileUri);
    stupidFileContentCache.set(filePath, fileContent);
    let projectRootPath = utils.findProjectRootOfFile(filePath);
    if (projectRootPath != null) {
        if (!projectsFiles.has(projectRootPath)) {
            projectsFiles.set(projectRootPath, {
                openFiles: new Set(),
                filesWithDiagnostics: new Set(),
                bsbWatcherByEditor: null,
            });
            compilerLogsWatcher.add(path.join(projectRootPath, c.compilerLogPartialPath));
        }
        let root = projectsFiles.get(projectRootPath);
        root.openFiles.add(filePath);
        let firstOpenFileOfProject = root.openFiles.size === 1;
        // check if .bsb.lock is still there. If not, start a bsb -w ourselves
        // because otherwise the diagnostics info we'll display might be stale
        let bsbLockPath = path.join(projectRootPath, c.bsbLock);
        if (firstOpenFileOfProject && !fs_1.default.existsSync(bsbLockPath)) {
            let bsbPath = path.join(projectRootPath, c.bsbPartialPath);
            // TODO: sometime stale .bsb.lock dangling. bsb -w knows .bsb.lock is
            // stale. Use that logic
            // TODO: close watcher when lang-server shuts down
            if (fs_1.default.existsSync(bsbPath)) {
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
                process_1.default.send(request);
                // the client might send us back the "start build" action, which we'll
                // handle in the isResponseMessage check in the message handling way
                // below
            }
            else {
                // we should send something to say that we can't find bsb.exe. But right now we'll silently not do anything
            }
        }
        // no need to call sendUpdatedDiagnostics() here; the watcher add will
        // call the listener which calls it
    }
};
let closedFile = (fileUri) => {
    let filePath = url_1.fileURLToPath(fileUri);
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
    let filePath = url_1.fileURLToPath(fileUri);
    console_1.assert(stupidFileContentCache.has(filePath));
    stupidFileContentCache.set(filePath, fileContent);
};
let getOpenedFileContent = (fileUri) => {
    let filePath = url_1.fileURLToPath(fileUri);
    let content = stupidFileContentCache.get(filePath);
    console_1.assert(content != null);
    return content;
};
process_1.default.on("message", (msg) => {
    if (m.isNotificationMessage(msg)) {
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
            let extName = path.extname(params.textDocument.uri);
            if (extName === c.resExt || extName === c.resiExt) {
                openedFile(params.textDocument.uri, params.textDocument.text);
            }
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
                }
            }
        }
        else if (msg.method === vscode_languageserver_protocol_1.DidCloseTextDocumentNotification.method) {
            let params = msg.params;
            closedFile(params.textDocument.uri);
        }
    }
    else if (m.isRequestMessage(msg)) {
        // request message, aka client sent request and waits for our mandatory reply
        if (!initialized && msg.method !== "initialize") {
            let response = {
                jsonrpc: c.jsonrpcVersion,
                id: msg.id,
                error: {
                    code: m.ErrorCodes.ServerNotInitialized,
                    message: "Server not initialized.",
                },
            };
            process_1.default.send(response);
        }
        else if (msg.method === "initialize") {
            // send the list of features we support
            let result = {
                // This tells the client: "hey, we support the following operations".
                // Example: we want to expose "jump-to-definition".
                // By adding `definitionProvider: true`, the client will now send "jump-to-definition" requests.
                capabilities: {
                    // TODO: incremental sync?
                    textDocumentSync: v.TextDocumentSyncKind.Full,
                    documentFormattingProvider: true,
                    hoverProvider: RescriptEditorSupport_1.binaryExists,
                    definitionProvider: RescriptEditorSupport_1.binaryExists,
                    completionProvider: RescriptEditorSupport_1.binaryExists
                        ? { triggerCharacters: ["."] }
                        : undefined,
                },
            };
            let response = {
                jsonrpc: c.jsonrpcVersion,
                id: msg.id,
                result: result,
            };
            initialized = true;
            process_1.default.send(response);
        }
        else if (msg.method === "initialized") {
            // sent from client after initialize. Nothing to do for now
            let response = {
                jsonrpc: c.jsonrpcVersion,
                id: msg.id,
                result: null,
            };
            process_1.default.send(response);
        }
        else if (msg.method === "shutdown") {
            // https://microsoft.github.io/language-server-protocol/specification#shutdown
            if (shutdownRequestAlreadyReceived) {
                let response = {
                    jsonrpc: c.jsonrpcVersion,
                    id: msg.id,
                    error: {
                        code: m.ErrorCodes.InvalidRequest,
                        message: `Language server already received the shutdown request`,
                    },
                };
                process_1.default.send(response);
            }
            else {
                shutdownRequestAlreadyReceived = true;
                // TODO: recheck logic around init/shutdown...
                stopWatchingCompilerLog();
                // TODO: delete bsb watchers
                let response = {
                    jsonrpc: c.jsonrpcVersion,
                    id: msg.id,
                    result: null,
                };
                process_1.default.send(response);
            }
        }
        else if (msg.method === p.HoverRequest.method) {
            let emptyHoverResponse = {
                jsonrpc: c.jsonrpcVersion,
                id: msg.id,
                // type result = Hover | null
                // type Hover = {contents: MarkedString | MarkedString[] | MarkupContent, range?: Range}
                result: null,
            };
            RescriptEditorSupport_1.runDumpCommand(msg, (result) => {
                if (result && result.hover) {
                    let hoverResponse = {
                        ...emptyHoverResponse,
                        result: {
                            contents: result.hover,
                        },
                    };
                    process_1.default.send(hoverResponse);
                }
                else {
                    process_1.default.send(emptyHoverResponse);
                }
            });
        }
        else if (msg.method === p.DefinitionRequest.method) {
            // https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_definition
            let emptyDefinitionResponse = {
                jsonrpc: c.jsonrpcVersion,
                id: msg.id,
                // result should be: Location | Array<Location> | Array<LocationLink> | null
                result: null,
            };
            RescriptEditorSupport_1.runDumpCommand(msg, (result) => {
                if (result && result.definition) {
                    let definitionResponse = {
                        ...emptyDefinitionResponse,
                        result: {
                            uri: result.definition.uri || msg.params.textDocument.uri,
                            range: result.definition.range,
                        },
                    };
                    process_1.default.send(definitionResponse);
                }
                else {
                    process_1.default.send(emptyDefinitionResponse);
                }
            });
        }
        else if (msg.method === p.CompletionRequest.method) {
            let emptyCompletionResponse = {
                jsonrpc: c.jsonrpcVersion,
                id: msg.id,
                result: null,
            };
            let code = getOpenedFileContent(msg.params.textDocument.uri);
            RescriptEditorSupport_1.runCompletionCommand(msg, code, (result) => {
                if (result) {
                    let definitionResponse = {
                        ...emptyCompletionResponse,
                        result: result,
                    };
                    process_1.default.send(definitionResponse);
                }
                else {
                    process_1.default.send(emptyCompletionResponse);
                }
            });
        }
        else if (msg.method === p.DocumentFormattingRequest.method) {
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
            let filePath = url_1.fileURLToPath(params.textDocument.uri);
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
                process_1.default.send(fakeSuccessResponse);
                process_1.default.send(response);
            }
            else {
                let projectRootPath = utils.findProjectRootOfFile(filePath);
                if (projectRootPath == null) {
                    let params = {
                        type: p.MessageType.Error,
                        message: `Cannot find a nearby ${c.bsconfigPartialPath}. It's needed for determining the project's root.`,
                    };
                    let response = {
                        jsonrpc: c.jsonrpcVersion,
                        method: "window/showMessage",
                        params: params,
                    };
                    process_1.default.send(fakeSuccessResponse);
                    process_1.default.send(response);
                }
                else {
                    let bscPath = path.join(projectRootPath, c.bscPartialPath);
                    if (!fs_1.default.existsSync(bscPath)) {
                        let params = {
                            type: p.MessageType.Error,
                            message: `Cannot find a nearby ${c.bscPartialPath}. It's needed for formatting.`,
                        };
                        let response = {
                            jsonrpc: c.jsonrpcVersion,
                            method: "window/showMessage",
                            params: params,
                        };
                        process_1.default.send(fakeSuccessResponse);
                        process_1.default.send(response);
                    }
                    else {
                        // code will always be defined here, even though technically it can be undefined
                        let code = getOpenedFileContent(params.textDocument.uri);
                        let formattedResult = utils.formatUsingValidBscPath(code, bscPath, extension === c.resiExt);
                        if (formattedResult.kind === "success") {
                            let result = [
                                {
                                    range: {
                                        start: { line: 0, character: 0 },
                                        end: {
                                            line: Number.MAX_VALUE,
                                            character: Number.MAX_VALUE,
                                        },
                                    },
                                    newText: formattedResult.result,
                                },
                            ];
                            let response = {
                                jsonrpc: c.jsonrpcVersion,
                                id: msg.id,
                                result: result,
                            };
                            process_1.default.send(response);
                        }
                        else {
                            // let the diagnostics logic display the updated syntax errors,
                            // from the build.
                            // Again, not sending the actual errors. See fakeSuccessResponse
                            // above for explanation
                            process_1.default.send(fakeSuccessResponse);
                        }
                    }
                }
            }
        }
        else {
            let response = {
                jsonrpc: c.jsonrpcVersion,
                id: msg.id,
                error: {
                    code: m.ErrorCodes.InvalidRequest,
                    message: "Unrecognized editor request.",
                },
            };
            process_1.default.send(response);
        }
    }
    else if (m.isResponseMessage(msg)) {
        // response message. Currently the client should have only sent a response
        // for asking us to start the build (see window/showMessageRequest in this
        // file)
        if (msg.result != null &&
            // @ts-ignore
            msg.result.title != null &&
            // @ts-ignore
            msg.result.title === c.startBuildAction) {
            let msg_ = msg.result;
            let projectRootPath = msg_.projectRootPath;
            let bsbPath = path.join(projectRootPath, c.bsbPartialPath);
            // TODO: sometime stale .bsb.lock dangling
            // TODO: close watcher when lang-server shuts down
            if (fs_1.default.existsSync(bsbPath)) {
                let bsbProcess = utils.runBsbWatcherUsingValidBsbPath(bsbPath, projectRootPath);
                let root = projectsFiles.get(projectRootPath);
                root.bsbWatcherByEditor = bsbProcess;
                bsbProcess.on("message", (a) => console.log("wtf======", a));
            }
        }
    }
});
//# sourceMappingURL=server.js.map