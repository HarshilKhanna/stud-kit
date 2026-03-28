/**
 * Runs @imgly/background-removal inside a dedicated worker so WASM inference
 * does not block the main thread (admin UI stays interactive).
 */

let worker: Worker | null = null;
let initPromise: Promise<void> | null = null;
let seq = 0;

const pending = new Map<
  number,
  { resolve: (b: Blob) => void; reject: (e: Error) => void }
>();

function attachHandlers(w: Worker) {
  w.onmessage = (
    e: MessageEvent<
      | { type: "ready" }
      | { type: "init-error"; error: string }
      | {
          type: "remove-result";
          id: number;
          ok: true;
          buffer: ArrayBuffer;
          mimeType: string;
        }
      | { type: "remove-result"; id: number; ok: false; error: string }
                >,
  ) => {
    const data = e.data;
    if (data.type === "ready" || data.type === "init-error") return;
    if (data.type !== "remove-result") return;
    const handlers = pending.get(data.id);
    if (!handlers) return;
    pending.delete(data.id);
    if (data.ok) {
      handlers.resolve(new Blob([data.buffer], { type: data.mimeType }));
    } else {
      handlers.reject(new Error(data.error));
    }
  };
  w.onerror = (ev) => {
    const err = new Error(ev.message || "Background removal worker error");
    pending.forEach((handlers) => handlers.reject(err));
    pending.clear();
    worker?.terminate();
    worker = null;
    initPromise = null;
  };
}

/**
 * Preloads models inside the worker. Safe to call once; subsequent calls return the same promise.
 */
export function ensureBgRemovalWorker(publicPath: string): Promise<void> {
  if (typeof Worker === "undefined") {
    return Promise.reject(new Error("Workers not available"));
  }
  if (!initPromise) {
    initPromise = new Promise((resolve, reject) => {
      try {
        const w = new Worker(new URL("./bgRemoval.worker.ts", import.meta.url), {
          type: "module",
        });
        attachHandlers(w);
        const onFirstMessage = (e: MessageEvent<{ type: string; error?: string }>) => {
          if (e.data?.type === "ready") {
            w.removeEventListener("message", onFirstMessage);
            worker = w;
            resolve();
            return;
          }
          if (e.data?.type === "init-error") {
            w.removeEventListener("message", onFirstMessage);
            w.terminate();
            initPromise = null;
            reject(new Error(e.data.error || "Worker init failed"));
          }
        };
        w.addEventListener("message", onFirstMessage);
        w.postMessage({ type: "init", publicPath });
      } catch (e) {
        initPromise = null;
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }
  return initPromise;
}

/**
 * Remove background off the main thread. Caller must have called ensureBgRemovalWorker first
 * (or this will wait for init via ensureBgRemovalWorker).
 */
export async function removeBackgroundInWorker(
  imageBlob: Blob,
  publicPath: string,
): Promise<Blob> {
  await ensureBgRemovalWorker(publicPath);
  if (!worker) throw new Error("Worker not initialised");

  const id = ++seq;
  const buffer = await imageBlob.arrayBuffer();
  const mimeType = imageBlob.type || "image/jpeg";

  const result = new Promise<Blob>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker!.postMessage({ type: "remove", id, buffer, mimeType }, [buffer]);
  });

  const timeoutMs = 120_000;
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Background removal timed out")), timeoutMs);
  });

  try {
    return await Promise.race([result, timeout]);
  } catch (e) {
    pending.delete(id);
    throw e;
  }
}
