import assert from 'node:assert/strict';
import { compare, verifyPublished, type Candidate } from './model';

export type ReleaseServices = {
  read: () => Promise<{ metadata?: any; publishedAt?: string; latest: string }>;
  publish: () => Promise<void>;
  tag: () => Promise<void>;
  release: (publishedAt: string) => Promise<void>;
  record: (publishedAt: string) => Promise<void>;
};

export async function completeRelease(
  candidate: Candidate,
  integrity: string,
  services: ReleaseServices,
) {
  let state = await services.read();
  if (!state.metadata) {
    assert(
      compare(state.latest, candidate.version) < 0,
      'A newer npm latest already exists. Stop rather than move latest backward.',
    );
    // An ambiguous publish error is recoverable only after registry verification.
    let publishError: unknown;
    try {
      await services.publish();
    } catch (error) {
      publishError = error;
    }
    state = await services.read();
    if (!state.metadata)
      throw (
        publishError ||
        new Error('npm has not confirmed publication; rerun this workflow')
      );
  }
  verifyPublished(state.metadata, candidate, integrity);
  assert(state.publishedAt, 'npm publication timestamp is missing');
  assert(
    !Number.isNaN(Date.parse(state.publishedAt)),
    'npm publication timestamp is invalid',
  );
  await services.tag();
  await services.release(state.publishedAt);
  await services.record(state.publishedAt);
}
