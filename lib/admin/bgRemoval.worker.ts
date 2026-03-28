/// <reference lib="webworker" />

import { preload, removeBackground } from "@imgly/background-removal";

type MainToWorker =
  | { type: "init"; publicPath: string }
  | {
      type: "remove";
      id: number;
      buffer: ArrayBuffer;
      mimeType: string;
    };

type WorkerToMain =
  | { type: "ready" }
  | { type: "init-error"; error: string }
  | {
      type: "remove-result";
      id: number;
      ok: true;
      buffer: ArrayBuffer;
      mimeType: string;
    }
  | { type: "remove-result"; id: number; ok: false; error: string };

let publicPath = "";

self.onmessage = async (e: MessageEvent<MainToWorker>) => {
  const msg = e.data;
  if (msg.type === "init") {
    try {
      publicPath = msg.publicPath;
      await preload({ publicPath });
      (self as DedicatedWorkerGlobalScope).postMessage({ type: "ready" } satisfies WorkerToMain);
    } catch (err) {
      const out: WorkerToMain = {
        type: "init-error",
        error: err instanceof Error ? err.message : String(err),
      };
      (self as DedicatedWorkerGlobalScope).postMessage(out);
    }
    return;
  }
  if (msg.type === "remove") {
    if (!publicPath) {
      const err: WorkerToMain = {
        type: "remove-result",
        id: msg.id,
        ok: false,
        error: "bgRemoval worker not initialised",
      };
      (self as DedicatedWorkerGlobalScope).postMessage(err);
      return;
    }
    try {
      const blob = new Blob([msg.buffer], {
        type: msg.mimeType || "image/jpeg",
      });
      const cutout = await removeBackground(blob, {
        publicPath,
        debug: false,
        model: "isnet_quint8",
        device: "cpu",
        output: {
          format: "image/png",
          quality: 1,
        },
      });
      const buffer = await cutout.arrayBuffer();
      const out: WorkerToMain = {
        type: "remove-result",
        id: msg.id,
        ok: true,
        buffer,
        mimeType: cutout.type || "image/png",
      };
      (self as DedicatedWorkerGlobalScope).postMessage(out, [buffer]);
    } catch (err) {
      const out: WorkerToMain = {
        type: "remove-result",
        id: msg.id,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
      (self as DedicatedWorkerGlobalScope).postMessage(out);
    }
  }
};
