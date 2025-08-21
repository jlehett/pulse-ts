/** Simply strictly-increasing numeric identifier generator. */
let NEXT_IDENTIFIER = 1;

/** Returns a unique numeric identifier. */
export function nextIdentifier(): number {
    return NEXT_IDENTIFIER++;
}
