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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease } },
};

const TitleSlide: React.FC<Props> = ({ slide }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={container}
      className="flex flex-col items-center justify-center h-full text-center px-8"
    >
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        {/* Badge pill */}
        <motion.div variants={fadeUp} className="mb-6">
          <span
            className="badge-pill border"
            style={{
              background: `${slide.accentColor}10`,
              borderColor: `${slide.accentColor}20`,
              color: slide.accentColor,
            }}
          >
            Bangalore Hackathon
          </span>
        </motion.div>

        {/* Headline with gradient text */}
        <motion.h1
          variants={fadeUp}
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight text-gradient-primary"
          style={{
            filter: `drop-shadow(0 0 30px ${slide.accentColor}30)`,
          }}
        >
          {slide.title}
        </motion.h1>

        {/* Accent divider */}
        <motion.div variants={fadeUp} className="relative h-[2px] w-24 rounded-full mb-6">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${slide.accentColor}, hsl(142 70% 50%))`,
              boxShadow: `0 0 16px ${slide.accentColor}60`,
            }}
          />
        </motion.div>

        {slide.subtitle && (
          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl mb-8 max-w-2xl"
            style={{ color: 'hsl(215 15% 55%)' }}
          >
            {slide.subtitle}
          </motion.p>
        )}

        {/* Content sections in card-elevated */}
        <motion.div variants={scaleIn} className="card-elevated rounded-2xl p-8 max-w-3xl w-full">
          <div className="flex flex-col items-center gap-4 w-full">
            {slide.sections.map((section, index) => (
              <motion.div
                key={index}
                variants={item}
                className="text-center w-full"
              >
                {renderSection(section, slide.accentColor, index)}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TitleSlide;
