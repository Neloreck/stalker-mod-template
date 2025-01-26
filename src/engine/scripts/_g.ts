import { prefetch } from "xray16";

/**
 * Prefetch main script entry points.
 * As result, first scripts execution will be much faster for all next global calls.
 * Reduces execution of register/bind/start calls by up to ~5 times.
 */
prefetch("register");
prefetch("bind");
prefetch("start");

/**
 * Initialize external references (effects/callbacks/conditions).
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("@/engine/scripts/register/externals_registrator").registerExternals();
