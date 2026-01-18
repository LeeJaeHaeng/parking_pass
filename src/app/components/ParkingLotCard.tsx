import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sparkles, ChevronRight } from 'lucide-react';
import { ParkingLot } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { getOccupancyBadgeClass, getOccupancyStatus } from '../utils/parking';

interface ParkingLotCardProps {
  lot: ParkingLot;
  isBest?: boolean;
  showPrediction?: boolean;
  onClick: (id: string) => void;
  index: number;
}

export const ParkingLotCard = React.forwardRef<HTMLDivElement, ParkingLotCardProps>(({ lot, isBest, showPrediction, onClick, index }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(lot.id)}
    >
      <Card className={`p-5 border-none shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all bg-white relative overflow-hidden group ${
        isBest ? 'ring-2 ring-blue-500/20' : ''
      }`}>
        {isBest && (
          <div className="absolute top-0 right-0">
            <div className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Best 추천
            </div>
          </div>
        )}

        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{lot.name}</h3>
              {lot.type === 'public' && (
                <Badge className="bg-blue-50 text-blue-600 border-0 hover:bg-blue-100 text-[10px] font-bold px-1.5 h-4">공영</Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
              <MapPin className="w-3 h-3" />
              {lot.address}
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-xl font-bold text-xs ${getOccupancyBadgeClass(lot.availableSpaces ?? 0, lot.totalSpaces || 1)}`}>
            {getOccupancyStatus(lot.availableSpaces ?? 0, lot.totalSpaces || 1)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">잔여</p>
            <p className="font-700 text-sm text-blue-600">
              <span className="text-base font-black">{lot.availableSpaces}</span>대
              <span className="text-gray-300 mx-1 text-[10px]">/</span>
              <span className="text-gray-400 text-[10px]">{lot.totalSpaces}대</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">거리</p>
            <p className="font-700 text-sm text-gray-900">{lot.distance}<span className="text-[10px] ml-0.5">km</span></p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">요금</p>
            <p className="font-700 text-sm text-gray-900">
              <span className="text-[10px] mr-1 text-gray-400">{lot.fee.basicTime}분</span>
              {lot.fee.basic.toLocaleString()}<span className="text-[10px] ml-0.5">원</span>
            </p>
          </div>
        </div>

        {showPrediction && lot.prediction && lot.prediction.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] text-gray-500 font-medium">30분 후 예측 혼잡도</span>
            </div>
            <span className="text-xs font-bold text-gray-900">{Math.round(lot.prediction[0]?.occupancyRate || 0)}%</span>
          </div>
        )}

        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
           <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600" />
        </div>
      </Card>
    </motion.div>
  );
});

ParkingLotCard.displayName = "ParkingLotCard";
