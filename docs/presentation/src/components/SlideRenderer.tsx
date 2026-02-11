import { motion } from 'framer-motion';
import type { SlideData } from '@/data/slides';
import { transitions } from '@/data/theme';
import TitleSlide from '@/templates/TitleSlide';
import ContentSlide from '@/templates/ContentSlide';
import CodeSlide from '@/templates/CodeSlide';
import TableSlide from '@/templates/TableSlide';
import SplitSlide from '@/templates/SplitSlide';
import DiagramSlide from '@/templates/DiagramSlide';

const templateMap: Record<string, React.FC<{ slide: SlideData }>> = {
  title: TitleSlide,
  content: ContentSlide,
  code: CodeSlide,
  table: TableSlide,
  split: SplitSlide,
  diagram: DiagramSlide,
};

interface SlideRendererProps {
  slide: SlideData;
  direction: number;
}

export function SlideRenderer({ slide, direction }: SlideRendererProps) {
  const Template = templateMap[slide.template] || ContentSlide;
  const variant = transitions[slide.transition as keyof typeof transitions] || transitions.fade;

  return (
    <motion.div
      className="h-full"
      custom={direction}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variant as any}
    >
      <Template slide={slide} />
    </motion.div>
  );
}
