import React, { useState, useEffect, useRef } from 'react';
import { generateSlug, optimizeImageUrl, getRouteUrl } from '../lib/utils';
import { useRouter } from 'next/navigation';
import { SEO } from './SEO';
import { collection, getDocs, getDoc, doc, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase-errors';
import { Product, Project, RouteState } from '../types';
import { Search, MapPin, SlidersHorizontal, RefreshCw, ChevronRight, Compass, Heart, ArrowUpRight, Layers, Building2, ChevronDown, X } from 'lucide-react';
import AdBanner from './AdBanner';
import { EditableText, EditableImage } from './EditableComponent';
import CustomSectionRenderer from './CustomSectionRenderer';
import SectionHeaderToolbar from './SectionHeaderToolbar';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { locationTree, parseLocation, LocationNode, formatLocationName } from '../lib/locationMapping';
import SchemaMarkup from './SchemaMarkup';

interface ProductListProps {
  onNavigate: (route: RouteState) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  isEditMode: boolean;
  sections: any[];
  onUpdateSections: (sections: any[]) => void;
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
  initialLocation?: string;
  initialCategory?: string;
  initialType?: 'all' | 'sale' | 'rent';
  initialPriceRange?: string;
  initialAreaRange?: string;
  initialCategoryTitle?: string;
  initialCategoryDesc?: string;
}

import ProductCard from './ProductCard';

export default function ProductList({ 
  onNavigate, 
  onShowNotification,
  isEditMode,
  sections,
  onUpdateSections,
  selectedSectionId,
  setSelectedSectionId,
  initialLocation,
  initialCategory,
  initialType,
  initialPriceRange,
  initialAreaRange,
  initialCategoryTitle,
  initialCategoryDesc
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter conditions
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'sale' | 'rent'>(initialType || 'all');
  const [selectedDistrict, setSelectedDistrict] = useState(initialLocation || 'all');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedPriceRange, setSelectedPriceRange] = useState(initialPriceRange || 'all');
  const [selectedAreaRange, setSelectedAreaRange] = useState(initialAreaRange || 'all');
  const [openDropdown, setOpenDropdown] = useState<'type' | 'district' | 'price' | 'area' | 'category' | null>(null);
  const [dropdownPos, setDropdownPos] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();
  const scrollDirection = useScrollDirection();
  
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedType(initialType || 'all');
    setSelectedDistrict(initialLocation || 'all');
    setSelectedCategory(initialCategory || 'all');
    setSelectedPriceRange(initialPriceRange || 'all');
    setSelectedAreaRange(initialAreaRange || 'all');
  }, [initialType, initialLocation, initialCategory, initialPriceRange, initialAreaRange]);

  const handleTabClick = (e: React.MouseEvent<HTMLElement>, action: () => void) => {
    action();
    const container = tabsContainerRef.current;
    const target = e.currentTarget;
    if (container && target) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      
      const targetCenter = targetRect.left + (targetRect.width / 2);
      const containerCenter = containerRect.left + (containerRect.width / 2);
      
      const offset = targetCenter - containerCenter;
      
      container.scrollTo({
        left: container.scrollLeft + offset,
        behavior: 'smooth'
      });
      
      if (navbarRef.current) {
        const navbarRect = navbarRef.current.getBoundingClientRect();
        // Calculate center position of target relative to navbar
        const relativeCenter = targetRect.left - navbarRect.left + (targetRect.width / 2);
        setDropdownPos(relativeCenter);
      }
    }
  };

  // Removed document.addEventListener('click') as we use a backdrop div for outside clicks

  const initialFilters = useRef({
    searchQuery, selectedPriceRange, selectedAreaRange, selectedDistrict, selectedCategory, selectedType
  });

  const isMounted = useRef(false);

  const scrollToGrid = () => {
    const element = document.getElementById('products-grid-section');
    if (element) {
      const offset = 140; // Offset for sticky headers
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    scrollToGrid();
  }, [searchQuery, selectedPriceRange, selectedAreaRange, selectedDistrict, selectedCategory, selectedType]);

  // Load limits for Ajax See-Mores - optimize mobile DOM size
  const [mainGridLimit, setMainGridLimit] = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 4 : 10);
  const [recentGridLimit, setRecentGridLimit] = useState(5);

  const [districts, setDistricts] = useState<string[]>([]);
  const [filteredLocationTree, setFilteredLocationTree] = useState<LocationNode[]>([]);
  const [expandedLocationLevel, setExpandedLocationLevel] = useState<string | null>(null);

  
  const [productCategoriesExt, setProductCategoriesExt] = useState<any[]>([]);
  const [expandedParentCat, setExpandedParentCat] = useState<string | null>(null);

  const [priceSaleConfig, setPriceSaleConfig] = useState<any[]>([]);
  const [priceRentConfig, setPriceRentConfig] = useState<any[]>([]);
  const [areaConfig, setAreaConfig] = useState<any[]>([]);

  useEffect(() => {
    async function loadDataAndHistory() {
      try {
        setLoading(true);

        setLoading(true);

        // Fetch projects in the background since they are only used below the fold
        getDocs(collection(db, 'projects')).then(projSnap => {
          const projList: Project[] = [];
          projSnap.forEach((doc) => {
            projList.push({ id: doc.id, ...doc.data() } as Project);
          });
          if (isMounted.current) {
            setProjects(projList);
          }
        }).catch(err => console.error("Error fetching background projects:", err));

        const [generalSnap, filterSnap, prodSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'general')),
          getDoc(doc(db, 'settings', 'filters')),
          getDocs(collection(db, 'products'))
        ]);

        if (generalSnap.exists()) {
          setProductCategoriesExt(generalSnap.data().productCategoriesExt || []);
        }

        let adminConfiguredDistricts: string[] = [];
        if (filterSnap.exists()) {
          const fd = filterSnap.data();
          setPriceSaleConfig(fd.priceSale || []);
          setPriceRentConfig(fd.priceRent || []);
          setAreaConfig(fd.areaRanges || []);
          adminConfiguredDistricts = fd.districts || [];
          if (adminConfiguredDistricts.length > 0) {
            setDistricts(adminConfiguredDistricts);
          }
        } else {
          setPriceSaleConfig([]);
          setPriceRentConfig([]);
          setAreaConfig([]);
        }

        const list: Product[] = [];
        const uniqueDistricts = new Set<string>();

        prodSnap.forEach((doc) => {
          const data = doc.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            const p = { id: doc.id, ...data } as Product;
            list.push(p);
            if (p.district) uniqueDistricts.add(p.district.trim());
          }
        });

        list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setProducts(list);
        setDistricts(adminConfiguredDistricts.length > 0 ? adminConfiguredDistricts : Array.from(uniqueDistricts).sort());

        const activeNodes = new Set<string>();
        uniqueDistricts.forEach(d => {
            const loc = parseLocation(d);
            if (loc.province) activeNodes.add(loc.province);
            if (loc.district) activeNodes.add(loc.district);
            if (loc.ward) activeNodes.add(loc.ward);
        });

        const dynamicTree = locationTree.map(prov => {
           const formattedProvName = formatLocationName(prov.name);
           if (!activeNodes.has(formattedProvName) && !activeNodes.has(prov.name)) return null;
           const newProv = { ...prov, name: formattedProvName };
           if (newProv.wards) {
             newProv.wards = newProv.wards.filter(ward => activeNodes.has(ward));
           }
           if (newProv.districts) {
             newProv.districts = newProv.districts.filter(dist => activeNodes.has(dist.name)).map(dist => {
               const newDist = { ...dist };
               if (newDist.wards) {
                 newDist.wards = newDist.wards.filter(ward => activeNodes.has(ward));
               }
               return newDist;
             });
           }
           return newProv;
        }).filter(Boolean) as LocationNode[];

        setFilteredLocationTree(dynamicTree);

        const viewedIds: string[] = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        if (viewedIds.length > 0) {
          const historyList = list.filter(p => viewedIds.includes(p.id));
          historyList.sort((a, b) => viewedIds.indexOf(a.id) - viewedIds.indexOf(b.id));
          setRecentlyViewed(historyList);
        }

      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trang sản phẩm:", err);
        handleFirestoreError(err, OperationType.LIST, 'products');
      } finally {
        setLoading(false);
      }
    }

    loadDataAndHistory();
  }, []);

  useEffect(() => {
    // Only run slider auto-scroll if it's explicitly needed and doesn't thrash layout continuously
    let isRunning = true;
    const interval = setInterval(() => {
       if (!isRunning || window.innerWidth >= 1024) return;
       // We use requestAnimationFrame to prevent layout thrashing
       requestAnimationFrame(() => {
         const slider = document.getElementById('featured-projects-slider');
         if (!slider) return;
         const maxScroll = slider.scrollWidth - slider.clientWidth;
         let nextScroll = slider.scrollLeft + slider.clientWidth;
         if (nextScroll >= maxScroll - 10) {
            nextScroll = 0;
         }
         slider.scrollTo({ left: nextScroll, behavior: 'smooth' });
       });
    }, 5000);
    return () => {
      isRunning = false;
      clearInterval(interval);
    };
  }, []);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedDistrict('all');
    setSelectedCategory('all');
    setSelectedPriceRange('all');
    setSelectedAreaRange('all');
    setMainGridLimit(10);
  };

  const filteredProducts = React.useMemo(() => products.filter(p => {
    // 6. Type search matches title, district, type, or parsed location
    const sQuery = searchQuery.toLowerCase().trim();
    const parsedSearch = parseLocation(sQuery);
    
    const matchesSearch = sQuery === '' || (
      p.title.toLowerCase().includes(sQuery) ||
      (p.district && p.district.toLowerCase().includes(sQuery)) ||
      (p.type && p.type.toLowerCase().includes(sQuery)) ||
      (parsedSearch.province && p.district && parseLocation(p.district).province === parsedSearch.province) ||
      (parsedSearch.district && p.district && parseLocation(p.district).district === parsedSearch.district)
    );
    
    const matchesType = selectedType === 'all' || (selectedType === 'sale' ? p.type !== 'rent' : p.type === 'rent');
    
    // District matches exact text OR hierarchical mappings
    const matchesDistrict = selectedDistrict === 'all' || (() => {
      const parsed = parseLocation(p.district || '');
      return p.district?.trim() === selectedDistrict || 
             parsed.province === selectedDistrict || 
             parsed.district === selectedDistrict || 
             parsed.ward === selectedDistrict;
    })();
    
    // Category matches exact category OR sub-categories of the selected category
    const matchesCategory = selectedCategory === 'all' || (() => {
      if (!p.category) return false;
      const pCatName = p.category.trim().toLowerCase();
      const sCatName = selectedCategory.trim().toLowerCase();
      
      // Exact match (by name or slug)
      if (pCatName === sCatName || generateSlug(p.category) === selectedCategory) {
        return true;
      }
      
      // Match if product's category is a child of the selected category
      const parentCat = productCategoriesExt.find(c => c.name.toLowerCase() === sCatName || generateSlug(c.name) === selectedCategory);
      if (parentCat) {
        const childCats = productCategoriesExt.filter(c => c.parentId === parentCat.name);
        if (childCats.some(child => child.name.toLowerCase() === pCatName || generateSlug(child.name) === generateSlug(p.category))) {
          return true;
        }
      }
      return false;
    })();

    let matchesPrice = true;
    if (selectedPriceRange !== 'all') {
      matchesPrice = false;
      const val = p.priceVal;
      if (p.type !== 'rent') {
        if (priceSaleConfig.length > 0) {
          const cfg = priceSaleConfig.find(c => c.id === selectedPriceRange);
          if (cfg) matchesPrice = val >= cfg.min && (cfg.max === null ? true : val <= cfg.max);
        } else {
          if (selectedPriceRange === 'under3') matchesPrice = val < 3000000000;
          else if (selectedPriceRange === '3to5') matchesPrice = val >= 3000000000 && val < 5000000000;
          else if (selectedPriceRange === '5to10') matchesPrice = val >= 5000000000 && val < 10000000000;
          else if (selectedPriceRange === '10to20') matchesPrice = val >= 10000000000 && val < 20000000000;
          else if (selectedPriceRange === '20to50') matchesPrice = val >= 20000000000 && val <= 50000000000;
          else if (selectedPriceRange === 'over50') matchesPrice = val > 50000000000;
        }
      } else {
        if (priceRentConfig.length > 0) {
          const cfg = priceRentConfig.find(c => c.id === selectedPriceRange);
          if (cfg) matchesPrice = val >= cfg.min && (cfg.max === null ? true : val <= cfg.max);
        } else {
          if (selectedPriceRange === 'under15m') matchesPrice = val < 15000000;
          else if (selectedPriceRange === '15to40m') matchesPrice = val >= 15000000 && val <= 40000000;
          else if (selectedPriceRange === 'over40m') matchesPrice = val > 40000000;
        }
      }
    }

    let matchesArea = true;
    if (selectedAreaRange !== 'all') {
      matchesArea = false;
      const area = p.area || 0;
      if (areaConfig.length > 0) {
        const cfg = areaConfig.find(c => c.id === selectedAreaRange);
        if (cfg) matchesArea = area >= cfg.min && (cfg.max === null ? true : area <= cfg.max);
      } else {
        if (selectedAreaRange === 'under100') matchesArea = area > 0 && area <= 100;
        else if (selectedAreaRange === '100to300') matchesArea = area > 100 && area <= 300;
        else if (selectedAreaRange === '300to500') matchesArea = area > 300 && area <= 500;
        else if (selectedAreaRange === 'over500') matchesArea = area > 500;
      }
    }

    return matchesSearch && matchesType && matchesDistrict && matchesCategory && matchesPrice && matchesArea;
  }), [products, searchQuery, selectedType, selectedDistrict, selectedCategory, selectedPriceRange, selectedAreaRange, priceSaleConfig, priceRentConfig, areaConfig, productCategoriesExt]);

  const displayedProductIds = React.useMemo(() => {
    return new Set(filteredProducts.slice(0, mainGridLimit).map(p => p.id));
  }, [filteredProducts, mainGridLimit]);

  const latestSales = React.useMemo(() => products.filter(p => p.type !== 'rent' && !displayedProductIds.has(p.id)).slice(0, 8), [products, displayedProductIds]);
  const latestRents = React.useMemo(() => products.filter(p => p.type === 'rent' && !displayedProductIds.has(p.id)).slice(0, 8), [products, displayedProductIds]);

  const getSection = (id: string) => {
    return sections.find(s => s.id === id) || {
      id,
      name: id,
      visible: true,
      paddingTop: 40,
      paddingBottom: 40,
      title: '',
      subtitle: '',
      description: ''
    };
  };

  const [showBelowFold, setShowBelowFold] = useState(false);
  useEffect(() => {
    // Defer rendering below-the-fold sections by 1500ms to allow LCP and TTI to finish quickly
    const timer = setTimeout(() => setShowBelowFold(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const schemaItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": filteredProducts.slice(0, mainGridLimit).map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://greeniahomes.vn/san-pham/${generateSlug(product.title)}-${product.id}`
    }))
  };


  return (    <>
    <SchemaMarkup schema={schemaItemList} />
    <div className="relative min-h-screen">
      <div className="font-sans" id="product-hub-view-root" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
        {sections.map((section, idx) => {
          if (!section.visible && !isEditMode) return null;
          
          // DEFER HEAVY SECTIONS THAT ARE BELOW THE FOLD
          const isHeavySection = ['recently_viewed', 'latest_sales', 'latest_rents', 'featured_projects'].includes(section.id);
          if (isHeavySection && !showBelowFold && !isEditMode) {
            return (
              <div key={section.id} className="min-h-[200px]" /> // Placeholder
            );
          }

          let cardContent = null;
          const sec = getSection(section.id);

          if (section.id.startsWith('custom_')) {
            cardContent = (
              <CustomSectionRenderer 
                section={sec}
                isEditMode={isEditMode}
                EditableText={EditableText}
                EditableImage={EditableImage}
               
                sections={sections}
                onUpdateSections={onUpdateSections}
                onShowNotification={onShowNotification}
                onNavigate={onNavigate}
              />
            );
          } else if (section.id === 'products_header') {
            cardContent = null;
          } else if (section.id === 'products_filter') {
            cardContent = (
              <div className="block max-w-7xl mx-auto px-0 mt-0">
                
                {/* Navbar/Filter Bar */}
                <div className="pt-0 pr-0 border-b border-border-color shadow-[0_10px_20px_rgba(0,0,0,0.05)] transition-all duration-300 z-50 relative m-0 p-0">
                  <div ref={navbarRef} className="flex items-center w-full relative m-0 px-[5px]">
                    
                    <div ref={tabsContainerRef} className="flex flex-nowrap items-center gap-[6px] md:gap-2 overflow-x-auto w-[calc(100%-36px)] md:w-full relative flex-1 z-50 pb-[2px] px-[5px] scrollbar-hide scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      
                      {/* Mobile Type Dropdown */}
                      <div className="relative flex shrink-0 md:hidden sticky left-[-5px] z-[60] bg-bg-surface pr-1 py-1 -my-1 outline outline-1 outline-white">
                        <button 
                          onClick={(e) => handleTabClick(e, () => { e.stopPropagation(); setOpenDropdown(openDropdown === 'type' ? null : 'type'); })}
                          className={`px-[8px] py-[4px] shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer border ${selectedType !== 'all' ? 'bg-[#064E3B]/10 text-primary border-primary' : 'bg-transparent border-border-color text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:border-primary/20'} flex items-center gap-1.5`}
                        >
                          <span className={selectedType !== 'all' ? 'text-primary' : 'text-text-primary'}>{selectedType === 'all' ? 'Tất cả' : (selectedType === 'sale' ? 'Bán' : 'Cho thuê')}</span>
                          <ChevronDown size={14} strokeWidth={2} />
                        </button>
                      </div>

                      {/* Desktop Tabs */}
                      <button 
                        onClick={(e) => handleTabClick(e, () => { 
                          if (selectedType === 'all') scrollToGrid();
                          setSelectedType('all'); setSelectedPriceRange('all'); setSelectedDistrict('all'); 
                        })}
                        className={`hidden md:inline-flex px-[8px] py-[4px] shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer border ${selectedType === 'all' ? 'bg-[#064E3B]/10 text-primary border-primary' : 'bg-transparent border-border-color text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:border-primary/20'}`}
                      >
                        Tất cả
                      </button>
                      <button 
                        onClick={(e) => handleTabClick(e, () => { 
                          if (selectedType === 'sale') scrollToGrid();
                          setSelectedType('sale'); setSelectedPriceRange('all'); setSelectedDistrict('all'); 
                        })}
                        className={`hidden md:inline-flex px-[5px] py-[3px] shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer border ${selectedType === 'sale' ? 'bg-[#064E3B]/10 text-primary border-primary' : 'bg-transparent border-border-color text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:border-primary/20'}`}
                      >
                        Bán
                      </button>
                      <button 
                        onClick={(e) => handleTabClick(e, () => { 
                          if (selectedType === 'rent') scrollToGrid();
                          setSelectedType('rent'); setSelectedPriceRange('all'); setSelectedDistrict('all'); 
                        })}
                        className={`hidden md:inline-flex px-[5px] py-[3px] shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer border ${selectedType === 'rent' ? 'bg-[#064E3B]/10 text-primary border-primary' : 'bg-transparent border-border-color text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:border-primary/20'}`}
                      >
                        Cho thuê
                      </button>
                      
                      <div className="relative inline-block shrink-0">
                        <button 
                          onClick={(e) => handleTabClick(e, () => { e.stopPropagation(); setOpenDropdown(openDropdown === 'district' ? null : 'district'); })}
                          className="px-[5px] py-[3px] shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer border bg-transparent border-border-color text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:border-primary/20 flex items-center gap-1.5">
                          <span className={selectedDistrict !== 'all' ? 'text-primary' : ''}>
                            {selectedDistrict === 'all' ? 'Khu vực' : selectedDistrict}
                          </span>
                          <ChevronDown size={14} strokeWidth={2} />
                        </button>
                      </div>

                      <div className="relative inline-block shrink-0">
                        <button 
                          onClick={(e) => handleTabClick(e, () => { e.stopPropagation(); setOpenDropdown(openDropdown === 'category' ? null : 'category'); })}
                          className="px-[5px] py-[3px] shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer border bg-transparent border-border-color text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:border-primary/20 flex items-center gap-1.5">
                          <span className={selectedCategory !== 'all' ? 'text-primary' : ''}>
                            {selectedCategory === 'all' ? 'Danh mục' : (productCategoriesExt.find(c => c.name === selectedCategory || generateSlug(c.name) === selectedCategory)?.name || selectedCategory)}
                          </span>
                          <ChevronDown size={14} strokeWidth={2} />
                        </button>
                      </div>

                      <div className="relative inline-block shrink-0">
                        <button 
                          onClick={(e) => handleTabClick(e, () => { e.stopPropagation(); setOpenDropdown(openDropdown === 'price' ? null : 'price'); })}
                          className="px-[5px] py-[3px] shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer border bg-transparent border-border-color text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:border-primary/20 flex items-center gap-1.5">
                          <span className={selectedPriceRange !== 'all' ? 'text-primary' : ''}>
                             {selectedPriceRange === 'all' ? 'Khoảng giá' : (
                               (selectedType !== 'rent' 
                                 ? (priceSaleConfig.length > 0 ? priceSaleConfig.find(c => c.id === selectedPriceRange)?.label : undefined)
                                 : (priceRentConfig.length > 0 ? priceRentConfig.find(c => c.id === selectedPriceRange)?.label : undefined)
                               ) || 'Khoảng giá'
                             )}
                          </span>
                          <ChevronDown size={14} strokeWidth={2} />
                        </button>
                      </div>
                    
                    <div className="relative inline-block shrink-0">
                      <button 
                        onClick={(e) => handleTabClick(e, () => { e.stopPropagation(); setOpenDropdown(openDropdown === 'area' ? null : 'area'); })}
                        className="px-[5px] py-[3px] shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer border bg-transparent border-border-color text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:border-primary/20 flex items-center gap-1.5">
                        <span className={selectedAreaRange !== 'all' ? 'text-primary' : ''}>
                          {selectedAreaRange === 'all' ? 'Diện tích' : (
                             (areaConfig.length > 0 ? areaConfig.find(c => c.id === selectedAreaRange)?.label : undefined) || 'Diện tích'
                          )}
                        </span>
                        <ChevronDown size={14} strokeWidth={2} />
                      </button>
                      </div>
                    </div>

                    {/* Desktop Search */}
                    <div className="hidden md:block w-auto shrink-0 ml-4 pb-0">
                      <div className="relative w-[150px] inline-block h-[26px]">
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Tìm dự án, khu vực..." 
                          className="w-full bg-bg-surface border border-primary/20 pl-3 pr-8 py-[4px] rounded-lg text-text-primary outline-none text-[11px] transition-colors focus:border-primary h-[26px]"
                        />
                        <button aria-label="Tìm kiếm" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary p-1 bg-transparent border-none">
                          <Search size={10} strokeWidth={3} />
                        </button>
                      </div>
                    </div>

                    {/* Mobile Search Icon */}
                    <div className="absolute right-[5px] md:hidden z-50 bg-bg-surface/90 h-full flex items-center px-0">
                      <button aria-label="Mở tìm kiếm" onClick={() => setIsSearchOpen(!isSearchOpen)} className="w-[28px] h-[28px] flex items-center justify-center text-primary bg-bg-surface border border-primary/20 shadow shadow-primary/10 rounded hover:bg-[#064E3B]/10 active:scale-95 transition-all">
                        {isSearchOpen ? <X size={13} strokeWidth={2.5} /> : <Search size={13} strokeWidth={2.5} />}
                      </button>
                    </div>

                    {/* Extracted Dropdown Menus */}
                    {openDropdown && (
                      <div className="fixed inset-0 z-[9999998]" onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); }} />
                    )}
                    {openDropdown && (
                      <div 
                        className="absolute top-[calc(100%+6px)] left-0 right-0 w-full md:w-auto z-[9999999] flex justify-center pointer-events-none px-4 md:px-0 desktop-dropdown-pos"
                        style={{ '--left-pos': dropdownPos ? `${dropdownPos}px` : '50%' } as React.CSSProperties}
                      >
                        <style>{`
                          @media (min-width: 768px) {
                            .desktop-dropdown-pos {
                              left: var(--left-pos, 50%) !important;
                              right: auto !important;
                              transform: translateX(-50%) !important;
                            }
                          }
                        `}</style>
                        
                        {openDropdown === 'type' && (
                          <div onClick={(e) => e.stopPropagation()} className="w-full md:hidden bg-bg-surface border border-border-color shadow-md scrollbar-thumb-border-color pointer-events-auto block">
                               <button onClick={() => { scrollToGrid(); setSelectedType('all'); setSelectedPriceRange('all'); setSelectedDistrict('all'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-[13px] border-none cursor-pointer flex justify-between items-center transition-colors border-b border-border-color/50 ${selectedType === 'all' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-transparent text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>
                                 <span>Tất cả</span>
                               </button>
                               <button onClick={() => { scrollToGrid(); setSelectedType('sale'); setSelectedPriceRange('all'); setSelectedDistrict('all'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-[13px] border-none cursor-pointer flex justify-between items-center transition-colors border-b border-border-color/50 ${selectedType === 'sale' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-transparent text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>
                                 <span>Bán</span>
                               </button>
                               <button onClick={() => { scrollToGrid(); setSelectedType('rent'); setSelectedPriceRange('all'); setSelectedDistrict('all'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-[13px] border-none cursor-pointer flex justify-between items-center transition-colors border-b border-border-color/50 ${selectedType === 'rent' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-transparent text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>
                                 <span>Cho thuê</span>
                               </button>
                          </div>
                        )}
                        
                        {openDropdown === 'district' && (
                          <div onClick={(e) => e.stopPropagation()} className="w-full md:w-[260px] bg-bg-surface border border-border-color shadow-md scrollbar-thumb-border-color pointer-events-auto block max-h-[400px] overflow-y-auto">
                               <button onClick={() => { setSelectedDistrict('all'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer flex justify-between items-center transition-colors border-b border-border-color/50 ${selectedDistrict === 'all' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-transparent text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>
                                 <span>Tất cả Khu vực</span>
                               </button>
                               
                               {filteredLocationTree.length > 0 ? filteredLocationTree.map(prov => {
                                  const isProvSelected = selectedDistrict === prov.name;
                                  const isProvExpanded = expandedLocationLevel === prov.name;
                                  return (
                                    <div key={prov.name} className="w-full flex flex-col">
                                      <div className={`w-full flex justify-between items-stretch transition-colors border-b border-border-color/50 ${isProvSelected ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary'}`}>
                                        <button
                                          onClick={() => { setSelectedDistrict(prov.name); setOpenDropdown(null); }}
                                          className="flex-1 text-left !px-[10px] !py-[5px] text-[13px] md:text-xs border-none cursor-pointer bg-transparent text-inherit font-inherit"
                                        >
                                          <span>{prov.name}</span>
                                        </button>
                                        {(prov.wards && prov.wards.length > 0) || (prov.districts && prov.districts.length > 0) ? (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setExpandedLocationLevel(isProvExpanded ? null : prov.name); }}
                                            className="px-3 flex items-center justify-center border-none cursor-pointer bg-transparent text-text-secondary hover:text-primary transition-colors"
                                          >
                                            <ChevronDown size={14} className={`transition-transform duration-200 ${isProvExpanded ? 'rotate-180' : ''}`} />
                                          </button>
                                        ) : null}
                                      </div>
                                      
                                      {isProvExpanded && prov.wards && (
                                        <div className="flex flex-col bg-bg-surface overflow-hidden">
                                           {prov.wards.sort().map(ward => {
                                              const isWardSelected = selectedDistrict === ward;
                                              return (
                                                <button
                                                  key={ward}
                                                  onClick={() => { setSelectedDistrict(ward); setOpenDropdown(null); }}
                                                  className={`w-full text-left !px-[10px] !py-[5px] pl-[25px] text-[13px] md:text-xs border-none cursor-pointer flex justify-between items-center transition-colors border-b border-border-color/50 ${isWardSelected ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary'}`}
                                                >
                                                  <span className="opacity-80">└ {ward}</span>
                                                </button>
                                              )
                                           })}
                                        </div>
                                      )}
                                    </div>
                                  )
                               }) : districts.map(dist => (
                                 <button 
                                   key={dist}
                                   onClick={() => { setSelectedDistrict(dist); setOpenDropdown(null); }} 
                                   className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer flex justify-between items-center transition-colors border-b border-border-color/50 ${selectedDistrict === dist ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}
                                 >
                                   <span>{dist}</span>
                                 </button>
                               ))}
                          </div>
                        )}
                        
                        {openDropdown === 'category' && (
                          <div onClick={(e) => e.stopPropagation()} className="w-full md:w-[260px] bg-bg-surface border border-border-color shadow-md scrollbar-thumb-border-color pointer-events-auto block">
                            <button onClick={() => { setSelectedCategory('all'); setOpenDropdown(null); }} className={`w-full text-left !px-[10px] !py-[5px] text-[13px] md:text-xs border-none cursor-pointer flex justify-between items-center transition-colors border-b border-border-color/50 ${selectedCategory === 'all' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-transparent text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>
                              <span>Tất cả Danh mục</span>
                            </button>
                            {productCategoriesExt.filter(c => !c.parentId).map((parentCat: any) => {
                               const childCats = productCategoriesExt.filter(c => c.parentId === parentCat.name);
                               const isParentSelected = selectedCategory === parentCat.name || selectedCategory === generateSlug(parentCat.name);
                               const isExpanded = expandedParentCat === parentCat.name;
                               return (
                                 <div key={parentCat.id} className="w-full flex flex-col">
                                   <div className={`w-full flex justify-between items-stretch transition-colors border-b border-border-color/50 ${isParentSelected ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary'}`}>
                                     <button
                                       onClick={(e) => { e.preventDefault(); setSelectedCategory(parentCat.name); setOpenDropdown(null); router.push(getRouteUrl({ screen: 'category-product', categoryName: parentCat.name })); }}
                                       className="flex-1 text-left !py-[5px] !px-[10px] text-[13px] md:text-xs border-none cursor-pointer bg-transparent text-inherit"
                                     >
                                       {parentCat.name}
                                     </button>
                                     {childCats.length > 0 && (
                                       <button 
                                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpandedParentCat(isExpanded ? null : parentCat.name); }}
                                         className="px-3 border-none cursor-pointer bg-transparent text-inherit flex items-center justify-center shrink-0 hover:bg-black/5"
                                       >
                                         <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                       </button>
                                     )}
                                   </div>
                                   {isExpanded && childCats.map((childCat: any) => {
                                     const isChildSelected = selectedCategory === childCat.name || selectedCategory === generateSlug(childCat.name);
                                     return (
                                       <button
                                         key={childCat.id}
                                         onClick={(e) => { e.preventDefault(); setSelectedCategory(childCat.name); setOpenDropdown(null); router.push(getRouteUrl({ screen: 'category-product', categoryName: childCat.name })); }}
                                         className={`w-full text-left !py-[5px] text-[13px] md:text-xs border-none cursor-pointer flex justify-between items-center transition-colors border-b border-border-color/50 !px-[20px] ${isChildSelected ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-slate-50 text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary'}`}
                                       >
                                         <span className="text-[12px] md:text-[11px] text-slate-500">└ {childCat.name}</span>
                                       </button>
                                     );
                                   })}
                                 </div>
                               );
                             })}
                          </div>
                        )}

                        {openDropdown === 'price' && (
                          <div onClick={(e) => e.stopPropagation()} className="w-full md:w-[260px] bg-bg-surface border border-border-color shadow-md scrollbar-thumb-border-color pointer-events-auto block">
                               <button onClick={() => { setSelectedPriceRange('all'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer flex justify-between items-center transition-colors border-b border-border-color/50 ${selectedPriceRange === 'all' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-transparent text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>
                                 <span>Tất cả Khoảng giá</span>
                               </button>
                               {selectedType !== 'rent' && (
                                 <>
                                   {priceSaleConfig.length > 0 ? (
                                     priceSaleConfig.map(c => (
                                       <button key={c.id} onClick={() => { setSelectedPriceRange(c.id); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedPriceRange === c.id ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>{c.label}</button>
                                     ))
                                   ) : (
                                     <>
                                       <button onClick={() => { setSelectedPriceRange('under3'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedPriceRange === 'under3' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Dưới 3 Tỷ</button>
                                       <button onClick={() => { setSelectedPriceRange('3to5'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedPriceRange === '3to5' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Từ 3 Tỷ - 5 Tỷ</button>
                                       <button onClick={() => { setSelectedPriceRange('5to10'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedPriceRange === '5to10' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Từ 5 Tỷ - 10 Tỷ</button>
                                       <button onClick={() => { setSelectedPriceRange('10to20'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedPriceRange === '10to20' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Từ 10 Tỷ - 20 Tỷ</button>
                                       <button onClick={() => { setSelectedPriceRange('20to50'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedPriceRange === '20to50' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Từ 20 Tỷ - 50 Tỷ</button>
                                       <button onClick={() => { setSelectedPriceRange('over50'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedPriceRange === 'over50' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Trên 50 Tỷ</button>
                                     </>
                                   )}
                                 </>
                               )}
                               {selectedType !== 'sale' && (
                                 <>
                                   {priceRentConfig.length > 0 ? (
                                     priceRentConfig.map(c => (
                                       <button key={c.id} onClick={() => { setSelectedPriceRange(c.id); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedPriceRange === c.id ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>{c.label}</button>
                                     ))
                                   ) : (
                                     <>
                                       <button onClick={() => { setSelectedPriceRange('under15m'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedPriceRange === 'under15m' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Dưới 15 Triệu/tháng</button>
                                       <button onClick={() => { setSelectedPriceRange('15to40m'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedPriceRange === '15to40m' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Từ 15 - 40 Triệu/tháng</button>
                                       <button onClick={() => { setSelectedPriceRange('over40m'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedPriceRange === 'over40m' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Trên 40 Triệu/tháng</button>
                                     </>
                                   )}
                                 </>
                               )}
                          </div>
                        )}

                        {openDropdown === 'area' && (
                          <div onClick={(e) => e.stopPropagation()} className="w-full md:w-[260px] bg-bg-surface border border-border-color shadow-md scrollbar-thumb-border-color pointer-events-auto block">
                             <button onClick={() => { setSelectedAreaRange('all'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer flex justify-between items-center transition-colors border-b border-border-color/50 ${selectedAreaRange === 'all' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-transparent text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>
                               <span>Tất cả Diện tích</span>
                             </button>
                             {areaConfig.length > 0 ? (
                               areaConfig.map(c => (
                                 <button key={c.id} onClick={() => { setSelectedAreaRange(c.id); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedAreaRange === c.id ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>{c.label}</button>
                               ))
                             ) : (
                               <>
                                 <button onClick={() => { setSelectedAreaRange('under100'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedAreaRange === 'under100' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Dưới 100 m²</button>
                                 <button onClick={() => { setSelectedAreaRange('100to300'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedAreaRange === '100to300' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Từ 100 m² - 300 m²</button>
                                 <button onClick={() => { setSelectedAreaRange('300to500'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedAreaRange === '300to500' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Từ 300 m² - 500 m²</button>
                                 <button onClick={() => { setSelectedAreaRange('over500'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 md:py-2 text-[13px] md:text-xs border-none cursor-pointer border-b border-border-color/50 ${selectedAreaRange === 'over500' ? 'bg-[#064E3B]/10 text-primary font-bold' : 'bg-bg-surface text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:font-bold'}`}>Trên 500 m²</button>
                               </>
                             )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Mobile Search Input Overlay */}
                  {isSearchOpen && (
                    <div className="md:hidden w-full px-[5px] py-[5px] bg-white/70 border-t border-border-color">
                      <div className="relative w-full h-[32px]">
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Tìm dự án, khu vực, danh mục..." 
                          className="w-full bg-bg-surface border border-primary/20 pl-3 pr-8 rounded-lg text-text-primary outline-none text-[12px] transition-colors focus:border-primary h-[32px]"
                          autoFocus
                        />
                        <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 p-1 bg-transparent border-none hover:text-primary transition-colors">
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            );
          } else if (section.id === 'products_grid') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-6 pt-[10px]" id="products-grid-section">
                {!searchQuery && (
                  <div className="pt-[10px] px-0 pb-0">
                    <EditableText 
                      sectionId={section.id} 
                      field="title" 
                      value={
                        (() => {
                          if (initialCategoryTitle) return initialCategoryTitle;
                          if (loading) return 'Đang tải danh mục...';
                          if (selectedCategory && selectedCategory !== 'all') {
                            const catExt = productCategoriesExt.find(c => c.name === selectedCategory || generateSlug(c.name) === selectedCategory);
                            return catExt?.seoTitle || catExt?.name || `Danh mục: ${catExt?.name || selectedCategory}`;
                          }
                          if (selectedType === 'sale') return 'Bất Động Sản Chuyển Nhượng';
                          if (selectedType === 'rent') return 'Bất Động Sản Cho thuê';
                          return sec.title === 'Bàn giao đúng hạn, đắc lộc cát tường' ? 'Giao Dịch Chuyển Nhượng & Cho thuê Mới Nhất' : sec.title;
                        })()
                      } 
                      isEditMode={isEditMode} 
                      sections={sections} 
                      onUpdateSections={onUpdateSections}
                      className="text-lg sm:text-xl font-display font-semibold text-text-primary tracking-tight block border-l-4 border-primary pl-3"
                      tag="h1"
                    />
                    <p className="text-text-secondary text-xs mt-2 pl-[5px] max-w-3xl">
                      {(() => {
                          if (initialCategoryDesc) return initialCategoryDesc;
                          if (loading) return 'Vui lòng chờ trong giây lát...';
                          if (selectedCategory && selectedCategory !== 'all') {
                            const catExt = productCategoriesExt.find(c => c.name === selectedCategory || generateSlug(c.name) === selectedCategory);
                            return catExt?.seoDescription || catExt?.description || `Khám phá các sản phẩm nổi bật thuộc danh mục ${catExt?.name || selectedCategory}.`;
                          }
                          return 'Khám phá danh sách các dự án bất động sản sang trọng, cập nhật liên tục các cơ hội mua bán và cho thuê biệt thự, penthouse tại vị trí đắc địa nhất.';
                        })()}
                    </p>
                  </div>
                )}

                {/* Status bar */}
                {(searchQuery || selectedDistrict !== 'all' || selectedPriceRange !== 'all' || selectedAreaRange !== 'all' || selectedType !== 'all' || selectedCategory !== 'all') && (
                  <div className="pt-[5px] pb-0 mb-[10px] text-text-secondary text-[12px] flex items-center border-b border-dashed border-border-color pl-[5px]">
                    <span className="">Tìm thấy <strong className="mx-1 text-primary font-bold">{filteredProducts.length}</strong> kết quả</span>
                    <button 
                      onClick={resetFilters} 
                      className="ml-3 text-error text-[12px] underline cursor-pointer bg-transparent border-none"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 p-[10px]">
                      {Array.from({ length: mainGridLimit }).map((_, index) => (
                        <div key={index} className="w-full shrink-0 bg-bg-surface border border-border-color rounded overflow-hidden flex flex-row sm:flex-col shadow-sm">
                          <div className="relative w-[90px] h-[90px] sm:h-auto shrink-0 sm:w-full sm:aspect-[4/3] bg-slate-100" />
                          <div className="px-[12px] py-1 sm:p-[15px] flex-1 flex flex-col justify-center">
                            <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-slate-100 rounded w-1/2 mb-4"></div>
                            <div className="pt-[4px] sm:pt-[10px] border-t border-dashed border-border-color mt-auto">
                              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2"></div>
                              <div className="flex gap-[8px] sm:gap-[10px]">
                                <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                                <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-white/70 text-xs">Không tìm thấy sản phẩm nào khớp bộ lọc lựa chọn của bạn.</div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 p-[10px]">
                      {filteredProducts.slice(0, mainGridLimit).map((item, index) => (
                        <ProductCard key={item.id} item={item} priority={index < 2} onNavigate={onNavigate} />
                      ))}
                    </div>

                    {filteredProducts.length > mainGridLimit && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setMainGridLimit(prev => prev + 10)}
                          className="bg-primary hover:bg-primary/80 text-[10px] font-bold uppercase tracking-wider text-white hover:text-white border border-primary px-6 py-3.5 rounded-full cursor-pointer transition-all border-solid shadow-md hover:shadow-lg"
                        >
                          Xem thêm bài đăng sàn chính (Tải thêm +10)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          } else if (section.id === 'recently_viewed' && recentlyViewed.length > 0) {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
                <section className="space-y-4 pt-4 border-t border-border-color border-dashed text-left" id="product-hub-history">
                  <div className="flex items-end justify-between pb-2 text-[16px]">
                    <EditableText 
                      sectionId={section.id} 
                      field="title" 
                      value={sec.title === 'Bất Động Sản [gradient]Dành Cho Riêng Bạn[/gradient]' ? 'Bất Động Sản Dành Cho Riêng Bạn' : sec.title} 
                      isEditMode={isEditMode} 
                      sections={sections} 
                      onUpdateSections={onUpdateSections}
                      className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3 m-0"
                      tag="h3"
                    />
                    
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('recentlyViewed');
                        setRecentlyViewed([]);
                        onShowNotification('Đã làm trống lịch sử xem.', 'success');
                      }}
                      className="text-[9px] uppercase font-mono font-bold tracking-wider text-text-secondary hover:text-error transition-colors bg-transparent border-none cursor-pointer"
                    >
                      Xóa lịch sử
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 p-[10px]">
                      {recentlyViewed.slice(0, recentGridLimit).map((item) => (
                        <ProductCard key={item.id} item={item} badgeText="Vừa xem" badgeColor="bg-pink-700 text-white" onNavigate={onNavigate} />
                      ))}
                    </div>

                    {recentlyViewed.length > recentGridLimit && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setRecentGridLimit(prev => prev + 5)}
                          className="bg-bg-surface hover:bg-bg-base text-text-secondary hover:text-primary border border-border-color/80 text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer transition-all border-solid shadow-sm"
                        >
                          Tải thêm vệt đã xem (AJAX +5)
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            );
          } else if (section.id === 'latest_sales') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
                <section className="space-y-6 pt-8 border-t border-border-color border-dashed text-left">
                  <div className="flex items-end justify-between pb-2 mb-[5px]">
                    <EditableText 
                      sectionId={section.id} 
                      field="title" 
                      value={sec.title === 'Danh Sách Bán Mới Nhất' ? 'Tin Bán mới nhất' : sec.title} 
                      isEditMode={isEditMode} 
                      sections={sections} 
                      onUpdateSections={onUpdateSections}
                      className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3 m-0"
                      tag="h3"
                    />

                    <button
                      type="button"
                      onClick={() => router.push(getRouteUrl({ screen: 'latest-sales' }))}
                      className="flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-primary font-bold hover:underline bg-transparent border-none cursor-pointer"
                    >
                      <span>Xem thêm</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 p-[10px]">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="w-full shrink-0 bg-bg-surface border border-border-color rounded overflow-hidden flex flex-row sm:flex-col shadow-sm">
                          <div className="relative w-[90px] h-[90px] sm:h-auto shrink-0 sm:w-full sm:aspect-[4/3] bg-slate-100" />
                          <div className="px-[12px] py-1 sm:p-[15px] flex-1 flex flex-col justify-center">
                            <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-slate-100 rounded w-1/2 mb-4"></div>
                            <div className="pt-[4px] sm:pt-[10px] border-t border-dashed border-border-color mt-auto">
                              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      latestSales.slice(0, 5).map((item) => (
                        <ProductCard key={item.id} item={item} onNavigate={onNavigate} />
                      ))
                    )}
                  </div>
                </section>
              </div>
            );
          } else if (section.id === 'latest_rents') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
                <section className="space-y-6 pt-8 border-t border-border-color border-dashed text-left">
                  <div className="flex items-end justify-between pb-2 mb-[5px]">
                    <EditableText 
                      sectionId={section.id} 
                      field="title" 
                      value={sec.title === 'Danh Sách Cho thuê Mới Nhất' ? 'Tin Cho thuê mới nhất' : sec.title} 
                      isEditMode={isEditMode} 
                      sections={sections} 
                      onUpdateSections={onUpdateSections}
                      className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3 m-0"
                      tag="h3"
                    />

                    <button
                      type="button"
                      onClick={() => router.push(getRouteUrl({ screen: 'latest-rents' }))}
                      className="flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-primary font-bold hover:underline bg-transparent border-none cursor-pointer"
                    >
                      <span>Xem thêm</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 p-[10px]">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="w-full shrink-0 bg-bg-surface border border-border-color rounded overflow-hidden flex flex-row sm:flex-col shadow-sm">
                          <div className="relative w-[90px] h-[90px] sm:h-auto shrink-0 sm:w-full sm:aspect-[4/3] bg-slate-100" />
                          <div className="px-[12px] py-1 sm:p-[15px] flex-1 flex flex-col justify-center">
                            <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-slate-100 rounded w-1/2 mb-4"></div>
                            <div className="pt-[4px] sm:pt-[10px] border-t border-dashed border-border-color mt-auto">
                              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      latestRents.slice(0, 5).map((item) => (
                        <ProductCard key={item.id} item={item} onNavigate={onNavigate} />
                      ))
                    )}
                  </div>
                </section>
              </div>
            );
          } else if (section.id === 'featured_projects') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
                <section className="space-y-6 pt-[27px] pb-[0px] border-t border-border-color border-dashed text-left">
                  <div className="flex items-end justify-between pb-2 mb-[5px]">
                    <EditableText 
                      sectionId={section.id} 
                      field="title" 
                      value={sec.title === 'Dự Án Kiến Trúc Tiêu Điểm' ? 'Dự Án Nổi Bật' : sec.title} 
                      isEditMode={isEditMode} 
                      sections={sections} 
                      onUpdateSections={onUpdateSections}
                      className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3 m-0"
                      tag="h3"
                    />

                    <button
                      type="button"
                      onClick={() => router.push(getRouteUrl({ screen: 'du-an' }))}
                      className="flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-primary font-bold hover:underline bg-transparent border-none cursor-pointer"
                    >
                      <span>Xem thêm →</span>
                    </button>
                  </div>

                  <div className="relative overflow-hidden py-4 w-full" id="featured-projects-slider">
                    <style>{`
                      @keyframes productSliderScroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(calc(-16.666666%)); }
                      }
                      .animate-product-slider {
                        animation: productSliderScroll 15s linear infinite;
                      }
                      .animate-product-sliding-container:hover .animate-product-slider {
                        animation-play-state: paused;
                      }
                    `}</style>
                    <div className="animate-product-sliding-container flex w-max">
                      <div className="flex w-max animate-product-slider">
                        {[...Array(6)].flatMap(() => projects.slice(0, 5)).map((proj, idx) => {
                          let statusText = 'Đang mở bán';
                          if (proj.status === 'handed_over') statusText = 'Đã bàn giao';
                          if (proj.status === 'coming_soon') statusText = 'Sắp ra mắt';

                          return (
                            <div
                              key={`${proj.id}-${idx}`}
                              onClick={() => router.push(getRouteUrl({ screen: 'project-detail', projectId: proj.id, slug: generateSlug(proj.title) }))}
                              className="w-[260px] sm:w-[280px] md:w-[240px] lg:w-[223px] shrink-0 mr-4 lg:mr-5 bg-bg-surface border border-primary/20 rounded-xl overflow-hidden flex flex-col h-full transition-all duration-300 hover:scale-[1.01] hover:border-emerald-500/30 hover:shadow-md cursor-pointer no-underline group shadow-sm justify-between"
                            >
                              <div className="relative aspect-[16/10] overflow-hidden">
                                <img 
                                  loading={idx < 2 ? "eager" : "lazy"} 
                                  decoding="async"
                                  fetchPriority={idx < 2 ? "high" : "auto"}
                                  src={optimizeImageUrl(proj.imageUrl || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800", 400) || undefined}
                                  alt={proj.title}
                                  width="800"
                                  height="500"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 block"
                                  onError={(e) => { e.currentTarget.onerror = null; (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Greenia+Homes'; }}
                                />
                                <div className="absolute top-0 left-0 px-2.5 py-1 bg-[#0f9b0f] text-white text-[11px] font-bold rounded-none rounded-br-lg shadow-sm z-10">
                                  {statusText}
                                </div>
                              </div>
    
                              <div className="p-4 flex-1 flex flex-col justify-between text-left">
                                <div>
                                  <h4 className="text-[13px] sm:text-[15px] font-bold text-text-primary mb-2 line-clamp-2 transition-colors group-hover:text-primary w-full text-left">
                                    {proj.title}
                                  </h4>
                                  <div className="flex items-center justify-between text-xs mb-3 w-full">
                                    <span className="text-text-secondary">Giá từ:</span>
                                    <span className="text-primary font-bold text-[13px]">{proj.priceText || "Đang cập nhật"}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-[11px] text-text-secondary mb-2 w-full">
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <Layers className="w-3 h-3 text-text-secondary shrink-0" />
                                      <span className="truncate" title={proj.scale || 'Đang cập nhật'}>{proj.scale || 'Đang cập nhật'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <Building2 className="w-3 h-3 text-text-secondary shrink-0" />
                                      <span className="truncate" title={proj.units ? String(proj.units) : 'Đang cập nhật'}>{proj.units ? `${proj.units} căn` : 'Đang cập nhật'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-start gap-1.5 text-[11px] text-text-secondary mt-auto pt-2 border-t border-border-color/50 w-full">
                                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-[1px]" />
                                  <span className="text-left line-clamp-2">
                                    {proj.location || proj.title}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            );
          }

          if (!cardContent && !isEditMode) return null; // ADD THIS to prevent empty wrappers spacing
          
          const SectionTag = section.id === 'products_filter' ? 'aside' : 'section';

          return (
            <SectionTag 
              key={section.id} 
              id={`section-wrapper-${section.id}`}
              style={{
                paddingTop: section.id === 'featured_projects' ? '5px' : section.id === 'products_filter' ? '2px' : ['latest_sales', 'recently_viewed', 'products_grid'].includes(section.id) ? '0px' : `${section.paddingTop || 0}px`,
                paddingLeft: section.id === 'featured_projects' ? '0px' : undefined,
                paddingRight: ['products_filter', 'featured_projects'].includes(section.id) ? '0px' : undefined,
                paddingBottom: section.id === 'featured_projects' ? '5px' : section.id === 'products_filter' ? '0px' : section.id === 'recently_viewed' ? '30px' : section.id === 'products_grid' ? '0px' : `${section.paddingBottom || 0}px`,
                marginBottom: section.id === 'products_filter' ? '0px' : undefined
              }}
              className={`relative transition-all duration-300 ${
                isEditMode 
                  ? `border-2 ${
                      selectedSectionId === section.id 
                        ? 'border-primary bg-[#064E3B]/10' 
                        : 'border-dashed border-border-color/80 hover:border-primary/50'
                    }` 
                  : ''
              } ${!section.visible ? 'opacity-40 bg-white/20' : ''} ${
                !isEditMode && section.id === 'products_filter' 
                  ? `sticky ${scrollDirection === 'down' ? 'top-0' : 'top-10'} z-40 bg-white/95 shadow-sm transition-colors duration-300` 
                  : 'relative z-10'
              }`}
              onClick={() => {
                if (isEditMode) {
                  setSelectedSectionId(section.id);
                }
              }}
            >
              {isEditMode && (
                <SectionHeaderToolbar
                  section={section}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  onShowNotification={onShowNotification}
                  index={idx}
                  setSelectedSectionId={setSelectedSectionId}
                />
              )}

              {cardContent}

              {idx === 2 && (
                <AdBanner slot="prods-hub-interstitial" containerClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-6" />
              )}
            </SectionTag>
          );
        })}
      </div>
    </div>
      </>
);
}
