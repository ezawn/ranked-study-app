import { SUBJECTS, STAGES, streamKey, TOPICS_BY_SUBJECT } from "./taxonomy";

/**
 * Everything a client is allowed to put in a queue preference.
 *
 * Derived from the taxonomy rather than written out, so a new subject or topic
 * becomes selectable the moment it exists and never a moment before. Anything
 * outside these sets is dropped on the way in: an unknown key would silently
 * narrow a search to nothing, which looks exactly like matchmaking being
 * broken and is impossible to diagnose from the outside.
 *
 * Its own module because both the server action and the queue service need it,
 * and neither should be importing the other.
 */

export const KNOWN_STREAMS: ReadonlySet<string> = new Set(
  SUBJECTS.flatMap((subject) => STAGES.map((stage) => streamKey(subject, stage))),
);

export const KNOWN_TOPICS: ReadonlySet<string> = new Set(
  SUBJECTS.flatMap((subject) => TOPICS_BY_SUBJECT[subject].map((topic) => topic.key)),
);

export const KNOWN_QUEUE_VALUES = { streams: KNOWN_STREAMS, topics: KNOWN_TOPICS };

/** Does this topic belong to this subject? Used by the importer. */
export function topicBelongsTo(subject: string, topicKey: string): boolean {
  const topics = TOPICS_BY_SUBJECT[subject as keyof typeof TOPICS_BY_SUBJECT];
  return topics ? topics.some((topic) => topic.key === topicKey) : false;
}
