/**
 * Runtime navigation event recording.
 *
 * The engine emits NavigationEvents on every menu transition.
 * A future dev tool can consume these to build flow diagrams.
 *
 * Minimal implementation — designed-for but not fully fleshed out yet.
 */

export interface NavigationEvent {
  from: string;
  to: string;
  sessionId: string;
  userId: string;
  timestamp: number;
  /** Whether this was a forward navigation or a back navigation. */
  direction: 'forward' | 'back';
  /** Which component triggered the navigation (e.g., 'button:add-prefix') */
  trigger?: string;
}

export class NavigationTracer {
  private readonly _events: NavigationEvent[] = [];
  private _enabled = false;

  /** Enable event recording. */
  enable(): void {
    this._enabled = true;
  }

  /** Disable event recording. */
  disable(): void {
    this._enabled = false;
  }

  /** Record a navigation event. No-op if disabled. */
  record(event: NavigationEvent): void {
    if (!this._enabled) return;
    this._events.push(event);
  }

  /** Get a snapshot of all recorded events. */
  get events(): ReadonlyArray<NavigationEvent> {
    return [...this._events];
  }

  /** Clear recorded events. */
  clear(): void {
    this._events.length = 0;
  }

  /**
   * Get all structurally implied forward navigation paths from a given menu.
   *
   * Forward events contribute a `from → to` edge. Back events are inverted
   * and contribute a `to → from` edge, representing the implied forward path
   * (e.g. a fallback back navigation implies the parent can reach the child).
   * Edges are deduplicated so forward+back pairs between the same menus
   * produce a single edge rather than a cycle.
   */
  getPathsFrom(menuId: string): string[][] {
    // Build a deduplicated adjacency map.
    // Forward events: from → to. Back events (inverted): to → from.
    const adjacency = new Map<string, Set<string>>();
    for (const event of this._events) {
      const [src, dst] =
        event.direction === 'back'
          ? [event.to, event.from]
          : [event.from, event.to];
      if (!adjacency.has(src)) adjacency.set(src, new Set());
      adjacency.get(src)!.add(dst);
    }

    const paths: string[][] = [];
    const visited = new Set<string>();

    // Depth-First Search (DFS) over implied forward edges to collect terminal paths.
    const dfs = (current: string, path: string[]): void => {
      if (visited.has(current)) return;
      visited.add(current);

      const next = adjacency.get(current);

      if (!next || next.size === 0) {
        paths.push([...path]);
        visited.delete(current);
        return;
      }

      for (const n of next) {
        dfs(n, [...path, n]);
      }
      visited.delete(current);
    };

    dfs(menuId, [menuId]);
    return paths;
  }
}
