/**
 * routes/ai.js
 * Express router for Venture AI — intelligent startup co-founder & business copilot.
 * Uses real Google Gemini when an API key is configured on the backend,
 * and features an autonomous reasoning engine for offline/local operation.
 */

import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = express.Router();

/**
 * Rate limiter for AI chat: 20 requests per minute per user/IP.
 * Suitable for small startup usage while guarding against quota/billing exhaustion.
 */
const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: 'Too Many Requests',
    message: 'Too many AI chat requests. Please wait a moment and try again.',
  },
  keyGenerator: (req) => {
    return req.user?.id || ipKeyGenerator(req.ip || '127.0.0.1');
  },
});

// ---------------------------------------------------------------------------
// Business State & Telemetry Retrieval (Strictly scoped by user)
// ---------------------------------------------------------------------------

async function fetchBusinessSummary(userId) {
  if (!supabaseAdmin || !userId) {
    return {
      hasBusiness: false,
      businessName: null,
      currency: 'USD',
      totalClients: 0,
      totalInvoices: 0,
      pendingInvoices: 0,
      recentRevenueLast30Days: 0,
      totalExpensesLast30Days: 0,
      netLast30Days: 0,
      pendingReceivables: 0,
      topDebtor: null,
      recentExpenses: [],
    };
  }

  try {
    const { data: business, error: bizErr } = await supabaseAdmin
      .from('businesses')
      .select('id, name, industry, description, currency')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bizErr) {
      console.error('[AI] Error fetching business for user:', bizErr.message);
      return {
        hasBusiness: false,
        businessName: null,
        currency: 'USD',
        totalClients: 0,
        totalInvoices: 0,
        pendingInvoices: 0,
        recentRevenueLast30Days: 0,
        totalExpensesLast30Days: 0,
        netLast30Days: 0,
        pendingReceivables: 0,
        topDebtor: null,
        recentExpenses: [],
      };
    }

    if (!business) {
      return {
        hasBusiness: false,
        businessName: null,
        currency: 'USD',
        totalClients: 0,
        totalInvoices: 0,
        pendingInvoices: 0,
        recentRevenueLast30Days: 0,
        totalExpensesLast30Days: 0,
        netLast30Days: 0,
        pendingReceivables: 0,
        topDebtor: null,
        recentExpenses: [],
      };
    }

    const businessId = business.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const [
      { count: clientCount, error: clientErr },
      { count: invoiceCount, error: invErr },
      { data: revenueData, error: revErr },
      { data: pendingInvoices, error: pendErr },
      { data: expenseData, error: expErr },
    ] = await Promise.all([
      supabaseAdmin.from('clients').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
      supabaseAdmin.from('invoices').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
      supabaseAdmin.from('invoices').select('total_amount').eq('business_id', businessId).eq('status', 'paid').gte('created_at', thirtyDaysAgoISO),
      supabaseAdmin.from('invoices').select('id, invoice_number, total_amount, due_date, status, client_id, clients(name)').eq('business_id', businessId).eq('status', 'pending').order('total_amount', { ascending: false }).limit(5),
      supabaseAdmin.from('expenses').select('amount, category, description, created_at').eq('business_id', businessId).gte('created_at', thirtyDaysAgoISO).order('created_at', { ascending: false }).limit(10),
    ]);

    if (clientErr) console.warn('[AI] Client count warning:', clientErr.message);
    if (invErr) console.warn('[AI] Invoice count warning:', invErr.message);
    if (revErr) console.warn('[AI] Revenue query warning:', revErr.message);
    if (pendErr) console.warn('[AI] Pending invoices warning:', pendErr.message);
    if (expErr) console.warn('[AI] Expenses query warning:', expErr.message);

    const recentRevenue = (revenueData ?? []).reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
    const totalExpenses = (expenseData ?? []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const pendingReceivables = (pendingInvoices ?? []).reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);

    const topDebtor = pendingInvoices && pendingInvoices.length > 0
      ? {
          client: pendingInvoices[0].clients?.name || 'Pending Client',
          invoice: pendingInvoices[0].invoice_number || 'Invoice',
          amount: Number(pendingInvoices[0].total_amount) || 0,
          dueDate: pendingInvoices[0].due_date || null,
        }
      : null;

    return {
      hasBusiness: true,
      businessId: business.id,
      businessName: business.name || 'Your Workspace',
      industry: business.industry || '',
      description: business.description || '',
      currency: business.currency || 'USD',
      totalClients: clientCount ?? 0,
      totalInvoices: invoiceCount ?? 0,
      pendingInvoices: (pendingInvoices ?? []).length,
      recentRevenueLast30Days: recentRevenue,
      totalExpensesLast30Days: totalExpenses,
      netLast30Days: recentRevenue - totalExpenses,
      pendingReceivables,
      topDebtor,
      recentExpenses: (expenseData ?? []).slice(0, 5),
    };
  } catch (err) {
    console.error('[AI] Unexpected error in fetchBusinessSummary:', err.message);
    return {
      hasBusiness: false,
      businessName: null,
      currency: 'USD',
      totalClients: 0,
      totalInvoices: 0,
      pendingInvoices: 0,
      recentRevenueLast30Days: 0,
      totalExpensesLast30Days: 0,
      netLast30Days: 0,
      pendingReceivables: 0,
      topDebtor: null,
      recentExpenses: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Autonomous Answering Engine (Offline/Local Fallback)
// ---------------------------------------------------------------------------

function evaluateMath(expr) {
  try {
    const clean = expr.replace(/[^0-9+\-*/().% ]/g, '').replace(/%/g, '/100');
    if (!clean.trim()) return null;
    const result = Function(`'use strict'; return (${clean})`)();
    if (typeof result === 'number' && !isNaN(result)) {
      return result;
    }
  } catch {
    return null;
  }
  return null;
}

function generatePersonalizedResponse(message, ctx, user) {
  const text = (message || '').trim();
  const q = text.toLowerCase();
  const founder = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const company = ctx?.businessName || 'your business';
  const hasData = ctx && ctx.hasBusiness && (ctx.totalClients > 0 || ctx.totalInvoices > 0 || ctx.recentRevenueLast30Days > 0 || ctx.totalExpensesLast30Days > 0);

  // Math & Calculation queries
  if (/[0-9]/.test(q) && (/(\+|\-|\*|\/|percent|%|calculate|what is [0-9])/i.test(q))) {
    const match = q.replace(/^(what is|calculate|solve)\s*/i, '');
    const val = evaluateMath(match);
    if (val !== null) {
      return `The result is **${val.toLocaleString()}**.\n\nLet me know if you need any other calculations or financial projections!`;
    }
  }

  // Greetings
  if (/^(hi|hello|hey|greetings|howdy|good morning|good afternoon|what's up|yo)\b/i.test(q)) {
    if (hasData) {
      return (
        `Hey ${founder}! Great to sync up. 👋\n\n` +
        `Here is the pulse on **${company}**:\n` +
        `* **30-Day Revenue:** $${ctx.recentRevenueLast30Days.toLocaleString()}\n` +
        `* **30-Day Expenses:** $${ctx.totalExpensesLast30Days.toLocaleString()}\n` +
        `* **Active Clients:** ${ctx.totalClients}\n\n` +
        `What are we tackling today? Ask me anything from drafting client communications to financial analysis or strategy!`
      );
    }
    return (
      `Hey ${founder}! Great to connect. 👋\n\n` +
      `I'm ready to assist with your business strategy, drafting client communications, financial planning, or general questions.\n\n` +
      `As you record clients and invoices in the workspace, I will track your live business metrics here. What would you like to work on?`
    );
  }

  // Identity / Persona
  if (q.includes('who are you') || q.includes('what are you') || q.includes('what can you do') || q.includes('introduce')) {
    return (
      `I'm **Venture AI** — your AI co-founder, strategic advisor, and business copilot for **${company}**.\n\n` +
      `Here is what we can do together:\n\n` +
      `* 💬 **Strategic Advisory**: Bounce business ideas, evaluate trade-offs, and plan next steps.\n` +
      `* ✍️ **Draft Communications**: Write professional emails, invoices, follow-ups, and proposals.\n` +
      `* 📊 **Financial Intelligence**: Review your actual revenue, operating expenses, and pending client invoices.\n` +
      `* 💻 **Technical & Operational Guidance**: Architecture advice, code snippets, pricing models, and workflow automation.\n\n` +
      `Ask me anything on your mind — I'm ready!`
    );
  }

  // Email & Letter Drafting
  if (q.includes('draft') || q.includes('write an email') || q.includes('write a letter') || q.includes('send an email') || q.includes('template')) {
    if (q.includes('remind') || q.includes('invoice') || q.includes('payment') || q.includes('late') || q.includes('owe')) {
      const debtorName = ctx?.topDebtor?.client || '[Client Company Name]';
      const invNum = ctx?.topDebtor?.invoice || '[INV-001]';
      const amt = ctx?.topDebtor?.amount ? `$${ctx.topDebtor.amount.toLocaleString()}` : '[Amount Due]';
      const due = ctx?.topDebtor?.dueDate || '[Due Date]';

      return (
        `Here is a professional payment reminder email draft:\n\n` +
        `---\n` +
        `**Subject:** Follow-up: Invoice #${invNum} — ${company}\n\n` +
        `Hi Team,\n\n` +
        `Hope you're having a productive week.\n\n` +
        `I wanted to check in regarding **Invoice #${invNum}** for **${amt}**, which is scheduled for payment by **${due}**.\n\n` +
        `Please let us know if your accounts department needs any updated documentation or assistance to facilitate the transfer.\n\n` +
        `Thank you for your partnership,\n\n` +
        `**${founder}**\n` +
        `${company}\n` +
        `---\n\n` +
        `💡 *Tip: You can copy and send this directly, or ask me to adjust the tone to be firmer or more casual.*`
      );
    }

    return (
      `Here is a clean B2B outreach email template you can adapt:\n\n` +
      `---\n` +
      `**Subject:** Exploring a collaboration with {{Company}}\n\n` +
      `Hi {{FirstName}},\n\n` +
      `I noticed your team's recent initiatives and wanted to reach out.\n\n` +
      `At **${company}**, we help businesses streamline operations and achieve their delivery milestones.\n\n` +
      `Would you have 10 minutes next Tuesday for a brief introductory conversation to see if we might be of help?\n\n` +
      `Best regards,\n\n` +
      `**${founder}**\n` +
      `${company}\n` +
      `---`
    );
  }

  // Financial lookups
  if (q.includes('revenue') || q.includes('mrr') || q.includes('trend')) {
    if (!hasData) {
      return `You have not recorded any revenue transactions in the last 30 days yet. As you mark invoices as paid in the Invoices tab, real-time revenue trends will be tracked here.`;
    }
    return (
      `Here is your verified 30-day financial summary for **${company}**:\n\n` +
      `* **Total Revenue (last 30 days):** $${ctx.recentRevenueLast30Days.toLocaleString()}\n` +
      `* **Total Expenses (last 30 days):** $${ctx.totalExpensesLast30Days.toLocaleString()}\n` +
      `* **Net Margin:** $${ctx.netLast30Days.toLocaleString()} (${ctx.recentRevenueLast30Days > 0 ? ((ctx.netLast30Days / ctx.recentRevenueLast30Days) * 100).toFixed(1) : 0}%)\n` +
      `* **Pending Receivables:** $${ctx.pendingReceivables.toLocaleString()} across ${ctx.pendingInvoices} invoice(s)`
    );
  }

  if (q.includes('owe') || q.includes('debtor') || q.includes('unpaid') || q.includes('pending')) {
    if (!ctx?.topDebtor || ctx.topDebtor.amount === 0) {
      return `You currently have no pending or overdue invoices recorded in your invoice ledger. All accounts are settled up!`;
    }
    return (
      `Your largest outstanding invoice is with **${ctx.topDebtor.client}**:\n\n` +
      `* **Invoice:** #${ctx.topDebtor.invoice}\n` +
      `* **Amount:** $${ctx.topDebtor.amount.toLocaleString()}\n` +
      `* **Due Date:** ${ctx.topDebtor.dueDate || 'Not specified'}\n\n` +
      `Would you like me to draft a friendly follow-up email for them?`
    );
  }

  if (q.includes('expense') || q.includes('cut') || q.includes('reduce') || q.includes('cost')) {
    if (!ctx || ctx.totalExpensesLast30Days === 0) {
      return `No operating expenses are recorded in your workspace for the last 30 days. You can log vendor costs and receipts in the Expenses or Venture Vision tab to begin tracking expense optimizations.`;
    }
    return (
      `Your recorded operating expenses over the last 30 days total **$${ctx.totalExpensesLast30Days.toLocaleString()}**.\n\n` +
      `To optimize costs:\n` +
      `1. Audit recurring software subscriptions and remove inactive seats.\n` +
      `2. Review cloud infrastructure commitments for discounted reserved pricing.\n` +
      `3. Consolidate vendor contracts where volume discounts apply.`
    );
  }

  // Hiring & Affordability
  if (q.includes('hire') || q.includes('afford') || q.includes('salary') || q.includes('headcount')) {
    if (!hasData) {
      return `To evaluate hiring feasibility accurately, record your regular client revenue and operating expenses in the workspace. That will allow me to calculate your real net operating surplus and payroll runway.`;
    }
    const surplus = ctx.netLast30Days;
    return (
      `### 🧮 Hiring Feasibility Check for **${company}**:\n\n` +
      `* **30-Day Net Cash Flow:** ${surplus >= 0 ? '+' : ''}$${surplus.toLocaleString()}\n` +
      `* **30-Day Revenue:** $${ctx.recentRevenueLast30Days.toLocaleString()}\n` +
      `* **30-Day Operating Expenses:** $${ctx.totalExpensesLast30Days.toLocaleString()}\n\n` +
      (surplus > 5000
        ? `With a monthly net surplus of **+$${surplus.toLocaleString()}**, you have operating room to support a contractor or hire. Ensure the new role directly drives client delivery or revenue growth.`
        : `Your current monthly net surplus is **$${surplus.toLocaleString()}**. Prioritize building additional recurring client revenue before adding fixed monthly payroll obligations.`)
    );
  }

  // General conversational answer
  return (
    `Regarding "${text}":\n\n` +
    `When evaluating this for **${company}**, look at the immediate operational requirement and the medium-term return on investment. ` +
    `What specific outcome are you targeting, and how can I help you execute it?`
  );
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/ai/status
 * Returns whether real Gemini LLM is active or local engine is running.
 */
router.get('/status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  return res.status(200).json({
    success: true,
    configured: hasKey,
    model: hasKey ? 'gemini-1.5-flash' : 'venture-autonomous-engine',
  });
});

/**
 * POST /api/ai/chat
 * Protected by dedicated rate limiting and authentication.
 */
router.post('/chat', aiChatLimiter, requireAuth, async (req, res) => {
  try {
    const { message, history: rawHistory, conversationHistory } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty message string is required.',
      });
    }

    // Derive business context exclusively from the authenticated user's records.
    // Client-provided businessContext / business_context is intentionally ignored.
    const businessSummary = await fetchBusinessSummary(req.user.id);
    const apiKey = process.env.GEMINI_API_KEY;

    // Real Gemini Execution (When backend GEMINI_API_KEY is configured)
    if (apiKey && apiKey.trim()) {
      try {
        let telemetryPrompt = '';
        if (businessSummary && businessSummary.hasBusiness) {
          telemetryPrompt =
            `Business Context for ${businessSummary.businessName}:\n` +
            `- Industry: ${businessSummary.industry || 'General Business'}\n` +
            `- Total Clients: ${businessSummary.totalClients}\n` +
            `- Total Invoices: ${businessSummary.totalInvoices}\n` +
            `- 30-Day Revenue: $${businessSummary.recentRevenueLast30Days.toLocaleString()}\n` +
            `- 30-Day Expenses: $${businessSummary.totalExpensesLast30Days.toLocaleString()}\n` +
            `- 30-Day Net Profit: $${businessSummary.netLast30Days.toLocaleString()}\n` +
            `- Pending Receivables: $${businessSummary.pendingReceivables.toLocaleString()}\n` +
            (businessSummary.topDebtor ? `- Top Pending Receivable: ${businessSummary.topDebtor.client} ($${businessSummary.topDebtor.amount} on ${businessSummary.topDebtor.invoice})\n` : '- No outstanding pending receivables.\n');
        } else {
          telemetryPrompt = 'Business Context: The user has not recorded business metrics or transactions yet. Do not invent fictional revenue, runway, or client numbers. Help them plan and manage their business.';
        }

        const systemPrompt =
          `You are Venture AI, an intelligent, empathetic, and exceptionally capable startup co-founder and business copilot for ${businessSummary.businessName || 'the user'}.\n` +
          `Your founder's name is ${req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'Founder'}.\n\n` +
          `${telemetryPrompt}\n\n` +
          `Behavioral Instructions:\n` +
          `1. Answer any question clearly and candidly — whether about business, code, math, drafting emails, brainstorming, or operations.\n` +
          `2. NEVER invent fake financial numbers or client names. Use only the real business numbers provided above or indicate that data is not yet recorded.\n` +
          `3. Format responses cleanly in markdown.`;

        const genAI = new GoogleGenerativeAI(apiKey.trim());
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        });

        const clientHistory = Array.isArray(rawHistory)
          ? rawHistory
          : (Array.isArray(conversationHistory) ? conversationHistory : []);

        const history = clientHistory
          .filter((entry) => entry && entry.role && entry.content && typeof entry.content === 'string')
          .map((entry) => ({
            role: entry.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: entry.content }],
          }));

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message.trim());
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({
          success: true,
          response: text,
          model: 'gemini-1.5-flash',
        });
      } catch (geminiErr) {
        console.warn('[AI] Gemini call failed, falling back to autonomous engine:', geminiErr.message);
      }
    }

    // Autonomous reasoning fallback
    const personalizedResponse = generatePersonalizedResponse(message, businessSummary, req.user);
    return res.status(200).json({
      success: true,
      response: personalizedResponse,
      model: 'venture-autonomous-engine',
    });
  } catch (err) {
    console.error('[AI] Chat error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'AI chat service unavailable',
      message: 'Unable to process your request at this time. Please try again later.',
    });
  }
});

/**
 * GET /api/ai/insights
 * Generates dynamic recommendations derived strictly from the authenticated user's records.
 */
router.get('/insights', requireAuth, async (req, res) => {
  try {
    const summary = await fetchBusinessSummary(req.user.id);
    const insights = [];

    if (!summary || !summary.hasBusiness || (summary.totalClients === 0 && summary.totalInvoices === 0 && summary.recentRevenueLast30Days === 0 && summary.totalExpensesLast30Days === 0)) {
      return res.status(200).json({
        success: true,
        insights: [],
        message: 'No business activity recorded yet. Create clients or invoices to see AI insights.',
      });
    }

    // Real insight: Pending receivables
    if (summary.topDebtor && summary.topDebtor.amount > 0) {
      insights.push({
        title: 'Receivable Pending',
        description: `${summary.topDebtor.client} has $${summary.topDebtor.amount.toLocaleString()} pending on ${summary.topDebtor.invoice}${summary.topDebtor.dueDate ? ` (due ${summary.topDebtor.dueDate})` : ''}.`,
        type: 'financial',
        priority: 'high',
      });
    }

    // Real insight: Net cash flow
    if (summary.recentRevenueLast30Days > 0 || summary.totalExpensesLast30Days > 0) {
      const netPositive = summary.netLast30Days >= 0;
      insights.push({
        title: netPositive ? 'Positive Net Cash Flow' : 'Net Operating Deficit',
        description: `30-day revenue is $${summary.recentRevenueLast30Days.toLocaleString()} against $${summary.totalExpensesLast30Days.toLocaleString()} expenses (net: ${netPositive ? '+' : ''}$${summary.netLast30Days.toLocaleString()}).`,
        type: 'growth',
        priority: netPositive ? 'medium' : 'high',
      });
    }

    // Real insight: Client directory status
    if (summary.totalClients > 0) {
      insights.push({
        title: 'Client Directory Active',
        description: `Tracking ${summary.totalClients} client ${summary.totalClients === 1 ? 'account' : 'accounts'} with ${summary.totalInvoices} total invoice(s) on file.`,
        type: 'operational',
        priority: 'low',
      });
    }

    return res.status(200).json({
      success: true,
      insights,
    });
  } catch (err) {
    console.error('[AI] Insights error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Insights generation failed',
      message: 'Unable to generate business insights at this time.',
    });
  }
});

export default router;
