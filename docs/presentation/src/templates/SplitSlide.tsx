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

const SplitSlide: React.FC<Props> = ({ slide }) => {
  const midpoint = Math.ceil(slide.sections.length / 2);
  const leftSections = slide.sections.slice(0, midpoint);
  const rightSections = slide.sections.slice(midpoint);

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
          Content
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

        {/* Two-column card-elevated */}
        <motion.div
          variants={fadeUp}
          className="card-elevated rounded-xl p-6 flex-1 overflow-hidden"
        >
          <div className="flex gap-0 h-full">
            <div className="flex-1 overflow-y-auto space-y-5 pr-5">
              {leftSections.map((section, index) => (
                <motion.div key={index} variants={item}>
                  {renderSection(section, slide.accentColor, index)}
                </motion.div>
              ))}
            </div>

            <div
              className="w-px self-stretch mx-1 flex-shrink-0"
              style={{
                background: `linear-gradient(to bottom, transparent, ${slide.accentColor}40, transparent)`,
              }}
            />

            <div className="flex-1 overflow-y-auto space-y-5 pl-5">
              {rightSections.map((section, index) => (
                <motion.div key={index} variants={item}>
                  {renderSection(section, slide.accentColor, midpoint + index)}
                </motion.div>
              ))}
            </div>
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

export default SplitSlide;
