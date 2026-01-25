import { motion } from 'framer-motion';
import type { SlideColors } from '../../../utils/presentationGenerator';

interface WebCascadesSlideProps {
  cascades: string[];
  colors: SlideColors;
}

export const WebCascadesSlide: React.FC<WebCascadesSlideProps> = ({
  cascades,
  colors,
}) => {
  return (
    <div
      className="w-full h-full flex flex-col px-12 py-8 relative overflow-hidden"
      style={{ backgroundColor: `#${colors.background}` }}
    >
      {/* Left accent bar */}
      <motion.div
        className="absolute left-0 top-0 w-2 h-full"
        style={{ backgroundColor: `#${colors.primary}` }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Decorative circle */}
      <motion.div
        className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full"
        style={{ backgroundColor: `#${colors.secondary}`, opacity: 0.5 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />

      {/* Header */}
      <div className="mb-6">
        <motion.h2
          className="text-4xl font-bold"
          style={{ color: `#${colors.text}` }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          CASCADES & UPDATES
        </motion.h2>
        <motion.div
          className="h-1 w-56 mt-2"
          style={{ backgroundColor: `#${colors.accent}` }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </div>

      {/* Cascades list */}
      <div className="flex-1 flex flex-col justify-center">
        {cascades.length > 0 ? (
          <div className="space-y-3">
            {cascades.map((cascade, i) => (
              <motion.div
                key={i}
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: `#${colors.cardBg}`,
                  borderColor: '#334155',
                }}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              >
                <span
                  className="text-lg flex items-start gap-3"
                  style={{ color: `#${colors.text}` }}
                >
                  <span style={{ color: `#${colors.accent}` }}>→</span>
                  {cascade}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.p
            className="text-center text-lg"
            style={{ color: `#${colors.textLight}` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            No updates for this week
          </motion.p>
        )}
      </div>
    </div>
  );
};
