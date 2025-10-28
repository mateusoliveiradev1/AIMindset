import React from 'react';
import Card from './Card';

interface CategorySkeletonProps {
  count?: number;
}

const CategorySkeleton: React.FC<CategorySkeletonProps> = ({ count = 8 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="glass-effect h-full animate-pulse">
          <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            {/* Ícone skeleton */}
            <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gray-700/50 rounded-full mb-4 sm:mb-6 mx-auto flex-shrink-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-gray-600/50 rounded"></div>
            </div>

            {/* Nome skeleton */}
            <div className="text-center mb-3 sm:mb-4">
              <div className="h-5 sm:h-6 lg:h-7 bg-gray-700/50 rounded mx-auto" style={{ width: '70%' }}></div>
            </div>

            {/* Descrição skeleton */}
            <div className="text-center mb-4 sm:mb-6 flex-grow">
              <div className="space-y-2">
                <div className="h-4 bg-gray-700/30 rounded mx-auto" style={{ width: '90%' }}></div>
                <div className="h-4 bg-gray-700/30 rounded mx-auto" style={{ width: '75%' }}></div>
                <div className="h-4 bg-gray-700/30 rounded mx-auto" style={{ width: '60%' }}></div>
              </div>
            </div>

            {/* Estatísticas skeleton */}
            <div className="flex items-center justify-center space-x-4 mb-4 sm:mb-6 flex-shrink-0">
              <div className="text-center">
                <div className="h-6 sm:h-8 w-8 sm:w-10 bg-gray-700/50 rounded mx-auto mb-1"></div>
                <div className="h-3 w-12 bg-gray-700/30 rounded mx-auto"></div>
              </div>
            </div>

            {/* Botão skeleton */}
            <div className="text-center flex-shrink-0">
              <div className="w-full h-10 sm:h-12 bg-gray-700/30 rounded border border-gray-600/30"></div>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
};

export default CategorySkeleton;