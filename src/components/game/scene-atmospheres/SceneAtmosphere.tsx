'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SceneId } from '@/data/types';
import { OfficeAtmosphere } from './OfficeAtmosphere';
import { HomeEveningAtmosphere } from './HomeEveningAtmosphere';
import { KitchenNightAtmosphere } from './KitchenNightAtmosphere';
import { CafeEveningAtmosphere } from './CafeEveningAtmosphere';
import { StreetNightAtmosphere } from './StreetNightAtmosphere';
import { StreetWinterAtmosphere } from './StreetWinterAtmosphere';
import { MemorialParkAtmosphere } from './MemorialParkAtmosphere';
import { RooftopNightAtmosphere } from './RooftopNightAtmosphere';
import { DreamAtmosphere } from './DreamAtmosphere';
import { BattleAtmosphere } from './BattleAtmosphere';
import { ServerRoomAtmosphere } from './ServerRoomAtmosphere';
import { UndergroundClubAtmosphere } from './UndergroundClubAtmosphere';
import { GenericAtmosphere } from './GenericAtmosphere';

export const SceneAtmosphere = memo(function SceneAtmosphere({ sceneId }: { sceneId: SceneId }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={sceneId}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          {(() => {
            switch (sceneId) {
              case 'office_morning':
                return <OfficeAtmosphere />;
              case 'home_evening':
              case 'volodka_room':
                return <HomeEveningAtmosphere />;
              case 'kitchen_night':
                return <KitchenNightAtmosphere />;
              case 'cafe_evening':
                return <CafeEveningAtmosphere />;
              case 'street_night':
                return <StreetNightAtmosphere />;
              case 'street_winter':
                return <StreetWinterAtmosphere />;
              case 'memorial_park':
                return <MemorialParkAtmosphere />;
              case 'rooftop_night':
                return <RooftopNightAtmosphere />;
              case 'dream':
                return <DreamAtmosphere />;
              case 'battle':
                return <BattleAtmosphere />;
              case 'server_room':
                return <ServerRoomAtmosphere />;
              case 'underground_club':
                return <UndergroundClubAtmosphere />;
              default:
                return <GenericAtmosphere />;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
