import { EmbedBuilder } from 'discord.js';
import { MenuBuilder } from '../../menu/MenuBuilder';
import type { MenuSessionLike } from '../../context/MenuContext';
import type { PaginationState } from '../../types';
import { MenuHarness } from '../MenuHarness';

describe('list pagination', () => {
  it('ctx.pagination is populated on first render', async () => {
    let capturedPagination: PaginationState | null = null;

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setListPagination({
          getTotalQuantityItems: () => 25,
          itemsPerPage: 10,
        })
        .setEmbeds((ctx) => {
          capturedPagination = ctx.pagination;
          return [new EmbedBuilder().setDescription('page')];
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(capturedPagination).not.toBeNull();
    expect(capturedPagination!.currentPage).toBe(0);
    expect(capturedPagination!.totalPages).toBe(3); // ceil(25/10)
    expect(capturedPagination!.itemsPerPage).toBe(10);
    expect(capturedPagination!.startIndex).toBe(0);
    expect(capturedPagination!.endIndex).toBe(10); // exclusive upper bound
  });

  it('clicking next advances to the next page', async () => {
    const paginationHistory: PaginationState[] = [];

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setListPagination({
          getTotalQuantityItems: () => 20,
          itemsPerPage: 10,
        })
        .setEmbeds((ctx) => {
          if (ctx.pagination)
            paginationHistory.push({ ...ctx.pagination });
          return [new EmbedBuilder().setDescription('page')];
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.nextPage();

    expect(paginationHistory).toHaveLength(2);
    expect(paginationHistory[1].currentPage).toBe(1);
    expect(paginationHistory[1].startIndex).toBe(10);
    expect(paginationHistory[1].endIndex).toBe(20); // exclusive upper bound
  });

  it('clicking previous goes back to the previous page', async () => {
    let currentPage = -1;

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setListPagination({
          getTotalQuantityItems: () => 30,
          itemsPerPage: 10,
        })
        .setEmbeds((ctx) => {
          if (ctx.pagination)
            currentPage = ctx.pagination.currentPage;
          return [new EmbedBuilder().setDescription('page')];
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.nextPage();
    expect(currentPage).toBe(1);

    await sim.prevPage();
    expect(currentPage).toBe(0);
  });

  it('previous button is disabled on first page', async () => {
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
    let currentPage = 0;

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setListPagination({
          getTotalQuantityItems: () => 20,
          itemsPerPage: 10,
        })
        .setEmbeds((ctx) => {
          if (ctx.pagination)
            currentPage = ctx.pagination.currentPage;
          return [new EmbedBuilder().setDescription('page')];
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.nextPage();
    expect(currentPage).toBe(1); // last page (total=20, perPage=10 → 2 pages, 0-indexed last = 1)

    expect(sim.queryButtonById('__reserved_next')?.disabled).toBe(
      true,
    );
  });
});
