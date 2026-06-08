import {
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import type { MenuSessionLike } from '../../context/MenuContext';
import { MenuBuilder } from '../../menu/MenuBuilder';
import { MenuHarness } from '../MenuHarness';

const OPEN_MODAL_BTN = 'open-modal';
const MODAL_ID = 'my-modal';

function buildModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(MODAL_ID)
    .setTitle('Test Modal')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Your Name')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('name-field')
            .setStyle(TextInputStyle.Short),
        ),
    );
}

describe('modal flow (declarative opensModal)', () => {
  it('onSubmit receives field values from the modal submission', async () => {
    expect.assertions(1);

    const mockSubmitMenu = (session: MenuSessionLike) =>
      new MenuBuilder<{ name: string }>(session, 'main')
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(
            `Name: ${ctx.state.get('name')}`,
          ),
        ])
        .setButtons(() => [
          {
            label: 'Open Modal',
            style: ButtonStyle.Primary,
            id: OPEN_MODAL_BTN,
            opensModal: MODAL_ID,
          },
        ])
        .setModal(() => [
          {
            id: MODAL_ID,
            builder: buildModal(),
            onSubmit: async (ctx, fields) => {
              ctx.state.set(
                'name',
                fields.getField('name-field', ComponentType.TextInput)
                  .value,
              );
            },
          },
        ])
        .build();

    const sim = new MenuHarness({ main: mockSubmitMenu });
    await sim.start('main');

    sim.clickModal('Open Modal');
    await sim.submitModal({ 'name-field': 'Alice' });

    expect(sim.hasText('Name: Alice')).toBe(true);
  });

  it('menu re-renders after modal submit — render count increments', async () => {
    expect.assertions(1);

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Open Modal',
            style: ButtonStyle.Primary,
            id: OPEN_MODAL_BTN,
            opensModal: MODAL_ID,
          },
        ])
        .setModal(() => [
          {
            id: MODAL_ID,
            builder: buildModal(),
            onSubmit: async () => {},
          },
        ])
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');
    const rendersBefore = sim.renderCount;

    sim.clickModal('Open Modal');
    await sim.submitModal({});

    expect(sim.renderCount).toBe(rendersBefore + 1);
  });

  it('modal can be submitted multiple times in a loop', async () => {
    expect.assertions(1);

    const mockMultiSubmitMenu = (session: MenuSessionLike) =>
      new MenuBuilder<{ names: string[] }>(session, 'main')
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(
            `Submitted names: ${ctx.state.get('names')?.join(', ')}`,
          ),
        ])
        .setButtons(() => [
          {
            label: 'Open Modal',
            style: ButtonStyle.Primary,
            id: OPEN_MODAL_BTN,
            opensModal: MODAL_ID,
          },
        ])
        .setModal(() => [
          {
            id: MODAL_ID,
            builder: buildModal(),
            onSubmit: async (ctx, fields) => {
              const submittedNames = ctx.state.get('names') || [];
              submittedNames.push(
                fields.getField('name-field', ComponentType.TextInput)
                  .value,
              );
              ctx.state.set('names', submittedNames);
            },
          },
        ])
        .build();

    const sim = new MenuHarness({ main: mockMultiSubmitMenu });
    await sim.start('main');

    for (const name of ['Alice', 'Bob']) {
      sim.clickModal('Open Modal');
      await sim.submitModal({ 'name-field': name });
    }

    expect(sim.hasText('Submitted names: Alice, Bob')).toBe(true);
  });
});
