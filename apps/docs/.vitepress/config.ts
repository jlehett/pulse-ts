import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Pulse TS',
  description: 'TypeScript ECS for interactive applications',
  themeConfig: {
    nav: [
      { text: 'Learn', link: '/learn/quickstart' },
      { text: 'Guides', link: '/guides/camera-controls-render' },
      { text: 'API', link: '/api/README' }
    ],
    sidebar: {
      '/learn/': [
        { text: 'Quickstart', link: '/learn/quickstart' },
        { text: 'Philosophy', link: '/learn/philosophy' },
        { text: 'Core Concepts', link: '/learn/core-concepts' },
        { text: 'Functional Nodes', link: '/learn/functional-nodes' },
        { text: 'Update Loop', link: '/learn/update-loop' },
        { text: 'Examples', link: '/learn/examples' }
      ],
      '/guides/': [
        { text: 'Camera + Controls + Render', link: '/guides/camera-controls-render' },
        { text: 'Save/Load with Stable IDs', link: '/guides/save-load-stable-ids' },
        { text: 'Input Bindings & Actions', link: '/guides/input-bindings' },
        { text: 'Networking: Authoritative Server & Client Worlds', link: '/guides/network-authoritative-worlds' },
        { text: 'Networking: Replication & Interpolation', link: '/guides/network-snapshots-interpolation' },
        { text: 'Networking: RPC & Reliable Channels', link: '/guides/network-rpc-channels' }
      ]
    },
    search: {
      provider: 'local'
    }
  }
});


