import React from 'react';
import { motion } from 'framer-motion';
import { SlideData, container, item, renderSection } from './renderSection';

interface Props {
  slide: SlideData;
}

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

/* Cognitum palette for diagram elements */
const dCyan = '#0bbccc';
const dGreen = '#2eb85c';
const dAmber = '#f9a825';
const dRed = '#f87171';

function renderDiagram(id: string, accentColor: string): React.ReactNode {
  const boxClass =
    'border rounded-lg px-3 py-1.5 text-center text-sm font-mono whitespace-nowrap';
  const arrowDown = (
    <div className="flex justify-center text-lg leading-none py-0.5" style={{ color: 'hsl(215 15% 55%)' }}>
      &#8595;
    </div>
  );
  const arrowRight = (
    <span className="text-lg mx-2" style={{ color: 'hsl(215 15% 55%)' }}>&#8594;</span>
  );

  switch (id) {
    case 'TOOLCHAIN_STACK':
      return (
        <div className="flex flex-col items-center gap-1">
          <div className={boxClass} style={{ borderColor: dCyan, color: dCyan }}>
            Claude Code + MCP
          </div>
          {arrowDown}
          <div className={boxClass} style={{ borderColor: dGreen, color: dGreen }}>
            Agentic Flow Runtime
          </div>
          {arrowDown}
          <div className="flex items-center gap-0">
            <div className={boxClass} style={{ borderColor: dAmber, color: dAmber }}>
              AgentDB
            </div>
            {arrowRight}
            <div className={boxClass} style={{ borderColor: dRed, color: dRed }}>
              HNSW Index
            </div>
            {arrowRight}
            <div className={boxClass} style={{ borderColor: dCyan, color: dCyan }}>
              Vector Memory
            </div>
          </div>
          {arrowDown}
          <div className={boxClass} style={{ borderColor: dGreen, color: dGreen }}>
            Swarm Orchestration Layer
          </div>
          {arrowDown}
          <div className={boxClass} style={{ borderColor: accentColor, color: accentColor }}>
            Agent Workers (Coder / Tester / Reviewer)
          </div>
        </div>
      );

    case 'DRIFT_COMPARISON':
      return (
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm font-semibold mb-1" style={{ color: dRed }}>
              Without Anti-Drift
            </div>
            <div className={boxClass} style={{ borderColor: dRed, color: dRed }}>
              Agent A &#8594; wanders off
            </div>
            <div className={boxClass} style={{ borderColor: dRed, color: dRed }}>
              Agent B &#8594; duplicates work
            </div>
            <div className={boxClass} style={{ borderColor: dRed, color: dRed }}>
              Agent C &#8594; contradicts A
            </div>
            <div className="text-xs mt-1" style={{ color: 'hsl(215 15% 55%)' }}>Chaos: no coordination</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm font-semibold mb-1" style={{ color: dGreen }}>
              With Anti-Drift
            </div>
            <div className={boxClass} style={{ borderColor: dGreen, color: dGreen }}>
              Coordinator (Raft leader)
            </div>
            {arrowDown}
            <div className="flex items-center gap-2">
              <div className={boxClass} style={{ borderColor: dGreen, color: dGreen }}>A: focused</div>
              <div className={boxClass} style={{ borderColor: dGreen, color: dGreen }}>B: focused</div>
              <div className={boxClass} style={{ borderColor: dGreen, color: dGreen }}>C: focused</div>
            </div>
            <div className="text-xs mt-1" style={{ color: 'hsl(215 15% 55%)' }}>
              Convergent: hierarchical control
            </div>
          </div>
        </div>
      );

    case 'CLEAN_ARCHITECTURE':
      return (
        <div className="flex flex-col items-center gap-1">
          <div
            className="border-2 rounded-xl px-16 py-2 text-center text-sm font-mono"
            style={{ borderColor: dCyan, color: dCyan }}
          >
            Presentation (CLI / MCP / UI)
          </div>
          {arrowDown}
          <div
            className="border-2 rounded-xl px-12 py-2 text-center text-sm font-mono"
            style={{ borderColor: dGreen, color: dGreen }}
          >
            Application (Use Cases / Hooks)
          </div>
          {arrowDown}
          <div
            className="border-2 rounded-xl px-8 py-2 text-center text-sm font-mono"
            style={{ borderColor: dAmber, color: dAmber }}
          >
            Domain (Entities / Value Objects)
          </div>
          {arrowDown}
          <div
            className="border-2 rounded-xl px-6 py-2 text-center text-sm font-mono"
            style={{ borderColor: dRed, color: dRed }}
          >
            Infrastructure (DB / MCP / FS)
          </div>
        </div>
      );

    case 'SELF_LEARNING_LOOP':
      return (
        <div className="flex items-center justify-center gap-0 flex-wrap">
          <div className={boxClass} style={{ borderColor: dCyan, color: dCyan }}>1. RETRIEVE</div>
          {arrowRight}
          <div className={boxClass} style={{ borderColor: dGreen, color: dGreen }}>2. JUDGE</div>
          {arrowRight}
          <div className={boxClass} style={{ borderColor: dAmber, color: dAmber }}>3. DISTILL</div>
          {arrowRight}
          <div className={boxClass} style={{ borderColor: dRed, color: dRed }}>4. CONSOLIDATE</div>
          <div className="w-full flex justify-center mt-2">
            <span className="text-sm font-mono" style={{ color: 'hsl(215 15% 55%)' }}>
              &#8630; loop back via EWC++ (prevents forgetting)
            </span>
          </div>
        </div>
      );

    default:
      return null;
  }
}

const DiagramSlide: React.FC<Props> = ({ slide }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={container}
      className="flex flex-col h-full px-8 py-8"
    >
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col flex-1 overflow-hidden">
        {/* Category label */}
        <motion.p
          variants={fadeUp}
          className="text-sm font-medium uppercase tracking-wider mb-2"
          style={{ color: slide.accentColor }}
        >
          Architecture
        </motion.p>

        {/* Headline with gradient */}
        <motion.h2
          variants={fadeUp}
          className="text-3xl md:text-5xl font-bold mb-1 text-gradient-primary"
        >
          {slide.title}
        </motion.h2>

        {slide.subtitle && (
          <motion.p variants={fadeUp} className="text-sm mb-5" style={{ color: 'hsl(215 15% 55%)' }}>
            {slide.subtitle}
          </motion.p>
        )}

        {!slide.subtitle && (
          <motion.div
            variants={fadeUp}
            className="h-[2px] w-16 rounded-full mb-5"
            style={{ background: `linear-gradient(90deg, ${slide.accentColor}, transparent)` }}
          />
        )}

        {/* Content in card-elevated */}
        <motion.div
          variants={fadeUp}
          className="card-elevated rounded-xl p-6 flex-1 overflow-y-auto"
        >
          <div className="space-y-5">
            {slide.sections.map((section, index) => (
              <motion.div key={index} variants={item}>
                {section.type === 'diagram' ? (
                  <div
                    className="rounded-xl p-6 flex justify-center"
                    style={{
                      background: 'hsl(220 20% 10% / 0.5)',
                      border: '1px solid hsl(220 15% 18% / 0.3)',
                    }}
                  >
                    {renderDiagram(section.content || '', slide.accentColor) || (
                      <pre className="font-mono text-sm whitespace-pre leading-relaxed" style={{ color: 'hsl(210 20% 80%)' }}>
                        {section.content}
                      </pre>
                    )}
                  </div>
                ) : (
                  renderSection(section, slide.accentColor, index)
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {slide.footer && (
          <motion.p
            variants={fadeUp}
            className="mt-3 text-xs"
            style={{ color: 'hsl(215 15% 55%)' }}
          >
            {slide.footer}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default DiagramSlide;
