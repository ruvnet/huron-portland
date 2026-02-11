import React from 'react';
import { motion } from 'framer-motion';
import { SlideData, SlideSection, container, item, renderSection } from './renderSection';

interface Props {
  slide: SlideData;
}

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

function renderCodeBlock(
  section: SlideSection,
  accentColor: string,
  index: number
): React.ReactNode {
  const lines = section.content?.split('\n') || [];

  return (
    <div
      key={index}
      className="relative rounded-xl overflow-hidden"
      style={{
        background: 'hsl(220 20% 10%)',
        border: '1px solid hsl(220 15% 18% / 0.5)',
      }}
    >
      {section.language && (
        <div
          className="absolute top-2 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full z-10"
          style={{
            background: `${accentColor}15`,
            color: accentColor,
            border: `1px solid ${accentColor}20`,
          }}
        >
          {section.language}
        </div>
      )}
      <pre className="p-4 text-sm font-mono overflow-x-auto leading-relaxed">
        <code>
          {lines.map((line, li) => (
            <div key={li} className="flex">
              <span
                className="inline-block w-8 text-right mr-4 select-none text-xs leading-relaxed"
                style={{ color: 'hsl(220 15% 18%)' }}
              >
                {li + 1}
              </span>
              <span style={{ color: 'hsl(210 20% 92%)' }}>{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

const CodeSlide: React.FC<Props> = ({ slide }) => {
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
          Technical
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
                {section.type === 'code'
                  ? renderCodeBlock(section, slide.accentColor, index)
                  : renderSection(section, slide.accentColor, index)}
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

export default CodeSlide;
