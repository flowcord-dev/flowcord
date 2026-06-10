import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// Items are added to each category as their corresponding PRs merge.
const sidebars: SidebarsConfig = {
  docsSidebar: [
    "introduction",
    {
      type: "category",
      label: "Getting Started",
      link: { type: "generated-index" },
      items: [
        "getting-started/installation",
        "getting-started/quick-start",
        "getting-started/project-setup",
      ],
    },
    {
      type: "category",
      label: "Core Concepts",
      link: { type: "generated-index" },
      items: [
        "core-concepts/menus-and-sessions",
        "core-concepts/menu-context",
        "core-concepts/render-modes",
        "core-concepts/navigation",
        "core-concepts/state-management",
        "core-concepts/lifecycle-hooks",
        "core-concepts/behavior-system",
      ],
    },
    {
      type: "category",
      label: "Components",
      link: { type: "generated-index" },
      items: [
        "components/buttons",
        "components/select-menus",
        "components/modals",
      ],
    },
    {
      type: "category",
      label: "Advanced",
      link: { type: "generated-index" },
      items: [
        "advanced/pagination",
        "advanced/sub-menus",
        "advanced/guards-and-pipelines",
        "advanced/layout-mode",
        "advanced/fallback-menus",
        "advanced/tracing-and-debugging",
        "advanced/session-persistence",
      ],
    },
    {
      type: "category",
      label: "Examples",
      link: { type: "doc", id: "examples/index" },
      items: [
        {
          type: "category",
          label: "Fundamentals",
          items: [
            "examples/quickstart",
            "examples/multi-menu-navigation",
            "examples/state-and-lifecycle",
            "examples/sub-menu-continuation",
            "examples/selects-and-modals",
            "examples/pagination-and-guards",
          ],
        },
        {
          type: "category",
          label: "Layout Mode",
          items: [
            "examples/layout-basics",
            "examples/layout-sections",
            "examples/layout-navigation",
            "examples/mode-transitions",
            "examples/layout-paginated-group",
          ],
        },
        {
          type: "category",
          label: "Behavior System",
          items: [
            "examples/behavior-subclass",
            "examples/behavior-policy",
          ],
        },
      ],
    },
  ],

  apiSidebar: [
    {
      type: "category",
      label: "API Reference",
      link: { type: "generated-index" },
      items: [
        "api-reference/flowcord-class",
        "api-reference/menu-builder",
        "api-reference/built-in-actions",
        "api-reference/context",
        "api-reference/behavior-types",
      ],
    },
  ],
};

export default sidebars;
