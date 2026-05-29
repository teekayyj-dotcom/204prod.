import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { projects } from '../data/projects';
import { ArrowLeft } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = projects.find(p => p.id === id);

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 1000], [0, -200]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0.1]);
  const titleY = useTransform(scrollY, [0, 1000], [0, -1000]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-3xl font-[Space_Grotesk] uppercase tracking-tighter mb-4">Project Not Found</h2>
          <button onClick={() => navigate('/')} className="text-orange-500 hover:text-white transition-colors flex items-center gap-2 justify-center mx-auto">
            <ArrowLeft size={16} /> Back to Portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Back Button Overlay */}
      <button 
        onClick={() => navigate('/')} 
        className="fixed top-24 left-6 md:left-12 z-50 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-orange-500 hover:border-orange-500 hover:text-black transition-all group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* Full Height Video / Hero Section */}
      <section className="sticky top-0 w-full h-[100svh] bg-black overflow-hidden z-0">
        {/* We use a sample cinematic video as a placeholder */}
        <motion.div 
          className="absolute inset-0"
          style={{ y: bgY, opacity: heroOpacity }}
        >
          <video 
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover" 
            poster={project.image}
          />
        </motion.div>
        
        {/* Title Overlay */}
        <motion.div 
          className="absolute inset-0 flex flex-col justify-end p-6 md:px-12 pb-8 md:pb-12 max-w-7xl mx-auto w-full"
          style={{ y: titleY, opacity: heroOpacity }}
        >
          <motion.div 
            className="flex flex-col gap-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-orange-500 font-sans text-sm md:text-base font-bold uppercase tracking-widest">
              {project.client}
            </span>
            <h1 className="text-white font-[Space_Grotesk] font-bold text-4xl md:text-6xl lg:text-8xl uppercase tracking-tighter leading-none m-0">
              {project.title}
            </h1>
          </motion.div>
        </motion.div>
      </section>

      {/* Project Info Section */}
      <section className="relative z-10 bg-black pt-8 md:pt-12 pb-24 md:pb-32 px-6 md:px-12 w-full border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* Left Column: Summary Table */}
          <motion.div 
            className="lg:col-span-4 flex flex-col font-sans"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="flex flex-col pb-6 border-b border-white/10">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Client</span>
              <span className="text-white text-lg">{project.client}</span>
            </div>
            <div className="flex flex-col py-6 border-b border-white/10">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Category</span>
              <span className="text-white text-lg">{project.category}</span>
            </div>
            <div className="flex flex-col py-6 border-b border-white/10">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Year</span>
              <span className="text-white text-lg">{project.year}</span>
            </div>
            <div className="flex flex-col py-6 border-b border-white/10">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Role</span>
              <span className="text-white text-lg">{project.role}</span>
            </div>
          </motion.div>

          {/* Right Column: Project Description */}
          <motion.div 
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <h2 className="text-white font-[Space_Grotesk] font-bold text-3xl md:text-4xl uppercase tracking-tighter mb-8">
              Project Description
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p className="text-xl md:text-2xl leading-relaxed mb-8 text-white/90">
                {project.description}
              </p>
              <p className="mb-6">
                For the {project.title} campaign, our objective was to redefine the visual language of {project.client}'s brand, pushing boundaries in {project.category.toLowerCase()}. We developed a comprehensive end-to-end strategy spanning concept art to final execution.
              </p>
              <p>
                The resulting suite of assets was deployed globally across multiple digital and physical touchpoints. Our work on {project.role.toLowerCase()} required a highly bespoke approach, leading to a truly distinguished output that set a new benchmark in the industry.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Additional Imagery / Breakdown (Mock) */}
      <section className="relative z-10 bg-black pb-32 px-6 md:px-12 w-full">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="w-full aspect-video bg-zinc-900 rounded-sm overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img 
              src={project.image} 
              alt={`${project.title} Behind the Scenes`} 
              className="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal hover:opacity-100 transition-all duration-700" 
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
