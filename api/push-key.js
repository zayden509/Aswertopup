// GET /api/push-key — kle piblik VAPID la, pou telefòn kliyan an abòne nan notifikasyon push yo
import { SetupError, bot, fail, json } from "./_lib/autotopup.js";
import { pushKeys } from "./_lib/push.js";

export async function GET() {
  try {
    const { publicKey } = await pushKeys(await bot());
    return json({ ok: true, publicKey }, 200);
  } catch (error) {
    if (error instanceof SetupError) return fail("Notifikasyon yo poko disponib.", 503);
    console.error("push-key", error);
    return fail("error", 500);
  }
}
