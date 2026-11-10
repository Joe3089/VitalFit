import { z } from "zod";

export const createConfirmEmailSchema = (t: (key: string) => string) =>
    z.object({
        code: z.string().length(6, { message: t("codeLengthError") }),
    });
