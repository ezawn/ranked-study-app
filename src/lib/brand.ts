/**
 * The product's name, in one place.
 *
 * The name is provisional — that was stated outright when the design world was
 * settled, and a provisional name spelled into eight files is not provisional,
 * it is eight files to find and miss one of. Everything user-facing reads
 * from here: the wordmark, the timer labels, the transactional mail.
 *
 * `PRODUCT_NAME` is the word. `MAIL_FROM_NAME` is the same word in the one
 * place a display name is joined to an address. Renaming the product should be
 * a one-line edit in this file plus a new wordmark glyph — nothing else.
 *
 * Deliberately not in `env.ts`: this is a brand fact, not a deployment
 * setting, and it should be identical in every environment.
 */
export const PRODUCT_NAME = "StudyQuest";

/** The display name on outbound mail. */
export const MAIL_FROM_NAME = PRODUCT_NAME;
