
import { readdir } from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";

// Directories excluded by default.
const DEFAULT_IGNORED_DIRECTORIES = [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
];

// File extensions the scanner currently supports.
const SUPPORTED_EXTENSIONS = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".md",
]);

// Options that callers can provide.
type ScanOptions = {
    ignore?: string[];
    allowPartial?: boolean;
};

// Information returned after scanning.
type ScanResult = {
    files: string[];
    warnings: string[];
    complete: boolean;
};

export async function scanRepository(
    rootDirectory: string,
    options: ScanOptions = {}
): Promise<ScanResult> {
    const absoluteRoot = path.resolve(rootDirectory);

    const ignoredDirectories = new Set([
        ...DEFAULT_IGNORED_DIRECTORIES,
        ...(options.ignore ?? []),
    ]);

    const discoveredFiles: string[] = [];
    const warnings: string[] = [];

    // Validate the root before scanning.
    // Root errors must fail in both modes.
    const rootEntries = await readdir(absoluteRoot, {
        withFileTypes: true,
    });

    async function traverse(
        currentDirectory: string,
        entries?: Dirent[]
    ): Promise<void> {
        let directoryEntries: Dirent[];

        try {
            directoryEntries =
                entries ??
                (await readdir(currentDirectory, {
                    withFileTypes: true,
                }));
        } catch (error) {
            if (!options.allowPartial) {
                throw new Error(
                    `Failed to scan directory "${currentDirectory}"`,
                    { cause: error }
                );
            }

            warnings.push(
                `Skipped inaccessible directory: ${currentDirectory}`
            );
            return;
        }

        for (const entry of directoryEntries) {
            const fullPath = path.join(currentDirectory, entry.name);

            if (entry.isDirectory()) {
                if (ignoredDirectories.has(entry.name)) {
                    continue;
                }

                await traverse(fullPath);
                continue;
            }

            if (!entry.isFile()) {
                continue;
            }

            const extension = path.extname(entry.name);

            if (SUPPORTED_EXTENSIONS.has(extension)) {
                discoveredFiles.push(
                    path.relative(absoluteRoot, fullPath)
                );
            }
        }
    }

    await traverse(absoluteRoot, rootEntries);

    return {
        files: discoveredFiles,
        warnings,
        complete: warnings.length === 0,
    };
}
