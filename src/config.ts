// Configuration from environment variables
export interface Config {
  DEFAULT_PRINTER: string;
  DEFAULT_DUPLEX: boolean;
  DEFAULT_OPTIONS: string;
  CHROME_PATH: string;
  RENDER_EXTENSIONS: string[];
  CODE_EXCLUDE: string;
  CODE_EXCLUDE_LIST: string[];
  CODE_COLOR_SCHEME: string;
  CODE_LINE_NUMBERS: boolean;
  CODE_FONT_SIZE: string;
  CODE_LINE_SPACING: string;
}

export const config: Config = {
  DEFAULT_PRINTER: process.env.MCP_PRINTER_DEFAULT || "",
  DEFAULT_DUPLEX: process.env.MCP_PRINTER_DUPLEX === "true",
  DEFAULT_OPTIONS: process.env.MCP_PRINTER_OPTIONS || "",
  CHROME_PATH: process.env.MCP_PRINTER_CHROME_PATH || "",
  RENDER_EXTENSIONS: process.env.MCP_PRINTER_RENDER_EXTENSIONS 
    ? process.env.MCP_PRINTER_RENDER_EXTENSIONS.split(',').map(e => e.trim().toLowerCase())
    : [],
  CODE_EXCLUDE: process.env.MCP_PRINTER_CODE_EXCLUDE || "",
  CODE_EXCLUDE_LIST: process.env.MCP_PRINTER_CODE_EXCLUDE 
    ? process.env.MCP_PRINTER_CODE_EXCLUDE.split(',').map(e => e.trim().toLowerCase()) 
    : [],
  CODE_COLOR_SCHEME: process.env.MCP_PRINTER_CODE_COLOR_SCHEME || "atom-one-light",
  CODE_LINE_NUMBERS: process.env.MCP_PRINTER_CODE_LINE_NUMBERS !== "false",
  CODE_FONT_SIZE: process.env.MCP_PRINTER_CODE_FONT_SIZE || "10pt",
  CODE_LINE_SPACING: process.env.MCP_PRINTER_CODE_LINE_SPACING || "1.5",
};

