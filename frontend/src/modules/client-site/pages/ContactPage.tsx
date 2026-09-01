import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ArrowUpRight, Instagram, Facebook, Youtube, Mail, MapPin, Phone, MessageSquare } from 'lucide-react';

export function ContactPage() {
  const { scrollYProgress } = useScroll();
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Parallax effect for the background text
  const yText = useTransform(scrollYProgress, [0, 1], [0, 300]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name && !formData.organization) {
      alert("Please enter a name or organization");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const payload = {
        name: formData.organization || formData.name || 'Unknown Lead',
        contact: formData.name,
        email: formData.email,
        phone: formData.phone,
        industry: '',
        status: 'Lead',
        notes: `Message: ${formData.message}`
      };

      const response = await fetch('/api/v1/projects/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({ name: '', organization: '', email: '', phone: '', message: '' });
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        const errData = await response.json().catch(() => null);
        console.error("Submit error", errData);
        alert("Failed to submit. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-x-hidden overflow-y-auto flex flex-col justify-center py-20 md:py-6">

      {/* Top Half-Circle Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] md:w-[80vw] h-[60vw] md:h-[40vw] bg-[#bc0a0a]/50 rounded-full blur-[100px] md:blur-[150px] -translate-y-1/2 mix-blend-screen pointer-events-none z-0"></div>

      {/* Giant Background Typography */}
      <div className="absolute top-0 left-0 right-0 flex justify-center items-start overflow-hidden pointer-events-none select-none z-0 opacity-15 pt-[2vh] md:-mt-6">
        <motion.div style={{ y: yText }} className="w-full text-center">
          <h1
            className="text-[25vw] md:text-[20vw] font-[Space_Grotesk] font-black uppercase leading-none tracking-tighter text-white"
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)'
            }}
          >
            CONTACT
          </h1>
        </motion.div>
      </div>

      {/* Foreground Content */}
      <div className="container mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4 lg:gap-5 mt-24 md:mt-32 mb-12">

        {/* Left Col: Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col md:col-span-2 justify-between h-full py-4"
        >
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-2">
              Get in touch
            </h2>
            <p className="text-white/60 text-sm md:text-base max-w-md mb-6">
              Have questions or ready to transform your business with AI automation?
            </p>

            <div className="flex items-center mt-4 origin-left">
              <div
                className="flex items-center bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-full p-1.5 min-h-[48px] md:min-h-[56px] w-fit overflow-hidden"
              >
                <button
                  onClick={() => setIsSocialOpen(!isSocialOpen)}
                  className={`flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/20 hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-300 z-10 overflow-hidden relative cursor-pointer flex-shrink-0 ${isSocialOpen
                    ? 'w-8 h-8 md:w-10 md:h-10 text-white'
                    : 'h-8 md:h-10 px-4 md:px-5 text-white/70'
                    }`}
                >
                  <MessageSquare size={16} className="shrink-0" />
                  <AnimatePresence>
                    {!isSocialOpen && (
                      <motion.div
                        initial={{ width: 0, opacity: 0, x: -10 }}
                        animate={{ width: "auto", opacity: 1, x: 0 }}
                        exit={{ width: 0, opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden whitespace-nowrap flex items-center"
                      >
                        <span className="font-semibold text-xs md:text-sm uppercase tracking-wider ml-2 text-white">
                          Contact
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <AnimatePresence>
                  {isSocialOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="flex gap-1.5 pr-1 pl-2 overflow-hidden items-center"
                    >
                      {[
                        { Icon: Instagram, href: 'https://www.instagram.com/204prod.vn/' },
                        { Icon: Facebook, href: 'https://www.facebook.com/204prod.vn/' },
                        { Icon: Youtube, href: 'https://www.youtube.com/@204prodvn' },
                        // { Icon: Tiktok, href: 'https://www.tiktok.com/@204prod.vn?is_from_webapp=1&sender_device=pc' }
                      ].map((social, i) => (
                        <motion.a
                          key={i}
                          href={social.href}
                          initial={{ opacity: 0, x: -20, scale: 1 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -20, scale: 1 }}
                          transition={{ delay: i * 0.05, duration: 0.2 }}
                          className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                        >
                          <social.Icon size={16} />
                        </motion.a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-8 w-full max-w-md">
            {[
              { label: "Email", desc: "204prod.work@gmail.com", action: "mailto:204prod.work@gmail.com", Icon: Mail },
              { label: "Location", desc: "21 Ng. 8 P. Tôn Thất Thiệp, Ba Đình, Hà Nội 10000", action: "#", Icon: MapPin },
              { label: "Phone", desc: "+84 989 143 490", action: "tel:+84989143490", Icon: Phone }
            ].map((item, i) => (
              <a key={item.label} href={item.action} className="group flex items-center justify-between w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300 border-t-white/20 border-l-white/20">
                <div className="flex items-center gap-3">
                  <item.Icon size={16} className="text-white/50 group-hover:text-white transition-colors" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest font-semibold group-hover:text-white/70 transition-colors">{item.label}</span>
                    <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors">{item.desc}</span>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-white/30 group-hover:text-white transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="bg-zinc-950/50 backdrop-blur-xl border border-white/10 border-t-white/20 border-l-white/20 p-6 md:p-8 lg:p-10 rounded-xl md:col-span-3 flex flex-col justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] relative"
        >
          {submitSuccess && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500/20 text-green-400 border border-green-500/50 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest backdrop-blur-md z-20 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              Message Sent Successfully!
            </div>
          )}
          <form className="flex flex-col gap-3 md:gap-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="flex flex-col gap-1.5 relative group">
                <label htmlFor="name" className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-white/40 group-focus-within:text-white group-focus-within:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] transition-all">Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="bg-white/5 border border-white/10 border-t-white/20 border-l-white/20 rounded-lg px-3 py-2.5 md:py-3 text-sm md:text-base outline-none focus:border-white focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all text-white placeholder:text-white/20 w-full shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]"
                />
              </div>

              <div className="flex flex-col gap-1.5 relative group">
                <label htmlFor="organization" className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-white/40 group-focus-within:text-white group-focus-within:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] transition-all">Organization</label>
                <input
                  type="text"
                  id="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="204PROD."
                  className="bg-white/5 border border-white/10 border-t-white/20 border-l-white/20 rounded-lg px-3 py-2.5 md:py-3 text-sm md:text-base outline-none focus:border-white focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all text-white placeholder:text-white/20 w-full shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="flex flex-col gap-1.5 relative group">
                <label htmlFor="email" className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-white/40 group-focus-within:text-white group-focus-within:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] transition-all">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className="bg-white/5 border border-white/10 border-t-white/20 border-l-white/20 rounded-lg px-3 py-2.5 md:py-3 text-sm md:text-base outline-none focus:border-white focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all text-white placeholder:text-white/20 w-full shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]"
                />
              </div>

              <div className="flex flex-col gap-1.5 relative group">
                <label htmlFor="phone" className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-white/40 group-focus-within:text-white group-focus-within:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] transition-all">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+84 989 143 490"
                  className="bg-white/5 border border-white/10 border-t-white/20 border-l-white/20 rounded-lg px-3 py-2.5 md:py-3 text-sm md:text-base outline-none focus:border-white focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all text-white placeholder:text-white/20 w-full shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 relative group">
              <label htmlFor="message" className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-white/40 group-focus-within:text-white group-focus-within:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] transition-all">Message</label>
              <textarea
                id="message"
                value={formData.message}
                onChange={handleChange}
                rows={2}
                placeholder="Tell us about your project..."
                className="bg-white/5 border border-white/10 border-t-white/20 border-l-white/20 rounded-lg px-3 py-2.5 md:py-3 text-sm md:text-base outline-none focus:border-white focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all text-white placeholder:text-white/20 resize-none w-full shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]"
              />
            </div>

            <button disabled={isSubmitting} type="submit" className="mt-1 md:mt-2 bg-white text-black rounded-lg py-3 px-6 md:px-8 font-bold uppercase tracking-widest text-xs md:text-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] hover:-translate-y-1 transition-all duration-300 w-full disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:cursor-not-allowed">
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
