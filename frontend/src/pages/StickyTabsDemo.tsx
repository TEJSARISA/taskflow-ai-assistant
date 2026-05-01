import React from 'react';
import StickyTabs from '@/components/ui/sticky-section-tabs';
import { Lightbulb, Palette, Code, Rocket } from 'lucide-react';

const PlaceholderContent: React.FC<{ title: string; icon: React.ReactNode; imageUrl: string }> = ({
    title,
    icon,
    imageUrl
}) => (
    <div className='flex flex-col items-center justify-center text-center py-16'>
        <div className='mb-6 p-4 bg-white/5 rounded-full text-white'>{icon}</div>
        <h3 className='text-2xl font-semibold mt-4 mb-4 text-gray-100'>{title}</h3>
        <div className='max-w-2xl overflow-hidden rounded-xl mb-8 border border-white/10'>
            <img
                src={imageUrl}
                alt={title}
                className='w-full h-64 object-cover'
            />
        </div>
        <p className='text-gray-400 max-w-xl text-lg leading-relaxed'>
            This is where the detailed content for the '{title}' section would normally appear. In this stage, we focus
            on the core deliverables and ensuring high quality standards.
        </p>
    </div>
);

export const StickyTabsDemoPage: React.FC = () => {
    return (
        <div className='min-h-screen bg-black'>
            <nav
                className='fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md text-white border-b border-white/15'
                style={{ height: '4rem' }}
            >
                <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between'>
                    <div className='flex items-center'>
                        <span className='font-bold text-xl tracking-tight text-white'>TASK</span>
                        <span className='font-semibold text-xl tracking-tight text-white/60'>FLOW</span>
                    </div>
                    <div className='hidden md:flex items-center space-x-8 text-sm font-medium'>
                        <a
                            href='#'
                            className='text-gray-300 hover:text-white transition-colors'
                        >
                            Platform
                        </a>
                        <a
                            href='#'
                            className='text-gray-300 hover:text-white transition-colors'
                        >
                            Solutions
                        </a>
                        <a
                            href='#'
                            className='text-gray-300 hover:text-white transition-colors'
                        >
                            Resources
                        </a>
                        <a
                            href='/login'
                            className='px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors'
                        >
                            Get Started
                        </a>
                    </div>
                </div>
            </nav>

            <main style={{ paddingTop: '4rem' }}>
                <div className='bg-black text-white relative overflow-hidden'>
                    <div className='mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 relative z-10 text-center'>
                        <h1 className='text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl mb-6'>
                            My <span className='text-white/60'>Project Flow</span>
                        </h1>
                        <p className='text-xl text-gray-400 max-w-3xl mx-auto'>
                            A streamlined approach to managing projects with TaskFlow AI.
                        </p>
                    </div>
                </div>

                <StickyTabs
                    mainNavHeight='4rem'
                    rootClassName='bg-black text-white'
                    navSpacerClassName='border-b border-white/15 bg-black'
                    sectionClassName='bg-[#0a0a0a]'
                    stickyHeaderContainerClassName='shadow-2xl'
                    headerContentWrapperClassName='border-b border-t border-white/10 bg-black/90 backdrop-blur-sm'
                    headerContentLayoutClassName='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'
                    titleClassName='my-0 text-2xl font-bold leading-none md:text-3xl lg:text-4xl text-white'
                    contentLayoutClassName='mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8'
                >
                    <StickyTabs.Item
                        title='01. Project Definition'
                        id='definition'
                    >
                        <PlaceholderContent
                            title='Project Definition'
                            icon={<Lightbulb size={48} />}
                            imageUrl='/project-flow.png'
                        />
                    </StickyTabs.Item>
                    <StickyTabs.Item
                        title='02. Task Decomposition'
                        id='tasks'
                    >
                        <PlaceholderContent
                            title='Task Decomposition'
                            icon={<Palette size={48} />}
                            imageUrl='https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=1000'
                        />
                    </StickyTabs.Item>
                    <StickyTabs.Item
                        title='03. Team Collaboration'
                        id='collaboration'
                    >
                        <PlaceholderContent
                            title='Team Collaboration'
                            icon={<Code size={48} />}
                            imageUrl='https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=1000'
                        />
                    </StickyTabs.Item>
                    <StickyTabs.Item
                        title='04. Real-time Monitoring'
                        id='monitoring'
                    >
                        <PlaceholderContent
                            title='Real-time Monitoring'
                            icon={<Rocket size={48} />}
                            imageUrl='https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000'
                        />
                    </StickyTabs.Item>
                    <StickyTabs.Item
                        title='05. Final Delivery'
                        id='delivery'
                    >
                        <PlaceholderContent
                            title='Final Delivery'
                            icon={<Rocket size={48} />}
                            imageUrl='https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1000'
                        />
                    </StickyTabs.Item>
                </StickyTabs>

                <footer className='bg-black py-20 border-t border-white/10 text-center'>
                    <h2 className='text-3xl font-bold text-white mb-6'>Ready to start your project?</h2>
                    <button className='px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all transform hover:scale-105'>
                        Contact Us Today
                    </button>
                    <p className='mt-12 text-gray-600'>&copy; 2026 ProjectFlow Inc. All rights reserved.</p>
                </footer>
            </main>
        </div>
    );
};

export default StickyTabsDemoPage;
