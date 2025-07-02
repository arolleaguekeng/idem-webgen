import type { ITheme } from '@xterm/xterm';

const style = getComputedStyle(document.documentElement);
const cssVar = (token: string) => style.getPropertyValue(token) || undefined;

export function getTerminalTheme(overrides?: ITheme): ITheme {
  return {
    cursor: cssVar('--idem-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--idem-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--idem-elements-terminal-textColor'),
    background: cssVar('--idem-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--idem-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--idem-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--idem-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--idem-elements-terminal-color-black'),
    red: cssVar('--idem-elements-terminal-color-red'),
    green: cssVar('--idem-elements-terminal-color-green'),
    yellow: cssVar('--idem-elements-terminal-color-yellow'),
    blue: cssVar('--idem-elements-terminal-color-blue'),
    magenta: cssVar('--idem-elements-terminal-color-magenta'),
    cyan: cssVar('--idem-elements-terminal-color-cyan'),
    white: cssVar('--idem-elements-terminal-color-white'),
    brightBlack: cssVar('--idem-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--idem-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--idem-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--idem-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--idem-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--idem-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--idem-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--idem-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}
