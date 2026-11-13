/**
 * The shared environment's nginx forwards only application prefixes such as `/customers`.
 * The preview sits below the static `all` item because `/customers/<segment>` is the customer
 * id slot: a direct child would be resolved as customer `dev-facilities`.
 */
export const FACILITIES_PREVIEW_PATH = '/customers/all/dev-facilities';
