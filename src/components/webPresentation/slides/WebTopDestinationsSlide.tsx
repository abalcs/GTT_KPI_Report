import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import type { SlideColors, TopDestination, AgentTopDestination } from '../../../utils/presentationGenerator';
import { findCuratedImage, getFallbackImage } from '../../../utils/destinationImages';

// Patagonia images for top destinations background
const PATAGONIA_IMAGES = [
  'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=1600', // Torres del Paine
  'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1600', // Patagonian mountains
  'https://images.pexels.com/photos/3225529/pexels-photo-3225529.jpeg?auto=compress&cs=tinysrgb&w=1600', // Fitz Roy
];

interface WebTopDestinationsSlideProps {
  destinations: TopDestination[];
  agentDestinations?: AgentTopDestination[];
  colors: SlideColors;
}

// Lightbox component for viewing larger images
const ImageLightbox: React.FC<{
  imageUrl: string;
  alt: string;
  onClose: () => void;
}> = ({ imageUrl, alt, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative max-w-[90vw] max-h-[90vh]"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
        />
        <p className="text-white text-center mt-3 text-lg font-medium">{alt}</p>
        <button
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-800 hover:bg-gray-200 transition-colors shadow-lg"
          onClick={onClose}
        >
          ✕
        </button>
      </motion.div>
    </motion.div>
  );
};

// Image component with loading state
const DestinationImageCard: React.FC<{
  destination: string;
  count: number;
  rank: number;
  maxCount: number;
  colors: SlideColors;
  delay: number;
  onImageClick: (imageUrl: string, alt: string) => void;
}> = ({ destination, count, rank, maxCount, colors, delay, onImageClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get image URL synchronously (curated images don't need async)
  const imageData = useMemo(() => {
    return findCuratedImage(destination) || getFallbackImage(rank);
  }, [destination, rank]);

  const barWidth = (count / maxCount) * 100;
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <motion.div
      className="flex items-stretch gap-3 rounded-lg overflow-hidden"
      style={{ backgroundColor: `#${colors.cardBg}` }}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {/* Image - clickable */}
      <div
        className="w-24 h-20 flex-shrink-0 relative overflow-hidden cursor-pointer group"
        onClick={() => onImageClick(imageData.url.replace('w=1600', 'w=1920'), imageData.alt)}
      >
        <motion.img
          src={imageData.url}
          alt={imageData.alt}
          className="w-full h-full object-cover transition-transform group-hover:scale-110"
          style={{ opacity: imageLoaded ? 1 : 0 }}
          onLoad={() => setImageLoaded(true)}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: delay + 0.2 }}
        />
        {!imageLoaded && (
          <div
            className="absolute inset-0 animate-pulse"
            style={{ backgroundColor: `#${colors.primary}30` }}
          />
        )}
        {/* Rank badge */}
        <div className="absolute top-1 left-1 text-lg">
          {medals[rank]}
        </div>
        {/* Hover indicator */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="text-white opacity-0 group-hover:opacity-100 text-sm">🔍</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 py-2 pr-3 flex flex-col justify-center">
        <div className="flex justify-between items-baseline mb-1">
          <span
            className="text-sm font-semibold truncate"
            style={{ color: `#${colors.text}` }}
          >
            {destination}
          </span>
          <span
            className="text-base font-bold ml-2"
            style={{ color: `#${colors.primary}` }}
          >
            {count}
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: `#${colors.background}` }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: rank === 0
                ? `#${colors.primary}`
                : rank === 1
                  ? `#${colors.secondary}`
                  : `#${colors.accent}`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.8, delay: delay + 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export const WebTopDestinationsSlide: React.FC<WebTopDestinationsSlideProps> = ({
  destinations,
  agentDestinations = [],
  colors,
}) => {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  const maxCount = destinations.length > 0 ? destinations[0].count : 1;

  // Pick consistent image based on data
  const imageIndex = destinations.length % PATAGONIA_IMAGES.length;
  const backgroundImage = PATAGONIA_IMAGES[imageIndex];

  const handleImageClick = (url: string, alt: string) => {
    setLightboxImage({ url, alt });
  };

  return (
    <div
      className="w-full h-full flex flex-col px-10 py-5 relative overflow-hidden"
      style={{ backgroundColor: `#${colors.background}` }}
    >
      {/* Background Image */}
      <img
        src={backgroundImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: bgImageLoaded ? 0.2 : 0, transition: 'opacity 0.8s ease-in-out' }}
        onLoad={() => setBgImageLoaded(true)}
      />

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `#${colors.background}`, opacity: 0.88 }}
      />

      {/* Left accent bar */}
      <motion.div
        className="absolute left-0 top-0 w-2 h-full z-10"
        style={{ backgroundColor: `#${colors.primary}` }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Bottom right decorative circle */}
      <motion.div
        className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full z-10"
        style={{ backgroundColor: `#${colors.secondary}`, opacity: 0.5 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />

      {/* Header */}
      <div className="mb-4 relative z-10">
        <motion.h2
          className="text-3xl font-bold"
          style={{ color: `#${colors.text}` }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          TOP DESTINATIONS
        </motion.h2>
        <motion.div
          className="h-1 w-40 mt-1.5"
          style={{ backgroundColor: `#${colors.accent}` }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <motion.p
          className="mt-1 text-sm"
          style={{ color: `#${colors.textLight}` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          By Passthroughs
        </motion.p>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex gap-6 relative z-10">
        {/* Left column - Team Top Destinations with images */}
        <div className="flex-1 flex flex-col">
          <motion.p
            className="text-sm font-bold tracking-wider mb-3"
            style={{ color: `#${colors.textLight}` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            TEAM TOP 5
          </motion.p>
          <div className="flex flex-col gap-2">
            {destinations.length > 0 ? (
              destinations.map((dest, index) => (
                <DestinationImageCard
                  key={dest.destination}
                  destination={dest.destination}
                  count={dest.count}
                  rank={index}
                  maxCount={maxCount}
                  colors={colors}
                  delay={0.2 + index * 0.1}
                  onImageClick={handleImageClick}
                />
              ))
            ) : (
              <motion.p
                className="text-center text-lg"
                style={{ color: `#${colors.textLight}` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No destination data available
              </motion.p>
            )}
          </div>
        </div>

        {/* Right column - Per-Agent Top Destinations */}
        {agentDestinations.length > 0 && (
          <div className="w-80 flex flex-col">
            <motion.p
              className="text-sm font-bold tracking-wider mb-3"
              style={{ color: `#${colors.textLight}` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              AGENT TOP DESTINATIONS
            </motion.p>
            <div
              className="flex-1 rounded-xl p-3 overflow-auto"
              style={{ backgroundColor: `#${colors.cardBg}` }}
            >
              <div className="space-y-1.5">
                {agentDestinations.map((agent, index) => (
                  <motion.div
                    key={agent.agentName}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md"
                    style={{ backgroundColor: index % 2 === 0 ? 'transparent' : `#${colors.background}30` }}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.04 }}
                  >
                    <p
                      className="text-sm font-medium truncate flex-1"
                      style={{ color: `#${colors.text}` }}
                    >
                      {agent.agentName}
                    </p>
                    <div className="flex items-center gap-2 ml-2">
                      <span
                        className="text-xs truncate max-w-24"
                        style={{ color: `#${colors.accent}` }}
                      >
                        {agent.destination}
                      </span>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded tabular-nums"
                        style={{
                          backgroundColor: `#${colors.primary}20`,
                          color: `#${colors.primary}`
                        }}
                      >
                        {agent.count}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <ImageLightbox
            imageUrl={lightboxImage.url}
            alt={lightboxImage.alt}
            onClose={() => setLightboxImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
