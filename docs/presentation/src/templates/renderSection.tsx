import React from 'react';
import type { SlideData, SlideSection } from '@/data/slides';

export type { SlideData, SlideSection };

export const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function renderSection(
  section: SlideSection,
  accentColor: string,
  index: number
): React.ReactNode {
  switch (section.type) {
    case 'text':
      return (
        <p key={index} className="text-lg leading-relaxed" style={{ color: 'hsl(210 20% 80%)' }}>
          {section.content}
        </p>
      );
    case 'list':
      return (
        <ul key={index} className="space-y-2.5">
          {section.items?.map((listItem, i) => (
            <li key={i} className="flex gap-3 text-base">
              <span className="mt-1 flex-shrink-0">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}60` }}
                />
              </span>
              <span style={{ color: 'hsl(210 20% 92%)' }}>{listItem}</span>
            </li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote
          key={index}
          className="border-l-2 pl-4 py-2 italic"
          style={{ borderColor: accentColor, color: 'hsl(210 20% 80%)' }}
        >
          {section.content}
        </blockquote>
      );
    case 'table':
      return (
        <div key={index} className="overflow-auto rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `2px solid ${accentColor}30` }}>
                {section.headers?.map((h, i) => (
                  <th
                    key={i}
                    className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wider"
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
                    <td key={ci} className="py-2 px-3" style={{ color: 'hsl(210 20% 80%)' }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'code':
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
              className="absolute top-2 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full"
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
            <code style={{ color: 'hsl(210 20% 92%)' }}>{section.content}</code>
          </pre>
        </div>
      );
    default:
      return (
        <p key={index} style={{ color: 'hsl(215 15% 55%)' }}>
          {section.content}
        </p>
      );
  }
}
