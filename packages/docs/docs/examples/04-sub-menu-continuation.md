---
sidebar_position: 5
---

# Sub-Menu Continuation

**Slash command:** `/party`

A party builder where the parent menu opens a sub-menu to recruit adventurers, then receives the selection back via a completion callback.

**Concepts:** [sub-menus](/docs/advanced/sub-menus), [ctx.openSubMenu](/docs/api-reference/context#ctxopensubmenumenuid-opts), [ctx.complete](/docs/api-reference/context#ctxcompleteresult), [setPreserveStateOnReturn](/docs/api-reference/menu-builder#setpreservestateonreturn)

---

```ts
import { Client, GatewayIntentBits, EmbedBuilder, ButtonStyle } from 'discord.js';
import { FlowCord, MenuBuilder, closeMenu, goBack } from '@flowcord/core';

interface Adventurer {
  name: string;
  role: string;
  emoji: string;
  power: number;
}

type PartyState = {
  members: Adventurer[];
  maxSize: number;
};

const availableRecruits: Adventurer[] = [
  { name: 'Aria',  role: 'Healer',   emoji: '💚', power: 45 },
  { name: 'Bjorn', role: 'Tank',     emoji: '🛡️', power: 70 },
  { name: 'Cleo',  role: 'Mage',     emoji: '🔮', power: 85 },
  { name: 'Drake', role: 'Ranger',   emoji: '🏹', power: 60 },
  { name: 'Ember', role: 'Assassin', emoji: '🗡️', power: 90 },
  { name: 'Freya', role: 'Bard',     emoji: '🎵', power: 35 },
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const flowcord = new FlowCord({ client });

// ---------------------------------------------------------------------------
// Parent Menu: Party Builder
// ---------------------------------------------------------------------------
flowcord.registerMenu('party', (session) =>
  new MenuBuilder<PartyState>(session, 'party')
    .setup((ctx) => {
      ctx.state.set('members', []);
      ctx.state.set('maxSize', 4);
    })

    .setEmbeds((ctx) => {
      const members = ctx.state.get('members');
      const maxSize = ctx.state.get('maxSize');
      const totalPower = members.reduce((sum, m) => sum + m.power, 0);

      return [
        new EmbedBuilder()
          .setTitle('⚔️ Adventure Party Builder')
          .setDescription(
            members.length === 0
              ? 'Your party is empty! Recruit some adventurers.'
              : `**Party (${members.length}/${maxSize}):**\n\n` +
                members.map((m, i) => `${i + 1}. ${m.emoji} **${m.name}** — ${m.role} (⚡ ${m.power})`).join('\n') +
                `\n\n**Total Power:** ⚡ ${totalPower}`
          )
          .setColor(members.length >= maxSize ? 0x2ecc71 : 0xe67e22)
          .setFooter({
            text: members.length >= maxSize ? 'Party is full! Ready for adventure!' : `${maxSize - members.length} slot(s) remaining`,
          }),
      ];
    })

    .setButtons((ctx) => {
      const members = ctx.state.get('members');
      const isFull = members.length >= ctx.state.get('maxSize');

      return [
        {
          label: '🆕 Recruit Member',
          style: ButtonStyle.Success,
          disabled: isFull,
          action: async (ctx) => {
            const currentMembers = ctx.state.get('members');

            await ctx.openSubMenu('recruit', {
              // Pass current members so the sub-menu can filter them out
              alreadyRecruited: currentMembers.map((m) => m.name),

              // onComplete fires only if the sub-menu calls ctx.complete()
              // — not if it calls goBack() without completing
              onComplete: async (parentCtx, result) => {
                if (result) {
                  const recruited = result as Adventurer;
                  const updated = [...parentCtx.state.get('members'), recruited];
                  parentCtx.state.set('members', updated);
                }
              },
            });
          },
        },
        {
          label: '🗑️ Remove Last',
          style: ButtonStyle.Danger,
          disabled: members.length === 0,
          action: async (ctx) => {
            const updated = [...ctx.state.get('members')];
            updated.pop();
            ctx.state.set('members', updated);
          },
        },
        {
          label: '🚀 Start Adventure',
          style: ButtonStyle.Primary,
          disabled: members.length === 0,
          action: closeMenu(),
        },
      ];
    })

    .setCancellable()
    .setTrackedInHistory()
    .setPreserveStateOnReturn() // Keep the party list when returning from the sub-menu
    .build()
);

// ---------------------------------------------------------------------------
// Child Menu: Recruit an Adventurer
// ---------------------------------------------------------------------------
flowcord.registerMenu('recruit', (session, options) => {
  const alreadyRecruited = (options?.alreadyRecruited as string[]) ?? [];
  const available = availableRecruits.filter((r) => !alreadyRecruited.includes(r.name));

  return new MenuBuilder(session, 'recruit')
    .setEmbeds(() => [
      new EmbedBuilder()
        .setTitle('🏰 Adventurer Guild')
        .setDescription(
          available.length === 0
            ? 'No more adventurers available!'
            : 'Choose an adventurer to recruit:\n\n' +
              available.map((r, i) => `**${i + 1}.** ${r.emoji} **${r.name}** — ${r.role} (⚡ ${r.power})`).join('\n')
        )
        .setColor(0x9b59b6),
    ])

    .setButtons(() => [
      ...available.map((recruit, index) => ({
        label: `${index + 1}`,
        style: ButtonStyle.Primary as ButtonStyle,
        action: async (ctx) => {
          // complete() signals success — fires onComplete in the parent
          await ctx.complete(recruit);
        },
      })),
      {
        label: 'Never mind',
        style: ButtonStyle.Secondary,
        // goBack() without complete() — onComplete is NOT called
        action: goBack(),
      },
    ])

    .build();
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'party') {
      await flowcord.handleInteraction(interaction, 'party');
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

- **`ctx.complete(result)` vs `goBack()`.** Selecting a recruit calls `ctx.complete(recruit)` — this fires `onComplete` in the parent with the chosen `Adventurer`. Pressing "Never mind" calls `goBack()` directly, which returns to the parent but does NOT fire `onComplete`.
- **`onComplete` runs in the parent's context.** The `parentCtx` argument is the party builder's context — `parentCtx.state.get('members')` reads the party list, not the recruit menu's state.
- **`setPreserveStateOnReturn()` is essential here.** Without it, returning from the sub-menu would re-run `setup()` and reset the party list to empty. With it, state is snapshot on exit and restored on return.
- **Options flow into the sub-menu factory.** The `alreadyRecruited` array is passed via `openSubMenu` options and received in the factory's `options` parameter, allowing the sub-menu to filter already-recruited members.
