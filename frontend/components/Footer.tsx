import Link from 'next/link';
import Image from 'next/image';
import { FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/6287737714346', '_blank');
  };

  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white overflow-hidden">
      <div className="container max-w-screen-xl mx-auto px-4 py-12 overflow-hidden">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* Brand & Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 relative">
                <Image
                  src="/logo.png"
                  alt="Bloom Sisters Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Bloom Sisters
              </h2>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
              Buket bunga cantik buatan tangan untuk setiap kesempatan. Membawa keindahan ke momen spesial Anda dengan penuh cinta dan perhatian.
            </p>

            {/* Social Media - Only WhatsApp */}
            <div className="pt-4">
              <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleWhatsAppClick}
                  className="w-10 h-10 bg-gray-700 hover:bg-green-500 rounded-full flex items-center justify-center transition hover:scale-110 cursor-pointer"
                  title="Chat with us on WhatsApp"
                >
                  <FaWhatsapp />
                </button>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-6 pb-2 border-b border-gray-700">
              Contact Info
            </h3>

            <div className="flex gap-3 items-start">
              <span className="text-pink-400 mt-1 shrink-0">
                <FaMapMarkerAlt />
              </span>
              <p className="text-sm text-gray-300">
                Jalan Hankam Raya No.89, RT.7/RW.4,<br />
                Cilangkap, Kec. Cipayung,<br />
                Kota Jakarta Timur,<br />
                Daerah Khusus Ibukota Jakarta 13870
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <span className="text-pink-400 shrink-0">
                <FaPhone />
              </span>
              <a 
                href="tel:+6287737714346" 
                className="text-sm text-gray-300 hover:text-pink-400 transition-colors"
              >
                0877 3771 4346
              </a>
            </div>

            <div className="flex gap-3 items-center">
              <span className="text-pink-400 shrink-0">
                <FaEnvelope />
              </span>
              <a 
                href="mailto:bloomsisters5@gmail.com" 
                className="text-sm text-gray-300 hover:text-pink-400 transition-colors break-all"
              >
                bloomsisters5@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
          © {currentYear} Bloom Sisters. All rights reserved.
        </div>
      </div>

      {/* Back to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-11 h-11 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg z-40 hover:opacity-90 transition-opacity"
        aria-label="Back to top"
      >
        ↑
      </button>
    </footer>
  );
}