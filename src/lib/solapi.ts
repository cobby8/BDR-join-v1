import { SolapiMessageService } from "solapi";

const messageService = new SolapiMessageService(
    process.env.SOLAPI_API_KEY || "",
    process.env.SOLAPI_API_SECRET || ""
);

export async function sendSms(to: string, text: string) {
    if (!process.env.SOLAPI_API_KEY || !process.env.SOLAPI_API_SECRET) {
        console.warn("Solapi credentials not found. SMS skipped.");
        return { success: false, error: "Solapi credentials missing" };
    }

    try {
        const res = await messageService.send({
            to,
            from: process.env.SOLAPI_SENDER_PHONE || "",
            text,
        });
        console.log("SMS Sent:", res);
        return { success: true, data: res };
    } catch (error: any) {
        console.error("SMS Error:", error);
        return { success: false, error: error.message };
    }
}
