import { exec } from "child_process";
import { promisify } from "util";
import { config } from "./config.js";

const execAsync = promisify(exec);

// Helper function to execute shell commands
export async function execCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    return stdout.trim();
  } catch (error) {
    throw new Error(`Command failed: ${error}`);
  }
}

// Check if a command/dependency exists
export async function checkDependency(command: string, name: string): Promise<void> {
  try {
    await execCommand(`which ${command}`);
  } catch {
    throw new Error(`${name} not found. Install with: brew install ${command}`);
  }
}

// Find Chrome/Chromium installation
export async function findChrome(): Promise<string | null> {
  // Check environment variable first
  if (config.CHROME_PATH) {
    try {
      await execCommand(`test -f "${config.CHROME_PATH}"`);
      return config.CHROME_PATH;
    } catch {
      // If specified path doesn't exist, continue to auto-detection
    }
  }

  // macOS paths
  const macPaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  ];

  for (const path of macPaths) {
    try {
      await execCommand(`test -f "${path}"`);
      return path;
    } catch {
      // Continue to next path
    }
  }

  // Linux paths
  const linuxCommands = ["google-chrome", "chromium", "chromium-browser"];
  for (const cmd of linuxCommands) {
    try {
      const path = await execCommand(`which ${cmd}`);
      if (path) return path;
    } catch {
      // Continue to next command
    }
  }

  return null;
}

// Check if file extension should be auto-rendered to PDF
export function shouldRenderToPdf(filePath: string): boolean {
  if (config.RENDER_EXTENSIONS.length === 0) return false;
  
  const ext = filePath.split('.').pop()?.toLowerCase() || "";
  return config.RENDER_EXTENSIONS.includes(ext);
}

// Check if file should be rendered as code with syntax highlighting
export function shouldRenderCode(filePath: string): boolean {
  // If CODE_EXCLUDE is "all", disable all code rendering
  if (config.CODE_EXCLUDE === "all") return false;
  
  const ext = filePath.split('.').pop()?.toLowerCase() || "";
  
  // Check if extension is in the exclusion list
  if (config.CODE_EXCLUDE_LIST.includes(ext)) return false;
  
  // Try to get language from extension - if highlight.js knows it, render it
  const language = getLanguageFromExtension(ext);
  return language !== "";
}

// Map file extension to highlight.js language identifier
export function getLanguageFromExtension(ext: string): string {
  const languageMap: { [key: string]: string } = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'fish': 'bash',
    'ps1': 'powershell',
    'sql': 'sql',
    'r': 'r',
    'lua': 'lua',
    'perl': 'perl',
    'pl': 'perl',
    'vim': 'vim',
    'yaml': 'yaml',
    'yml': 'yaml',
    'json': 'json',
    'xml': 'xml',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'md': 'markdown',
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
    'mk': 'makefile',
  };
  
  return languageMap[ext] || ext;
}

// Fix multiline spans - ensure spans don't break across lines
export function fixMultilineSpans(text: string): string {
  let classes: string[] = [];
  const spanRegex = /<(\/?)span(.*?)>/g;
  const tagAttrRegex = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/g;

  return text.split("\n").map(line => {
    const pre = classes.map(classVal => `<span class="${classVal}">`);

    let spanMatch;
    spanRegex.lastIndex = 0;
    while ((spanMatch = spanRegex.exec(line)) !== null) {
      if (spanMatch[1] !== "") {
        classes.pop();
        continue;
      }
      let attrMatch;
      tagAttrRegex.lastIndex = 0;
      while ((attrMatch = tagAttrRegex.exec(spanMatch[2])) !== null) {
        if (attrMatch[1].toLowerCase().trim() === "class") {
          classes.push(attrMatch[2]);
        }
      }
    }

    return `${pre.join("")}${line}${"</span>".repeat(classes.length)}`;
  }).join("\n");
}

