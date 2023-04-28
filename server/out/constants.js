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
exports.pullConfigurationInterval = exports.configurationRequestId = exports.bsconfigSuffixDefault = exports.bsconfigModuleDefault = exports.startBuildAction = exports.cmiExt = exports.resiExt = exports.resExt = exports.compilerLogPartialPath = exports.compilerDirPartialPath = exports.bsconfigPartialPath = exports.bsbLock = exports.rescriptNodePartialPath = exports.nodeModulesBinDir = exports.bscBinName = exports.rescriptBinName = exports.analysisProdPath = exports.analysisDevPath = exports.bscNativeReScriptPartialPath = exports.bscExeName = exports.nodeModulesPlatformPath = exports.platformPath = exports.jsonrpcVersion = exports.platformDir = void 0;
const path = __importStar(require("path"));
const buildSchema_1 = require("./buildSchema");
exports.platformDir = process.arch == "arm64" ? process.platform + process.arch : process.platform;
// See https://microsoft.github.io/language-server-protocol/specification Abstract Message
// version is fixed to 2.0
exports.jsonrpcVersion = "2.0";
exports.platformPath = path.join("rescript", exports.platformDir);
exports.nodeModulesPlatformPath = path.join("node_modules", exports.platformPath);
exports.bscExeName = "bsc.exe";
exports.bscNativeReScriptPartialPath = path.join(exports.nodeModulesPlatformPath, exports.bscExeName);
exports.analysisDevPath = path.join(path.dirname(__dirname), "..", "analysis", "rescript-editor-analysis.exe");
exports.analysisProdPath = path.join(path.dirname(__dirname), "analysis_binaries", exports.platformDir, "rescript-editor-analysis.exe");
exports.rescriptBinName = "rescript";
exports.bscBinName = "bsc";
exports.nodeModulesBinDir = path.join("node_modules", ".bin");
// can't use the native bsb/rescript since we might need the watcher -w flag, which is only in the JS wrapper
exports.rescriptNodePartialPath = path.join(exports.nodeModulesBinDir, exports.rescriptBinName);
exports.bsbLock = ".bsb.lock";
exports.bsconfigPartialPath = "bsconfig.json";
exports.compilerDirPartialPath = path.join("lib", "bs");
exports.compilerLogPartialPath = path.join("lib", "bs", ".compiler.log");
exports.resExt = ".res";
exports.resiExt = ".resi";
exports.cmiExt = ".cmi";
exports.startBuildAction = "Start Build";
// bsconfig defaults according configuration schema (https://rescript-lang.org/docs/manual/latest/build-configuration-schema)
exports.bsconfigModuleDefault = buildSchema_1.ModuleFormat.Commonjs;
exports.bsconfigSuffixDefault = ".js";
exports.configurationRequestId = "rescript_configuration_request";
exports.pullConfigurationInterval = 10000;
//# sourceMappingURL=constants.js.map