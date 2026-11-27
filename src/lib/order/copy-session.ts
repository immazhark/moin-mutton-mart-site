export type CopySnapshot = Readonly<{ busy: boolean; result: 'idle' | 'done' | 'failed' }>;

/** A single clipboard write at a time; feedback belongs to one message revision. */
export class CopySession {
  private message = '';
  private revision = 0;
  private snapshot: CopySnapshot = { busy: false, result: 'idle' };
  private listeners = new Set<() => void>();

  getSnapshot = (): CopySnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private update(snapshot: CopySnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }

  setMessage(message: string): void {
    if (message === this.message) return;
    this.message = message;
    this.revision++;
    this.update({ busy: this.snapshot.busy, result: 'idle' });
  }

  async copy(write: (message: string) => Promise<void>): Promise<void> {
    if (!this.message || this.snapshot.busy) return;
    const revision = this.revision;
    const message = this.message;
    this.update({ busy: true, result: 'idle' });
    let result: CopySnapshot['result'];
    try {
      await write(message);
      result = 'done';
    } catch {
      result = 'failed';
    }
    this.update({ busy: false, result: revision === this.revision ? result : 'idle' });
  }
}
