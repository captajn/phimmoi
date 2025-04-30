"use client"

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { MdClose, MdSearch, MdExpandMore, MdMenu } from 'react-icons/md';
import { FaTelegram, FaFacebook, FaTiktok, FaYoutube, FaTwitter } from 'react-icons/fa';
import axios from 'axios';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileDropdowns, setMobileDropdowns] = useState({
    phim: false,
    theLoai: false,
    quocGia: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [types] = useState([
    { name: 'Phim Bộ', slug: 'phim-bo' },
    { name: 'Phim Lẻ', slug: 'phim-le' },
    { name: 'Hoạt Hình', slug: 'hoat-hinh' },
    { name: 'VietSub', slug: 'phim-vietsub' },
    { name: 'Thuyết Minh', slug: 'phim-thuyet-minh' },
    { name: 'Lồng Tiếng', slug: 'phim-long-tieng' },
    { name: 'TV Shows', slug: 'tv-shows' }
  ]);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [countries, setCountries] = useState<{ name: string; slug: string }[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [isClient, setIsClient] = useState(false);

  const pathname = usePathname() || '';

  // Đánh dấu khi component đã được render ở client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, countriesRes] = await Promise.all([
          axios.get('https://phimapi.com/the-loai'),
          axios.get('https://phimapi.com/quoc-gia')
        ]);
        setCategories(categoriesRes.data);
        setCountries(countriesRes.data);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setMobileDropdowns({ phim: false, theLoai: false, quocGia: false });
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  // Thêm handler để xử lý event scroll ở client
  useEffect(() => {
    const handleScroll = () => {
      const header = document.getElementById('main-header');
      if (header) {
        if (window.scrollY > 10) {
          header.classList.add('header-scrolled');
        } else {
          header.classList.remove('header-scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`;
      setIsMobileMenuOpen(false);
      setIsSearchActive(false);
      setSearchQuery('');
    }
  };

  const toggleMobileDropdown = (key: keyof typeof mobileDropdowns) => {
    setMobileDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleSearch = () => {
    setIsSearchActive(!isSearchActive);
  };

  const renderDropdown = (label: string, items: { name: string; slug: string }[], basePath: string) => (
    <div className="relative group">
      <button className="text-white hover:text-yellow-400 text-sm font-medium px-2 py-2">
        {label}
        <span className="ml-1">▾</span>
      </button>
      <div className="absolute left-0 top-full header-dropdown rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40">
        <div className="p-3 min-w-[220px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            {items.map((item, idx) => (
              <Link
                key={idx}
                href={`/${basePath}/${item.slug}`}
                className="px-3 py-2 text-white hover:text-yellow-400 hover:bg-white/10 rounded text-sm font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Luôn áp dụng header trong suốt cho tất cả các trang
  const isTransparentHeader = true;

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
      <style jsx global>{`
        .shadow-text {
          text-shadow: 0 2px 4px rgba(0,0,0,0.9);
        }
        .menu-item {
          text-shadow: 0 2px 4px rgba(0,0,0,0.9);
          font-weight: 500;
          position: relative;
        }
        .menu-item:after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: #f59e0b;
          transition: width 0.3s ease;
        }
        .menu-item:hover:after {
          width: 100%;
        }
        .header-dropdown {
          background: rgba(10, 10, 10, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        /* Header trong suốt */
        .transparent-header {
          background-color: transparent !important;
          box-shadow: none !important;
          border: none !important;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          transition: background-color 0.3s ease;
        }
        
        /* Khi cuộn xuống, thêm background mờ */
        .header-scrolled {
          background-color: rgba(17, 24, 39, 0.85) !important; 
          backdrop-filter: blur(8px);
        }

        @media (max-width: 768px) {
          .menu-shadow-mobile {
            text-shadow: 0 3px 6px rgba(0,0,0,1);
          }
        }
      `}</style>
      
      <header className={`fixed w-full z-[9999] ${isTransparentHeader ? 'transparent-header' : 'bg-gray-900/95 backdrop-blur-sm shadow-md'}`} id="main-header" suppressHydrationWarning>
        <div className="container mx-auto px-3 md:px-4" suppressHydrationWarning>
          <div className="flex items-center justify-between h-16" suppressHydrationWarning>
            {/* Left side: Mobile menu button and logo */}
            <div className="flex items-center" suppressHydrationWarning>
              <button
                ref={menuBtnRef}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-center text-white md:hidden shadow-text menu-shadow-mobile mr-3"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <MdClose size={28} /> : <MdMenu size={28} />}
              </button>
              
              <Link href="/" className="flex items-center">
                <span className="text-white text-xl font-bold">KhoPhim</span>
              </Link>
            </div>
            
            {/* Center: Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1" suppressHydrationWarning>
              <div className="flex items-center">
                {/* Desktop Search Form */}
                <div className="relative mr-4">
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="text"
                      placeholder="Tìm kiếm phim, diễn viên"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-[180px] h-9 px-3 pl-8 rounded-full bg-white/10 text-white placeholder-gray-300 border border-white/10 focus:border-white/30 focus:outline-none text-sm backdrop-blur-sm"
                    />
                    <MdSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                  </form>
                </div>
                
                <Link href="/duyet-tim" className="text-white hover:text-yellow-400 text-sm font-medium px-4 py-2">
                  Duyệt Tìm
                </Link>

                <div className="relative group">
                  <button className="text-white hover:text-yellow-400 text-sm font-medium px-4 py-2">
                    Phim
                    <span className="ml-1">▾</span>
                  </button>
                  <div className="absolute left-0 top-full header-dropdown rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40">
                    <div className="p-3 min-w-[220px]">
                      <div className="grid grid-cols-1 gap-1">
                        {types.map((item, idx) => (
                          <Link
                            key={idx}
                            href={`/danh-sach/${item.slug}`}
                            className="px-3 py-2 text-white hover:text-yellow-400 hover:bg-white/10 rounded text-sm font-medium"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {isClient && renderDropdown('Thể loại', categories, 'the-loai')}
                
                {isClient && renderDropdown('Quốc gia', countries, 'quoc-gia')}
              </div>
            </nav>
          
            {/* Right side: Login */}
            <div className="flex items-center" suppressHydrationWarning>
              {/* Mobile search button */}
              <button
                onClick={toggleSearch}
                className="md:hidden flex items-center justify-center text-white mr-3"
                aria-label="Search"
              >
                <MdSearch size={26} />
              </button>
              
              {/* Login Button */}
              <Link 
                href="/login" 
                className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-1.5 rounded-full text-sm transition-all shadow-md"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
          
          {/* Mobile Search bar (expanded when active) */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ${
            isSearchActive ? 'max-h-16 opacity-100 visible' : 'max-h-0 opacity-0 invisible'
          }`}>
            <form onSubmit={handleSearch} className="relative w-full py-3">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm kiếm phim, diễn viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-4 pl-10 rounded-full bg-black/40 text-white placeholder-gray-300 border border-white/10 focus:outline-none text-sm backdrop-blur-sm"
              />
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300"
                onClick={toggleSearch}
              >
                <MdClose size={20} />
              </button>
            </form>
          </div>
        </div>
      </header>

      {isClient && isMobileMenuOpen && (
        <div className="fixed inset-0 z-[99999] md:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-0 left-0 h-full w-[85%] max-w-[320px] bg-[#1a1b1d] shadow-xl z-10 overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="text-white text-xl font-bold">KhoPhim</span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:text-yellow-400"
                >
                  <MdClose size={26} />
                </button>
              </div>
              
              <div className="space-y-3 text-white">
                <div className="border-b border-[#2a2c31] pb-3">
                  <Link
                    href="/duyet-tim"
                    className="w-full flex justify-between items-center py-2 px-3 hover:bg-[#2a2c31] rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="font-medium">Duyệt Tìm</span>
                  </Link>
                </div>
                
                <div className="border-b border-[#2a2c31] pb-3">
                  <button
                    onClick={() => toggleMobileDropdown('phim')}
                    className="w-full flex justify-between items-center py-2 px-3 hover:bg-[#2a2c31] rounded-md transition-colors"
                  >
                    <span className="font-medium">Phim</span>
                    <MdExpandMore className={`${mobileDropdowns.phim ? 'rotate-180' : ''} transition-transform`} />
                  </button>
                  {mobileDropdowns.phim && (
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {types.map((item, idx) => (
                        <Link
                          key={idx}
                          href={`/danh-sach/${item.slug}`}
                          className="py-1.5 px-3 text-gray-300 hover:text-yellow-400 text-sm hover:bg-[#2a2c31] rounded"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="border-b border-[#2a2c31] pb-3">
                  <button
                    onClick={() => toggleMobileDropdown('theLoai')}
                    className="w-full flex justify-between items-center py-2 px-3 hover:bg-[#2a2c31] rounded-md transition-colors"
                  >
                    <span className="font-medium">Thể Loại</span>
                    <MdExpandMore className={`${mobileDropdowns.theLoai ? 'rotate-180' : ''} transition-transform`} />
                  </button>
                  {mobileDropdowns.theLoai && (
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {categories.map((item, idx) => (
                        <Link
                          key={idx}
                          href={`/the-loai/${item.slug}`}
                          className="py-1.5 px-3 text-gray-300 hover:text-yellow-400 text-sm hover:bg-[#2a2c31] rounded"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="border-b border-[#2a2c31] pb-3">
                  <button
                    onClick={() => toggleMobileDropdown('quocGia')}
                    className="w-full flex justify-between items-center py-2 px-3 hover:bg-[#2a2c31] rounded-md transition-colors"
                  >
                    <span className="font-medium">Quốc Gia</span>
                    <MdExpandMore className={`${mobileDropdowns.quocGia ? 'rotate-180' : ''} transition-transform`} />
                  </button>
                  {mobileDropdowns.quocGia && (
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {countries.map((item, idx) => (
                        <Link
                          key={idx}
                          href={`/quoc-gia/${item.slug}`}
                          className="py-1.5 px-3 text-gray-300 hover:text-yellow-400 text-sm hover:bg-[#2a2c31] rounded"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                
                <Link
                  href="/login"
                  className="block py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-md transition-colors text-center mt-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-0 pt-0" suppressHydrationWarning>
        {children}
      </main>
      <footer className="bg-[#121212] text-white py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-red-700 text-white px-3 py-1.5 rounded-lg inline-flex items-center mb-4 mx-auto text-sm">
            <Image 
              src="/images/vn_flag.svg" 
              alt="Vietnam" 
              width={16} 
              height={16} 
              className="mr-2" 
            />
            Hoàng Sa & Trường Sa là của Việt Nam!
          </div>

          <div className="flex flex-col items-center mb-4">
            <Link href="/" className="flex items-center mb-3">
              <span className="text-white text-xl font-bold">KhoPhim</span>
            </Link>
            
            <div className="flex space-x-3 mb-3">
              <a href="#" className="bg-[#2a2c31] p-2 rounded-full hover:bg-[#3a3c41] transition">
                <FaTelegram className="w-4 h-4 text-white" />
              </a>
              <a href="#" className="bg-[#2a2c31] p-2 rounded-full hover:bg-[#3a3c41] transition">
                <FaTwitter className="w-4 h-4 text-white" />
              </a>
              <a href="#" className="bg-[#2a2c31] p-2 rounded-full hover:bg-[#3a3c41] transition">
                <FaFacebook className="w-4 h-4 text-white" />
              </a>
              <a href="#" className="bg-[#2a2c31] p-2 rounded-full hover:bg-[#3a3c41] transition">
                <FaTiktok className="w-4 h-4 text-white" />
              </a>
              <a href="#" className="bg-[#2a2c31] p-2 rounded-full hover:bg-[#3a3c41] transition">
                <FaYoutube className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

          <div className="text-xs text-gray-400 mb-3 max-w-3xl mx-auto text-center">
            <p>Trang xem phim online chất lượng cao miễn phí Vietsub, thuyết minh, lồng tiếng HD. Kho phim mới không lỗ, phim chiếu rạp, phim bộ, phim lẻ từ nhiều quốc gia.</p>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-xs">© 2025 KhoPhim</p>
          </div>
        </div>
      </footer>
    </div>
  );
}