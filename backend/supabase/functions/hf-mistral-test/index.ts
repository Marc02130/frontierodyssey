import { serve } from "serve";

serve(async (_req) => {
  const HF_API_KEY = Deno.env.get("HF_API_KEY");
  if (!HF_API_KEY) {
    return new Response("Missing Hugging Face API key", { status: 500 });
  }

  const body = {
    inputs: "What is the capital of France?",
    parameters: {
      // You can add model parameters here if needed
      max_new_tokens: 64,
    },
  };

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return new Response(error, { status: response.status });
    }

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});