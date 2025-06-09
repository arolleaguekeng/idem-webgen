import { globSync } from 'fast-glob';
import fs from 'node:fs/promises';
import { basename } from 'node:path';
import { defineConfig, presetIcons, presetUno, transformerDirectives } from 'unocss';

const iconPaths = globSync('./icons/*.svg');

const collectionName = 'idem';

const customIconCollection = iconPaths.reduce(
  (acc, iconPath) => {
    const [iconName] = basename(iconPath).split('.');

    acc[collectionName] ??= {};
    acc[collectionName][iconName] = async () => fs.readFile(iconPath, 'utf8');

    return acc;
  },
  {} as Record<string, Record<string, () => Promise<string>>>,
);

const BASE_COLORS = {
  white: '#FFFFFF',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  accent: {
    50: '#EEF9FF',
    100: '#D8F1FF',
    200: '#BAE7FF',
    300: '#8ADAFF',
    400: '#53C4FF',
    500: '#2BA6FF',
    600: '#1488FC',
    700: '#0D6FE8',
    800: '#1259BB',
    900: '#154E93',
    950: '#122F59',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  orange: {
    50: '#FFFAEB',
    100: '#FEEFC7',
    200: '#FEDF89',
    300: '#FEC84B',
    400: '#FDB022',
    500: '#F79009',
    600: '#DC6803',
    700: '#B54708',
    800: '#93370D',
    900: '#792E0D',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },
};

const COLOR_PRIMITIVES = {
  ...BASE_COLORS,
  alpha: {
    white: generateAlphaPalette(BASE_COLORS.white),
    gray: generateAlphaPalette(BASE_COLORS.gray[900]),
    red: generateAlphaPalette(BASE_COLORS.red[500]),
    accent: generateAlphaPalette(BASE_COLORS.accent[500]),
  },
};

export default defineConfig({
  shortcuts: {
    'idem-ease-cubic-bezier': 'ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transition-theme': 'transition-[background-color,border-color,color] duration-150 idem-ease-cubic-bezier',
    kdb: 'bg-idem-elements-code-background text-idem-elements-code-text py-1 px-1.5 rounded-md',
    'max-w-chat': 'max-w-[var(--chat-max-width)]',
  },
  rules: [
    /**
     * This shorthand doesn't exist in Tailwind and we overwrite it to avoid
     * any conflicts with minified CSS classes.
     */
    ['b', {}],
  ],
  theme: {
    colors: {
      ...COLOR_PRIMITIVES,
      idem: {
        elements: {
          borderColor: 'var(--idem-elements-borderColor)',
          borderColorActive: 'var(--idem-elements-borderColorActive)',
          background: {
            depth: {
              1: 'var(--idem-elements-bg-depth-1)',
              2: 'var(--idem-elements-bg-depth-2)',
              3: 'var(--idem-elements-bg-depth-3)',
              4: 'var(--idem-elements-bg-depth-4)',
            },
          },
          textPrimary: 'var(--idem-elements-textPrimary)',
          textSecondary: 'var(--idem-elements-textSecondary)',
          textTertiary: 'var(--idem-elements-textTertiary)',
          code: {
            background: 'var(--idem-elements-code-background)',
            text: 'var(--idem-elements-code-text)',
          },
          button: {
            primary: {
              background: 'var(--idem-elements-button-primary-background)',
              backgroundHover: 'var(--idem-elements-button-primary-backgroundHover)',
              text: 'var(--idem-elements-button-primary-text)',
            },
            secondary: {
              background: 'var(--idem-elements-button-secondary-background)',
              backgroundHover: 'var(--idem-elements-button-secondary-backgroundHover)',
              text: 'var(--idem-elements-button-secondary-text)',
            },
            danger: {
              background: 'var(--idem-elements-button-danger-background)',
              backgroundHover: 'var(--idem-elements-button-danger-backgroundHover)',
              text: 'var(--idem-elements-button-danger-text)',
            },
          },
          item: {
            contentDefault: 'var(--idem-elements-item-contentDefault)',
            contentActive: 'var(--idem-elements-item-contentActive)',
            contentAccent: 'var(--idem-elements-item-contentAccent)',
            contentDanger: 'var(--idem-elements-item-contentDanger)',
            backgroundDefault: 'var(--idem-elements-item-backgroundDefault)',
            backgroundActive: 'var(--idem-elements-item-backgroundActive)',
            backgroundAccent: 'var(--idem-elements-item-backgroundAccent)',
            backgroundDanger: 'var(--idem-elements-item-backgroundDanger)',
          },
          actions: {
            background: 'var(--idem-elements-actions-background)',
            code: {
              background: 'var(--idem-elements-actions-code-background)',
            },
          },
          artifacts: {
            background: 'var(--idem-elements-artifacts-background)',
            backgroundHover: 'var(--idem-elements-artifacts-backgroundHover)',
            borderColor: 'var(--idem-elements-artifacts-borderColor)',
            inlineCode: {
              background: 'var(--idem-elements-artifacts-inlineCode-background)',
              text: 'var(--idem-elements-artifacts-inlineCode-text)',
            },
          },
          messages: {
            background: 'var(--idem-elements-messages-background)',
            linkColor: 'var(--idem-elements-messages-linkColor)',
            code: {
              background: 'var(--idem-elements-messages-code-background)',
            },
            inlineCode: {
              background: 'var(--idem-elements-messages-inlineCode-background)',
              text: 'var(--idem-elements-messages-inlineCode-text)',
            },
          },
          icon: {
            success: 'var(--idem-elements-icon-success)',
            error: 'var(--idem-elements-icon-error)',
            primary: 'var(--idem-elements-icon-primary)',
            secondary: 'var(--idem-elements-icon-secondary)',
            tertiary: 'var(--idem-elements-icon-tertiary)',
          },
          preview: {
            addressBar: {
              background: 'var(--idem-elements-preview-addressBar-background)',
              backgroundHover: 'var(--idem-elements-preview-addressBar-backgroundHover)',
              backgroundActive: 'var(--idem-elements-preview-addressBar-backgroundActive)',
              text: 'var(--idem-elements-preview-addressBar-text)',
              textActive: 'var(--idem-elements-preview-addressBar-textActive)',
            },
          },
          terminals: {
            background: 'var(--idem-elements-terminals-background)',
            buttonBackground: 'var(--idem-elements-terminals-buttonBackground)',
          },
          dividerColor: 'var(--idem-elements-dividerColor)',
          loader: {
            background: 'var(--idem-elements-loader-background)',
            progress: 'var(--idem-elements-loader-progress)',
          },
          prompt: {
            background: 'var(--idem-elements-prompt-background)',
          },
          sidebar: {
            dropdownShadow: 'var(--idem-elements-sidebar-dropdownShadow)',
            buttonBackgroundDefault: 'var(--idem-elements-sidebar-buttonBackgroundDefault)',
            buttonBackgroundHover: 'var(--idem-elements-sidebar-buttonBackgroundHover)',
            buttonText: 'var(--idem-elements-sidebar-buttonText)',
          },
          cta: {
            background: 'var(--idem-elements-cta-background)',
            text: 'var(--idem-elements-cta-text)',
          },
        },
      },
    },
  },
  transformers: [transformerDirectives()],
  presets: [
    presetUno({
      dark: {
        light: '[data-theme="light"]',
        dark: '[data-theme="dark"]',
      },
    }),
    presetIcons({
      warn: true,
      collections: {
        ...customIconCollection,
      },
    }),
  ],
});

/**
 * Generates an alpha palette for a given hex color.
 *
 * @param hex - The hex color code (without alpha) to generate the palette from.
 * @returns An object where keys are opacity percentages and values are hex colors with alpha.
 *
 * Example:
 *
 * ```
 * {
 *   '1': '#FFFFFF03',
 *   '2': '#FFFFFF05',
 *   '3': '#FFFFFF08',
 * }
 * ```
 */
function generateAlphaPalette(hex: string) {
  return [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].reduce(
    (acc, opacity) => {
      const alpha = Math.round((opacity / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      acc[opacity] = `${hex}${alpha}`;

      return acc;
    },
    {} as Record<number, string>,
  );
}
