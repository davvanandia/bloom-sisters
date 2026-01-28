//app/about/page.tsx
'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Davina Anandia',
      role: 'Full Stack Developer',
      image: '👩‍💻',
      bio: 'Bertanggung jawab mengembangkan backend dan frontend sistem Bloom Sisters dengan teknologi terkini.',
      expertise: ['Node.js', 'React', 'Database Design', 'API Development']
    },
    {
      name: 'Aprilia Intani',
      role: 'Frontend Developer',
      image: '👩‍🎨',
      bio: 'Menciptakan pengalaman pengguna yang menarik dan responsif dengan desain yang modern dan intuitif.',
      expertise: ['React.js', 'Next.js', 'TypeScript', 'Responsive Design']
    },
    {
      name: 'Grace Marin',
      role: 'UI/UX Designer',
      image: '🎨',
      bio: 'Merancang antarmuka yang estetik dan mudah digunakan untuk memastikan kepuasan pengguna.',
      expertise: ['User Research', 'Wireframing', 'Prototyping', 'Design System']
    },
    {
      name: 'Evi Vani',
      role: 'Business Analyst',
      image: '📊',
      bio: 'Menganalisis kebutuhan pasar dan mengembangkan strategi bisnis untuk pertumbuhan Bloom Sisters.',
      expertise: ['Market Research', 'Business Strategy', 'Data Analysis', 'Process Optimization']
    },
    {
      name: 'Alfatiha Galuh',
      role: 'Public Documentation',
      image: '📝',
      bio: 'Mengelola dokumentasi proyek dan komunikasi publik untuk memastikan transparansi informasi.',
      expertise: ['Technical Writing', 'Content Strategy', 'Public Relations', 'Project Documentation']
    }
  ];

  const values = [
    {
      icon: '💐',
      title: 'Bunga Artificial Berkualitas',
      description: 'Kami menyediakan bunga artificial premium yang tahan lama dan tampak seperti asli, tanpa perlu perawatan khusus.'
    },
    {
      icon: '🎓',
      title: 'Proyek Pendidikan',
      description: 'Inisiatif dari siswa SMK untuk mengembangkan solusi teknologi dalam industri bunga dekorasi.'
    },
    {
      icon: '✨',
      title: 'Inovasi Kreatif',
      description: 'Menggabungkan teknologi modern dengan keindahan bunga untuk menciptakan pengalaman belanja yang unik.'
    },
    {
      icon: '🤝',
      title: 'Kolaborasi Tim',
      description: 'Bekerja sama sebagai tim untuk mencapai tujuan bersama dengan semangat gotong royong.'
    }
  ];

  const milestones = [
    { year: '2026', event: 'Bloom Sisters diluncurkan sebagai proyek siswa SMK PPLG' },
    { year: 'Februari 2026', event: 'Fokus pada produk Valentine dan rangkaian bunga artificial' },
    { year: 'Maret 2026', event: 'Pengembangan sistem e-commerce berbasis web modern' },
    { year: 'April 2026', event: 'Persiapan koleksi bunga untuk musim kelulusan sekolah' },
    { year: 'Mei 2026', event: 'Ekspansi produk untuk berbagai acara dan dekorasi' }
  ];

  const projectInfo = {
    school: 'SMK Prestasi Prima',
    program: 'Pengembangan Perangkat Lunak dan Gim (PPLG)',
    class: 'XII PPLG',
    year: '2026',
    location: 'Indonesia'
  };

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
            <li className="text-pink-600 font-medium">Tentang Kami</li>
          </ol>
        </nav>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 mb-6">
              <span className="text-sm font-medium text-pink-600">PROYEK KAMI</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
              Selamat Datang di Bloom Sisters
            </h1>
            <p className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto mb-6">
              Platform e-commerce bunga artificial modern yang dikembangkan oleh siswa SMK untuk memenuhi kebutuhan dekorasi bunga pada momen-momen spesial seperti Valentine dan kelulusan sekolah.
            </p>
            
            {/* Project Info Banner */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 max-w-2xl mx-auto border border-pink-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Sekolah</div>
                  <div className="font-semibold text-gray-800">{projectInfo.school}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Program</div>
                  <div className="font-semibold text-gray-800">{projectInfo.program}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Kelas</div>
                  <div className="font-semibold text-gray-800">{projectInfo.class}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            <div className="h-64 md:h-80 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              <div className="text-6xl md:text-8xl">
                💐🌸🌺
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex items-end p-6">
              <div className="text-white">
                <p className="text-lg font-semibold">Memulai Perjalanan di Tahun 2026</p>
                <p className="text-sm opacity-90">Inovasi bunga artificial untuk generasi modern</p>
              </div>
            </div>
          </div>
        </div>

        {/* About Bunga Artificial */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Kenapa Bunga Artificial?</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Memasuki tahun 2026, kami melihat peluang besar dalam pasar bunga dekorasi untuk acara-acara spesial seperti 
                  <span className="font-semibold text-pink-600"> Hari Valentine</span> dan 
                  <span className="font-semibold text-purple-600"> musim kelulusan sekolah</span>. 
                  Bunga artificial menjadi pilihan populer karena keunggulannya:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-pink-600 text-xs">✓</span>
                    </div>
                    <span><span className="font-semibold">Tahan lama</span> - Bisa digunakan berulang kali untuk berbagai acara</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-pink-600 text-xs">✓</span>
                    </div>
                    <span><span className="font-semibold">Perawatan mudah</span> - Tidak perlu disiram atau dipangkas</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-pink-600 text-xs">✓</span>
                    </div>
                    <span><span className="font-semibold">Ramah lingkungan</span> - Mengurangi limbah bunga segar</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-pink-600 text-xs">✓</span>
                    </div>
                    <span><span className="font-semibold">Hemat biaya</span> - Investasi sekali untuk penggunaan jangka panjang</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-8 text-white">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-4">Visi Kami</h3>
              <p className="mb-6">
                Menjadi platform terdepan untuk bunga artificial berkualitas tinggi di Indonesia, 
                menyediakan solusi dekorasi yang praktis dan estetik untuk setiap momen spesial.
              </p>
              <h4 className="text-xl font-bold mb-3">Misi Kami</h4>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <span>Menyediakan bunga artificial premium dengan harga terjangkau</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <span>Mengembangkan teknologi e-commerce yang user-friendly</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <span>Mendukung pendidikan teknologi melalui proyek nyata</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <span>Menginspirasi kreativitas dalam dekorasi bunga</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Nilai-Nilai Kami</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Prinsip-prinsip yang menjadi fondasi dalam setiap langkah pengembangan Bloom Sisters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-2xl mb-4">
                  {value.icon}
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Team */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Tim Pengembang</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Siswa-siswi berbakat dari kelas XII PPLG SMK Prestasi Prima yang berkolaborasi menciptakan Bloom Sisters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="p-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-2xl mb-4 mx-auto">
                    {member.image}
                  </div>
                  <h3 className="font-bold text-gray-800 text-center text-base mb-1">{member.name}</h3>
                  <p className="text-pink-600 text-center text-sm font-medium mb-4">{member.role}</p>
                  <p className="text-gray-600 text-xs text-center mb-4">{member.bio}</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {member.expertise.map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Jejak Perjalanan</h2>
            <p className="text-gray-600">Perkembangan proyek Bloom Sisters dari awal hingga sekarang</p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-pink-300 to-purple-400"></div>
            
            {milestones.map((milestone, index) => (
              <div key={index} className={`flex flex-col md:flex-row items-center mb-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className="md:w-1/2 mb-4 md:mb-0">
                  <div className={`bg-white rounded-xl p-5 shadow-sm ${index % 2 === 0 ? 'md:mr-8 md:text-right' : 'md:ml-8'}`}>
                    <div className="text-xl font-bold text-pink-600 mb-2">{milestone.year}</div>
                    <p className="text-gray-700">{milestone.event}</p>
                  </div>
                </div>
                <div className="relative z-10 mb-4 md:mb-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                </div>
                <div className="md:w-1/2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* School Information */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-8 border border-pink-100">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">SMK Prestasi Prima</h2>
                <p className="text-gray-600 mb-4">
                  Sekolah Menengah Kejuruan yang berfokus pada pengembangan kompetensi siswa di bidang teknologi informasi, 
                  khususnya Pengembangan Perangkat Lunak dan Gim (PPLG).
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                      <span className="text-pink-600 text-xs">🎯</span>
                    </div>
                    <span className="text-gray-700">Program PPLG Kelas XII</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                      <span className="text-pink-600 text-xs">🏆</span>
                    </div>
                    <span className="text-gray-700">Fokus pada pembelajaran berbasis proyek</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                      <span className="text-pink-600 text-xs">💼</span>
                    </div>
                    <span className="text-gray-700">Kemitraan dengan industri teknologi</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-4xl mb-4 text-center">🏫</div>
                <h3 className="font-bold text-gray-800 text-center mb-2">Visi Sekolah</h3>
                <p className="text-gray-600 text-sm text-center">
                  Mencetak lulusan yang kompeten, berkarakter, dan siap bersaing di era digital
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-8 md:p-12 text-center text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Siap Berbelanja Bunga Artificial?</h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                Jelajahi koleksi bunga artificial premium kami untuk Valentine, kelulusan, atau dekorasi ruangan Anda. 
                Setiap produk dirancang dengan detail yang indah dan tahan lama.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/shop"
                  className="px-6 md:px-8 py-3 md:py-4 bg-white text-pink-600 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 text-sm md:text-base"
                >
                  Lihat Koleksi
                </Link>
                <Link
                  href="/contact"
                  className="px-6 md:px-8 py-3 md:py-4 border-2 border-white text-white rounded-xl font-bold hover:bg-white/10 transition-all duration-300 text-sm md:text-base"
                >
                  Hubungi Kami
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}