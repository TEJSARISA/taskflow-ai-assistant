import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return <div className={cn('animate-pulse bg-secondary/50 rounded-lg', className)} />;
};

export const CardSkeleton = () => (
    <div className='card p-6 space-y-4'>
        <div className='flex justify-between items-start'>
            <Skeleton className='w-12 h-12 rounded-xl' />
            <Skeleton className='w-16 h-6 rounded-full' />
        </div>
        <div className='space-y-2'>
            <Skeleton className='w-3/4 h-6' />
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-full h-4' />
        </div>
        <div className='pt-4 border-t border-border flex justify-between'>
            <Skeleton className='w-24 h-4' />
            <Skeleton className='w-24 h-4' />
        </div>
    </div>
);

export const TableRowSkeleton = () => (
    <tr className='border-b border-border'>
        <td className='px-8 py-6'>
            <div className='flex items-center gap-4'>
                <Skeleton className='w-10 h-10 rounded-xl' />
                <div className='space-y-2'>
                    <Skeleton className='w-32 h-4' />
                    <Skeleton className='w-24 h-3' />
                </div>
            </div>
        </td>
        <td className='px-8 py-6'>
            <Skeleton className='w-16 h-4' />
        </td>
        <td className='px-8 py-6'>
            <Skeleton className='w-24 h-4' />
        </td>
        <td className='px-8 py-6'>
            <Skeleton className='w-24 h-4' />
        </td>
        <td className='px-8 py-6'>
            <Skeleton className='w-8 h-8 rounded-lg' />
        </td>
    </tr>
);
