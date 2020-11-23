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
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBuildAction = exports.resiExt = exports.resExt = exports.compilerLogPartialPath = exports.bsconfigPartialPath = exports.bsbLock = exports.bsbPartialPath = exports.bscPartialPath = exports.jsonrpcVersion = void 0;
const path = __importStar(require("path"));
// See https://microsoft.github.io/language-server-protocol/specification Abstract Message
// version is fixed to 2.0
exports.jsonrpcVersion = "2.0";
exports.bscPartialPath = path.join("node_modules", "bs-platform", process.platform, "bsc.exe");
// can't use the native bsb since we might need the watcher -w flag, which is only in the js wrapper
// export let bsbPartialPath = path.join('node_modules', 'bs-platform', process.platform, 'bsb.exe');
exports.bsbPartialPath = path.join("node_modules", ".bin", "bsb");
exports.bsbLock = ".bsb.lock";
exports.bsconfigPartialPath = "bsconfig.json";
exports.compilerLogPartialPath = path.join("lib", "bs", ".compiler.log");
exports.resExt = ".res";
exports.resiExt = ".resi";
exports.startBuildAction = "Start Build";
//# sourceMappingURL=constants.js.map