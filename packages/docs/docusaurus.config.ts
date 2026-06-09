import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'FlowCord',
  tagline: 'Build rich, interactive menus for Discord bots.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://flowcord.dev',
  baseUrl: '/',

  organizationName: 'flowcord-dev',
  projectName: 'flowcord-core',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/flowcord-dev/flowcord-core/tree/master/packages/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    announcementBar: {
      id: 'alpha',
      content:
        '⚠️ FlowCord is currently in alpha — APIs may change between releases. See the <a href="https://github.com/flowcord-dev/flowcord-core/releases" target="_blank" rel="noopener noreferrer">changelog</a>.',
      backgroundColor: '#f0ad4e',
      textColor: '#1a1a1a',
      isCloseable: true,
    },
    image: 'img/social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'FlowCord',
      logo: {
        alt: 'FlowCord Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Guide',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API Reference',
        },
        {
          href: 'https://discord.gg/tcTqa5aKh9',
          label: 'Discord',
          position: 'right',
        },
        {
          href: 'https://github.com/flowcord-dev/flowcord-core',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/docs/introduction' },
            {
              label: 'Getting Started',
              to: '/docs/getting-started/installation',
            },
            {
              label: 'API Reference',
              to: '/docs/api-reference/flowcord-class',
            },
          ],
        },
        {
          title: 'Open Source',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/flowcord-dev/flowcord-core',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/@flowcord/core',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/tcTqa5aKh9',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} FlowCord. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
