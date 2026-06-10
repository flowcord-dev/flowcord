---
sidebar_position: 7
---

# Pagination & Guards

**Slash command:** `/shop`

A virtual shop with three menus: a paginated item list, an item detail page with purchase guards, and an inventory with list pagination.

**Concepts:** [button pagination](/docs/advanced/pagination#button-pagination), [list pagination](/docs/advanced/pagination#list-pagination), [guards](/docs/advanced/guards-and-pipelines#guards), [pipeline](/docs/advanced/guards-and-pipelines#pipelines), [onNext/onPrevious hooks](/docs/core-concepts/lifecycle-hooks#onnextctx--onpreviousctx)

---

```ts
import { Client, GatewayIntentBits, EmbedBuilder, ButtonStyle } from 'discord.js';
import { FlowCord, MenuBuilder, type MenuContext, goTo, pipeline, guard } from '@flowcord/core';

interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  rarity: 'common' | 'rare' | 'legendary';
}

type ShopSessionState = { gold: number; inventory: string[] };
type CatalogState = { items: ShopItem[] };

const shopInventory: ShopItem[] = [
  { id: 'potion',    name: 'Health Potion',   emoji: '🧪', price: 50,   rarity: 'common'    },
  { id: 'shield',    name: 'Iron Shield',     emoji: '🛡️', price: 150,  rarity: 'common'    },
  { id: 'sword',     name: 'Steel Sword',     emoji: '⚔️', price: 200,  rarity: 'common'    },
  { id: 'bow',       name: 'Longbow',         emoji: '🏹', price: 175,  rarity: 'common'    },
  { id: 'staff',     name: 'Oak Staff',       emoji: '🪄', price: 180,  rarity: 'common'    },
  { id: 'ring',      name: 'Silver Ring',     emoji: '💍', price: 300,  rarity: 'rare'      },
  { id: 'cape',      name: 'Enchanted Cape',  emoji: '🧣', price: 400,  rarity: 'rare'      },
  { id: 'boots',     name: 'Winged Boots',    emoji: '👢', price: 350,  rarity: 'rare'      },
  { id: 'amulet',    name: 'Dragon Amulet',   emoji: '📿', price: 500,  rarity: 'rare'      },
  { id: 'helm',      name: 'Mithril Helm',    emoji: '⛑️', price: 450,  rarity: 'rare'      },
  { id: 'excalibur', name: 'Excalibur',       emoji: '🗡️', price: 1000, rarity: 'legendary' },
  { id: 'phoenix',   name: 'Phoenix Feather', emoji: '🪶', price: 800,  rarity: 'legendary' },
  { id: 'crown',     name: 'Crown of Wisdom', emoji: '👑', price: 1200, rarity: 'legendary' },
];

const rarityColors = { common: 0x95a5a6, rare: 0x3498db, legendary: 0xe67e22 };

// --- Reusable guards ---
const requireGold = (item: ShopItem) =>
  guard<MenuContext<Record<string, unknown>, ShopSessionState>>(
    async (ctx) => {
      const gold = ctx.sessionState.get('gold') ?? 0;
      return gold >= item.price;
    },
    `Not enough gold! You need ${item.price}g.`
  );

const requireNotOwned = (item: ShopItem) =>
  guard<MenuContext<Record<string, unknown>, ShopSessionState>>(
    async (ctx) => {
      const inventory = ctx.sessionState.get('inventory') ?? [];
      return !inventory.includes(item.id);
    },
    `You already own ${item.name}!`
  );

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const flowcord = new FlowCord({ client });

// ---------------------------------------------------------------------------
// Menu 1: Shop Home — button pagination
// ---------------------------------------------------------------------------
flowcord.registerMenu('shop', (session) =>
  new MenuBuilder<Record<string, unknown>, ShopSessionState>(session, 'shop')
    .setup((ctx) => {
      ctx.sessionState.set('gold', 500);
      ctx.sessionState.set('inventory', []);
    })

    .setEmbeds((ctx) => {
      const gold = ctx.sessionState.get('gold') ?? 0;
      const inventory = ctx.sessionState.get('inventory') ?? [];
      const page = ctx.pagination; // Available because setButtons uses pagination below

      return [
        new EmbedBuilder()
          .setTitle("🏪 The Adventurer's Shop")
          .setDescription(
            `Welcome, traveler!\n\n💰 **Your Gold:** ${gold}g\n🎒 **Items Owned:** ${inventory.length}` +
            (page ? `\n\n📄 Page ${page.currentPage + 1} of ${page.totalPages}` : '')
          )
          .setColor(0xe67e22)
          .setFooter({ text: 'Each button corresponds to an item for sale' }),
      ];
    })

    // 13 items paginated at 4 per page — Next/Previous injected automatically
    .setButtons(
      () => shopInventory.map((item) => ({
        label: `${item.emoji} ${item.name} (${item.price}g)`,
        style: item.rarity === 'legendary' ? ButtonStyle.Danger
             : item.rarity === 'rare'      ? ButtonStyle.Primary
             :                               ButtonStyle.Secondary,
        action: goTo('item-detail', { itemId: item.id }),
      })),
      { pagination: { perPage: 4, stableButtons: true } }
    )

    // Fires when the user clicks Next or Previous
    .onNext((ctx) => {
      console.log(`[Shop] Advanced to page ${ctx.pagination?.currentPage}`);
    })
    .onPrevious((ctx) => {
      console.log(`[Shop] Went back to page ${ctx.pagination?.currentPage}`);
    })

    .setCancellable()
    .setTrackedInHistory()
    .build()
);

// ---------------------------------------------------------------------------
// Menu 2: Item Detail — guard pipeline on purchase
// ---------------------------------------------------------------------------
flowcord.registerMenu('item-detail', (session, options) => {
  const item = shopInventory.find((i) => i.id === options?.itemId)!;

  return new MenuBuilder(session, 'item-detail')
    .setEmbeds((ctx) => {
      const owned = (ctx.sessionState.get('inventory') ?? []).includes(item.id);

      return [
        new EmbedBuilder()
          .setTitle(`${item.emoji} ${item.name}`)
          .setDescription(
            `**Rarity:** ${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}\n` +
            `**Price:** ${item.price}g\n\n` +
            (owned ? '✅ *You own this item.*' : '🛒 *Available for purchase.*')
          )
          .setColor(rarityColors[item.rarity]),
      ];
    })

    .setButtons((ctx) => {
      const owned = (ctx.sessionState.get('inventory') ?? []).includes(item.id);

      return [
        {
          label: owned ? '✅ Owned' : `🛒 Buy (${item.price}g)`,
          style: owned ? ButtonStyle.Secondary : ButtonStyle.Success,
          disabled: owned,
          // Guards run in order — if any fail, the pipeline halts and shows the message
          action: pipeline(
            requireGold(item),
            requireNotOwned(item),
            async (ctx) => {
              const gold = ctx.sessionState.get('gold') ?? 0;
              const inventory = ctx.sessionState.get('inventory') ?? [];
              ctx.sessionState.set('gold', gold - item.price);
              ctx.sessionState.set('inventory', [...inventory, item.id]);
              // Re-renders to show "Owned"
            }
          ),
        },
      ];
    })

    .setReturnable()
    .build();
});

// ---------------------------------------------------------------------------
// Menu 3: Inventory — list pagination
// ---------------------------------------------------------------------------
flowcord.registerMenu('inventory', (session) =>
  new MenuBuilder<CatalogState, ShopSessionState>(session, 'inventory')
    .setup((ctx) => {
      const ownedIds = ctx.sessionState.get('inventory') ?? [];
      ctx.state.set('items', shopInventory.filter((i) => ownedIds.includes(i.id)));
    })

    // List pagination: FlowCord populates ctx.pagination before setEmbeds runs
    .setListPagination({
      getTotalQuantityItems: async (ctx) => ctx.state.get('items').length,
      itemsPerPage: 3,
    })

    .setEmbeds((ctx) => {
      const items = ctx.state.get('items');
      const page = ctx.pagination;

      if (items.length === 0) {
        return [
          new EmbedBuilder()
            .setTitle('🎒 Your Inventory')
            .setDescription('Your inventory is empty! Visit the shop to buy items.')
            .setColor(0x95a5a6),
        ];
      }

      // Use startIndex/endIndex to slice the correct page of items
      const pageItems = page ? items.slice(page.startIndex, page.endIndex) : items;

      return [
        new EmbedBuilder()
          .setTitle('🎒 Your Inventory')
          .setDescription(
            pageItems.map((item, i) =>
              `**${(page?.startIndex ?? 0) + i + 1}.** ${item.emoji} ${item.name} — *${item.rarity}*`
            ).join('\n')
          )
          .setColor(0x2ecc71)
          .setFooter({
            text: page
              ? `Page ${page.currentPage + 1}/${page.totalPages} • ${page.totalItems} items total`
              : `${items.length} items total`,
          }),
      ];
    })

    .setReturnable()
    .build()
);

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'shop') {
      await flowcord.handleInteraction(interaction, 'shop');
    }
  } else if (interaction.isMessageComponent()) {
    flowcord.routeComponentInteraction(interaction);
  }
});

client.once('ready', () => console.log(`Logged in as ${client.user?.tag}`));
client.login(process.env.DISCORD_BOT_TOKEN);
```

---

## Key things to notice

- **Button pagination vs list pagination serve different purposes.** The shop home uses button pagination — each button is a clickable item. The inventory uses list pagination — items are displayed in an embed, and `ctx.pagination` provides `startIndex`/`endIndex` to slice the data.
- **Guards are defined as factory functions.** `requireGold(item)` and `requireNotOwned(item)` each close over the specific item, then return a `guard()`. This keeps the `pipeline()` call at the button level clean and the guard logic reusable.
- **`pipeline` halts on the first failed guard.** If the user can't afford the item, `requireGold` throws `GuardFailedError` and the purchase action never runs. The user sees the failure message and the menu re-renders unchanged.
- **`ctx.pagination` is available in `setEmbeds`** during button pagination — the shop embed uses it to display the current page number even though the buttons are what's actually paginated.
