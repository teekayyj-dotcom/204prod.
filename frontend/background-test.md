export function ProjectShowcase() {
  const [view, setView] = useState<'single' | 'row' | 'gallery'>('single');
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  // Filter State
  const [activeFilter, setActiveFilter] = useState<'service' | 'client' | 'year' | null>(null);
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  const cursorX = useMotionValue(-1000);
  const cursorY = useMotionValue(-1000);

  const springConfig = { damping: 25, stiffness: 200 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
  };

  const toggleFilter = (
    value: string, 
    selectedState: string[], 
    setFn: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setFn(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  return (
    <section id="portfolio" className="bg-black pt-24 pb-32 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header & View Controls */}
        <div className="flex flex-col gap-8 mb-16">
          <h2 className="text-white font-[Space_Grotesk] font-bold text-3xl md:text-5xl uppercase tracking-tighter">
            Selected Works
          </h2>
          
          {/* Portfolio Control Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-y border-white/10 py-4">
            {/* Left: View Controls */}
            <div className="flex items-center gap-4">
              <span className="text-white/40 font-sans text-xs font-semibold uppercase tracking-widest mr-2">
                View
              </span>
              <button 
                onClick={() => setView('single')} 
                className={`p-2 transition-colors duration-300 rounded-md hover:bg-white/5 ${view === 'single' ? 'text-orange-500 bg-white/[0.02]' : 'text-white/30 hover:text-white'}`}
                aria-label="Single View"
              >
                <Square size={18} />
              </button>
              <button 
                onClick={() => setView('row')} 
                className={`p-2 transition-colors duration-300 rounded-md hover:bg-white/5 ${view === 'row' ? 'text-orange-500 bg-white/[0.02]' : 'text-white/30 hover:text-white'}`}
                aria-label="Row View"
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => setView('gallery')} 
                className={`p-2 transition-colors duration-300 rounded-md hover:bg-white/5 ${view === 'gallery' ? 'text-orange-500 bg-white/[0.02]' : 'text-white/30 hover:text-white'}`}
                aria-label="Gallery View"
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            {/* Right: Search and Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Compact Search Input */}
              <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-2 rounded border border-white/10 focus-within:border-white/30 focus-within:bg-zinc-900 transition-all group">
                <Search size={16} className="text-white/40 group-focus-within:text-white/70" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-32 focus:w-48 transition-all"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-2">
                <FilterDropdown 
                  label="Service"
                  options={serviceOptions}
                  selected={selectedServices}
                  toggleOption={(opt) => toggleFilter(opt, selectedServices, setSelectedServices)}
                  isOpen={activeFilter === 'service'}
                  setIsOpen={(open) => setActiveFilter(open ? 'service' : null)}
                />
                
                <FilterDropdown 
                  label="Client"
                  options={clientOptions}
                  selected={selectedClients}
                  toggleOption={(opt) => toggleFilter(opt, selectedClients, setSelectedClients)}
                  isOpen={activeFilter === 'client'}
                  setIsOpen={(open) => setActiveFilter(open ? 'client' : null)}
                />

                <FilterDropdown 
                  label="Year"
                  options={yearOptions}
                  selected={selectedYears}
                  toggleOption={(opt) => toggleFilter(opt, selectedYears, setSelectedYears)}
                  isOpen={activeFilter === 'year'}
                  setIsOpen={(open) => setActiveFilter(open ? 'year' : null)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
          >
            {/* SINGLE VIEW */}
            {view === 'single' && (
              <div className="flex flex-col gap-32">
                {projects.map((project) => (
                  <motion.div key={project.id} variants={itemVariants} className="flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-white/50 font-sans text-lg md:text-xl font-semibold">{project.number}</span>
                        <h3 className="text-white font-[Space_Grotesk] font-bold text-4xl md:text-6xl uppercase tracking-tighter leading-none hover:text-orange-500 transition-colors">
                          {project.title}
                        </h3>
                      </div>
                      <div className="text-left md:text-right text-white/70 font-sans text-sm font-semibold uppercase tracking-widest leading-relaxed">
                        <p>{project.client} &mdash; {project.year}</p>
                        <p className="text-white/40 mt-1">{project.services}</p>
                      </div>
                    </div>
                    
                    <div className="w-full aspect-[4/5] md:aspect-[21/9] bg-zinc-900 overflow-hidden relative group">
                      <ImageWithFallback 
                        src={project.image} 
                        alt={project.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out opacity-90 group-hover:opacity-100" 
                      />
                    </div>
                    
                    <div className="max-w-3xl">
                      <p className="text-white/80 font-sans text-lg md:text-xl font-medium leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ROW VIEW */}
            {view === 'row' && (
              <div 
                className="flex flex-col border-t border-white/10"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredProject(null)}
              >
                {projects.map((project) => (
                  <motion.div 
                    key={project.id} 
                    variants={itemVariants}
                    onMouseEnter={() => setHoveredProject(project.id)}
                    className="group relative border-b border-white/10 py-6 md:py-8 cursor-pointer flex items-center"
                  >
                    {/* Subtle Background change */}
                    <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    {/* Text Row */}
                    <div className="relative z-10 flex flex-wrap md:flex-nowrap items-center gap-x-4 md:gap-x-6 text-white/80 font-sans text-sm md:text-base font-semibold uppercase tracking-widest w-full px-4 pointer-events-none">
                      <span className="text-white/40 min-w-[3rem]">{project.number}</span>
                      <span className="hidden md:inline text-white/30">&mdash;</span>
                      
                      <span className="text-white font-[Space_Grotesk] font-bold text-2xl md:text-3xl group-hover:text-orange-500 transition-colors md:min-w-[300px]">
                        {project.title}
                      </span>
                      
                      <div className="hidden md:flex items-center gap-6 flex-1 justify-end text-xs lg:text-sm">
                        <span>&mdash;</span>
                        <span className="w-48 text-right truncate">{project.client}</span>
                        <span>&mdash;</span>
                        <span className="w-64 text-right truncate">{project.services}</span>
                        <span>&mdash;</span>
                        <span>{project.year}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* GALLERY VIEW */}
            {view === 'gallery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <motion.div key={project.id} variants={itemVariants} className="relative group aspect-square md:aspect-[4/5] bg-zinc-900 overflow-hidden cursor-pointer">
                    <ImageWithFallback 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-80 group-hover:opacity-40" 
                    />
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <h3 className="text-white font-[Space_Grotesk] font-bold text-2xl md:text-3xl uppercase tracking-tighter leading-tight drop-shadow-lg">
                        {project.title}
                      </h3>
                      <p className="text-white font-sans text-xs md:text-sm font-semibold uppercase tracking-widest mt-4 drop-shadow-md">
                        {project.category}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Load More Button */}
        <div className="mt-16 flex justify-center">
          <button className="group relative overflow-hidden px-8 py-4 bg-zinc-900 border border-white/10 hover:border-orange-500/50 transition-colors duration-300 rounded-sm">
            <div className="absolute inset-0 bg-orange-500/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative text-white/80 group-hover:text-white font-sans text-xs font-semibold uppercase tracking-widest transition-colors duration-300">
              Load More
            </span>
          </button>
        </div>

        {/* Floating Cursor Image for Row View */}
        <AnimatePresence>
          {view === 'row' && hoveredProject && (
            <motion.div
              className="fixed pointer-events-none z-50 w-72 aspect-video overflow-hidden shadow-2xl hidden md:block border border-white/10 rounded-md"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              style={{ 
                left: 0, 
                top: 0,
                x: cursorXSpring, 
                y: cursorYSpring,
                translateX: "32px", // Offset slightly to the right of the cursor
                translateY: "-50%"  // Center vertically on cursor
              }}
            >
              <ImageWithFallback 
                src={projects.find(p => p.id === hoveredProject)?.image || ''} 
                alt="Project Preview" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
