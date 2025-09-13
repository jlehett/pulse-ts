/** Minimal helper to adapt a Zod-like schema for NetworkServer.registerChannel validate. */
export type ZodLikeSchema<T = any> = {
    safeParse: (data: unknown) => { success: boolean };
};

export function validateWithZod(schema: ZodLikeSchema) {
    return (data: any) => !!schema?.safeParse?.(data)?.success;
}
