// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Midjourney } from "midjourney";
import { ResponseError } from "../../interfaces";
export const config = {
  runtime: "edge",
};
const client = new Midjourney(
  <string>process.env.SERVER_ID,
  <string>process.env.CHANNEL_ID,
  <string>process.env.SALAI_TOKEN
);
client.maxWait = 600;
export default async function handler(req: Request) {
  const { content, index, msgId, msgHash } = await req.json();
  console.log("upscale.handler", content);
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      console.log("upscale.start", content);
      client
        .Upscale(
          content,
          index,
          msgId,
          msgHash,
          (uri: string, progress: string) => {
            console.log("upscale.loading", uri);
            controller.enqueue(
              encoder.encode(JSON.stringify({ uri, progress }))
            );
          }
        )
        .then((msg) => {
          console.log("upscale.done", msg);
          controller.enqueue(encoder.encode(JSON.stringify(msg)));
          controller.close();
        })
        .catch((err: ResponseError) => {
          console.log("upscale.error", err);
          controller.close();
        });
    },
  });
  return new Response(readable, {});
}
