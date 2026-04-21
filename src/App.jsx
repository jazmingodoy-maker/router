import { useState, useCallback } from 'react';
import StageNav from './components/StageNav.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import DesignGallery from './components/DesignGallery.jsx';
import PillarScorecard from './components/PillarScorecard.jsx';
import { useStreamingChat } from './hooks/useStreamingChat.js';
import { ROUTER_SYSTEM_PROMPT } from './prompts/router.js';
import { BUILDER_SYSTEM_PROMPT } from './prompts/builder.js';
import { EVALUATOR_SYSTEM_PROMPT } from './prompts/evaluator.js';
import {
  extractRouterBrief,
  extractDesignType,
  extractCanvaPrompt,
  parsePillarScores,
  isRouterComplete,
  isBuilderComplete,
  isEvaluationComplete,
} from './utils/parsers.js';

// ── Stage: Router ─────────────────────────────────────────────────────────────

function RouterStage({ onHandoff }) {
  const chat = useStreamingChat({ systemPrompt: ROUTER_SYSTEM_PROMPT, maxTokens: 1500 });

  const handleSend = useCallback(
    async (text) => {
      const response = await chat.sendMessage(text);
      if (response && isRouterComplete(response)) {
        const brief = extractRouterBrief(response);
        const designType = extractDesignType(response);
        if (brief) onHandoff({ routerBrief: brief, routerDesignType: designType });
      }
    },
    [chat, onHandoff]
  );

  return (
    <div className="stage">
      <div className="stage__header">
        <h2 className="stage__title">Router</h2>
        <p className="stage__subtitle">
          Paste or describe your brief. The Router will classify it, assign a generation model, and
          produce a prompt package for the Builder.
        </p>
      </div>
      <ChatInterface
        messages={chat.messages}
        onSend={handleSend}
        isStreaming={chat.isStreaming}
        onAbort={chat.abort}
        placeholder="Describe your design brief… e.g. 'Instagram post for a coffee brand launch targeting Gen Z'"
      />
    </div>
  );
}

// ── Stage: Builder ────────────────────────────────────────────────────────────

function BuilderStage({ handoff, onHandoff }) {
  const chat = useStreamingChat({ systemPrompt: BUILDER_SYSTEM_PROMPT, maxTokens: 1500 });
  const [canvaGenerating, setCanvaGenerating] = useState(false);
  const [canvaError, setCanvaError] = useState(null);

  // If router produced a brief, auto-send it as the first message
  const initialMessage = handoff.routerBrief
    ? `Here's the brief from the Router:\n\n${handoff.routerBrief}`
    : null;

  const handleSend = useCallback(
    async (text) => {
      const response = await chat.sendMessage(text);
      if (response && isBuilderComplete(response)) {
        const prompt = extractCanvaPrompt(response);
        if (prompt) {
          onHandoff({ canvaPrompt: prompt });
          await triggerCanvaGeneration(prompt, handoff.routerDesignType);
        }
      }
    },
    [chat, handoff.routerDesignType, onHandoff]
  );

  const triggerCanvaGeneration = async (prompt, designType = 'instagram_post') => {
    setCanvaGenerating(true);
    setCanvaError(null);
    try {
      const res = await fetch('/api/canva/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt, design_type: designType }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (!data.canvaConfigured) {
          setCanvaError('Canva not configured — set CANVA_MCP_TOKEN in your .env to enable generation.');
        } else {
          setCanvaError(data.error || 'Canva generation failed.');
        }
        return;
      }

      // Parse designs from response (images = inline previews, text = raw content)
      const designs = [];
      if (data.images?.length) {
        data.images.forEach((img, i) => {
          designs.push({ index: i, thumbnailData: img.data, mimeType: img.mimeType });
        });
      }

      onHandoff({
        designs,
        canvaRawResponse: data.text || null,
      });
    } catch (err) {
      setCanvaError(err.message);
    } finally {
      setCanvaGenerating(false);
    }
  };

  const handleManualGenerate = () => {
    if (handoff.canvaPrompt) {
      triggerCanvaGeneration(handoff.canvaPrompt, handoff.routerDesignType);
    }
  };

  return (
    <div className="stage">
      <div className="stage__header">
        <h2 className="stage__title">Prompt Builder</h2>
        <p className="stage__subtitle">
          Answer the designer's questions to build a precise Canva generation prompt. When complete,
          designs are automatically generated.
        </p>
        {!handoff.routerBrief && (
          <div className="stage__notice">
            Tip: Complete the Router stage first to auto-populate the brief here.
          </div>
        )}
      </div>

      <ChatInterface
        messages={chat.messages}
        onSend={handleSend}
        isStreaming={chat.isStreaming}
        onAbort={chat.abort}
        initialMessage={initialMessage}
        placeholder="Answer the question above…"
      />

      {/* Canva generation status */}
      {(canvaGenerating || canvaError || handoff.canvaPrompt) && (
        <div className="canva-status">
          {canvaGenerating && (
            <div className="canva-status__loading">
              <div className="spinner spinner--sm" />
              <span>Sending prompt to Canva…</span>
            </div>
          )}
          {canvaError && (
            <div className="canva-status__error">
              <span>⚠️ {canvaError}</span>
              {handoff.canvaPrompt && (
                <button className="btn btn--sm btn--secondary" onClick={handleManualGenerate}>
                  Retry
                </button>
              )}
            </div>
          )}
          {handoff.canvaPrompt && !canvaGenerating && !canvaError && (
            <div className="canva-status__ready">
              <span>Prompt captured — </span>
              {handoff.designs.length > 0 ? (
                <span>{handoff.designs.length} design(s) generated. Switch to Evaluator →</span>
              ) : (
                <button className="btn btn--sm btn--primary" onClick={handleManualGenerate}>
                  Generate in Canva
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stage: Evaluator ──────────────────────────────────────────────────────────

function EvaluatorStage({ handoff }) {
  const chat = useStreamingChat({ systemPrompt: EVALUATOR_SYSTEM_PROMPT, maxTokens: 2000 });
  const [evaluations, setEvaluations] = useState([]);

  // Build the initial evaluator context from available data
  const buildEvaluatorContext = (designs) => {
    let ctx = '';
    if (handoff.canvaPrompt) ctx += `**Original prompt:**\n${handoff.canvaPrompt}\n\n`;
    if (designs.length > 0) {
      ctx += `**Designs to evaluate:** ${designs.length} variation(s)\n`;
      designs.forEach((d, i) => {
        if (d.description) ctx += `\nVariation ${i + 1}:\n${d.description}`;
      });
    } else if (handoff.canvaRawResponse) {
      ctx += `**Canva output:**\n${handoff.canvaRawResponse}`;
    }
    return ctx;
  };

  const handleEvaluate = useCallback(
    async (designs) => {
      const context = buildEvaluatorContext(designs);
      const prompt =
        designs.length > 1
          ? `Please evaluate all ${designs.length} design variations against the 6 quality pillars, then provide a comparative recommendation.`
          : 'Please evaluate this design against the 6 quality pillars and provide an overall verdict.';

      const response = await chat.sendMessage(prompt, context);
      if (response && isEvaluationComplete(response)) {
        const parsed = parsePillarScores(response);
        setEvaluations((prev) => [...prev, { designs, ...parsed }]);
      }
    },
    [chat, handoff]
  );

  const handleSend = useCallback(
    async (text) => {
      const response = await chat.sendMessage(text);
      if (response && isEvaluationComplete(response)) {
        const parsed = parsePillarScores(response);
        if (parsed.pillars?.length > 0) {
          setEvaluations((prev) => [...prev, parsed]);
        }
      }
    },
    [chat]
  );

  const hasDesigns = handoff.designs.length > 0 || handoff.canvaRawResponse;
  const latestEval = evaluations[evaluations.length - 1];

  return (
    <div className="stage stage--evaluator">
      <div className="stage__header">
        <h2 className="stage__title">Evaluator</h2>
        <p className="stage__subtitle">
          Score generated designs against the 6 Canva AI Quality pillars. Select designs from the
          gallery and hit Evaluate, or describe a design manually.
        </p>
      </div>

      <div className="evaluator-layout">
        {/* Left: design gallery + scorecard */}
        <div className="evaluator-layout__left">
          {hasDesigns ? (
            <DesignGallery
              designs={handoff.designs}
              rawResponse={handoff.canvaRawResponse}
              isGenerating={false}
              onEvaluate={handleEvaluate}
            />
          ) : (
            <div className="evaluator-empty">
              <p>No designs yet. Complete the Builder stage to generate Canva designs, or describe a design in the chat to evaluate it manually.</p>
            </div>
          )}

          {latestEval?.pillars?.length > 0 && (
            <PillarScorecard
              evaluation={latestEval}
              variationLabel={evaluations.length > 1 ? `Evaluation ${evaluations.length}` : null}
            />
          )}
        </div>

        {/* Right: evaluator chat */}
        <div className="evaluator-layout__right">
          <ChatInterface
            messages={chat.messages}
            onSend={handleSend}
            isStreaming={chat.isStreaming}
            onAbort={chat.abort}
            placeholder="Describe a design to evaluate, or ask follow-up questions…"
          />
        </div>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activeStage, setActiveStage] = useState('router');
  const [handoff, setHandoff] = useState({
    routerBrief: null,
    routerDesignType: 'instagram_post',
    canvaPrompt: null,
    designs: [],
    canvaRawResponse: null,
  });

  const updateHandoff = useCallback((data) => {
    setHandoff((prev) => ({ ...prev, ...data }));
  }, []);

  return (
    <div className="app">
      <StageNav activeStage={activeStage} onStageChange={setActiveStage} handoff={handoff} />
      <main className="app__main">
        {activeStage === 'router' && <RouterStage onHandoff={updateHandoff} />}
        {activeStage === 'builder' && <BuilderStage handoff={handoff} onHandoff={updateHandoff} />}
        {activeStage === 'evaluator' && <EvaluatorStage handoff={handoff} />}
      </main>
    </div>
  );
}
