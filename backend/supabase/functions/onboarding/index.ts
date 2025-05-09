// Import required modules
import { serve } from 'serve';
import { InferenceClient } from '@huggingface/inference';
import { createClient } from '@supabase/supabase-js';
import { onboardingPrompt } from './prompts.ts';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const HF_API_KEY = Deno.env.get('HF_API_KEY')!;
const ONBOARD_HF_MODEL = Deno.env.get('ONBOARD_HF_MODEL')!;

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const hf = new InferenceClient(HF_API_KEY);

// Validate input
function validateInput(user_id: unknown, response: unknown): { valid: boolean, error?: string } {
  if (!user_id || typeof user_id !== 'string') return { valid: false, error: 'Invalid user_id' };
  if (response && (typeof response !== 'string' || response.length > 250)) return { valid: false, error: 'Invalid response' };
  return { valid: true };
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  let user_id: string | undefined;
  let response: string | undefined;

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const body = await req.json();
    user_id = body.user_id;
    response = body.response;

    const validation = validateInput(user_id, response);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Get or create conversation
    let { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('conversation_id')
      .eq('user_id', user_id)
      .eq('topic_type', 'onboard')
      .single();
    if (convError || !conversation) {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ user_id, topic_type: 'onboard' }])
        .select('conversation_id')
        .single();
      if (error) throw new Error('Failed to create conversation');
      conversation = data;
    }

    // Fetch conversation history
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('sender_type, message')
      .eq('conversation_id', conversation.conversation_id)
      .order('message_date', { ascending: true });
    if (msgError) throw new Error('Failed to fetch messages');

    // If this is the very first request (no response and no messages), call AI with just the system prompt
    if (!response && (!messages || messages.length === 0)) {
      const chatMessages = [{ role: 'system', content: onboardingPrompt }];
      const hfResult = await hf.chatCompletion({
        provider: 'hf-inference',
        model: ONBOARD_HF_MODEL,
        messages: chatMessages,
        max_tokens: 50,
        temperature: 0.7,
      });
      const aiMessage = hfResult.choices?.[0]?.message?.content?.trim() || 'What’s a subject or hobby you love? 😊';
      // Store only the AI message
      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: conversation.conversation_id,
          user_id,
          sender_type: 'ai',
          message_type: 'onboard_interests',
          message: aiMessage,
          is_draft: true,
          topic: 'onboarding',
        },
      ]);
      if (error) throw new Error('Failed to initialize messages');
      return new Response(JSON.stringify({ message: aiMessage, is_complete: false }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Build chat messages
    const chatMessages = [{ role: 'system', content: onboardingPrompt }];
    messages.forEach(m => {
      chatMessages.push({ role: m.sender_type === 'student' ? 'user' : 'assistant', content: m.message });
    });
    chatMessages.push({ role: 'user', content: response });

    // Call Hugging Face API
    const hfResult = await hf.chatCompletion({
      provider: 'hf-inference',
      model: ONBOARD_HF_MODEL,
      messages: chatMessages,
      max_tokens: 50,
      temperature: 0.7,
    });

    const aiMessage = hfResult.choices?.[0]?.message?.content?.trim() || 'What’s another subject or activity you enjoy? 😊';

    // Store messages
    const { error: insertError } = await supabase.from('messages').insert([
      {
        conversation_id: conversation.conversation_id,
        user_id,
        sender_type: 'student',
        message_type: 'onboard_interests',
        message: response,
        is_draft: true,
        topic: 'onboarding',
      },
      {
        conversation_id: conversation.conversation_id,
        user_id,
        sender_type: 'ai',
        message_type: 'onboard_interests',
        message: aiMessage,
        is_draft: true,
        topic: 'onboarding',
      },
    ]);
    if (insertError) throw new Error('Failed to store messages');

    return new Response(JSON.stringify({ message: aiMessage, is_complete: false }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error:', {
      message: err.message,
      user_id: user_id || 'unknown',
      response: response || 'none',
    });
    return new Response(
      JSON.stringify({ error: 'Server error', message: 'What’s another subject or activity you enjoy? 😊', is_complete: false }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});