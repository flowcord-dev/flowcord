---
sidebar_position: 4
---

# State & Lifecycle

**Slash command:** `/workout`

A workout tracker across two menus, showing the difference between per-menu state and session-wide state, and demonstrating every major lifecycle hook.

**Concepts:** [state management](/docs/core-concepts/state-management), [lifecycle hooks](/docs/core-concepts/lifecycle-hooks), [ctx.state vs ctx.sessionState](/docs/core-concepts/state-management#choosing-between-them)

---

```ts
import { Client, GatewayIntentBits, EmbedBuilder, ButtonStyle } from 'discord.js';
import { FlowCord, MenuBuilder, goTo, closeMenu } from '@flowcord/core';

interface Exercise {
  name: string;
  reps: number;
  addedAt: number;
}

type DashboardState = {
  greeting: string;
  viewCount: number;
};

type ExerciseMenuState = {
  selectedExercise: string | null;
};

const exerciseLibrary = [
  { name: '🏋️ Squats', reps: 15 },
  { name: '🤸 Push-ups', reps: 20 },
  { name: '🏃 Lunges', reps: 12 },
  { name: '💪 Bicep Curls', reps: 10 },
  { name: '🧘 Planks', reps: 3 },
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const flowcord = new FlowCord({ client });

// ---------------------------------------------------------------------------
// Menu 1: Workout Dashboard
// ---------------------------------------------------------------------------
flowcord.registerMenu('workout', (session) =>
  new MenuBuilder<DashboardState>(session, 'workout')
    // setup() runs once on creation — the right place to initialize state
    .setup((ctx) => {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? '🌅 Good morning' : hour < 18 ? '☀️ Good afternoon' : '🌙 Good evening';
      ctx.state.set('greeting', greeting);
      ctx.state.set('viewCount', 0);

      // Session state persists across ALL menus in this session
      if (!ctx.sessionState.has('workoutLog')) {
        ctx.sessionState.set('workoutLog', [] as Exercise[]);
      }
    })

    // onEnter fires every time this menu is entered — including returns via goBack()
    .onEnter((ctx) => {
      const count = ctx.state.get('viewCount');
      ctx.state.set('viewCount', count + 1);
    })

    .beforeRender((ctx) => {
      // Runs before setEmbeds/setButtons — good for pre-computing derived state
    })

    .afterRender((ctx) => {
      // Runs after the Discord message is sent — good for analytics, logging
      const log = ctx.sessionState.get<Exercise[]>('workoutLog') ?? [];
      console.log(`[afterRender] Total exercises logged: ${log.length}`);
    })

    .onAction((ctx) => {
      // Fires before each button action callback
      console.log(`[onAction] User interacted with dashboard`);
    })

    .onLeave((ctx) => {
      console.log(`[onLeave] Leaving dashboard`);
    })

    .setEmbeds((ctx) => {
      const log = ctx.sessionState.get<Exercise[]>('workoutLog') ?? [];
      const totalReps = log.reduce((sum, ex) => sum + ex.reps, 0);

      return [
        new EmbedBuilder()
          .setTitle(`${ctx.state.get('greeting')}! 💪 Workout Dashboard`)
          .setDescription(
            log.length === 0
              ? 'No exercises logged yet. Start your workout!'
              : `**Exercises logged:** ${log.length}\n**Total reps:** ${totalReps}\n\n` +
                log.map((ex) => `• ${ex.name} — ${ex.reps} reps`).join('\n')
          )
          .setColor(log.length >= 3 ? 0x2ecc71 : 0xe74c3c)
          .setFooter({ text: `Views this session: ${ctx.state.get('viewCount')}` })
          .setTimestamp(),
      ];
    })

    .setButtons(() => [
      {
        label: '➕ Add Exercise',
        style: ButtonStyle.Success,
        action: goTo('exercise-picker'),
      },
      {
        label: '🗑️ Clear Log',
        style: ButtonStyle.Danger,
        action: async (ctx) => {
          // Clears session state — visible from any menu in this session
          ctx.sessionState.set('workoutLog', []);
        },
      },
      {
        label: '✅ Finish Workout',
        style: ButtonStyle.Secondary,
        action: closeMenu(),
      },
    ])

    .setCancellable()
    .setTrackedInHistory()
    .build()
);

// ---------------------------------------------------------------------------
// Menu 2: Exercise Picker
// ---------------------------------------------------------------------------
flowcord.registerMenu('exercise-picker', (session) =>
  new MenuBuilder<ExerciseMenuState>(session, 'exercise-picker')
    .setup((ctx) => {
      ctx.state.set('selectedExercise', null);
    })

    .setEmbeds(() => [
      new EmbedBuilder()
        .setTitle('🏋️ Choose an Exercise')
        .setDescription(
          exerciseLibrary.map((ex, i) => `**${i + 1}.** ${ex.name} (${ex.reps} reps)`).join('\n')
        )
        .setColor(0x3498db),
    ])

    .setButtons(() =>
      exerciseLibrary.map((exercise, index) => ({
        label: `${index + 1}`,
        style: ButtonStyle.Primary,
        action: async (ctx) => {
          // Write to session state — the dashboard will read this on return
          const log = ctx.sessionState.get<Exercise[]>('workoutLog') ?? [];
          log.push({ name: exercise.name, reps: exercise.reps, addedAt: Date.now() });
          ctx.sessionState.set('workoutLog', log);

          await ctx.goBack(); // Return to dashboard — it re-renders with the updated log
        },
      }))
    )

    .setReturnable()
    .build()
);

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'workout') {
      await flowcord.handleInteraction(interaction, 'workout');
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

- **`ctx.state` vs `ctx.sessionState`.** `greeting` and `viewCount` are menu-local — they reset when the menu is recreated. The `workoutLog` is in `ctx.sessionState` so it survives navigation to `exercise-picker` and back.
- **`onEnter` increments `viewCount` on every visit** — including when `goBack()` returns here. `setup()` only runs once, so the initial value is set there.
- **The exercise picker writes to `sessionState`, then calls `goBack()`.** The dashboard's `setEmbeds` callback reads `sessionState` fresh on every render, so it shows the updated log without any extra coordination.
- **Hook execution order:** `setup` → `onEnter` → `beforeRender` → *(render)* → `afterRender` → *(await interaction)* → `onAction` → *(action)* → `onLeave` (on navigate). See [Lifecycle Hooks](/docs/core-concepts/lifecycle-hooks).
