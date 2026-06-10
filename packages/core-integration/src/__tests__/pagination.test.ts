import { EmbedBuilder } from 'discord.js';

import { MenuBuilder, type MenuSessionLike } from '@flowcord/core';
import { MenuHarness } from '@flowcord/testing';

describe('list pagination', () => {
  it('ctx.pagination is populated on first render', async () => {
    expect.assertions(3);
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setListPagination({
          getTotalQuantityItems: () => 25,
          itemsPerPage: 10,
        })
        .setEmbeds((ctx) => {
          if (!ctx.pagination) return [];
          return [
            new EmbedBuilder()
              .setDescription(
                `Showing page ${ctx.pagination.currentPage + 1} of ${ctx.pagination.totalPages}`,
              )
              .setFields({
                name: 'Details',
                value:
                  `Items: ${ctx.pagination.startIndex + 1}-${ctx.pagination.endIndex}` +
                  `\nItems per page: ${ctx.pagination.itemsPerPage}`,
              }),
          ];
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.hasText('Showing page 1 of 3')).toBe(true);
    expect(sim.hasText('Items: 1-10')).toBe(true);
    expect(sim.hasText('Items per page: 10')).toBe(true);
  });

  it('clicking next advances to the next page', async () => {
    expect.assertions(1);
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setListPagination({
          getTotalQuantityItems: () => 20,
          itemsPerPage: 10,
        })
        .setEmbeds((ctx) => {
          if (!ctx.pagination) return [];
          return [
            new EmbedBuilder().setFooter({
              text:
                `Page: ${ctx.pagination.currentPage + 1} - ` +
                `Items: ${ctx.pagination.startIndex + 1}-${ctx.pagination.endIndex}`,
            }),
          ];
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.nextPage();

    expect(sim.hasText('Page: 2 - Items: 11-20')).toBe(true);
  });

  it('clicking previous goes back to the previous page', async () => {
    expect.assertions(2);
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setListPagination({
          getTotalQuantityItems: () => 30,
          itemsPerPage: 10,
        })
        .setEmbeds((ctx) => {
          if (!ctx.pagination) return [];
          return [
            new EmbedBuilder().setDescription(
              `Current page: ${ctx.pagination.currentPage + 1}`,
            ),
          ];
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.nextPage();
    expect(sim.hasText('Current page: 2')).toBe(true);

    await sim.prevPage();
    expect(sim.hasText('Current page: 1')).toBe(true);
  });

  it('previous button is disabled on first page', async () => {
    expect.assertions(1);
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setListPagination({
          getTotalQuantityItems: () => 20,
          itemsPerPage: 10,
        })
        .setEmbeds(() => [new EmbedBuilder().setDescription('page')])
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.queryButtonById('__reserved_previous')?.disabled).toBe(
      true,
    );
  });

  it('next button is disabled on last page', async () => {
    expect.assertions(2);

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setListPagination({
          // 2 pages total
          getTotalQuantityItems: () => 20,
          itemsPerPage: 10,
        })
        .setEmbeds((ctx) => {
          if (!ctx.pagination) return [];
          return [
            new EmbedBuilder().setDescription(
              `Current page: ${ctx.pagination.currentPage + 1}`,
            ),
          ];
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.nextPage();
    expect(sim.hasText('Current page: 2')).toBe(true);

    expect(sim.queryButtonById('__reserved_next')?.disabled).toBe(
      true,
    );
  });
});
