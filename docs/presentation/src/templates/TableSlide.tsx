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

function renderStyledTable(
  section: SlideSection,
  accentColor: string,
  index: number
): React.ReactNode {
  return (
    <div
      key={index}
      className="overflow-auto rounded-xl"
      style={{ border: '1px solid hsl(220 15% 18% / 0.5)' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'hsl(220 20% 10%)', borderBottom: `2px solid ${accentColor}30` }}>
            {section.headers?.map((h, i) => (
              <th
                key={i}
                className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wider"
                style={{ color: accentColor }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.rows?.map((row, ri) => (
            <tr
              key={ri}
              style={{
                background: ri % 2 === 0 ? 'hsl(220 20% 10% / 0.5)' : 'transparent',
                borderBottom: '1px solid hsl(220 15% 18% / 0.3)',
              }}
            >
              {row.map((cell, ci) => (
                <td key={ci} className="py-2 px-4" style={{ color: 'hsl(210 20% 80%)' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TableSlide: React.FC<Props> = ({ slide }) => {
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
          Data
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
                {section.type === 'table'
                  ? renderStyledTable(section, slide.accentColor, index)
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

export default TableSlide;
