//app/contact/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for map
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const contactInfo = [
    {
      icon: '📍',
      title: 'Lokasi Kami',
      details: ['SMK Prestasi Prima', 'Jl. Mawar No. 12, Jakarta Selatan', 'Indonesia 12180'],
      link: 'https://maps.google.com',
      linkText: 'Lihat di Google Maps'
    },
    {
      icon: '📞',
      title: 'Telepon',
      details: ['+62 812-3456-7890', 'Hotline: 1500-123'],
      link: 'tel:+6281234567890',
      linkText: 'Hubungi Sekarang'
    },
    {
      icon: '✉️',
      title: 'Email',
      details: ['bloomsisters@prestasiprima.sch.id', 'support@bloomsisters.com'],
      link: 'mailto:bloomsisters@prestasiprima.sch.id',
      linkText: 'Kirim Email'
    },
    {
      icon: '🕒',
      title: 'Jam Operasional',
      details: ['Senin - Jumat: 07:00 - 17:00', 'Sabtu: 08:00 - 15:00', 'Minggu: Tutup'],
      link: null
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="text-sm text-gray-600">
          <ol className="flex flex-wrap items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-pink-600 transition-colors">Beranda</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-pink-600 font-medium">Kontak</li>
          </ol>
        </nav>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 mb-6">
              <span className="text-sm font-medium text-pink-600">HUBUNGI KAMI</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
              Hubungi Bloom Sisters
            </h1>
            <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
              Proyek bunga artificial ini dikembangkan oleh siswa SMK Prestasi Prima. 
              Kunjungi sekolah kami atau hubungi tim pengembang untuk informasi lebih lanjut.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              {contactInfo.map((info, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xl">
                      {info.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-2">{info.title}</h3>
                      <div className="space-y-1">
                        {info.details.map((detail, i) => (
                          <p key={i} className="text-gray-600 text-sm">{detail}</p>
                        ))}
                      </div>
                      {info.link && (
                        <a
                          href={info.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 text-pink-600 hover:text-pink-700 font-medium text-sm"
                        >
                          {info.linkText} →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                {loading ? (
                  <div className="h-64 md:h-96 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 text-sm">Memuat peta...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 md:h-96">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.474826850753!2d106.89464377499122!3d-6.332476493657119!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ed2681bc7c67%3A0x777152b1d3f74a62!2sSMA%20%26%20SMK%20Prestasi%20Prima!5e0!3m2!1sen!2sid!4v1769588135780!5m2!1sen!2sid"
                      className="w-full h-full border-0"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      title="SMK Prestasi Prima Location"
                    />
                  </div>
                )}
                
                <div className="p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Kunjungi Sekolah Kami</h2>
                  <p className="text-gray-600 mb-6 text-sm md:text-base">
                    SMK Prestasi Prima adalah sekolah yang memfasilitasi pengembangan proyek Bloom Sisters. 
                    Kunjungi kami untuk melihat langsung karya siswa atau berkonsultasi mengenai proyek bunga artificial.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                        <span className="text-pink-600 text-sm">📍</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">SMK Prestasi Prima</p>
                        <p className="text-sm text-gray-600">Jl. Mawar No. 12, Jakarta Selatan</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                        <span className="text-pink-600 text-sm">🕒</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Buka Setiap Hari</p>
                        <p className="text-sm text-gray-600">07:00 - 17:00 (Senin-Jumat)</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                        <span className="text-pink-600 text-sm">🚗</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Parkir Gratis</p>
                        <p className="text-sm text-gray-600">Tersedia area parkir untuk pengunjung</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Information */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 md:p-8 border border-pink-100">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Tentang Proyek Bloom Sisters</h2>
                  <p className="text-gray-600 mb-4 text-sm md:text-base">
                    Bloom Sisters merupakan proyek pengembangan e-commerce bunga artificial yang dikerjakan 
                    oleh siswa-siswi kelas XII PPLG SMK Prestasi Prima. Proyek ini bertujuan untuk menerapkan 
                    ilmu teknologi informasi dalam menciptakan solusi bisnis yang inovatif.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                        <span className="text-pink-600 text-xs">🎓</span>
                      </div>
                      <span className="text-gray-700 text-sm">Proyek siswa SMK Prestasi Prima</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                        <span className="text-pink-600 text-xs">💻</span>
                      </div>
                      <span className="text-gray-700 text-sm">Dikembangkan oleh kelas XII PPLG</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                        <span className="text-pink-600 text-xs">🌺</span>
                      </div>
                      <span className="text-gray-700 text-sm">Fokus pada produk bunga artificial</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm min-w-[200px]">
                  <div className="text-4xl mb-4 text-center">🏫</div>
                  <h3 className="font-bold text-gray-800 text-center mb-2 text-lg">SMK Prestasi Prima</h3>
                  <p className="text-gray-600 text-sm text-center">
                    Sekolah Kejuruan dengan Program Pengembangan Perangkat Lunak dan Gim
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-8 md:p-12 text-center text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Ingin Tahu Lebih Lanjut?</h2>
                <p className="text-white/90 mb-8 max-w-2xl mx-auto text-sm md:text-base">
                  Kunjungi sekolah kami atau jelajahi website untuk melihat koleksi bunga artificial 
                  dan informasi tentang proyek pengembangan kami.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/shop"
                    className="px-6 md:px-8 py-3 md:py-4 bg-white text-pink-600 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 text-sm md:text-base"
                  >
                    Lihat Koleksi Bunga
                  </Link>
                  <a
                    href="https://www.google.com/maps?q=SMK+Prestasi+Prima"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 md:px-8 py-3 md:py-4 border-2 border-white text-white rounded-xl font-bold hover:bg-white/10 transition-all duration-300 text-sm md:text-base"
                  >
                    Petunjuk Arah
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}