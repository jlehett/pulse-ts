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
        { text: 'Networking: Overview', link: '/guides/networking-overview' },
        { text: 'Networking: Transports', link: '/guides/networking-transports' },
        { text: 'Networking: Channels, RPC & Reliable', link: '/guides/networking-channels-rpc-reliable' },
        { text: 'Networking: Replication & Interpolation', link: '/guides/networking-replication' },
        { text: 'Networking: Server Broker (WebSocket)', link: '/guides/networking-server-broker' },
        { text: 'Networking: Cookbook', link: '/guides/networking-cookbook' },
      ]
    },
    search: {
      provider: 'local'
    }
  }
});


