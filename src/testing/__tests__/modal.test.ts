import {
  ButtonStyle,
  ComponentType,
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { MenuBuilder } from '../../menu/MenuBuilder';
import type { MenuSessionLike } from '../../context/MenuContext';
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

// Reusable factory for tests that only need the modal button wired up with a no-op submit.
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

describe('modal flow (declarative opensModal)', () => {
  it('onSubmit receives field values from the modal submission', async () => {
    let submittedName: string | null = null;

    const mockSubmitMenu = (session: MenuSessionLike) =>
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
            onSubmit: async (_ctx, fields) => {
              submittedName = fields.getField(
                'name-field',
                ComponentType.TextInput,
              ).value;
            },
          },
        ])
        .build();

    const sim = new MenuHarness({ main: mockSubmitMenu });
    await sim.start('main');

    sim.clickModal('Open Modal');
    await sim.submitModal({ 'name-field': 'Alice' });

    expect(submittedName).toBe('Alice');
  });

  it('menu re-renders after modal submit — render count increments', async () => {
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');
    const rendersBefore = sim.renderCount;

    sim.clickModal('Open Modal');
    await sim.submitModal({});

    expect(sim.renderCount).toBe(rendersBefore + 1);
  });

  it('modal can be submitted multiple times in a loop', async () => {
    const submittedNames: string[] = [];

    const mockMultiSubmitMenu = (session: MenuSessionLike) =>
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
            onSubmit: async (_ctx, fields) => {
              submittedNames.push(
                fields.getField('name-field', ComponentType.TextInput)
                  .value,
              );
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

    expect(submittedNames).toEqual(['Alice', 'Bob']);
  });
});
