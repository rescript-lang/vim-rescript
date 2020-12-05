"use strict";
// import * as c from './constants';
// import * as utils from './utils';
// import { uriToFsPath, URI } from 'vscode-uri';
// import * as path from 'path';
// import { CompletionResolveRequest } from 'vscode-languageserver';
// let stupidFileContentCache: Map<string, string> = new Map()
// let projectsFiles: Map<
// 	string,
// 	{
// 		openFiles: Set<string>,
// 		filesWithDiagnostics: Set<string>,
// 	}>
// 	= new Map()
// let openedFile = (fileUri: string, fileContent: string) => {
// 	let filePath = uriToFsPath(URI.parse(fileUri), true);
// 	stupidFileContentCache.set(filePath, fileContent)
// 	let compilerLogDir = utils.findDirOfFileNearFile(c.compilerLogPartialPath, filePath)
// 	if (compilerLogDir != null) {
// 		let compilerLogPath = path.join(compilerLogDir, c.compilerLogPartialPath);
// 		if (!projectsFiles.has(compilerLogPath)) {
// 			projectsFiles.set(compilerLogPath, { openFiles: new Set(), filesWithDiagnostics: new Set() })
// 			compilerLogsWatcher.add(compilerLogPath)
// 		}
// 		let compilerLog = projectsFiles.get(compilerLogPath)!
// 		compilerLog.openFiles.add(filePath)
// 		// no need to call sendUpdatedDiagnostics() here; the watcher add will
// 		// call the listener which calls it
// 	}
// }
// let closedFile = (fileUri: string) => {
// 	let filePath = uriToFsPath(URI.parse(fileUri), true);
// 	stupidFileContentCache.delete(filePath)
// 	let compilerLogDir = utils.findDirOfFileNearFile(c.compilerLogPartialPath, filePath)
// 	if (compilerLogDir != null) {
// 		let compilerLogPath = path.join(compilerLogDir, c.compilerLogPartialPath);
// 		let compilerLog = projectsFiles.get(compilerLogPath)
// 		if (compilerLog != null) {
// 			compilerLog.openFiles.delete(filePath)
// 			// clear diagnostics too if no open files open in said project
// 			if (compilerLog.openFiles.size === 0) {
// 				projectsFiles.delete(compilerLogPath)
// 				compilerLogsWatcher.unwatch(compilerLogPath)
// 			}
// 		}
// 	}
// }
//# sourceMappingURL=fileState.js.map