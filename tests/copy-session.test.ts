import { describe, expect, it } from 'vitest';
import { CopySession } from '../src/lib/order/copy-session';

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe('request clipboard session', () => {
  it('clears a successful copy when the message changes', async () => {
    const session = new CopySession();
    session.setMessage('first');
    await session.copy(async () => {});
    expect(session.getSnapshot()).toEqual({ busy: false, result: 'done' });
    session.setMessage('second');
    expect(session.getSnapshot()).toEqual({ busy: false, result: 'idle' });
  });
  it('ignores an old success even if the customer edits back to the first message', async () => {
    const session = new CopySession();
    session.setMessage('first');
    const pending = deferred();
    const task = session.copy(() => pending.promise);
    session.setMessage('second');
    session.setMessage('first');
    pending.resolve();
    await task;
    expect(session.getSnapshot()).toEqual({ busy: false, result: 'idle' });
  });
  it('serializes writes so an old write cannot overwrite a newer one', async () => {
    const session = new CopySession();
    const pending = deferred();
    const writes: string[] = [];
    session.setMessage('first');
    const task = session.copy((text) => { writes.push(text); return pending.promise; });
    session.setMessage('second');
    await session.copy(async (text) => { writes.push(text); });
    expect(writes).toEqual(['first']);
    pending.resolve();
    await task;
    await session.copy(async (text) => { writes.push(text); });
    expect(writes).toEqual(['first', 'second']);
  });
  it('shows a failure only for the current message and allows retry', async () => {
    const session = new CopySession();
    session.setMessage('first');
    await session.copy(async () => { throw new Error('denied'); });
    expect(session.getSnapshot()).toEqual({ busy: false, result: 'failed' });
    await session.copy(async () => {});
    expect(session.getSnapshot()).toEqual({ busy: false, result: 'done' });
  });
  it('suppresses stale failures and does not write empty messages', async () => {
    const session = new CopySession();
    session.setMessage('first');
    const pending = deferred();
    const task = session.copy(() => pending.promise);
    session.setMessage('');
    pending.reject(new Error('denied'));
    await task;
    let called = false;
    await session.copy(async () => { called = true; });
    expect(called).toBe(false);
    expect(session.getSnapshot()).toEqual({ busy: false, result: 'idle' });
  });
});
