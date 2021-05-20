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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBuildAction = exports.cmiExt = exports.resiExt = exports.resExt = exports.compilerLogPartialPath = exports.compilerDirPartialPath = exports.bsconfigPartialPath = exports.bsbLock = exports.bsbNodePartialPath = exports.rescriptNodePartialPath = exports.analysisProdPath = exports.analysisDevPath = exports.bscNativePartialPath = exports.bscNativeReScriptPartialPath = exports.jsonrpcVersion = void 0;
const path = __importStar(require("path"));
// See https://microsoft.github.io/language-server-protocol/specification Abstract Message
// version is fixed to 2.0
exports.jsonrpcVersion = "2.0";
exports.bscNativeReScriptPartialPath = path.join("node_modules", "rescript", process.platform, "bsc.exe");
exports.bscNativePartialPath = path.join("node_modules", "bs-platform", process.platform, "bsc.exe");
exports.analysisDevPath = path.join(path.dirname(__dirname), "..", "analysis", "rescript-editor-analysis.exe");
exports.analysisProdPath = path.join(path.dirname(__dirname), "analysis_binaries", process.platform, "rescript-editor-analysis.exe");
// can't use the native bsb/rescript since we might need the watcher -w flag, which is only in the JS wrapper
exports.rescriptNodePartialPath = path.join("node_modules", ".bin", "rescript");
exports.bsbNodePartialPath = path.join("node_modules", ".bin", "bsb");
exports.bsbLock = ".bsb.lock";
exports.bsconfigPartialPath = "bsconfig.json";
exports.compilerDirPartialPath = path.join("lib", "bs");
exports.compilerLogPartialPath = path.join("lib", "bs", ".compiler.log");
exports.resExt = ".res";
exports.resiExt = ".resi";
exports.cmiExt = ".cmi";
exports.startBuildAction = "Start Build";
//# sourceMappingURL=constants.js.map